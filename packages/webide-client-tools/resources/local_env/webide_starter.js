// Needs to run in browser, but the eslint config here is for node.js (ES6).
/* eslint-disable */

window.WEB_IDE_DEFERRED = {}

var pkg = loadResourceSync("./package.json", "json")

var DEFAULT_FEATURE_CONFIG = {
  name: "rootFeature",
  bundledFeatures: {
    "sap.watt.uitools.di.hcp.feature":
      "file:./resources/sap/watt/uitools/hcp-di/client/package.json",
  },
}

DEFAULT_FEATURE_CONFIG.bundledFeatures[pkg.name] =
  "file:../../../../../package.json"

Object.freeze(DEFAULT_FEATURE_CONFIG)
Object.freeze(DEFAULT_FEATURE_CONFIG.bundledFeatures)

var DEFAULT_OPTIONS = {
  webappPath: "node_modules/webide/src/main/webapp/",
  featureConfig: DEFAULT_FEATURE_CONFIG,
}

Object.freeze(DEFAULT_OPTIONS)

// Hack to sync load deps

function loadResourceSync(url, resourceType) {
  var xhrObj = new XMLHttpRequest()
  xhrObj.open("GET", url, false)
  xhrObj.send("")

  // TODO read suffix from the url instead of argument?
  if (resourceType === "js") {
    return eval(xhrObj.responseText)
  } else if (resourceType === "json") {
    return JSON.parse(xhrObj.responseText)
  } else {
    throw Error("non exhaustive match")
  }
}

loadResourceSync("https://unpkg.com/lodash@4.17.2/lodash.min.js", "js")

var actualOptions = _.defaults(window.CUSTOM_OPTIONS, DEFAULT_OPTIONS)

loadResourceSync(
  actualOptions.webappPath + "test-resources/sap/watt/util/mock_conf.js",
  "js"
)
loadResourceSync(
  actualOptions.webappPath + "test-resources/sap/watt/sane-tests/ui5Version.js",
  "js"
)

var localEnvJson = loadResourceSync(
  "node_modules/@sap-webide/webide-client-tools/resources/local_env/local_env.json",
  "json"
)

var defaultFake = mockConf.getDefaultFake(false, actualOptions.webappPath)
var WEBIDE_BACKEND_PRESETS = {
  DI: {
    add: [],
    remove: [],
  },
  IN_MEMORY: {
    add: defaultFake.plugins,
    remove: defaultFake.remove,
  },
}

var DEFAULT_UI5_URL =
  "https://sapui5.hana.ondemand.com/" +
  WEBIDE_LOCAL_DEV_UI5.version +
  "/resources/"

var DEFAULT_START_WEBIDE_OPTIONS = {
  ui5_url: DEFAULT_UI5_URL,
  base_index_html: actualOptions.webappPath + "index.html",
  dev_mode: true,
  extra_url_params: {},
  backend: "IN_MEMORY",
  env: localEnvJson,
  featureConfig: DEFAULT_FEATURE_CONFIG,
}

Object.freeze(DEFAULT_START_WEBIDE_OPTIONS)
Object.freeze(DEFAULT_START_WEBIDE_OPTIONS.extra_url_params)

/**
 * Starts the WebIDE in an IFrame.
 *
 * @param [options = DEFAULT_START_WEBIDE_OPTIONS]
 *
 *   @param {string} [options.ui5_url]
 *
 *   @param {string} [options.base_index_html] - which webide index.html to load in the iframe.
 *
 *   @param {boolean}  [options.dev_mode] - Should the url param "sap-ide-dev=true" be used.
 *
 *   @param {Object.<string, number>}  [options.extra_url_params] -
 *          Additional url params to append to the webide URL.
 *          Example: {
 *                     "ui5-debug": "true",
 *                     "myCustomParam": 666
 *                   }
 *
 *   @param {string}  [options.backend] - Which backend to use, Currently only in-memory is supported.
 *
 *   @param {Object}  [options.env] - custom env.json object to inject.
 *
 *   @param {Object}  [options.featureConfig] - custom featureConfig to use, see DEFAULT_FEATURE_CONFIG variable
 *                                              to see it's structure.
 *
 *   @param {{ add:{ pluginName:string, sURI:string, required:boolean }[], remove:string[] }} [options.plugins_transform]
 *                - Custom plugin transformations, can be used to load the feature's plugins or plugin mocks.
 */
function startWebIDE(options) {
  const id = "local_dev_webide"

  // unfortunately using deprecated "deferred" promise API
  const deferred = {
    promise: null,
    resolve: null,
    reject: null,
  }

  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  window.WEB_IDE_DEFERRED[id] = deferred

  var actualOptions = _.defaultsDeep(options, DEFAULT_START_WEBIDE_OPTIONS)

  var iframe = document.createElement("iframe")

  var url = actualOptions.base_index_html + "?sap-ide-static-ws&sap-ide-iframe"
  url += "&static-ws-ui5-root="
  console.log("Loading UI5 From: <" + actualOptions.ui5_url + ">")
  url += encodeURIComponent(actualOptions.ui5_url)

  if (actualOptions.dev_mode) {
    url += "&sap-ide-dev=true"
  }
  _.forEach(actualOptions.extra_url_params, function (value, key) {
    url += "&" + key + "=" + encodeURIComponent(value)
  })

  iframe.src = url
  iframe.name = "frame"
  iframe.id = id
  iframe.style.position = "fixed"
  iframe.style.top = "0px"
  iframe.style.left = "0px"
  iframe.style.bottom = "0px"
  iframe.style.right = "0px"
  iframe.style.width = "100%"
  iframe.style.height = "100%"
  iframe.style.border = "none"
  iframe.style.margin = "0"
  iframe.style.padding = "0"
  iframe.style.overflow = "hidden"
  iframe.style["z-index"] = "999999"

  document.body.appendChild(iframe)

  iframe.contentWindow.addEventListener("error", function (e) {
    // quickly fail a service test in case webide failed to load instead of waiting for a timeout.
    // note that if there is an issue with missing plugins the config.json must include "require":true
    deferred.reject(new Error(e.message)) // wrapping in an Error for better error message formatting.
  })

  var transformDef = {
    add: [],
    remove: [],
  }

  function concatArraysInMergeCustomizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue)
    }
  }

  transformDef = _.mergeWith(
    transformDef,
    WEBIDE_BACKEND_PRESETS[actualOptions.backend],
    actualOptions.plugins_transform,
    concatArraysInMergeCustomizer
  )

  // TODO: Duplicated in STF
  function transformPluginsCollection(plugins) {
    var transformedPlugins = _.reject(plugins, function (currPlugin) {
      return _.some(transformDef.remove, function (removePattern) {
        if (_.isString(removePattern)) {
          return removePattern === currPlugin.pluginName
        } else if (_.isRegExp(removePattern)) {
          return removePattern.test(currPlugin.pluginName)
        }
      })
    })

    transformedPlugins = transformedPlugins.concat(transformDef.add)
    return transformedPlugins
  }

  iframe.contentWindow.WEB_IDE_PLUGINS_TRANSFORM = transformPluginsCollection

  // using clone deep to avoid passing frozen objects here as the webide core explodes when we do it.
  iframe.contentWindow.WEB_IDE_FEATURE_CONFIG_OVERRIDE = _.cloneDeep(
    actualOptions.featureConfig
  )

  iframe.contentWindow.WEB_IDE_ENV_JSON_OVERRIDE = actualOptions.env

  return deferred.promise.then(function (PluginRegistry) {
    return {
      pluginRegistry: PluginRegistry,
      contentWindow: iframe.contentWindow,
    }
  })
}
