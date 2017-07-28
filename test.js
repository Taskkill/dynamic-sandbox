const { evaluate, createTerminal } = require('./main')

const src = `
console.log("Hello World!")
let a = new Array(2)
const e = 'text'
console.log(e)
console.error('my little error', ', and second one')
`

evaluate(
  src,
  {
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
  { console: null },
  { Integer: null }
)
