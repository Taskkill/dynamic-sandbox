(function module() {
  const exports = {
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

  window.evaluate = exports.evaluate
  window.isolate = exports.isolate
  window.createTerminal = exports.createTerminal

  function runInSandbox(source, context, restricted) {
    const scope = new Proxy({
      source,
      context,
      restricted,
      Proxy,
      eval,
    }, {
      has(target, propName) {
        if (propName in target) {
          return false
        }

        if (propName in restricted) {
          throw `ReferenceError: ${propName} is restricted`
        }

        return false
      },
    })

    with(scope) {
      function runInInnerSandbox(source, context) {
        const innerScope = new Proxy({
          source,
          eval
        }, {
          has(target, propName) {
            if (propName in target) {
              return false
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
        })

        with(innerScope) {
          eval(source)
        }
      }

      if ('this' in restricted) {
        return runInInnerSandbox.call({}, source, context)
      }
      return runInInnerSandbox(source, context)
    }
  }

  function runInIsolation(source, allowed, context) {
    const scope = new Proxy({
      source,
      context,
      allowed,
      Proxy,
      eval,
    }, {
      has(target, propName) {
        if (propName in target) {
          return false
        }

        if (!(propName in allowed)) {
          throw `ReferenceError: ${propName} is restricted`
        }

        return false
      },
    })

    with(scope) {
      function runInInnerIsolation(source, context) {
        const innerScope = new Proxy({
          source,
          eval
        }, {
          has(target, propName) {
            if (propName in target) {
              return false
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
        })

        with(innerScope) {
          eval(source)
        }
      }

      if ('this' in allowed) {
        return runInInnerIsolation(source, context)
      }
      return runInInnerIsolation.call({}, source, context)
    }
  }
})()
