# dynamic-sandbox
Sandboxed and completely controlled javascript evaluator.

example:
``` javascript
import { evaluate } from 'dynamic-sandbox'

const snippet = `console.log('Hello world!')`

evaluate(snippet)
```

# It's completely controllable
You can specify which variables should be allowed, restricted and you can even
override behavior of any variable in submitted snippet.
It can be used for code snippet evaluators on client and in node.

# API
``` javascript
function evaluate ( source, context, restricted )
```

## source - (string)
it should be standard JavaScript code to run

## context - (object)
it's properties specify which variables should be overrode with supplied values

## restricted - (object)
it's properties specify which variables should be considered protected and cause error

# Design
By default it's mean to run everything what is not explicitly restricted.
You can use 'restricted' object to define which properties should be protected from accessing.
You can also use 'context' object to override variables, for example console, you can easily hijack console.log
in evaluated code and feed your output somewhere else. Overrode variables has higher priority than restricted,
so you can restrict whole object like 'window' and then selectively pick and allow some of properties easily.

Global eval cannot be restricted as it is used internally.

# It can run in batch/terminal mode too
There is createTerminal function exported which creates terminal object for you.
Thanks to use of generators you can send (valid) chunks of code and on top of that call some of them.
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


## It is in active development
todo: correct error throwing and tests

It's all comming soon
