module.exports = {
  evaluate(source, context = {}, restricted = {}) {
    runInSandbox(source, context, restricted)
  },
  isolate(source, allowed = {}, context = {}) {
    runInIsolation(source, allowed, context)
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

function runInIsolation(source, allowed, context) {
  const scope = new Proxy(
    {
      source,
      context,
      Proxy,
      eval
    },
    {
      has(target, propName) {
        if (propName in target) {
          return false
        }

        if (!(propName in allowed)) {
          throw `ReferenceError: ${propName} is restricted`
        }

        return false
      },
    }
  )

  with (scope) {
    function runInInnerIsolation(source, context) {
      const scope1 = new Proxy(
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

      with (scope1) {
        eval(source)
      }
    }

    runInInnerIsolation(source, context)
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
