/**
 * Created by marko on 23.5.15.
 */

/*

require(interface.min.js);
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

    function isObject(item) {
        return item && item.constructor.name == 'Object';
    }

    var interfaceFactory = {
        interfaces: {},
        create: function(name, interface) {
            this.interfaces[name] = interface;
        },
        implement: function(name, implementation) {
            this.interfaces[name]['implementation'] = implementation;
            this.interfaces[name]['type'] = name;
            return new Interface(this.interfaces[name]);
        }
    };

    var observer = observer || {};

    observer.handlerApi = function() {
        var handler_key = 'handlers';
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

    observer.createModel = function(model, properties, parent) {

        // create temporary root for model
        var root_name = root_name ||'root';

        // recursive model iterator
        function rec(obj, properties, parent) {
            var properties = properties || [];
            for (var property in obj) {
                properties.push(property);
                def(obj[property], obj, property, properties.slice(), parent);
                if (typeof obj[property] === "object")
                    rec(obj[property], properties, obj);
                properties.pop();
            }
            return obj;
        }

        // define branch and node
        function def(value, model, property, property_stack, parent) {
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
        }
        // temporary root handler
        var root = {};
        root[root_name] = model;
        var mod = rec(root, properties, parent);
        //delete mod[root_name];
        return mod[root_name];
    };
    return observer;
}