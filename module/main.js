(function module() {
  const scopeCheckLimit = getScopeCheckLimit()

  const exports = {
    evaluate(source, context = {}, restricted = {}) {
      runInSandbox(source, context, restricted, scopeCheckLimit)
    },
    isolate(source, allowed = {}, context = {}) {
      runInIsolation(source, allowed, context, scopeCheckLimit)
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

  function runInSandbox(source, context, restricted, scopeCheckLimit) {
    const scope = new Proxy({
      source,
      context,
      restricted,
      Proxy,
      eval
    }, {
      has(target, propName) {
        if (propName in target || propName in context) {
          return false
        }

        if (propName in restricted) {
          throw `OUTER ReferenceError: ${propName} is restricted`
        }

        return false
      },
    })

    with(scope) {
      function runInInnerSandbox(source, context) {
        const used = {
          eval: 0,
          source: scopeCheckLimit - 1
        }

        const innerScope = new Proxy({
          source: null,
          eval: null
        }, {
          has(target, propName) {
            if (propName in target) {
              if (used[propName] < scopeCheckLimit) {
                ++used[propName]

                return false
              }

              if (propName in restricted) {
                throw `ReferenceError: ${propName} is restricted`
              }
              
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
        runInInnerSandbox.call({}, source, context)
        return
      }
      runInInnerSandbox(source, context)
    }
  }

  function runInIsolation(source, allowed, context, scopeCheckLimit) {
    const scope = new Proxy({
      source,
      context,
      allowed,
      scopeCheckLimit,
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
        const used = {
          eval: 0,
          source: scopeCheckLimit - 1,
          allowed: scopeCheckLimit,
          context : scopeCheckLimit,
          scopeCheckLimit: scopeCheckLimit
        }

        const innerScope = new Proxy({
          source: null,
          eval: null,
          allowed,
          context,
          scopeCheckLimit
        }, {
          has(target, propName) {
            if (propName in target) {
              if (used[propName] < scopeCheckLimit) {
                ++used[propName]
                return false
              }

              if (!(propName in allowed) &&
                !(propName in context)) {
                throw `ReferenceError: ${propName} is restricted`
              }

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

  // todo: implement better isolation
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
      with(scope) {
        eval(source)
      }
      target.source = yield
    }
  }

  function getScopeCheckLimit() {
    let scopeCheckLimit = 0
    const scope = new Proxy({
    }, {
      has: () => false
    })

    with(scope) {
      const innerScope = new Proxy({
        eval: null
      }, {
        has(_, propName) {
          if (propName === 'eval') {
            ++scopeCheckLimit
          }

          return false
        }
      })

      with(innerScope) {
        eval('')
      }

      // runInInnerSandbox()
      return scopeCheckLimit
    }
  }

})()
