module.exports = {
  evaluate(source, context = {}, restricted = {}) {
    runInSandbox(source, context, restricted)
  },
  createTerminal() {
    let terminal = null
    return {
      reset() {
        terminal = null
      },
      sendBatch(batch, context = {}, restricted = {}) {
        if (terminal === null) {
          terminal = runSandboxTerminal(batch, context, restricted)
          terminal.next(batch)
          return
        }
        terminal.next(batch)
      }
    }
  }
}

function runInSandbox(source, context, restricted) {
  const scope = new Proxy(
    {
      source,
      eval
    },
    {
      has(target, propName) {
        if (propName in target) {
          return true
        }

        if (propName in context) {
          return true
        }

        if (propName in restricted) {
          throw `ReferenceError: ${propName} is restricted`
        }

        // check if var or function variable infected current function's scope
        let searchedVar
        try {
          eval(`searchedVar = ${propName}`)

          if (typeof searchedVar === 'function') {
            return false
          }

          return true
        } catch (Ex) {
          // searched for var not in global scope, not supplied from upper scope
          // this var doesn't exist - throw Exception and log error
          throw `ReferenceError: ${propName} is not defined`
        }

        return false
      },
      set(target, propName, value) {
        if (context[propName]) {
          context[propName] = value
        } else {
          target[propName] = value
        }
        return true
      },
      get(target, propName) {
        if (context[propName]) {
          return context[propName]
        }
        return target[propName]
      }
    }
  )

  with (scope) {
    eval(source)
  }
}

function* runSandboxTerminal(source, context, restricted) {
  const target = {
    source,
    eval
  }

  const scope = new Proxy(target, {
    has(target, propName) {
      if (propName in target) {
        return true
      }

      if (propName in context) {
        return true
      }

      if (propName in restricted) {
        throw `ReferenceError: ${propName} is restricted`
      }

      // check if var or function variable infected current function's scope
      let searchedVar
      try {
        eval(`searchedVar = ${propName}`)

        if (typeof searchedVar === 'function') {
          return false
        }

        return true
      } catch (Ex) {
        // searched for var not in global scope, not supplied from upper scope
        // this var doesn't exist - throw Exception and log error
        throw `ReferenceError: ${propName} is not defined`
      }

      return false
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
