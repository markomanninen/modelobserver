function observer() {
    function isObject(item) {
        return item && item.constructor.name == 'Object';
    }
    function isArray(item) {
        return item && item.constructor.name == 'Array';
    }
    function first(arr) {
        for (var i in arr) return arr[i];
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
    }
    var observer = observer || {};
    observer.models = [];
    observer.handlerApi = function() {
        var handler_key = 'handlers';    
        var functions = {};
        var binders = {};
        // defines interface for handlers
        interfaceFactory.create(handler_key, {
            // this is called once in the model creation moment
            initter: function(value, model, property, property_stack){return value},
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
        }
        this.runHandler = function(name) {
            for (var i in functions[name]) {
                if (functions[name].hasOwnProperty(i)) {
                    // modify the first argument of the callee arguments
                    arguments[1][0] = functions[name][i].apply(this, arguments[1]);
                }
            }
            // first parameter of handler is used as a return value.
            return arguments[1][0];
        }
        return this;
    }
    observer.handler = new observer.handlerApi();
    observer.handler.define({
        initter: function(value, model, property, property_stack) {
            //console.log(["basic init", value, model, property, property_stack]);
            return value;
        },
        getter: function(value, property_stack) {
            //console.log(["basic get", value, property_stack]);
            return value;
        },
        setter: function(value, old_value, property_stack) {
            //console.log(["basic set", value, old_value, property_stack]);
            return value;
        }
    });
    observer.createModel = function(model) {
        var properties = [];
        function _recurs(model) {
            for (var property in model) {
                if (model.hasOwnProperty(property)) {
                    // add property / key on stack
                    properties.push(property);
                    var value = model[property];
                    if (isObject(value) || (isArray(value) && isObject(first(value)))) {
                        _recurs(value);
                    } else {
                        // slice properties to get a fresh new instance of the array, not a reference
                        bind(model, property, value, properties.slice());
                    }
                    // remove property / key from stack
                    properties.pop();
                }
            }
            return model;
        }
        function bind(model, property, value, properties_stack) {
            //value = observer.handler.initter(value, model, property, properties_stack);
            value = observer.handler.runHandler('initter', [value, model, property, properties_stack]);
            //observer.handler.initter(model, property, value, properties);
            Object.defineProperty(model, property, {
                get: function () {
                    return observer.handler.runHandler('getter', [value, properties_stack]);
                },
                set: function (new_value) {
                    value = observer.handler.runHandler('setter', [new_value, value, properties_stack]);
                }
            });
        }
        // add model to collection
        observer.models.push(model);
        // return model with bind setters and getters
        return _recurs(observer.models[observer.models.length-1]);
    };
    return observer;
}
