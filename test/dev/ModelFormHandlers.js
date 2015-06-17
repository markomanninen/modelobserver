"use strict";

function ModelFormHandlers(observer, selector_name) {

	var selector_name = selector_name || 'data-bind';

    function isObject(item) {
        return item && item.constructor.name == 'Object'
    }

    function isArray(item) {
        return item && item.constructor.name == 'Array'
    }

    function contains(arr, elem) {
        for (var i in arr) {
            if (arr[i] == elem) return true;
        }
        return false;
    }

    /* TYPE CONVERSION */
    /*
     "00250" is not int
     "250" is int
     "2.50" is not int
     ".50" is not in
     "some.name@gmail.com" is not int
     "1,5" is not int
     "" is not int
     "-1" is int
     "-1.5" is not int
     0 is int
     1 is int
     1.5 is not int
     -1 is int
     -1.5 is not int
     */
    function isInt(item) {
        if (item === undefined ||
            item === null ||
            typeof item === 'boolean' ||
            String(item).trim() === '') return false
        return String(parseInt(item)) === String(item)
    }

    /*
     "00250" is not float
     "250" is not float
     "2.50" is float
     ".50" is float
     "some.name@gmail.com" is not float
     "1,5" is not float
     "" is not float
     1 is not float
     1.5 is float
     -1.5 is float
     0.0 is not float! javascript engine seems to handle 0.0 or -0.0 as an int
     */
    function isFloat(item) {
        if (item === undefined ||
            item === null ||
            typeof item === 'boolean' ||
            String(item).trim() === '') return false;
        var itemx = String(item);
        var s = itemx.split('.');
        if (itemx.indexOf('.') > -1 && s.length == 2) {
            var l = String(parseFloat(itemx).toFixed(s[1].length));
            return (s[0] != '' && l == itemx) || (s[0] == '' && l.replace('0.', '.') == itemx);
        }
        return false
    }

    function parseValue(item, domElem) {
        if (domElem.attr('data-type') == "integer" && isInt(item)) {
            return parseInt(item);
        }
        if (domElem.attr('data-type') == "number" && isFloat(item)) {
            return parseFloat(item);
        }
        return item;
    }

    var formbinder = formbinder || {};

    formbinder.selector = function(properties) {
        return '['+selector_name+'="'+properties.join('.')+'"]';
    };



    formbinder.initter = function(model, property, old_value, domElem) {
        if (domElem.length) {
        	if (domElem.prop("value") !== undefined) {
	            domElem.change(function(event) {
	                if (!domElem.hasClass('select2')) {
	                    model[property] = model[property].value;
	                } else {
	                    formbinder.callback();
	                }
	            });
	        }
	        // multiple elements on change handlers?
        	/*
        	$.each(domElem, function(key, element) {
	        	if ($(this).prop("value") !== undefined) {
		            $(this).change(function(event) {
		                if (!$(this).hasClass('select2')) {
		                    model[property] = model[property].value;
		                } else {
		                    formbinder.callback();
		                }
		            });
		        }
	    	});
			*/
        }
        // multiselect and checkbox groups, that have array value
        if (isArray(old_value) && domElem.length) {
            // multiselect
            if (domElem[0].type == 'select-multiple') {
                domElem.val(old_value);
                // checkbox group. note all inputs have same data-bind name!
            } else {
                $.each(domElem, function(key, element) {
                    this.checked = contains(old_value, element.value);
                });
            }
            // text, textarea, single select, radio and boolean checkbox types
        } else if (domElem.length) {
            // boolean type checkbox
            if (domElem[0].type == 'checkbox') {
                domElem[0].checked = Boolean(old_value);
                // radio types
            } else if (domElem[0].type == 'radio') {
                $.each(domElem, function(key, element) {
                    this.checked = old_value == element.value;
                });
                // single select types
            } else if (domElem[0].type == 'select' || domElem[0].type == 'select-one') {
                domElem[0].selected = old_value == domElem.val();
                // other types (text, textarea)
            } else {
            	if (domElem.prop("value") !== undefined)
				  domElem.val(old_value);
				else
				  domElem.text(old_value);
            }
        }
    };

    formbinder.setter = function(value, domElem) {
        // type is either radio or checkbox
        if (domElem.length > 1) {
            $.each(domElem, function(key, element) {
                if (element.type == 'radio') {
                    domElem[key].checked = element.value == value;
                } else if (element.type == 'checkbox') {
                    if (contains(value, element.value)) {
                        $(this).prop('checked', 'checked');
                    } else $(this).removeAttr('checked');
                } else {
                	if ($(this).prop("value") !== undefined)
					  $(this).val(value);
					else
					  $(this).text(value);
                }
            });
        } else if (domElem.length) {
            // boolean type checkbox
            if (domElem[0].type == 'checkbox') {
                domElem[0].checked = Boolean(value);
            } else {
                // other elements
                if (domElem.hasClass('select2')) {
                    domElem.val(value).trigger("change");
                } else {
	                if (domElem.prop("value") !== undefined)
					  domElem.val(value);
					else
					  domElem.text(value);
                }
            }
        }
    };

    formbinder.getter = function(old_value, domElem) {
        // checkbox and radiobuttons have same data-bind names
        // so we need to get their values with a special case
        // checkbox and multiselect with multiple values
        // note that checkbox have been given multiple attribute!
        if (domElem.length && domElem[0].multiple) {
            if (domElem[0].type == 'select-multiple') {
                if (domElem.val()) {
                    return domElem.val().map(function(value){return parseValue(value, domElem)});
                } else return []
            } else if (domElem[0].type == 'checkbox') {
                return domElem.filter(function(){return this.checked}).map(function(){return parseValue($(this).attr("value"), domElem)}).get();
            }
            // radio
        } else if (domElem.length && domElem[0].type == 'radio') {
            return parseValue($(domElem).filter(function () {return this.checked}).val(), domElem);
        } else if (domElem.length) {
            // boolean type checkbox
            if (domElem[0].type == 'checkbox') {
                return domElem[0].checked;
            } else {
            	if (domElem.prop("value") !== undefined) {
				  return parseValue(domElem.val(), domElem);
                }
				else {
				  return parseValue(domElem.text(), domElem);
                }
            }
        }
    };

    formbinder.callback = function() {};

    formbinder.handler = {
        initter: function(value, model, property, property_stack, parent) {
            //console.log(["init", value.value, model, property, property_stack.join('.'), parent]);
            formbinder.initter(model, property, value.value, $(formbinder.selector(property_stack)));
            return value;
        },
        getter: function(value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            //console.log(["getter", value.value, property_stack.join('.')]);
            value.value = formbinder.getter(value.value, $(formbinder.selector(property_stack)));
            return value;
        },
        setter: function(value, old_value, property_stack) {
            // console.log(this) -> cyclic object, but available!
            //console.log(["setter", value.value, old_value.old_value, property_stack.join('.')]);
            formbinder.setter(value.value, $(formbinder.selector(property_stack)));
            formbinder.callback();
            return value;
        }
    };

    return {formHandler: formbinder.handler};
}

// for node environment require call
if( typeof module !== 'undefined' ) {
    if ( typeof module.exports === 'undefined' ) {
        module.exports = {}
    }
    exports.ModelFormHandlers = ModelFormHandlers
}