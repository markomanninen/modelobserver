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
                //console.log('node set', this.path.join('.'));
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
                //console.log('branch set', this.path.join('.'));
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
        // instead of setting fixed and static path, dynamic retrieval
        // based on parent keys are used here because keys may change
        // on array order, push, remove, pop, shift and unshift
        var get = function() {
            if (this.parent)
                return [this.key].concat(this.parent.path.reverse()).reverse();
            else return [this.key];
        };
        defineProperty(obj, 'path', {configurable: true}, get);
    }

    // push... append: add item to the end of the array/list
    function defineArrayPushProperty(obj, property) {
        obj[property]['push'] = function() {
            if (arguments) {
                observer.triggers.runTrigger.bind(this)('add', [arguments, obj[property], this.length, this.path, this.parent]);
                for (var i in arguments) {
                    if (typeof arguments[i] == 'object') {
                        observer.createModel(arguments[i], this.path.slice(0), this.parent, i);
                        this[this.length] = arguments[i];
                    } else {
                        observer.define(arguments[i], this, this.length, this.path.slice(), this.parent);
                        this[this.length-1].parent = this;
                    }
                }
                this.updated = getTimestamp();
            }
        }
        defineProperty(obj[property], 'push');
    }

    // unshift... add item to the beginning of the array/list
    function defineArrayUnShiftProperty(obj, property) {
        obj[property]['unshift'] = function() {
            for (var i in arguments) {
                //var value = arguments[i];
                var l = this.length;
                if (l > 0) {
                    //this.push();
                    do {
                        delete this[l];
                        this[l] = this[l-1];
                        this[l].key = l;
                        this[l].updated = getTimestamp();
                        this[l].parent = this;
                        l -= 1;
                    } while (l > 0);
                    delete this[0];
                }
                if (typeof arguments[i] == 'object') {
                    observer.createModel(arguments[i], this.path.slice(0), this.parent, 0);
                    this[0] = arguments[i];
                    this[0].parent = this;
                } else {
                    observer.define(arguments[i], this, 0, this.path.slice(), this.parent);
                    this[0].parent = this;
                }
                this.updated = getTimestamp();
            }
            return observer.triggers.runTrigger.bind(this)('add', [arguments, obj[property], 0, this.path, this.parent]);
        }
        defineProperty(obj[property], 'unshift');
    }

    // pop... remove the last item
    function defineArrayPopProperty(obj, property) {
        obj[property]['pop'] = function() {
            return this.parent[property].remove(-1);
        }
        defineProperty(obj[property], 'pop');
    }

    // shift... remove the first item
    function defineArrayShiftProperty(obj, property) {
        obj[property]['shift'] = function() {
            return this.parent[property].remove(0);
        }
        defineProperty(obj[property], 'shift');
    }

    // order... reorder array in place according to given function
    function defineArrayOrderProperty(obj, property) {
        obj[property]['order'] = function(func) {
            var args = [];
            for (var i in arguments) if (i > 0) args.push(arguments[i]);
            var val = func.apply(this, args);
            observer.triggers.runTrigger.bind(this)('order', [Object.keys(this), obj, this.path]);
            return val;
        };
        defineProperty(obj[property], 'order');
    }

    function defineArrayMoveProperty(obj, property) {
        obj[property]['move'] = function(from, count, to) {
            
            var list = this;
            var l = list.length-1;
            
            if (from > l) from = l; else if (from < 0) from = 0;
            if (to > l) to = l; else if (to < 0) to = 0;

            var args = [from > to ? to : to + 1 - count, 0];

            args.push.apply(args, list.splice(from, count));
            list.splice.apply(list, args);

            var val = Object.keys(this);
            
            list.map(function(item, i, arr){item.key=i;});
            observer.triggers.runTrigger.bind(this)('order', [val, obj, this.path]);
        };
        defineProperty(obj[property], 'move');
    }

    function defineArraySwapProperty(obj, property) {
        obj[property]['swap'] = function(index1, index2) {
            this[index1].key = index2;
            this[index2].key = index1;
            var list1 = this[index1];
            var list2 = this[index2];
            this[index1] = list2;
            this[index2] = list1;
            observer.triggers.runTrigger.bind(this)('order', [[index1, index2], obj, this.path]);
        };
        defineProperty(obj[property], 'swap');
    }

    // remove... like javascript slice but without third parameter
    function defineObjectRemoveProperty(obj, property) {
        // index: where to start removing. negative number starts from the end
        // of the list. howmany: how many items will be removed counting from the index.
        // default 1.
        obj[property]['remove'] = function(index, howmany) {
            var l = this.length;
            var val = []; // removed items
            // remove all
            if (index == undefined) {
                for (var i in this) {
                    val.push(this[i]);
                    delete this[i];
                }
                if (this.arrayMutation) this.splice(0, l);
            } else if (typeof index == 'string') {
                val.push(this[index]);
                delete this[index];
            } else if (typeof index == 'number') {
                // remove howmany amount of items starting from index
                if (index < 0) {index = index + l;}
                if (index > -1 && index < l) {
                    // default howmany is 1. 0 not possible
                    if (howmany == undefined || howmany < 1) howmany = 1; 
                    // max howmany is length of the array
                    if (howmany > l - index) howmany = l - index;
                    var r = index;
                    do {
                        val.push(this[r]);
                        delete this[r];
                        r += 1;
                    } while (r < index + howmany);
                    this.splice(index, howmany);
                }
            }
            this.updated = getTimestamp();
            return observer.triggers.runTrigger.bind(this)('remove', [val, this, index]);
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

                defineObjectRemoveProperty(model, property);

                if (isArray(value)) {
                    // special methods for arrays/lists
                    // push, remove, pop, shift, unshift, order and move are supported
                    
                    // arrayMutation is to give possbility to prevent set trigger, 
                    // which is launched by splice, shift and unshift functions
                    // unwisfully
                    model[property]['arrayMutation'] = true;
                    defineProperty(model[property], 'arrayMutation');
                
                    defineArrayPushProperty(model, property);
                    defineArrayPopProperty(model, property);
                    defineArrayShiftProperty(model, property);
                    defineArrayUnShiftProperty(model, property);
                    defineArrayOrderProperty(model, property);
                    defineArrayMoveProperty(model, property);
                    defineArraySwapProperty(model, property);

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
        'set': function (value, old_value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            //console.log(["value set", value, old_value, property_stack.join('.')]);
            
            // TODO: this is needed for array mutations,
            // splice function with howmany = 1 will give strange behaviour
            // on the setter... must be examined more closely
            if (this.arrayMutation) {
                return value;
            }

            old_value.old_value = old_value.value;
            old_value.value = value;
            
            return old_value;
        },
        /*
        'get': function (value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            
            if (value.node)
                console.log(["value get (NODE)", value, property_stack.join('.')]);
            else
                if (value.parent)
                    console.log(["value get (BRANCH)", value, property_stack.join('.')]);
                else
                    console.log(["value get (ROOT)", value, property_stack.join('.')]);
            
            return value;
        },
        'add': function (value, model, property, property_stack, parent) {
            // console.log(this) -> cyclic object, but available!
            return value;
        },
        'remove': function (value, model, property, property_stack, parent) {
            // console.log(this) -> cyclic object, but available!
            return value;
        },
        'order': function (value, model, property, property_stack, parent) {
            // console.log(this) -> cyclic object, but available!
            return value;
        }
        */
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