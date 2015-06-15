# Model Observer (Alpha state)

[![Build Status](https://travis-ci.org/markomanninen/modelobserver.svg?branch=master)](https://travis-ci.org/markomanninen/modelobserver)

## Install

	bower install modelobserver

## Usage

```html
<script type="text/javascript" src="./dist/modelobserver.min.js"></script>
```

```js

var obs = BaseModelObserver();

var logger = {
    'init': function(value, model, property, property_stack, parent) {
        console.log(["init", value, model, property, property_stack.join('.'), parent]);
        return value;
    },
    'get': function(value, property_stack) {
        console.log(["get",, property_stack.join('.')]);
        return value;
    },
    'set': function(value, old_value, property_stack) {
        console.log(["set", value, old_value, property_stack.join('.')]);
        return value;
    }
};

// add a new log handler

obs.triggers.defines(logger);

var obj = {foo: {bar: 1}};

var model = obs.createModel(obj);

model.foo.bar = 2;

console.log(model);


```

```js

["init",{"foo":{"bar":1}},{"root":{"foo":{"bar":1}}},"root","root",null]
["get","root"]
["get","root"]
["get","root"]
["init",{"bar":1},{"foo":{"bar":1}},"foo","root.foo",{"root":{"foo":{"bar":1}}}]
["get","root.foo"]
["get","root.foo"]
["get","root.foo"]
["init",1,{"bar":1},"bar","root.foo.bar",{"foo":{"bar":1}}]
["get","root.foo.bar"]
["get","root"]
["get","root.foo"]
["set",2,1,"root.foo.bar"]
["get","root.foo"]
["get","root.foo.bar"]
{"foo":{"bar":2}}

```

## Test

First edit package.json open:test part to contain your server path to test suite. Then run:

	npm run tests

## Build from sources (./src/elonmedia/modelobserver)

	npm run build

which creates a new minified version of the library to the dist directory.

## Developer tools&notes

Bower: http://bower.io

NPM: https://www.npmjs.com

Gulp: http://gulpjs.com

Karma: http://karma-runner.github.io/0.12/index.html

Jasmine: http://jasmine.github.io

Travis CI: https://travis-ci.org

Semantic versioning: http://www.sitepoint.com/semantic-versioning-why-you-should-using/

## LICENCE

The MIT License (MIT)