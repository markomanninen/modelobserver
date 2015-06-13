//var assert = require('assert');

// check if we run on browser of node environment
if( typeof BaseModelObserver === 'undefined' ) {
  var BaseModelObserver = require('../dist/modelobserver.min.js').BaseModelObserver;
}

if( typeof ModelValueTriggers === 'undefined' ) {
  var ModelValueTriggers = require('../dist/modelobserver.min.js').ModelValueTriggers;
}

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

describe('ModelValueTriggers', function () {

    var obs;
    var model;

    beforeEach(function () {
        obs = BaseModelObserver();
        mvt = ModelValueTriggers(obs);
        obs.triggers.defines(mvt.valueTriggers);
        var obj = {foo: {bar: 'baz', bars: []}};
        model = obs.createModel(obj);
    });

    afterEach(function () {
        obs = null;delete obs;
        model = null;delete model;
    });

    it('Initialize dummy model', function () {

        var obj = {};
        var m = obs.createModel(obj);

        expect(m.created).toBeDefined();
        expect(m.updated).toBeUndefined();
        expect(m.parent).toBeUndefined();
        expect(m.canget).toBe(true);
        expect(m.canset).toBe(true);
        expect(m.branch).toBe(true);
        expect(m.key).toBe('root');
        expect(m.path).toEqual(['root']);
        expect(m.value).toEqual({});
        // model and old value reference should be the very same object!
        expect(m.old_value).toBe(m);
        expect(typeof m.remove).toBe("function");
    });

    it('Set new value to property', function () {
        
        model.foo.bar = "BAZ";
        expect(model.foo.bar.value).toBe("BAZ");

    });

    it('Set new property by attribute', function () {

        var obj = {};
        var m = obs.createModel(obj);

        // observer doesn't recognize this
        m.foo = "bar";
        expect(m.foo.key).toBeUndefined();
        // but property will be treated as normal javascrit object
        expect(m.foo).toBe("bar");

    });

    it('Set new property by value', function () {

        var obj = {};
        var m = obs.createModel(obj);

        // add / set foo bar
        m.value = {foo: "bar"}

        expect(m.foo.key).toBe("foo");
        expect(m.foo.value).toBe("bar");

        // add / set new foo2 bar2
        m.value = {foo2: "bar2"}

        expect(m.foo2.key).toBe("foo2");
        expect(m.foo2.value).toBe("bar2");

        expect(Object.keys(m)).toEqual(['foo','foo2']);
        expect(m.value).toEqual({foo: "bar", foo2: "bar2"});

    });

    it('Initialized model keys', function () {

        expect(model.key).toBe('root');
        expect(model.foo.key).toBe('foo');
        expect(model.foo.bar.key).toBe('bar');
        expect(model.foo.bars.key).toBe('bars');

        expect(Object.keys(model)).toEqual(['foo']);
        expect(Object.keys(model.foo)).toEqual(['bar', 'bars']);
        expect(Object.keys(model.foo.bar)).toEqual([]);
        expect(Object.keys(model.foo.bars)).toEqual([]);

    });

    it('Initialized model paths', function () {

        expect(model.path).toEqual(['root']);
        expect(model.foo.path).toEqual(['root', 'foo']);
        expect(model.foo.bar.path).toEqual(['root', 'foo', 'bar']);
        expect(model.foo.bars.path).toEqual(['root', 'foo', 'bars']);

    });

    it('Push dummy to bars', function () {

        expect(model.foo.bars.updated).toBeUndefined();

        model.foo.bars.push();
        
        expect(model.foo.bars.length).toBe(0);
        expect(model.foo.bars.value).toEqual({});
        expect(model.foo.bars.updated).toBeDefined();
    });

    it('Can get properties', function () {

        expect(model.canget).toBe(true);

        expect(model.foo.bar.value).toBe("baz");
        model.foo.bar.canget = false;
        expect(model.foo.bar.value).toBeUndefined();

        expect(model.value).toBeDefined();
        expect(model.foo.value).toBeDefined();

        model.canget = false;

        expect(model.value).toEqual({});
        expect(model.foo.value).toEqual({});
        expect(model.foo.bar.value).toBeUndefined();

        model.canget = true;
        expect(model.foo.bar.value).toBe("baz");

        expect(model.value).toBeDefined();
        expect(model.foo.value).toBeDefined();

    });

    it('Can set properties', function () {

        var obj = {foo: {bar: "baz"}};
        var m = obs.createModel(obj);

        expect(m.foo.bar.canset).toBe(true);
        m.foo.bar.canset = false;

        expect(m.foo.bar.value).toBe("baz");
        m.foo.bar = "BAZ";
        expect(m.foo.bar.value).toBe("baz");

        m.canset = false;

        m.value = {foo2: 1};
        m.foo = {bar2: 1};
        m.foo.bar = "BAZ";

        expect(m.value).toEqual({foo: {bar: "baz"}});
        expect(m.foo.value).toEqual({bar: "baz"});
        expect(m.foo.bar.value).toEqual("baz");

        m.foo.bar.canset = true;
        m.foo.bar = "BAZ"
        expect(m.foo.bar.value).toBe("BAZ");

    });

    it('Parent properties', function () {
        model.foo.bars.push(1);
        expect(model.foo.bars[0].parent.key).toBe('bars');
        expect(model.foo.bars.parent.key).toBe('foo');
        expect(model.foo.parent.key).toBe('root');
        expect(model.parent).toBeUndefined();
    });

    it('Push 1 to bars', function () {

        model.foo.bars.push(1);

        expect(model.foo.bars.length).toBe(1);
        expect(model.foo.bars[0].path).toEqual(["root","foo","bars",0]);
        expect(model.foo.bars[0].parent.key).toBe("bars");
        expect(model.foo.bars[0].value).toBe(1);
        expect(model.foo.bars.updated).toBeDefined();
    });

    it('Push 1, 2, 3 to bars', function () {

        model.foo.bars.push(1, 2, 3);

        expect(model.foo.bars.updated).toBeDefined();
        expect(model.foo.bars.length).toBe(3);
        expect(Object.keys(model.foo.bars)).toEqual(['0','1','2']);

        for (var i in model.foo.bars) {
            expect(model.foo.bars[i].path).toEqual(["root","foo","bars", parseInt(i)]);
            expect(model.foo.bars[i].parent.key).toBe("bars");
            expect(model.foo.bars[i].value).toBe(parseInt(i)+1);
            expect(model.foo.bars[i].updated).toBeUndefined();
        }

    });

    it('Push objects to bars', function () {

        model.foo.bars.push({a:1}, {b:{c:1}});

        expect(model.foo.bars.value).toEqual({"0":{"a":1},"1":{"b":{"c":1}}});

        expect(model.foo.bars[1].b.c.value).toBe(1);

    });

    it('Ushift items to the beginning of the array', function () {

        model.foo.bars.push(2, 3);

        expect(model.foo.bars.value).toEqual({ 0: 2, 1: 3 });

        var c = model.foo.bars.unshift(1, 0);

        expect(model.foo.bars.value).toEqual({ 0: 0, 1: 1, 2: 2, 3: 3 });

        // items affected
        expect(Array.prototype.slice.call(c)).toEqual([1, 0]);

    });

    it('Ushift objects to the beginning of the array', function () {

        model.foo.bars.unshift({b:{c:1}}, {a:[1,2,3]});

        expect(model.foo.bars.value).toEqual({"0":{"a":{0:1,1:2,2:3}},"1":{"b":{"c":1}}});

        expect(model.foo.bars[1].b.c.value).toBe(1);

        expect(model.foo.bars[0].a[0].path).toEqual(["root","foo","bars","0","a","0"]);

    });

    it('Remove only bar', function () {

        expect(model.foo.bar.value).toBe("baz");
        model.foo.remove('bar');
        expect(model.foo.bar).toBeUndefined();

    });

    it('Remove all under foo', function () {

        expect(model.foo.value).toEqual({bar: 'baz', bars: {}});
        model.foo.remove();
        expect(model.foo).toEqual({});

    });

    it('Remove all array items', function () {

        model.foo.bars.push(1, 2, 3);
        expect(model.foo.bars.value).toEqual({0: 1, 1: 2, 2: 3});
        // same as:
        //expect(model.foo.bars.value).toEqual([1, 2, 3]);
        model.foo.bars.remove();
        expect(model.foo.bars).toEqual([]);
        // same as:
        //expect(model.foo.bars).toEqual([]);

    });

    it('Remove middle array item', function () {

        model.foo.bars.push(1, 2, 3);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });
        model.foo.bars.remove(1);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 3 });

    });

    it('Remove middle array item (-2)', function () {

        model.foo.bars.push(1, 2, 3);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });
        model.foo.bars.remove(-2);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 3 });

    });

    it('Remove first two array items', function () {

        model.foo.bars.push(1, 2, 3);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });
        model.foo.bars.remove(0,2);
        expect(model.foo.bars.value).toEqual({ 0: 3 });

    });

    it('Remove last two array items', function () {

        model.foo.bars.push(1, 2, 3);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });
        model.foo.bars.remove(1,2);
        expect(model.foo.bars.value).toEqual({ 0: 1 });

    });

    it('Pop the last array item', function () {

        model.foo.bars.push(1, 2, 3);

        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });

        var c = model.foo.bars.pop();

        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2 });

        // removed item
        expect(c.length).toBe(1);
        expect(c[0].key).toBe(2);
        expect(c[0].value).toBe(3);

    });

    it('Pull (shift) the first array item', function () {

        model.foo.bars.push(1, 2, 3);

        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });

        var c = model.foo.bars.shift();

        expect(model.foo.bars.value).toEqual({ 0: 2, 1: 3 });

        // removed item
        expect(c.length).toBe(1);
        expect(c[0].key).toBe(0);
        expect(c[0].value).toBe(1);

    });

    it('Order array items (reverse)', function () {

        model.foo.bars.push(1, 2, 3);
        
        model.foo.bars.order(Array.prototype.reverse);

        expect(model.foo.bars.value).toEqual({ 0: 3, 1: 2, 2: 1 });

    });

    it('Order array items (sort)', function () {
        model.foo.bars.push(3, 2, 1);
        var a = model.foo.bars.order(
            Array.prototype.sort, 
            function(a,b) {
                return a.value-b.value;
            }
        );
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3 });

    });

    it('Move array items', function () {
        model.foo.bars.push(1, 2, 3, 4, 5);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 });
        model.foo.bars.move(0, 3, 5);
        expect(model.foo.bars.value).toEqual({ 0: 4, 1: 5, 2: 1, 3: 2, 4: 3 });
    });

    it('Swap array items', function () {
        model.foo.bars.push(1, 2, 3, 4, 5);
        expect(model.foo.bars.value).toEqual({ 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 });
        model.foo.bars.swap(4, 0);
        expect(model.foo.bars.value).toEqual({ 0: 5, 1: 2, 2: 3, 3: 4, 4: 1 });
        expect(model.foo.bars[0].key).toBe(0);
        expect(model.foo.bars[4].key).toBe(4);
    });

});
