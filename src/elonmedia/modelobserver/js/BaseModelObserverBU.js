"use strict";

/*

require(BaseModelObserver.js);

var obs = BaseModelObserver();

var exampleHandler = {
    initter: function(value, model, property, property_stack, parent) {
        console.log(["init", value, model, property, property_stack.join('.'), parent]);
        return value;
    },
    getter: function(value, property_stack) {
        console.log(["get", value, property_stack.join('.'), this]);
        return value;
    },
    setter: function(value, old_value, property_stack) {
        console.log(["set", value, old_value, property_stack.join('.'), this]);
        return value;
    }
};

obs.handler.define(exampleHandler);

var obj = {foo: {bar: 1}};

var model = obs.createModel(obj);

console.log(model);

=>

{
    foo: {
        bar: 1
    }
}

*/

function BaseModelObserver() {

    /**
     * This work is licensed under the Creative Commons Attribution 3.0 United States License.
     * To view a copy of this license, visit
     * http://creativecommons.org/licenses/by/3.0/us/ or send a letter to
     * Creative Commons, 171 Second Street, Suite 300, San Francisco, California, 94105, USA.
     * Copyright 2010, Rob Blakemore
     * http://wiki.github.com/rdblakemore/JavaScript-Interface/
     */
    var Interface = function(i){i=i||null;var c=function(k){return typeof k==="undefined"},d=function(k){return typeof k!=="function"},g=function(l,k){if(d(l)){throw new Error('"signature" parameter should be of type "function"')}if(d(k)){throw new Error('"implementation" parameter should be of type "function"')}return l.length!==k.length},f,e,h;switch(true){case i===null:throw new Error("No arguments supplied to an instance of Interface constructor.");case c(i.type):throw new Error("Interface.type not defined.");case c(i.implementation):throw new Error("The interface ".concat(i.type).concat(" has not been implemented."))}f=i.type,e=i.implementation,h={};for(var j in i){var b=i[j];if(!d(b)){h[j]=b}}for(var b in h){if(c(e[b])){throw new Error(f.concat(".").concat(b).concat(" has not been implemented."))}for(var j in e){var a=e[j];switch(true){case c(h[j]):throw new Error(j.concat(" is not a defined member of ").concat(f).concat("."));case d(a):throw new Error(f.concat(".").concat(j).concat(" has not been implemented as a function."));case g(h[j],a):throw new Error("An implementation of ".concat(f).concat(".").concat(j).concat(" does not have the correct number of arguments."));default:h[j]=a;break}}}return h};

    function isObject(item) {
        return item && item.constructor.name == 'Object';
    }

    function isArray(item) {
        return item && item.constructor.name == 'Array'
    }

    var interfaceFactory = {
        interfaces: {},
        create: function(name, _interface) {
            this.interfaces[name] = _interface;
        },
        implement: function(name, _implementation) {
            this.interfaces[name]['implementation'] = _implementation;
            this.interfaces[name]['type'] = name;
            return new Interface(this.interfaces[name]);
        }
    };

    var observer = observer || {};

    observer.triggerApi = function() {

        //var trigger_key_order = 'order';
        var functions = {};
        var binders = {};

        /*
        triggerApi.create('add', function(value, parent, property_stack){return value});
        triggerApi.create('remove', function(value, parent, property_stack){return value});
        */
        this.create = function(name, func) {
            var d = {}; d[name] = func;
            interfaceFactory.create(name, d);
        }

        /*
        this.create('init', function(value, model, property, property_stack, parent){return value});
        this.create('get', function(value, property_stack){return value});
        this.create('set', function(value, old_value, property_stack){return value});
        */

        // defines interfaces for triggers
        interfaceFactory.create('init', {
            // this is called once in the model creation moment
            'init': function(value, model, property, property_stack, parent){return value}
        });

        interfaceFactory.create('get', {
            // this is called everytime model attribute is provoked
            'get': function(value, property_stack){return value}
        });

        interfaceFactory.create('set', {
            // this is called everytime model attribute is set
            'set': function(value, old_value, property_stack){return value}
        });

        interfaceFactory.create('remove', {
            // this is called everytime model attribute is set
            'remove': function(value, model, property, property_stack, parent){return value}
        });

        interfaceFactory.create('add', {
            // this is called everytime model attribute is set
            'add': function(value, model, property, property_stack, parent){return value}
        });

        this.defines = function(dict) {
            for (var i in dict) {
                var d = {}; d[i] = dict[i];
                this.define(i, d);
            }
        }

        // trigger keys: init, get, set, add, remove.
        this.define = function(trigger_key, trigger) {
            var handlerImplementations = interfaceFactory.implement(trigger_key, trigger);
            for (var name in trigger) {
                if (trigger.hasOwnProperty(name)) {
                    if (!functions.hasOwnProperty(name)) functions[name] = [];
                    Object.defineProperty(binders, name, {
                        get: function() {return functions[name]},
                        set: function(val) {functions[name].push(val)},
                        enumerable: true,
                        configurable: true
                    });
                    binders[name] = handlerImplementations[name];
                }
            }
        };

        // fundamentally same as runHandler, but using separate function for design purposes
        this.runTrigger = function(name) {
            for (var i in functions[name]) {
                if (functions[name].hasOwnProperty(i)) {
                    // modify the first argument of the callee arguments
                    arguments[1][0] = functions[name][i].apply(this, arguments[1]);
                    if (typeof arguments[1][0] == 'function') {
                        arguments[1][0] = arguments[1][0].bind(this)();
                    }
                }
            }
            // first parameter of handler is used as a return value.
            return arguments[1][0];
        };

        return this;
    };

    /*
    observer.handlerApi = function() {

        var handler_key = 'handlers';

        //var trigger_key_order = 'order';
        var functions = {};
        var binders = {};

        // defines interface for handlers
        interfaceFactory.create(handler_key, {
            // this is called once in the model creation moment
            initter: function(value, model, property, property_stack, parent){return value},
            // this is called everytime model attribute is provoked
            getter: function(value, property_stack){return value},
            // this is called everytime model attribute is called
            setter: function(value, old_value, property_stack){return value}
        });

        this.define = function(handlers) {
            var handlerImplementations = interfaceFactory.implement(handler_key, handlers);
            for (var name in handlers) {
                if (handlers.hasOwnProperty(name)) {
                    if (!functions.hasOwnProperty(name)) functions[name] = [];
                    Object.defineProperty(binders, name, {
                        get: function() {return functions[name]},
                        set: function(val) {functions[name].push(val)},
                        enumerable: true,
                        configurable: true
                    });
                    binders[name] = handlerImplementations[name];
                }
            }
        };

        this.runHandler = function(name) {
            for (var i in functions[name]) {
                if (functions[name].hasOwnProperty(i)) {
                    // modify the first argument of the callee arguments
                    arguments[1][0] = functions[name][i].apply(this, arguments[1]);
                }
            }
            // first parameter of handler is used as a return value.
            return arguments[1][0];
        };

        return this;
    };

    observer.handler = new observer.handlerApi();
    */
    observer.triggers = new observer.triggerApi();

    observer.createModel = function(model, properties, parent, root_name) {
        // create temporary root for model
        var root_name = root_name || 'root';
        // temporary root handler
        var root = {};
        root[root_name] = model;
        var mod = observer.rec(root, properties, parent);
        return mod[root_name];
    };

    // recursive model iterator
    observer.rec = function(obj, properties, parent) {
        var properties = properties || [];
        for (var property in obj) {
            properties.push(property);
            observer.define(obj[property], obj, property, properties.slice(), parent);
            if (typeof obj[property] === "object")
                observer.rec(obj[property], properties, obj);
            properties.pop();
        }
        return obj;
    }

    /*
    // define branch and node
    observer.define = function(value, model, property, property_stack, parent) {
        // define initters for model
        value = observer.handler.runHandler('initter', [value, model, property, property_stack, parent]);
        Object.defineProperty(model, property, {
            configurable: true,
            // define getters for model
            get: function () {
                return observer.handler.runHandler.bind(this)('getter', [value, property_stack]);
            },
            // define setters for model
            set: function (new_value) {
                value = observer.handler.runHandler.bind(this)('setter', [new_value, value, property_stack]);
            }
        });
    };
    */

    // define branch and node
    observer.define = function(value, model, property, property_stack, parent) {
        // define initters for model
        value = observer.triggers.runTrigger('init', [value, model, property, property_stack, parent]);
        
        if (value !== null && typeof value === "object") {

        } else {
            /*
            model[property] = {};

            model = model[property];

            model['value'] = {};
            Object.defineProperty(model, 'value', {enumerable: false, configurable: true});
            */
        }

        Object.defineProperty(model, property, {
            enumerable: true, 
            configurable: true,
            // define getters for model
            get: function () {
                return observer.triggers.runTrigger.bind(this)('get', [value, property_stack]);
            },
            // define setters for model
            set: function (new_value) {
                value = observer.triggers.runTrigger.bind(this)('set', [new_value, value, property_stack]);
            }
        });

        // define key property for model
        model['key'] = property;
        Object.defineProperty(model, 'key', {value: property, enumerable: false, configurable: true});

        // define path property for model
        model['path'] = function() {
            return parent ? parent.path().concat(parent.key) : [];
        };
        Object.defineProperty(model, 'path', {enumerable: false, configurable: true});

        // define remover/deleter for model
        model['remove'] = function(prop) {
            var c;
            if (prop) { 
                if (model.hasOwnProperty(prop)) {
                    c = observer.triggers.runTrigger.bind(this)('remove', [value, model, property, property_stack, parent]);
                    model[prop] = null;
                    delete model[prop];
                }
            } else {
                for (var i in this) {
                    if (this.hasOwnProperty(i)) {
                        observer.triggers.runTrigger.bind(this)('remove', [value, model, property, property_stack, parent]);
                        c = this;
                        this[property] = null;
                        delete this[property];
                    }
                }
            }
            return c;
        }
        Object.defineProperty(model, 'remove', {enumerable: false, configurable: true});

        // define isRoot, isBranch, is Node properties for model
        model['isRoot'] = property_stack.length == 2;
        Object.defineProperty(model, 'isRoot', {enumerable: false, configurable: true});

        model['isBranch'] = isObject(value); //(value !== null && typeof value === "object");
        Object.defineProperty(model, 'isBranch', {enumerable: false, configurable: true});

        model['isNode'] = !model['isBranch'];
        Object.defineProperty(model, 'isNode', {enumerable: false, configurable: true});

        model['parent'] = parent;
        Object.defineProperty(model, 'parent', {enumerable: false, configurable: true});

        if (isArray(value)) {
        	/*
            model['splice'] = function(index, howmany) {
                // values for remove trigger
                var l1 = index < 0 ? index + this[property].length : index;
                var l2 = l1+howmany+1;
                var val = this[property].slice().filter(function(v){return v > l1 && v < l2});
                // splice and call remove trigger
                this[property].splice.apply(this[property], arguments);
                observer.triggers.runTrigger.bind(this)('remove', [val, model, property, property_stack, parent]);
                if (arguments.length > 2) {
                    // values for add trigger
                    var d = {};
                    for (var i in arguments) if (parseInt(i) > l1) d[i] = arguments[i];
                    // call add trigger
                    observer.triggers.runTrigger.bind(this)('add', [d, model, property, property_stack, parent]);
                }
                return val;
            }
            Object.defineProperty(model, 'splice', {enumerable: false, configurable: true});
            */
            // special methods for arrays/lists
            // push, remove, pop, shift, unshift are supported
            model['push'] = function(val) {
                observer.triggers.runTrigger.bind(this)('add', [val, model, property, property_stack, parent]);
                return this[property].push(val);
            }
            Object.defineProperty(model, 'push', {enumerable: false, configurable: true});

            model['pop'] = function() {
                var val = this[property].pop();
                observer.triggers.runTrigger.bind(this)('remove', [val, model, property, property_stack, parent]);
                return val;
            }
            Object.defineProperty(model, 'pop', {enumerable: false, configurable: true});
            
            model['shift'] = function() {
                var val = this[property].shift();
                observer.triggers.runTrigger.bind(this)('remove', [val, model, property, property_stack, parent]);
                return val;
            }
            Object.defineProperty(model, 'shift', {enumerable: false, configurable: true});

            model['unshift'] = function(val) {
                observer.triggers.runTrigger.bind(this)('add', [val, model, property, property_stack, parent]);
                return this[property].unshift(val);
            }
            Object.defineProperty(model, 'unshift', {enumerable: false, configurable: true});


        }
    };

    return observer;
}

// for node environment require call
if( typeof module !== 'undefined' ) {
    if ( typeof module.exports === 'undefined' ) {
        module.exports = {}
    }
    exports.BaseModelObserver = BaseModelObserver
}