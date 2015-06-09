"use strict";

function ModelValueTriggers(observer) {

    function isArray(item) {
        return item && item.constructor.name == 'Array'
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    }

    // http://apiux.com/2013/09/11/api-timezones/
    function getTimestamp(iso8601) {
        if (typeof iso8601 == "undefined" || iso8601 == true) {
            return new Date().toISOString();
        }
        return Date.now();
        //return Date.now(); // Date.now() / 1000 | 0;
    }

    function mergeConfig(to, from) {
        for (var n in from)
            if (typeof to[n] != 'object')
                to[n] = from[n];
            else if (typeof from[n] == 'object')
                to[n] = mergeConfig(to[n], from[n]);
        return to;
    }

    function defineProperty(obj, property, config, get, set) {
        var value = obj[property];
        var config = mergeConfig({enumerable: false, configurable: true}, config || {});
        config['get'] = get || function() {return value};
        config['set'] = set || function(new_value) {value = new_value};
        Object.defineProperty(obj, property, config);
    }

    function defineNodeValueProperty(obj) {
        var value = obj['value'];
        var config = {enumerable: false, configurable: true};
        config['get'] = function() {
            if (this.canget) return value;
            else return undefined;
        };
        config['set'] = function(new_value) {
            if (this.canset) {
                value = new_value;
                this.updated = getTimestamp();
            }
        };
        Object.defineProperty(obj, 'value', config);
    }

    function defineBranchValueProperty(obj) {
        var value = obj['value'];
        var config = {enumerable: false, configurable: true};
        config['get'] = function() {
            var value = {};
            if (this.canget) {
                for (var i in this)
                    if (this.hasOwnProperty(i))
                        value[i] = this[i].value;
            }
            return value;
        };
        config['set'] = function(new_value) {
            if (this.canset) {
                var props = this.path.slice();
                for (var property in new_value) {
                    props.push(property);
                    if (this.hasOwnProperty(property)) {
                        this[property].value = new_value[property];
                        this[property].updated = getTimestamp();
                    } else {
                        if (typeof new_value[property] == 'object') {
                            var m = observer.createModel(new_value[property], props.slice(0, -1), this, property);
                            this[property] = new_value[property];
                        } else {
                            observer.define(new_value[property], this, property, props.slice(0), this);
                        }
                        // indexes of parent needs to be reconfigured
                        this[property].parent = this;
                        this.updated = getTimestamp();
                    }
                    props.pop();
                }
            }
        };
        Object.defineProperty(obj, 'value', config);
    }

    // canget, canget,...
    function setHierarchyDownProperty(obj, property, val) {
        var value = obj[property] = val || true;
        var get = function() {return value};
        var set = function(new_value) {
            value = new_value;
            for (var i in this) {
                if (this[i].hasOwnProperty(property)) {
                    this[i][property] = value;
                }
            }
        };
        defineProperty(obj, property, {configurable: true}, get, set);
    }

    // created,...
    function setOnceProperty(obj, property, val) {
        Object.defineProperty(obj, property, {value: obj[property] || val, enumerable: false, configurable: false, writable: false});
    }

    // updated,...
    function setHierarchyUpProperty(obj, property, val) {
        var value = obj[property] = val;
        var get = function() {return value};
        var set = function(new_value) {
            value = new_value;
            if (this.parent) this.parent[property] = new_value;
        };
        defineProperty(obj, property, {enumerable: false, configurable: true}, get, set);
    }

    // path,...
    function setPathProperty(obj) {
        //var value = obj['path'];
        // instead of setting fixed and static path, dynamic retreaval
        // based on parent keys are used here because keys may change
        // on array push, remove, pop, shift and
        var get = function() {
            //return value;
            if (this.parent)
                return [this.key].concat(this.parent.path.reverse()).reverse();
            else return [this.key];
        };
        defineProperty(obj, 'path', {configurable: true}, get);
    }

    // push... append: add item to the end of the array/list
    function defineArrayPushProperty(obj, property) {
        obj[property]['push'] = function(value) {
            observer.triggers.runTrigger.bind(this)('add', [value, obj[property], this.length, this.path, this.parent]);
            var o = {};
            o[this.parent[property].length] = value;
            this.parent[property] = o;
        }
        defineProperty(obj[property], 'push');
    }

    // unshift... add item to the beginning of the array/list
    function defineArrayUnShiftProperty(obj, property) {
        obj[property]['unshift'] = function(value) {
            var l = this.length;
            if (l > 0) {
                this.push({});
                do {
                    delete this[l];
                    this[l] = this[l-1];
                    this[l].key = l;
                    this[l].updated = getTimestamp();
                    l -= 1;
                } while (l > 0);
                delete this[0];
            }
            this.parent[property] = {0: value};
            observer.triggers.runTrigger.bind(this)('add', [value, obj[property], 0, this.path, this.parent]);
        }
        defineProperty(obj[property], 'unshift');
    }

    // pop... remove the last item
    function defineArrayPopProperty(obj, property) {
        obj[property]['pop'] = function() {
            this.parent[property].remove(-1);
        }
        defineProperty(obj[property], 'pop');
    }

    // shift... remove the first item
    function defineArrayShiftProperty(obj, property) {
        obj[property]['shift'] = function() {
            var val = this.parent[property].remove(0);
        }
        defineProperty(obj[property], 'shift');
    }

    // shift... remove the first item
    function defineArrayOrderProperty(obj, property) {
        obj[property]['order'] = function(func) {
            var args = {};
            for (var i in arguments) if (i > 0) args[i] = arguments[i];
            var val = func.apply(this, args);
            observer.triggers.runTrigger.bind(this)('set', [val, obj, this.path]);
            return val;
        };
        defineProperty(obj[property], 'order');
    }

    // splice... like javascript slice but without third parameter
    function defineArrayRemoveProperty(obj, property) {
        // index: where to start removing. negative number starts from the end
        // of the list. howmany: how many items will be removed counting from the index.
        // default 1.
        obj[property]['remove'] = function(index, howmany) {
            var m = this.parent[property];
            var l = m.length-1;

            // default howmany is 1. 0 not possible
            if (howmany == undefined || howmany < 2) howmany = 1
            var l1 = index < 0 ? index + m.length : index;
            var l2 = l1+howmany;
            var val = this.slice().filter(function(v){return v > l1 && v < l2});
            //console.log(l1, l2, val);
            // remove all
            if (index == undefined) {
                for (var i in m) {
                    i = parseInt(i);
                    delete m[i];
                }
                m.splice(0, l+1);
            } else {
                // remove howmany amount of items starting from index
                if (index < 0) {
                    index = index + l + 1;
                }
                if (index > -1 && index < l+1) {
                    for (var i in m) {
                        if (i >= index) {
                            // array indexes are integers
                            i = parseInt(i);
                            delete m[i];
                            if (i < l) {
                                m[i] = m[i+1];
                                m[i].key = i;
                                m[i].updated = getTimestamp();
                            }
                        }
                    }
                    // remove null items
                    m.splice(l, 1);

                    //observer.triggers.runTrigger.bind(this)('add', [m, obj, index, this.path, this.parent]);

                    // recursively remove rest of the items if needed
                    howmany -= 1;
                    if (howmany > 0) m.remove(index, howmany);
                }
            }
            m.updated = getTimestamp();
            // this dummy assignment triggers setter handler after removal of items
            //this.parent[property] = {};
            observer.triggers.runTrigger.bind(this)('remove', [val, obj[property], index, this.path, this.parent]);
        }
        defineProperty(obj[property], 'remove');
    }

    var valueTriggers = {
        'init': function (value, model, property, property_stack, parent) {
            // console.log(["value init", value, model, property, property_stack.join('.'), parent]);
            if (value !== null && typeof value === "object") {
                // value property appending on old dictionary
                model[property]['value'] = value;
                defineBranchValueProperty(model[property]);
                // branch / node property
                model[property]['branch'] = true;
                defineProperty(model[property], 'branch');
                if (isArray(value)) {
                    // special methods for arrays/lists
                    // push, remove, pop, shift, unshift are supported
                    // especially for set trigger, which is lanched by splice, shift and unshift functions.
                    model[property]['arrayMutation'] = true;
                    defineProperty(model[property], 'arrayMutation');
                
                    defineArrayPushProperty(model, property);
                    defineArrayRemoveProperty(model, property);
                    defineArrayPopProperty(model, property);
                    defineArrayShiftProperty(model, property);
                    defineArrayUnShiftProperty(model, property);
                    defineArrayOrderProperty(model, property);
                }
            } else {
                // value property with a new dictionary
                model[property] = {value: value};
                defineNodeValueProperty(model[property]);
                // branch / node property
                model[property]['node'] = true;
                defineProperty(model[property], 'node');
            }

            // key
            model[property]['key'] = property;
            defineProperty(model[property], 'key');

            // common configuration
            var config = {enumerable: false, configurable: true};
            // parent property
            var parent_property, grand_parent;
            parent_property = property_stack.length > 1 ? property_stack[property_stack.length - 2] : null;
            if (parent_property) {
                grand_parent = parent[parent_property];
            }
            model[property]['parent'] = grand_parent;
            defineProperty(model[property], 'parent', config);
            // path
            model[property]['path'] = property_stack;
            setPathProperty(model[property], 'path');
            // old value
            model[property]['old_value'] = value;
            defineProperty(model[property], 'old_value', config);
            // access properties
            setHierarchyDownProperty(model[property], 'canget', model[property]['canget']);
            setHierarchyDownProperty(model[property], 'canset', model[property]['canset']);
            // timestamp properties
            setOnceProperty(model[property], 'created', model[property]['created'] || getTimestamp());
            setHierarchyUpProperty(model[property], 'updated', model[property]['updated']);
            // node value needs to be reassigned
            if (!(value !== null && typeof value === "object")) {
                value = model[property];
            }

            return value;
        },
        'get': function (value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            /*
            if (value.node)
                console.log(["value get (NODE)", value, property_stack.join('.')]);
            else
                if (value.parent)
                    console.log(["value get (BRANCH)", value, property_stack.join('.')]);
                else
                    console.log(["value get (ROOT)", value, property_stack.join('.')]);
            */
            return value;
        },
        'set': function (value, old_value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            //console.log(["value set", value, old_value, property_stack.join('.')]);
            old_value.old_value = old_value.value;
            old_value.value = value;
            return old_value;
        },
        'add': function (value, model, property, property_stack, parent) {
            // console.log(this) -> cyclic object, but available!
            return value;
        },
        'remove': function (value, model, property, property_stack, parent) {
            // console.log(this) -> cyclic object, but available!
            return value;
        }
    };

    return {valueTriggers: valueTriggers};
}

// for node environment require call
if( typeof module !== 'undefined' ) {
    if ( typeof module.exports === 'undefined' ) {
        module.exports = {}
    }
    module.exports.ModelValueTriggers = ModelValueTriggers
}