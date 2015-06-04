"use strict";

function ModelObserverHandlers(observer) {

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
        for (n in from)
            if (typeof to[n] != 'object')
                to[n] = from[n];
            else if (typeof from[n] == 'object')
                to[n] = realMerge(to[n], from[n]);
        return to;
    }

    function defineProperty(obj, property, config, get, set) {
        var value = obj[property];
        var config = mergeConfig({enumerable: false, configurable: false}, config || {});
        config['get'] = get || function() {return value};
        config['set'] = set || function(new_value) {value = new_value};
        Object.defineProperty(obj, property, config);
    }

    function defineNodeValueProperty(obj) {
        var value = obj['value'];
        var config = {enumerable: false, configurable: false};
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
        var config = {enumerable: false, configurable: false};
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
                    } else {
                        if (typeof new_value[property] == 'object') {
                            var m = observer.createModel(new_value[property], props.slice(0, -1), this, property);
                            this[property] = new_value[property];
                        } else {
                            observer.define(new_value[property], this, property, props.slice(), this);
                        }
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
        defineProperty(obj, property, {}, get, set);
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
        defineProperty(obj, property, null, get, set);
    }

    var valueHandler = {
        initter: function (value, model, property, property_stack, parent) {
            // console.log(["value init", value, model, property, property_stack.join('.'), parent]);
            if (value !== null && typeof value === "object") {
                // value property appending on old dictionary
                model[property]['value'] = value;
                defineBranchValueProperty(model[property]);
                // branch / node property
                model[property]['branch'] = true;
                defineProperty(model[property], 'branch');

                if (isArray(value)) {
                    model[property]['push'] = function(value) {
                        var o = {};
                        o[this.parent[property].length] = value;
                        this.parent[property] = o;
                    }
                    defineProperty(model[property], 'push');
                }

            } else {
                // value property with a new dictionary
                model[property] = {value: value};
                defineNodeValueProperty(model[property]);
                // branch / node property
                model[property]['node'] = true;
                defineProperty(model[property], 'node');
            }
            // parent property
            var parent_property, grand_parent;
            parent_property = property_stack.length > 1 ? property_stack[property_stack.length - 2] : null;
            if (parent_property) {
                grand_parent = parent[parent_property];
            }
            model[property]['parent'] = grand_parent;
            defineProperty(model[property], 'parent');
            // path
            model[property]['path'] = property_stack;
            defineProperty(model[property], 'path');
            // old value
            model[property]['old_value'] = value;
            defineProperty(model[property], 'old_value');
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
        getter: function (value, property_stack) {
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
        setter: function (value, old_value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            //console.log(["value set", value, old_value, property_stack.join('.')]);
            old_value.old_value = old_value.value;
            old_value.value = value;
            return old_value;
        }
    };

    return {valueHandler: valueHandler};
}

// for node environment require call
if( typeof module !== 'undefined' ) {
    if ( typeof module.exports === 'undefined' ) {
        module.exports = {}
    }
    module.exports.ModelObserverHandlers = ModelObserverHandlers
}