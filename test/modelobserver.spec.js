//var mo = require('../dist/modelobserver.min.js');
//var assert = require('assert');

describe('BaseModelObserver', function () {

    var obs;
    var model;

    beforeEach(function () {
    	obs = BaseModelObserver();
        var obj = {foo: {bar: 1}};
        model = obs.createModel(obj);
    });

    afterEach(function () {
    	obs = null;
        delete obs;
        model = null;
        delete model;
    });

    it('Foo bar get 1', function () {
        expect(model.foo.bar).toBe(1);
    });

    it('Foo bar set 2', function () {
    	
        model.foo.bar = 2;

        expect(model.foo.bar).toBe(2);
    });

});
