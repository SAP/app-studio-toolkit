// Needs to run in browser, but the eslint config here is for node.js (ES6).
/* eslint-disable */
define("STF", [
  "ui5Version",
  "coverage",
  "mockConf",
  "https://unpkg.com/lodash@4.17.2/lodash.min.js",
], function (ui5Version, coverage, mockConf, _) {
  "use strict"
  // Hack to sync load deps
  // TODO: can this be extracted? or must it bbe duplicated for every file using it?
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

  var pkg = loadResourceSync("./base/package.json", "json")
  // TODO: we are injecting this, perhaps wrap in UMD js resource to load via require.js?
  var localEnvJson = loadResourceSync(
    "./base/node_modules/@sap-webide/webide-client-tools/resources/local_env/local_env.json",
    "json"
  )

  window.WEB_IDE_CORE_STARTED_DEFERRED = {}
  window.WEB_IDE_DEFERRED = {}
  window.WEB_IDE_PLUGIN_REG = {}

  var defaultFake = mockConf.getDefaultFake(true)
  var IN_MEMORY_BACKEND = "IN_MEMORY_BACKEND"
  var BUILT_IN_MOCKS = {}
  BUILT_IN_MOCKS[IN_MEMORY_BACKEND] = {
    remove: defaultFake.remove,
    add: defaultFake.plugins,
  }
  Object.freeze(BUILT_IN_MOCKS)

  /**
   * @param {PluginsTransformDef} userTransforms
   * @param {string[]} mockNames
   *
   * @returns {PluginsTransformDef}
   */
  function mergeMocksWithUserPluginTransforms(userTransforms, mockNames) {
    var result = _.clone(userTransforms)
    var actualMocks = _.filter(BUILT_IN_MOCKS, function (value, key) {
      return _.includes(mockNames, key)
    })

    var allMockRemoves = _.uniq(_.flatten(_.map(actualMocks, "remove")))
    var allMockAddWithDuplicates = _.flatten(_.map(actualMocks, "add"))
    var allMockAdd = _.uniqBy(allMockAddWithDuplicates, "pluginName")
    var allAddsWithDuplicate = userTransforms.add.concat(allMockAdd)
    var allAdds = _.uniqBy(allAddsWithDuplicate, "pluginName")

    result.remove = _.union(userTransforms.remove, allMockRemoves)
    result.add = allAdds

    return result
  }

  /**
   * @param {PluginsTransformDef} pluginTransforms
   *
   * @returns {PluginsTransformDef}
   */
  function addRequiredTrueToPluginTransforms(pluginTransforms) {
    var result = _.clone(pluginTransforms)

    _.forEach(result.add, function (pluginDescription) {
      if (_.isUndefined(pluginDescription.required)) {
        pluginDescription.required = true
      }
    })

    return result
  }

  function combinePluginTransformOptions(pluginsTransform, mocks) {
    var resultTransforms = mergeMocksWithUserPluginTransforms(
      pluginsTransform,
      mocks
    )
    resultTransforms = addRequiredTrueToPluginTransforms(resultTransforms)

    return resultTransforms
  }

  /**
   * @param {PluginDef[]} plugins
   * @param {PluginsTransformDef} transformDef
   * @return {PluginDef[]}
   */
  // TODO: duplicated in webide_starter
  function transformPluginsCollection(plugins, transformDef) {
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

  var usedSuiteNames = {}
  var isRunning = false
  var lastSuiteName

  var DEFAULT_FEATURE_CONFIG = {
    name: "rootFeature",
    bundledFeatures: {
      "sap.watt.uitools.di.hcp.feature":
        "file:./resources/sap/watt/uitools/hcp-di/client/package.json",
    },
  }
  DEFAULT_FEATURE_CONFIG.bundledFeatures[pkg.name] =
    "file:../../../../../package.json"

  // Freezing causes the webide core to explode...
  // Object.freeze(DEFAULT_FEATURE_CONFIG)
  var DEFAULT_START_WEBIDE_OPTIONS = {
    featureConfig: DEFAULT_FEATURE_CONFIG,
    pluginsTransformDef: { add: [], remove: [] },
    mocks: [IN_MEMORY_BACKEND],
    env: localEnvJson,
    html: "/base/node_modules/webide/src/main/webapp/index.html",
    ui5Root:
      "https://sapui5.hana.ondemand.com/" + ui5Version.version + "/resources/",
    ui5Debug: false,
    ideDebug: true,
    urlParams: undefined,
  }
  Object.freeze(DEFAULT_START_WEBIDE_OPTIONS)

  var STF = {
    startWebIde: function (suiteName, options) {
      if (isRunning) {
        throw Error(
          "WebIde already running, may not not in parallel, did you forget to call shutdownWebIde?"
        )
      }
      isRunning = true
      lastSuiteName = suiteName

      if (_.has(usedSuiteNames, suiteName)) {
        throw new Error("Duplicate suite name: -->" + suiteName + "<--")
      }
      usedSuiteNames[suiteName] = true

      var actualOptions = _.defaultsDeep(options, DEFAULT_START_WEBIDE_OPTIONS)

      var invalidMockNames = _.filter(actualOptions.mocks, function (currMock) {
        return !_.includes(_.keys(BUILT_IN_MOCKS), currMock)
      })

      if (!_.isEmpty(invalidMockNames)) {
        throw Error(
          "Invalid Mock names to STF.startWebIDE\n\t" +
            invalidMockNames.join("\t\n")
        )
      }

      actualOptions.pluginsTransformDef = combinePluginTransformOptions(
        actualOptions.pluginsTransformDef,
        actualOptions.mocks
      )

      // url building for the web-ide iframe
      var url = actualOptions.html

      if (_.endsWith(url, ".html")) {
        url += "?sap-ide-iframe"
      } else {
        url += "&sap-ide-iframe"
      }

      if (actualOptions.ideDebug) {
        url += "&sap-ide-debug"
      }

      if (actualOptions.ui5Debug) {
        url += "&sap-ui-debug=true"
      }

      url += "&sap-ide-static-ws"

      url += "&static-ws-ui5-root=" + encodeURIComponent(actualOptions.ui5Root)

      // TODO: should the key also be encoded?
      url = _.reduce(
        actualOptions.urlParams,
        function (currUrl, value, key) {
          return currUrl + "&" + key + "=" + encodeURIComponent(value)
        },
        url
      )

      // can't use ->window.location.origin<- because it is not supported on all browsers
      var host = window.location.host
      var protocol = window.location.protocol
      url = protocol + "//" + host + url

      var coreStartedRegistryDeferred = Q.defer()
      window.WEB_IDE_CORE_STARTED_DEFERRED[suiteName] =
        coreStartedRegistryDeferred
      coreStartedRegistryDeferred.promise =
        coreStartedRegistryDeferred.promise.then(function (PluginRegistry) {
          if (
            actualOptions.registerPlugins &&
            _.isArray(actualOptions.registerPlugins)
          ) {
            return PluginRegistry.register(actualOptions.registerPlugins)
          }
        })

      var serviceRegistryDeferred = Q.defer()
      window.WEB_IDE_DEFERRED[suiteName] = serviceRegistryDeferred
      var iframe = document.createElement("iframe")
      iframe.src = url
      iframe.name = "frame"
      iframe.id = suiteName
      iframe.height = "900px"
      iframe.width = "100%"
      document.body.appendChild(iframe)
      iframe.contentWindow.addEventListener("error", function (e) {
        // quickly fail a service test in case webide failed to load instead of waiting for a timeout.
        // note that if there is an issue with missing plugins the config.json must include "require":true
        serviceRegistryDeferred.reject(new Error(e.message)) // wrapping in an Error for better error message formatting.
      })

      // Injecting pseudo arguments to the Webide's core
      iframe.contentWindow.WEB_IDE_PLUGINS_TRANSFORM = _.partialRight(
        transformPluginsCollection,
        actualOptions.pluginsTransformDef
      )
      iframe.contentWindow.WEB_IDE_FEATURE_CONFIG_OVERRIDE =
        actualOptions.featureConfig
      iframe.contentWindow.WEB_IDE_ENV_JSON_OVERRIDE = actualOptions.env

      return serviceRegistryDeferred.promise.then(function (PluginRegistry) {
        window.WEB_IDE_PLUGIN_REG[suiteName] = PluginRegistry
        return iframe.contentWindow
      })
    },

    shutdownWebIde: function (suiteName) {
      if (suiteName !== lastSuiteName) {
        throw Error(
          "trying to shutdown suite: <" +
            suiteName +
            "> but previous suite: <" +
            lastSuiteName +
            "> is still running"
        )
      }

      window.WEB_IDE_CORE_STARTED_DEFERRED[suiteName] = "done"
      window.WEB_IDE_DEFERRED[suiteName] = "done"
      window.WEB_IDE_PLUGIN_REG[suiteName] = "done"
      var testIFrame = document.getElementById(suiteName)

      var hasRootWindowCoverage = !_.isUndefined(window.__coverage__)
      var hasIframeCoverage = !_.isUndefined(
        testIFrame.contentWindow.__coverage__
      )

      // coverage data aggregation
      if (hasRootWindowCoverage && hasIframeCoverage) {
        var coverageDataFromIFrame = testIFrame.contentWindow.__coverage__
        coverage.mergeIstanbulCoverageData(
          window.__coverage__,
          coverageDataFromIFrame
        )
      } else if (!hasRootWindowCoverage && hasIframeCoverage) {
        window.__coverage__ = testIFrame.contentWindow.__coverage__
      }

      testIFrame.parentNode.removeChild(testIFrame)
      delete usedSuiteNames[suiteName]
      isRunning = false
    },

    getService: function (suiteName, serviceName) {
      return window.WEB_IDE_PLUGIN_REG[suiteName]
        .$getServiceRegistry()
        .get(serviceName)
    },

    getServicePartial: function (suiteName) {
      return this.getService.bind(this, suiteName)
    },

    require: function (suiteName, depPaths) {
      var iframe = document.getElementById(suiteName)
      var iframeWindow = iframe.contentWindow
      var deferred = Q.defer()

      iframeWindow.require(depPaths, function () {
        deferred.resolve(Array.prototype.slice.call(arguments))
      })
      return deferred.promise
    },

    getServicePrivateImpl: function (oService) {
      return oService._getImpl().then(function (oNonLazyProxy) {
        return oNonLazyProxy._getImpl().then(function (_impl) {
          return _impl
        })
      })
    },

    mocks: {
      IN_MEMORY_BACKEND: IN_MEMORY_BACKEND,
    },
  }

  STF.startWebIde.DEFAULT_OPTIONS = function () {
    // immutability changes everything.
    return _.cloneDeep(DEFAULT_START_WEBIDE_OPTIONS)
  }
  return STF
})
