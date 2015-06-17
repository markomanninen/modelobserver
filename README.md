# Model Observer (Alpha state)

Moving to beta after library is used on few projects outside of the main library tests.

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
        console.log(["get", value, property_stack.join('.')]);
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
["init",{"bar":1},{"foo":{"bar":1}},"foo","root.foo",{"root":{"foo":{"bar":1}}}]
["init",1,{"bar":1},"bar","root.foo.bar",{"foo":{"bar":1}}]
["get",{"foo":{"bar":1}},"root"]
["get",{"bar":1},"root.foo"]
["set",2,1,"root.foo.bar"]
{"foo":{"bar":2}}

```

## Test

First edit package.json open:test part to contain your server path to test suite. Then run:

	npm run tests

## Build from sources (./src/elonmedia/modelobserver)

	npm run build

which creates a new minified version of the library to the `dist` directory.

## Developer tools & notes

Bower: http://bower.io

NPM: https://www.npmjs.com

Gulp: http://gulpjs.com

Jasmine: http://jasmine.github.io

Travis CI: https://travis-ci.org

Semantic versioning: http://www.sitepoint.com/semantic-versioning-why-you-should-using/

```
x.y.z
x = Main version of the plugin
y = New features were added to the plugin
z = Fixes/patches to existing features of the plugin
```

## Copyright and License

The MIT License (MIT)

Copyright (c) 2015 Marko Manninen

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.