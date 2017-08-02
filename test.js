const {
  evaluate,
  isolate,
  createTerminal
} = require('./main')

// examples from README
{
  console.log('Tests from examples')
  // #1
  {
    const snippet = `console.log('Hello world!')`

    evaluate(snippet) // Hello world!
  }

  // #2
  {
    const snippet = `
    let a = 23
    let b = a++
    submit(a + b)
    `
    const context = {
      submit: val => console.log(val),
    }

    isolate(snippet, {}, context) // 47
  }

  console.log('')
}

// test evaluate
{
  console.log('Testing evaluate()')
  // test transparency
  {
    const src = `
  console.log('#0 - It should log normally:', true)
  `

    evaluate(src)
  }

  // test basic functionality
  {
    const referenceOut = []
    const referenceFn = () => {
      referenceOut.push('Hello world!')
      for (let i = 0; i < 10; i++) {
        referenceOut.push(i)
      }
    }

    const src = `
  console.log('Hello world!')
  for (let i = 0; i < 10; i++) {
    console.log(i)
  }
  `
    const output = []
    const context = {
      console: {
        log: val => output.push(val)
      }
    }

    evaluate(src, context)
    referenceFn()

    const success = JSON.stringify(output) === JSON.stringify(referenceOut)
    if (success) {
      console.log('#1 - It should be same:', success)
    } else {
      throw '#1 - It should be same'
    }
  }

  // test restricted variabe
  {
    let throws = false

    const src = `
  console.log('Hello world!')
  `
    const restricted = {
      console
    }

    try {
      evaluate(src, {}, restricted)
    } catch (E) {
      throws = E === `ReferenceError: console is restricted`
    }

    const success = throws
    if (success) {
      console.log('#2 - It should throw:', success)
    } else {
      throw '#2 - It should throw'
    }
  }

  // test declaration of variables
  {
    const output = []
    const src = `
  var a = 23
  let b = 23
  let c = 23

  console.log(a)
  console.log(a + b)
  console.log(a + b + c)
  `
    const context = {
      console: {
        log: val => output.push(val)
      }
    }

    evaluate(src, context)

    const success = output[0] === 23 && output[1] === 46 && output[2] === 69
    if (success) {
      console.log('#3 - It should be same:', success)
    } else {
      throw '#2 - It should be same'
    }
  }

  // test function declaration
  {
    const output = []
    const src = `
  function test(val) {
    console.log(val)
  }

  test(23)
  `
    const context = {
      console: {
        log: val => output.push(val)
      }
    }

    evaluate(src, context)

    const success = output[0] === 23 && output.length === 1
    if (success) {
      console.log('#4 - It should be same:', success)
    } else {
      throw '#4 - It should be same'
    }
  }

  // test for use of undeclared variable
  {
    let throws = false
    const src = `
  nonExistent
  `

    try {
      evaluate(src)
    } catch (E) {
      throws = E.toString() === `ReferenceError: nonExistent is not defined`
    }
    const success = throws
    if (success) {
      console.log('#5 - It should throw:', success)
    } else {
      throw '#5 - It should throw'
    }
  }

  // test for var declaration overriding restricted variable
  {
    let output = []
    const src = `
    var a = 23
    console.log(a)
    `
    const context = {
      console: {
        log: val => output.push(val)
      }
    }
    const restricted = {
      a: 0,
    }

    evaluate(src, context, restricted)

    const success = output[0] === 23
    if (success) {
      console.log('#6 - It should be same:', success)
    } else {
      throw '#6 - It should be same'
    }
  }

  // test strict mode inside snippet
  {
    let throws = false
    const src = `
  'use strict'

  with({prop: 23}) {
    console.log(prop)
  }
  `

    try {
      evaluate(src)
    } catch (E) {
      throws =
        E.toString() ===
        `SyntaxError: Strict mode code may not include a with statement`
    }
    success = throws
    if (success) {
      console.log('#7 - It should throw:', success)
    } else {
      throw '#7 - It should throw'
    }
  }

  // test restricting this properties
  {
    const output = []
    const src = `
    console.log(this.process, this.global, this)
    `
    const context = {
      console: {
        log: (first, second, third) => output.push(first) && output.push(second) && output.push(third)
      }
    }

    evaluate(src, context, {
      'this': undefined
    })

    const success = output[0] === undefined && output[1] === undefined && output[2].toString() === {}.toString()
    if (success) {
      console.log('#8 - It should be same:', success)
    } else {
      throw '#8 - It should be same'
    }
  }

  // test accessing this properties
  {
    const output = []
    const src = `
    console.log(this.process, this.global, this)
    `
    const context = {
      console: {
        log: (first, second, third) => output.push(first) && output.push(second) && output.push(third)
      }
    }

    evaluate(src, context, {})

    const success = output[0] !== undefined && output[1] !== undefined && output[2].toString() !== {}.toString()
    if (success) {
      console.log('#9 - It should not be same:', success)
    } else {
      throw '#9 - It should not be same'
    }
  }
}

// test isolate
{
  console.log()
  console.log('Testing isolate()')
  // test transparency
  {
    const src = `
  console.log('#0 - It should log normally:', true)
  `
    const allowed = {
      console
    }

    isolate(src, allowed)
  }

  // test basic functionality
  {
    const referenceOut = []
    const referenceFn = () => {
      referenceOut.push('Hello world!')
      for (let i = 0; i < 10; i++) {
        referenceOut.push(i)
      }
    }

    const src = `
  console.log('Hello world!')
  for (let i = 0; i < 10; i++) {
    console.log(i)
  }
  `
    const output = []
    const allowed = {}
    const context = {
      console: {
        log: val => output.push(val)
      }
    }

    isolate(src, allowed, context)
    referenceFn()

    const success = JSON.stringify(output) === JSON.stringify(referenceOut)
    if (success) {
      console.log('#1 - It should be same:', success)
    } else {
      throw '#1 - It should be same'
    }
  }

  // test restricted variabe
  {
    let throws = false

    const src = `
  console.log('Hello world!')
  `

    try {
      isolate(src)
    } catch (E) {
      throws = E === `ReferenceError: console is restricted`
    }

    const success = throws
    if (success) {
      console.log('#2 - It should throw:', success)
    } else {
      throw '#2 - It should throw'
    }
  }

  // test declaration of variables
  {
    const output = []
    const src = `
  var a = 23
  let b = 23
  let c = 23

  console.log(a)
  console.log(a + b)
  console.log(a + b + c)
  `
    const context = {
      console: {
        log: val => output.push(val)
      }
    }

    isolate(src, {}, context)

    const success = output[0] === 23 && output[1] === 46 && output[2] === 69
    if (success) {
      console.log('#3 - It should be same:', success)
    } else {
      throw '#3 - It should be same'
    }
  }

  // test function declaration
  {
    const output = []
    const src = `
  function test(val) {
    console.log(val)
  }

  test(23)
  `
    const context = {
      console: {
        log: val => output.push(val)
      }
    }

    isolate(src, {}, context)

    const success = output[0] === 23 && output.length === 1
    if (success) {
      console.log('#4 - It should be same:', success)
    } else {
      throw '#4 - It should be same'
    }
  }

  // test for use of undeclared variable
  {
    let throws = false
    const src = `
  nonExistent
  `

    try {
      isolate(src)
    } catch (E) {
      throws = E.toString() === `ReferenceError: nonExistent is restricted`
    }
    const success = throws
    if (success) {
      console.log('#5 - It should throw:', success)
    } else {
      throw '#5 - It should throw'
    }
  }

  // test strict mode inside snippet
  {
    let throws = false
    const src = `
  'use strict'

  with({prop: 23}) {
    console.log(prop)
  }
  `

    try {
      isolate(src)
    } catch (E) {
      throws =
        E.toString() ===
        `SyntaxError: Strict mode code may not include a with statement`
    }
    success = throws
    if (success) {
      console.log('#6 - It should throw:', success)
    } else {
      throw '#6 - It should throw'
    }
  }

  // test restricted access to this properties
  {
    const output = []
    const src = `
    console.log(this.process, this.global, this)
    `
    const context = {
      console: {
        log: (first, second, third) => output.push(first) && output.push(second) && output.push(third)
      }
    }

    isolate(src, {}, context)

    const success = output[0] === undefined && output[1] === undefined && output[2].toString() === {}.toString()
    if (success) {
      console.log('#7 - It should be same:', success)
    } else {
      throw '#7 - It should be same'
    }
  }

  // test allowing this
  {
    const output = []
    const src = `
    console.log(this.process, this.global, this)
    `
    const context = {
      console: {
        log: (first, second, third) => output.push(first) && output.push(second) && output.push(third)
      }
    }

    isolate(src, {
      'this': undefined
    }, context)

    const success = output[0] !== undefined && output[1] !== undefined && output[2].toString() !== {}.toString()
    if (success) {
      console.log('#8 - It should not be same:', success)
    } else {
      throw '#8 - It should not be same'
    }
  }
}
