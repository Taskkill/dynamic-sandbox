module.exports = {
  evaluate(source, context = {}, allowed = {}, restricted = {}) {
    runInSandbox(source, context, allowed, restricted)
  },
  createTerminal() {
    let terminal = null
    return {
      reset() {
        terminal = null
      },
      sendBatch(batch, context = {}, allowed = {}, restricted = {}) {
        if (terminal === null) {
          terminal = runSandboxTerminal(batch, context, allowed, restricted)
          terminal.next(batch)
          return
        }
        terminal.next(batch)
      }
    }
  }
}

// let terminal = null
//
// module.exports = {
//   evaluate(source, context, allowed, restricted = window || {}) {
//     runInSandbox(source, context, allowed, restricted)
//   },
//   resetTerminal() {
//     terminal = null
//   },
//   commit(source, context = {}, allowed = {}, restricted = window || {}) {
//     if (terminal === null) {
//       terminal = runSandboxTerminal(source, context, allowed, restricted)
//       terminal.next(source)
//       return
//     }
//     terminal.next(source)
//   }
// }

function runInSandbox(source, context, allowed, restricted) {
  const _console = context.console || console
  const err = _console.error

  // alowing eval for myself
  allowed['eval'] = null

  const scope = new Proxy(
    {
      source: source
    },
    {
      has(target, propName) {
        if (propName in context) return true

        if (propName in allowed) return false

        if (propName in restricted) {
          err(
            "Error - DO NOT USE: '" + propName + "' IT IS RESTRICTED VARIABLE"
          )
          throw 'ERROR USE OF PROTECTED VARIABLES'
        }

        if (propName in target) return true

        // check if var or function variable infected current function's scope
        let searchedVar
        try {
          eval(`searchedVar = ${propName}`)
        } catch (Ex) {
          // searched for var not in global scope, not supplied from upper scope
          // this var doesn't exist - throw Exception and log error
          err('ERROR - VARIABLE ' + propName + ' was not declared!')
          throw 'Undeclared variable use Exception'
        }

        if (typeof searchedVar === 'function') return false

        return true
      },
      set(target, propName, value) {
        if (context[propName]) context[propName] = value
        else target[propName] = value
        return true
      },
      get(target, propName) {
        if (context[propName]) return context[propName]
        return target[propName]
      }
    }
  )

  with (scope) {
    eval(source)
  }
}

function* runSandboxTerminal(source, context = {}, allowed = {}, restricted) {
  const _console = context.console || console
  const err = _console.error

  // alowing eval for myself
  allowed['eval'] = null
  const target = {
    source: source
  }

  const scope = new Proxy(target, {
    has(target, propName) {
      if (propName in context) return true

      if (propName in allowed) return false

      if (propName in restricted) {
        err("Error - DO NOT USE: '" + propName + "' IT IS RESTRICTED VARIABLE")
        throw 'ERROR USE OF PROTECTED VARIABLES'
      }

      if (propName in target) return true

      // check if var or function variable infected current function's scope
      let searchedVar
      try {
        eval(`searchedVar = ${propName}`)
      } catch (Ex) {
        // searched for var not in restricted scope, not supplied from upper scope
        // this var doesn't exist - throw Exception and log error
        err('ERROR - VARIABLE ' + propName + ' was not declared!')
        throw 'Undeclared variable use Exception'
      }

      if (typeof searchedVar === 'function') return false

      return true
    },
    set(target, propName, value) {
      if (context[propName]) context[propName] = value
      else target[propName] = value
      return true
    },
    get(target, propName) {
      if (context[propName]) return context[propName]
      return target[propName]
    }
  })

  while (true) {
    with (scope) {
      eval(source)
    }
    target.source = yield
  }
}
