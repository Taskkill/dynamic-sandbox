`deprecated`
# dynamic-sandbox
Almost sand-boxed and completely controlled JavaScript evaluator.

``` bash
npm install dynamic-sandbox
```
``` bash
npm test
```

example:
``` javascript
import { evaluate } from 'dynamic-sandbox'

const snippet = `console.log('Hello world!')`

evaluate(snippet) // Hello world!
```

``` javascript
import { isolate } from 'dynamic-sandbox'

const snippet = `
let a = 23
let b = a++
submit(a + b)
`
const allowed = {
  submit: val => console.log(val)
}

isolate(snippet, {}, allowed) // 47
```

## Demo: https://taskkill.github.io/dynamic-sandbox/

# It's not completely secure!
For example if code snippet contains IIFE - https://developer.mozilla.org/en-US/docs/Glossary/IIFE
this sandbox is not able to prevent accessing of global object, even empty bind()
call on function will lead to accessing global context. So if you care about security really you should not use this project.

# It's completely controllable
On the other hand if you just need some evaluator and want to override some of variables
this project can be for you. You decide. So you can specify which variables should be allowed, restricted and you can even
override behavior of any variable in submitted snippet.
It can be used for code snippet evaluators on client and in node.

# Standard mode
## API
``` javascript
function evaluate ( source, context, restricted )
```

## source - (string)
it should be standard JavaScript code to run

## context - (object)
it's properties specify which variables should be overrode with supplied values

## restricted - (object)
it's properties specify which variables should be considered protected and cause
error if accessing. If `this` property provided, snippet's this context will be empty object,
thus snippet code will not be able to access properties using `this.propertyName`.

# Design
By default it's mean to run everything what is not explicitly restricted.
You can use `restricted` object to define which properties should be protected from accessing.
You can also use `context` object to override variables, for example console, you can easily hijack console.log
in evaluated code and feed your output somewhere else. Overrode variables has higher priority than restricted,
so you can restrict whole object like `window` and then selectively pick and allow some of variables easily.
By default `this` is allowed to be accessed with all it's properties.

Global eval cannot be restricted as it is used internally.


# Complete isolation mode
## API
It can run code snippet in completely isolated environment - only functions or
properties declared inside snippet can be accessed within snippet code.
Everything non declared there will fail with `ReferenceError - <variable name> is restricted` error.  

``` javascript
function isolate ( source, allowed, context )
```

## source - (string)
it should be standard JavaScript code to run

## allowed - (object)
it's properties specify which of outer scope variables can be accessed.
So you can give some ordinary JavaScript functionality to your code snippets.
If you leave it blank no outer scope variables such as `window`, `console` or `alert` would be accessible.
If `this` property provided, snippet code will be given access to `this` properties
as `this` will be default JavaScript `this context` depending on environment.

## context - (object)
it's properties specify which variables should be overrode with supplied values.
This object is changing behavior of isolation - basically it overrides isolation
and define variables for code snippet. It acts similarly for isolation as acts for
`restricted` properties in `evaluate` function.

# Design
By default it's mean to restrict everything what is not explicitly allowed or defined by snippet context.
You can use `allowed` object to define which properties should be given access to.
You can also use `context` object to override variables, for example console, you can easily hijack console.log
in evaluated code and feed your output somewhere else. Overrode variables has higher priority than implicit restriction,
so you can restrict everything non declared in code snippet and then selectively pick and allow/override some of variables easily.
By default `this` is restricted and provided empty object without any properties.


# Terminal mode
There is createTerminal function exported, which creates terminal object for you.
With use of generators you can send chunks of code in terminal similarly as if you were streaming code into evaluator.
Terminal keeps context between calls so you can declare functions and variables (only using `var`) in one chunk and use it in another one.
Its extra useful when you want declare some functions and so on and then call them in small divided chunks of code, like in terminal.

example:
``` javascript
import { createTerminal } from 'dynamic-sandbox'

let terminal = createTerminal()

const chunk = `
function hello(name) {
  console.log("Hello " + name)
}
`

terminal.sendBatch(chunk)

const command = `
hello('ME')
`
terminal.sendBatch(command)
```
API of sendBatch function is exactly same as of evaluate


## It is not in active development!

This project will remain as it is, because of how JavaScript works I am not able
to make it completely isolated and it was for study purpose after all. Use it if you want
but there probable won't be any updates.
