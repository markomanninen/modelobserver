# Model Observer (Alpha state)

## Install

	bower install modelobserver

## Usage

```

<script type="text/javascript" src="./dist/modelobserver.min.js"></script>

var obs = BaseModelObserver();

var logger = {
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

// add a new log handler

obs.handler.define(logger);

var obj = {foo: {bar: 1}};

var model = obs.createModel(obj);

model.foo.bar = 2;

```

## Test

First edit package.json open:test part to contain your server path to test suite. Then run:

	npm run test

## Build from sources (./src/elonmedia/modelobserver)

	npm run build

which creates a new minified version of the library to the dist directory.

## Developer notes

Bower: http://bower.io
NPM: https://www.npmjs.com
Karma: http://karma-runner.github.io/0.12/index.html
Jasmine: http://jasmine.github.io
Travis CI: https://travis-ci.org
Semantic versioning: http://www.sitepoint.com/semantic-versioning-why-you-should-using/
