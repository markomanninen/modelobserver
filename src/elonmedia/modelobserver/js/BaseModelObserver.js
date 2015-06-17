"use strict";

/*

require(BaseModelObserver.js);

var obs = BaseModelObserver();

var exampleHandler = {
    'init': function(value, model, property, property_stack, parent) {
        console.log(["init", value, model, property, property_stack.join('.'), parent]);
        return value;
    },
    'get': function(value, property_stack) {
        console.log(["get", value, property_stack.join('.'), this]);
        return value;
    },
    'set': function(value, old_value, property_stack) {
        console.log(["set", value, old_value, property_stack.join('.'), this]);
        return value;
    }
};

obs.handler.defines(exampleHandler);

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

    // Interface is not mandatory and might be a subject to be removed after alpha state of the project...
    
    function isObject(item) {
        return item && item.constructor.name == 'Object';
    }

    function isArray(item) {
        return item && item.constructor.name == 'Array';
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

        var functions = {};
        var binders = {};

        this.create = function(name, func) {
            var d = {}; d[name] = func;
            interfaceFactory.create(name, d);
        };

        // defines interfaces for triggers
        interfaceFactory.create('init', {
            // this is called once in the model creation moment
            'init': function(value, model, property, property_stack, parent){return value;}
        });

        interfaceFactory.create('get', {
            // this is called everytime model attribute is provoked
            'get': function(value, property_stack){return value;}
        });

        interfaceFactory.create('set', {
            // this is called everytime model attribute is set/updated
            'set': function(value, old_value, property_stack){return value;}
        });

        // object/array remove/delete handler
        interfaceFactory.create('remove', {
            // this is called everytime model attribute or array item is removed
            'remove': function(value, model, property, property_stack, parent){return value;}
        });

        // array add handler
        interfaceFactory.create('add', {
            // this is called everytime array item is added
            'add': function(value, model, property, property_stack, parent){return value;}
        });

        // array order/rearrange/sort handler
        interfaceFactory.create('order', {
            // this is called everytime array items are sorted
            'order': function(value, model, property_stack){return value;}
        });

        this.defines = function(dict) {
            for (var i in dict) {
                var d = {}; d[i] = dict[i];
                this.define(i, d);
            }
        };

        // trigger keys: init, get, set, add, remove, order.
        this.define = function(trigger_key, trigger) {
            var handlerImplementations = interfaceFactory.implement(trigger_key, trigger);
            for (var name in trigger) {
                if (trigger.hasOwnProperty(name)) {
                    if (!functions.hasOwnProperty(name)) functions[name] = [];
                    Object.defineProperty(binders, name, {
                        get: function() {return functions[name];},
                        set: function(val) {functions[name].push(val);},
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

    observer.triggers = new observer.triggerApi();

    observer.createModel = function(model, properties, parent, root_name) {
        // create temporary root for model
        var root_name = root_name !== undefined ? root_name : 'root';
        // temporary root handler. This is going to trigger the first
        // getter, so there might be a better way to do this. basicly it is done
        // to allow different root names for paths as well as to allow
        // special properties for root element
        var root = {}; root[root_name] = model;
        return observer.rec(root, properties, parent)[root_name];
    };
/*
    observer.createModel = function(model, properties, parent) {
        return observer.rec(model, properties, parent);
    };
*/
    // recursive model iterator
    observer.rec = function(obj, properties, parent) {
        var properties = properties || [];
        for (var property in obj) {
            properties.push(property);
            // get value here to prevent getter triggering at the model creation time
            var value = obj[property];
            observer.define(value, obj, property, properties.slice(), parent);
            if (typeof value === "object")
                observer.rec(value, properties, obj);
            properties.pop();
        }
        return obj;
    };

    // define branch and node
    observer.define = function(value, model, property, property_stack, parent) {
        // define initters for model
        value = observer.triggers.runTrigger('init', [value, model, property, property_stack, parent]);
        Object.defineProperty(model, property, {
            enumerable: true, configurable: true,
            // define getters for model
            get: function () {
                return observer.triggers.runTrigger.bind(this)('get', [value, property_stack]);
            },
            // define setters for model
            set: function (new_value) {
                value = observer.triggers.runTrigger.bind(this)('set', [new_value, value, property_stack]);
            }
        });
    };

    return observer;
}

// for node environment require call
if( typeof module !== 'undefined' ) {
    if ( typeof module.exports === 'undefined' ) {
        module.exports = {};
    }
    exports.BaseModelObserver = BaseModelObserver;
}