// THIS file is IGNORED from coverage perspective
// because it can't be easily tested using unit tests.

const connect = require("connect")
const http = require("http")
const serveStatic = require("serve-static")
const _ = require("lodash")
const middleware = require("./middleware")

/** @type {webideClientTools.DevServerAPI} */
const devServer = {
  /* istanbul ignore next - can only be tested in the context of integration tests with webide installed */
  startConnect: function startConnect(options) {
    const DEFAULT_CONNECT_OPTIONS = {
      port: 3000,
      customMiddlewares: [],
      builtInMiddlewareOpts: {},
    }
    Object.freeze(DEFAULT_CONNECT_OPTIONS)
    const actualOptions = _.defaultsDeep(options, DEFAULT_CONNECT_OPTIONS)
    const builtInMiddlewares = devServer.getDefaultMiddleware(
      actualOptions.builtInMiddlewareOpts
    )
    const allMiddlewares = builtInMiddlewares.concat(
      actualOptions.customMiddlewares
    )
    const app = connect()

    _.forEach(allMiddlewares, (middlewareDef) => {
      const path = middlewareDef.path
      const middlewares = _.flatten([middlewareDef.middleware])

      _.forEach(middlewares, (currMiddleware) => {
        if (path) {
          app.use(path, currMiddleware)
        } else {
          app.use(currMiddleware)
        }
      })
    })

    // Note that this uses the CWD as the base directory for the web server
    app.use(serveStatic("."))
    console.log(`Using Port: <${actualOptions.port}>`)
    const server = http.createServer(app)
    server.listen(actualOptions.port)
    console.log(
      `Dev Server has started, open <http://localhost:${actualOptions.port}>`
    )
    return server
  },

  getDefaultMiddleware: function getDefaultMiddleware(options) {
    const DEFAULT_MIDDLEWARE_OPTIONS = {
      diHost: "localhost",
      diPort: 8888,
    }
    const middlewares = []

    const actualOptions = _.defaults(options, DEFAULT_MIDDLEWARE_OPTIONS)

    const DEFAULT_DI_MIDDLEWARE = {
      path: "/di",
      middleware: [
        middleware.getDiProxyMiddleware({
          host: actualOptions.diHost,
          port: actualOptions.diPort,
        }),
      ],
    }
    Object.freeze(DEFAULT_DI_MIDDLEWARE)
    middlewares.push(DEFAULT_DI_MIDDLEWARE)

    const minikube = middleware.getMinikubeMiddleware(actualOptions)
    if (minikube) {
      const DEFAULT_MINIKUBE_MIDDLEWARE = {
        path: "/che6",
        middleware: [minikube],
      }
      Object.freeze(DEFAULT_MINIKUBE_MIDDLEWARE)
      middlewares.push(DEFAULT_MINIKUBE_MIDDLEWARE)
    }

    return middlewares
  },
}

module.exports = devServer
