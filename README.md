# Model Observer (Alpha state)

Moving to beta after library is used on few projects outside of the main library tests.

[![Build Status](https://travis-ci.org/markomanninen/modelobserver.svg?branch=master)](https://travis-ci.org/markomanninen/modelobserver)

## Install

	bower install modelobserver

## Usage

```html
<script type="text/javascript" src="./dist/modelobserver.min.js"></script>
```

### Base Model Observer

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

Output:

```js
["init",{"foo":{"bar":1}},{"root":{"foo":{"bar":1}}},"root","root",null]
["init",{"bar":1},{"foo":{"bar":1}},"foo","root.foo",{"root":{"foo":{"bar":1}}}]
["init",1,{"bar":1},"bar","root.foo.bar",{"foo":{"bar":1}}]
["get",{"foo":{"bar":1}},"root"]
["get",{"bar":1},"root.foo"]
["set",2,1,"root.foo.bar"]
{"foo":{"bar":2}}
```

### Model Value Triggers

Model value triggers library adds several properties to the base model observer. Main purpose of this is to enable access control to the model, removal function and add basic array manipulation functionality with triggers. Basicly you use this library as follows:

```js
var obs = BaseModelObserver();
var mvt = ModelValueTriggers(obs);

obs.triggers.defines(mvt.valueTriggers);

var obj = {foo: {bar: 'baz', bars: []}};
var model = obs.createModel(obj);
```

After initialization you have several new properties and function available which will be introduced next. Note that all new properties and function names are now reserved word on the model, so they shouldn't be used or overwritten on model attributes.

#### Value property

The most fundamental of the new properties of the model is a value property. While model observer without value triggers allows traditional property retrieval, model value triggers change the functionality to enhance model. In short you should always use `model.branch.node.value` to get the value of the wanted property. If value property is provoked for a branch like: `model.branch` it will output object data in json object format. Note that array is still an object. Only scalar values like numbers, strings, null and undefined are regarded as node values. Few examples should make this more clear:

```
console.log(model.foo.bar.value) -> "baz"

console.log(model.foo.value) -> {bar: "baz", "bars": []}
```

But setting values should be done via node property instead of value property:

```
model.foo.bar = "BAZ"

console.log(model.foo.bar.value) -> "BAZ"
```

You can also set values for branches. Object will examined. Properties available already on model will get the new value. All new branches and nodes of the value will be enchanged by new functionality. For example:

```
model.foo = {bar: "baz1", bar2: "baz2"}

console.log(model.foo.value) -> {bar: "baz1", bar2: "baz2", "bars": []}
```

This concludes changing values and setting/adding new properties to the model. You can very well start a model with empty object if you will like: `obs.createModel({})`. Array manipulation will be discussed later.


#### Parent property

Parent property is a reference to the node or branch parent object. Inside the object this is used to retrieve the path of the node or branch for example, and is a useful property for data binding purposes.

There are just few things you need to realize with parent property. Root object won't have a parent:

```
console.log(model.parent) -> undefined
```

Properties under the root will have a parent called `root` by default:


```
console.log(model.foo.parent.key) -> "root"
```

But you can modify the key name of the root node on the model init by third argument: `obs.createModel(obj, [], null, "myRoot")`:

```
console.log(model.foo.parent.key) -> "myRoot"
```

In short, parent is a way to access a model one level up from to current cursor point.

#### Key and path property

Key name was already mentioned on parent property introduction. Key name is automaticly given on the model creation time and there should be no reason to modify it on application end level. So key is mainly used for internal purposes, where most important usage of it is to determine the path of the nodes and branches. Path again is an array of keys, that leads from root of the model to the cursored node or branch. For example:

```
console.log(model.foo.bar.path) -> ['root', 'foo', 'bar']
```

#### Created and updated properties

Created and updated properties are pretty much self explanatory. Created is an iso 8601 formatted timestamp automaticly done on the node creation time. This means deeper the nodes are in the model, they might have a few millisecond difference compared to the root node. Updated property is also automaticly changed. Things to note with it are that updated property is undefined after model creation. Timestamp, also in iso 8601 format, will be given, everytime node/branch ahs been set a new value. New values again won't have updated value. The most important thing is that updated timestamp will be given a new value for all direct parent nodes. So if you change a value of a node, also root will have a new updated value. Evidently other siblings won't be affected, only parent nodes from on the path up to the root.


```
console.log(model.foo.bar.updated) -> undefined

model.foo.bar = "BAZ"

console.log(model.foo.bar.updated) -> "2015-06-20T19:06:14.810Z"

console.log(model.updated == model.foo.bar.updated) -> true
```

#### Can get and set properties

Can get can can set properties can be used to constrol access to the properties. Similar to updated functionality, these proerpties will have an effect to all child branches and nodes. Examples will show it best:


```
model.canget = false

console.log(model.foo.bar.value) -> undefined
console.log(model.foo.value) -> {}
console.log(model.value) -> {}
```

But note that accessing property instead of value will still give all other functionality of the model allowing operations with the model. Just the value will be blocked from access.

Can set can be used similar ways, but now preventing giving new values from the branches or nodes.

```
model.canget = true
model.canset = false

model.foo.bar = "BAZ"

console.log(model.foo.bar.value) -> "baz"
```


#### Branch and node properties

Branch and node properties are simply boolean values to point out hierachal position of the property. To simplify the load of the properties only true values will be listed on model. Root will have branch as true, but node as undefined. On the example model you can find these behaviours:

```
console.log(model.branch) -> true
console.log(model.node) -> undefined
console.log(model.foo.bar.branch) -> undefined
console.log(model.foo.bar.node) -> true
console.log(model.foo.bars.branch) -> true
console.log(model.foo.bars.node) -> undefined
```

Along with these new properties: `value, parent, key, path, created, updated, canget, canset, branch, node` also new functions are added to the model. They will be presented next.

#### Remove

#### Pop

#### Unshift

#### Shift

#### Push

#### Move

#### Swap

#### Order

Finally three new triggers are available in this model. Basic model observer has `init, set and get` triggers. Now they will have a companion of `remove, add and order` triggers. Usage of the triggers is similar to base model example and shown below:

```js

var logger = {
    'remove': function(value, model, property, property_stack, parent) {
        console.log(["remove", value, model, property, property_stack.join('.'), parent]);
        return value;
    },
    'add': function(value, model, property, property_stack, parent) {
        console.log(["add", value, property_stack.join('.')]);
        return value;
    },
    'order': function(value, model, property_stack) {
        console.log(["order", value, model, property_stack.join('.')]);
        return value;
    }
};

obs.triggers.defines(logger);
```

### Model Form Triggers

This is a further extension of the observer so that html form controller handling is abstracted and factorized. By doing this two and three way data binding is enabled and some of the model-view-controller logic is simplified for single page applications. Form triggers requires using value triggers so initialization of the model is done by next variables:

```js

var obs = BaseModelObserver();
var mvt = ModelValueTriggers(obs);
var mft = ModelFormTriggers(obs);

obs.triggers.defines(mvt.valueTriggers);
obs.triggers.defines(mft.formTriggers);

var obj = {foo: {bar: 'baz', bars: []}};

var model = obs.createModel(obj);

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