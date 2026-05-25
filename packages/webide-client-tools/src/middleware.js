// THIS file is IGNORED from coverage perspective
// because it can't be easily tested using unit tests.

const url = require("url")
const { createProxyMiddleware } = require("http-proxy-middleware")
const _ = require("lodash")
const execSync = require("child_process").execSync
const which = require("which")

/**
 * middleware
 * @namespace
 */
const middleware = {
  /**
   * Will return the default middleware required to run webide locally on a connect webserver.
   *
   * This means redirects for env.json files with "local" configurations
   * and reverse proxies for DI.
   *
   * @param [options]
   *
   *   @param {string} [options.host = 'localhost'] - Host to use for di reverse proxy
   *   @param {number} [options.port = 8888] - Port to use for di reverse proxy.
   *   @param {string} [options.context] - @link {https://github.com/chimurai/http-proxy-middleware#context-matching}.
   *
   *
   *  @return {any}
   */
  getDiProxyMiddleware: function getDiProxyMiddleware(options) {
    const actualOptions = _.defaults(options, {
      host: "localhost",
      port: 8888,
      context: undefined,
    })

    const proxyOpts = {
      target: `http://${actualOptions.host}:${actualOptions.port}`,
      changeOrigin: true,
      secure: false,
      /* istanbul ignore next - can only be tested in the context of integration tests */
      onProxyReq: function setBasicAuthentications(proxyReq, req) {
        const urlParts = url.parse(req.headers.referer, true)
        const auth = `Basic ${Buffer.from(
          // @ts-ignore
          `${urlParts.query.username}:${urlParts.query.password}`
        ).toString("base64")}`
        proxyReq.setHeader("Authorization", auth)
      },
    }

    if (actualOptions.context) {
      return createProxyMiddleware(actualOptions.context, proxyOpts)
    }
    return createProxyMiddleware(proxyOpts)
  },

  /**
   * Attempts to retrieve IP address of the minikube VM if no IP is predefined
   * @param {string} [options.ip] - The VM IP, without any protocol or port
   * @param {string} [options.context] - @link {https://github.com/chimurai/http-proxy-middleware#context-matching}
   * @returns {object}
   */
  getMinikubeMiddleware: function getMinikubeMiddleware(options) {
    try {
      const actualOptions = _.defaults(options, {
        context: "/che6",
      })

      const shellCommand = `${which.sync("minikube")} ip`
      const minikube =
        actualOptions.ip || `http://${execSync(shellCommand).toString().trim()}`

      const proxyOptions = {
        target: minikube,
        pathRewrite: { "^/che6/(.*)$": "/$1" },
      }

      if (actualOptions.context) {
        return createProxyMiddleware(actualOptions.context, proxyOptions)
      }
      return createProxyMiddleware(proxyOptions)
    } catch (oError) {
      console.log("minikube not found. No middleware to add")
      return undefined
    }
  },
}

module.exports = middleware
