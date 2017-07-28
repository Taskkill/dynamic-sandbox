const { evaluate, createTerminal } = require('./main')

const src = `
console.log("Hello World!")
let a = new Array(2)
const e = 'text'
console.log(e)
console.error('my little error', ', and second one')

var el = 23
console.log("el ", el)

function test(a) {
  return a + 4
}

var o = test(el)
console.log("o", o)

// console.log(evaluate)
`
const src2 = 'process'

evaluate(
  src,
  {
    // console,
    Array: function() {
      // override
      console.error('Use [] not Array()')
      return []
    },
    console: {
      error() {
        console.error.call(null, 'Mock console: ',...arguments)
      },
      log() {
        console.log(...arguments)
      }
    }
  },
  { Integer: null }
)
