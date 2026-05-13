"use strict"

// we reuse this pattern alot in this file...
/* eslint no-param-reassign: 0 -- reduce accumulators are reassigned by design throughout this file */

const acorn = require("acorn")
const stringEscape = require("js-string-escape")
const _ = require("lodash")
const fs = require("fs-extra")
const glob = require("glob")
const path = require("path")
const requirejs = require("requirejs")
const webpack = require("webpack")
const metadataReader = require("./utils/meta_data_reader")
const utils = require("./utils/utils")

function optimizeAsync(config) {
  return new Promise((resolve, reject) => {
    requirejs.optimize(config, resolve, reject)
  })
}

/**
 * @name defaultJsOptimizeOptions
 * @constant
 * @type {Object} - Require.js optimize options object,
 *    @see http://requirejs.org/docs/optimization.html#options for details.
 */
const defaultJsOptimizeOptions = {
  baseUrl: "./",
  useStrict: true,
  skipDirOptimize: true,
  wrap: false,
  throwWhen: { optimize: true },
  optimize: "uglify2",
  paths: {
    sap: "empty:",
  },
  modules: [
    {
      name: "config-preload",
      create: true,
    },
  ],
  fileExclusionRegExp: /^(\.|dist|node_modules|test)/,
}

const DEFAULT_PACKAGE_LOCATION = "./package.json"
const DEFAULT_OUT_DIR = "dist"
const CACHED_FEATURE_SUFFIX = ".cached"

const DEFAULT_BUNDLE_FEATURE_OPTS = {
  bundler: "requirejs",
  outDir: DEFAULT_OUT_DIR,
  enableCaching: true,
  cleanOutDir: true,
}
/** @type {webideClientTools.BundlingAPI} */
const bundling = {
  bundleFeature: function bundleFeature(target, options) {
    /* istanbul ignore next */
    if (target === undefined) {
      target = DEFAULT_PACKAGE_LOCATION
    } else {
      target = utils.backslashesToSlashes(target)
    }

    const timeStamp = new Date().getTime()

    const file = utils.readJsonSync(target)
    const version = file.version
    const cacheFolderName = `v${version}_${timeStamp}`

    if (!version) {
      throw Error(
        "The target package.json does not contain a valid version field!"
      )
    }

    const actualOptions = _.defaults(options, DEFAULT_BUNDLE_FEATURE_OPTS)
    const originalOutDir = actualOptions.outDir
    if (actualOptions.enableCaching) {
      actualOptions.outDir += `/${cacheFolderName}`
    }

    if (actualOptions.bundler === "requirejs") {
      _.set(actualOptions, "javaScriptOpts.outDir", actualOptions.outDir)
      // this flow creates several types of artifacts, without the keepBuildDir the require.js optimizer
      // will delete the previously created artifacts in the output directory(dist)...
      _.set(actualOptions, "javaScriptOpts.optimizeOptions.keepBuildDir", true)
    } else if (actualOptions.bundler === "webpack") {
      if (actualOptions.webpackConfig === undefined) {
        console.log(
          "<webpackConfig> option not provided, using default webpack configuration"
        )
        actualOptions.webpackConfig = bundling.getDefaultWebpackConfig(target)
      }
    }

    _.set(actualOptions, "metadataOpts.outDir", actualOptions.outDir)
    _.set(actualOptions, "i18nOpts.outDir", actualOptions.outDir)

    // Begin Execution Flow
    if (actualOptions.cleanOutDir) {
      fs.emptyDirSync(originalOutDir)
    }

    bundling.internal.bundleMetadata(target, actualOptions.metadataOpts)
    bundling.internal.bundleI18n(target, actualOptions)

    if (actualOptions.enableCaching) {
      bundling.internal.bundleCachePackageWrapper(
        file,
        originalOutDir,
        cacheFolderName
      )
    }

    if (actualOptions.bundler === "requirejs") {
      return bundling.internal
        .bundleJavaScriptSources(target, actualOptions.javaScriptOpts)
        .then(() => {
          if (actualOptions.enableCaching) {
            bundling.internal.modifyWrappedCachedPackage(
              target,
              actualOptions.outDir
            )
          }

          return { outDir: actualOptions.outDir }
        })
    } else if (actualOptions.bundler === "webpack") {
      bundling.internal.createWebpackEntryPoint(target)

      return (
        bundling.internal
          .bundleJavaScriptSourcesWebpack(actualOptions.webpackConfig)
          .then(() => {
            try {
              const targetDir = path.resolve(path.dirname(target))
              fs.copySync(targetDir, actualOptions.outDir, { overwrite: true })

              if (actualOptions.enableCaching) {
                bundling.internal.modifyWrappedCachedPackage(
                  target,
                  actualOptions.outDir
                )
              }
            } finally {
              bundling.internal.cleanWebpackEntryPoint(target)
            }

            return { outDir: actualOptions.outDir }
          })
          // this is actually a finally clause not a catch clause
          // but finally is not yet available with native promises.
          .catch((err) => {
            bundling.internal.cleanWebpackEntryPoint(target)
            throw err
          })
      )
    }
    throw Error(
      `unrecognized <bundler> option value: <${actualOptions.bundler}>`
    )
  },

  getDefaultWebpackConfig(target) {
    /* istanbul ignore next */
    if (target === undefined) {
      target = DEFAULT_PACKAGE_LOCATION
    }

    const targetFolderPath = path.resolve(path.dirname(target))
    /** @type {any} - False positives in type checks */
    const config = {
      context: targetFolderPath,

      mode: "production",

      devtool: "source-map",

      // entry point to your app
      // it's possible to have multiple entry points (see docs)
      // this is relative to the context dir above
      entry: `./webpack.entry.js`,

      output: {
        path: targetFolderPath,
        filename: "config-preload.js",
        library: { type: "amd" },
      },

      externals: [
        function ({ request }, /** @type {any} */ callback) {
          // Every module prefixed with "sap/" becomes external
          if (/^sap\/watt\//.test(request)) {
            return callback(null, `amd ${request}`)
          }
          return callback()
        },
      ],

      // uncommenting this will disable minification.
      // optimization: {
      //     minimizer: []
      // }
    }

    return config
  },

  internal: {
    /**
     * Creates the requirejs options object.
     *
     * @param {string} [target='./package.json'] - Webide package.json to be used as an entry point for the creation
     *    of the requirejs optimize options.
     *
     * @param {{ignore: string|string[], outDir: string, optimizeOptions: Object}} [options] -
     *
     *      {string|string[]} [options.ignore] - Ignored glob patterns, by default all JS resources (recursively)
     *         in the directory of the plugin.json will be bundled. However, some special edge cases may require exclusion.
     *         @See https://github.com/isaacs/node-glob for details on valid patterns syntax.
     *
     *      {string} [options.outDir='dist'] - Output directory for the JS Resources bundle,
     *
     *      {Object} [options.optimizeOptions=defaultJsOptimizeOptions] - custom configurations for the require.js optimizer.
     *         @see http://requirejs.org/docs/optimization.html#options for details.
     *
     * @return {Object} - Require.js optimize options object,
     *    @see http://requirejs.org/docs/optimization.html#options for details.
     */
    createRequireJSOptimizeOptions: function createRequireJSOptimizeOptions(
      target,
      options
    ) {
      /** @type {any} */
      let actualOptions
      if (_.isUndefined(options)) {
        actualOptions = {}
      } else {
        actualOptions = options
      }

      if (!_.isUndefined(actualOptions.additionalResources)) {
        throw Error(
          "<additionalResources> is no longer supported since version 0.5.0, All JS resources are now bundled.\n" +
            "use the <ignore> option to explicitly exclude specific resources"
        )
      }

      let packageJsonFullPath
      /* istanbul ignore next */
      if (_.isUndefined(target)) {
        packageJsonFullPath = DEFAULT_PACKAGE_LOCATION
      } else {
        packageJsonFullPath = utils.backslashesToSlashes(target)
      }

      const pathSuffixRegExp = /[^/]*$/
      const pathPrefix = packageJsonFullPath.replace(pathSuffixRegExp, "")

      let customOptimizeOptions
      if (_.isUndefined(actualOptions.optimizeOptions)) {
        customOptimizeOptions = {}
      } else {
        customOptimizeOptions = actualOptions.optimizeOptions
      }

      let actualIgnore
      if (_.isUndefined(actualOptions.ignore)) {
        actualIgnore = []
      } else {
        actualIgnore = actualOptions.ignore
      }

      let actualOutDir
      if (_.isUndefined(actualOptions.outDir)) {
        actualOutDir = DEFAULT_OUT_DIR
      } else {
        actualOutDir = actualOptions.outDir
      }

      const pathAndFile = utils.splitPathAndFile(packageJsonFullPath)
      const pkgPath = pathAndFile.path
      const pkgFile = pathAndFile.file
      const metadata = metadataReader(pkgPath, pkgFile)

      const pluginsNamesAndAbsolutePaths = _.mapValues(
        metadata.pluginsMeta,
        (currPlugin) => utils.backslashesToSlashes(currPlugin.baseURI)
      )
      const pluginsNamesAndRelativePaths = _.mapValues(
        pluginsNamesAndAbsolutePaths,
        (currAbsPath) =>
          utils.backslashesToSlashes(path.relative(pathPrefix, currAbsPath))
      )

      const filePatterns = _.flatMap(
        pluginsNamesAndAbsolutePaths,
        (currPath) => [`${currPath}/**/*.js`]
      )

      const expandedPatterns = _.uniq(
        _.flatMap(filePatterns, (currPattern) =>
          glob.sync(utils.backslashesToSlashes(currPattern), {
            ignore: actualIgnore,
          })
        )
      )

      const expandedFiles = _.filter(expandedPatterns, (currPattern) =>
        fs.statSync(currPattern).isFile()
      )
      const expandedFilesNoSuffix = _.map(expandedFiles, (currExpandedFile) =>
        currExpandedFile.replace(/.js$/, "")
      )

      const nameAndBaseURIPairs = _.toPairs(pluginsNamesAndAbsolutePaths)
      const nameAndBaseURIPairsSorted = utils.sortByPropLength(
        nameAndBaseURIPairs,
        "1"
      )
      const expandedFilesWithDotPrefixNames = _.map(
        expandedFilesNoSuffix,
        (currExpandedFile) => {
          const matchingPair = _.find(
            nameAndBaseURIPairsSorted,
            (currNameAndUri) => {
              /** @type {any} */
              const assertedCurrExpandedFile = currExpandedFile
              return assertedCurrExpandedFile.startsWith(currNameAndUri[1])
            }
          )

          /* istanbul ignore next - Code should never enter this if. this is for edge cases like windows/linux slash bugs
           *  can't think of a way to reproduce this....
           * */
          if (matchingPair === undefined) {
            throw Error(
              `Trying to bundle a JS resource which is not part of a plugin: <${currExpandedFile}>.`
            )
          }
          const currPluginUri = matchingPair[1]
          const currPluginDotName = matchingPair[0]

          return currExpandedFile.replace(currPluginUri, currPluginDotName)
        }
      )

      return _.merge(
        {
          appDir: pathPrefix,
          dir: actualOutDir,
          paths: pluginsNamesAndRelativePaths,
          modules: [
            {
              include: expandedFilesWithDotPrefixNames,
            },
          ],
        },
        defaultJsOptimizeOptions,
        customOptimizeOptions
      )
    },

    /**
     * @param [target] - see target param in {@link createRequireJSOptimizeOptions}.
     *
     * @param [options] - see options param in {@link createRequireJSOptimizeOptions}.
     *   @param {Object} [options.optimizeOptions=defaultJsOptimizeOptions]
     *   @param {Object} [options.ignoreValidations]
     *
     * @return {Promise} - Require.js optimize options object which was used during optimizations,
     *    @see http://requirejs.org/docs/optimization.html#options for details.
     */
    bundleJavaScriptSources: function bundleJavaScriptSources(target, options) {
      const defaultOptions = {
        optimizeOptions: {},
      }

      const actualOptions = _.defaults(options, defaultOptions)

      // TODO: extract? the "bundleJavaScriptSources" function should only get the prepared config
      const config = bundling.internal.createRequireJSOptimizeOptions(
        target,
        actualOptions
      )

      return optimizeAsync(config).then(() => {
        const validationMessages = _.reduce(
          config.modules,
          (result, currModule) => {
            const orgTarget = path.resolve(config.dir, `${currModule.name}.js`)
            const bundledContents = fs.readFileSync(orgTarget, "UTF-8")
            const errorLocations =
              bundling.internal.findNoneAmdSource(bundledContents)
            if (errorLocations.length > 0) {
              const errorLocationsText = _.map(errorLocations, JSON.stringify)
              let fileMessages = `file: <${orgTarget}> \nNone amd source at locations: [${errorLocationsText.join(
                ", "
              )}]`
              fileMessages +=
                "\nsee: https://sap.github.io/webide-client-tools/web/site/FAQ.html#VALIDATE_AMD"
              fileMessages += " for details."
              result.push(fileMessages)
            }
            return result
          },
          []
        )

        if (!_.isEmpty(validationMessages)) {
          const errMessage = validationMessages.join(
            "\n-----------------------------\n"
          )

          console.error(errMessage)

          if (!actualOptions.ignoreValidations) {
            throw Error(errMessage)
          }
        }
      })
    },

    /**
     * Creates a bundled i18n properties file for WebIDE.
     *
     * @param {string} [target='./package.json'] - Webide package.json to be used as an entry point for the creation
     *    of the i18n bundle.
     *
     * @param [options]
     *   @param {Function} [options.outDir = 'dist'] - - Output directory for the i18n Resources bundle, the bundled i18n resources
     *                                 will be placed under outDir/i18n folder.
     *
     * @returns {void}
     */
    bundleI18n: function bundleI18n(target, options) {
      let packageJsonFullPath
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(target)) {
        packageJsonFullPath = DEFAULT_PACKAGE_LOCATION
      } else {
        packageJsonFullPath = utils.backslashesToSlashes(target)
      }

      let actualOptions = options
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(actualOptions)) {
        actualOptions = {}
      }
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(actualOptions.outDir)) {
        actualOptions.outDir = DEFAULT_OUT_DIR
      }

      const pathAndFile = utils.splitPathAndFile(packageJsonFullPath)
      const pkgPath = pathAndFile.path
      const pkgFile = pathAndFile.file
      const metadata = metadataReader(pkgPath, pkgFile)

      const bundledPluginNames = _.keys(metadata.pluginsMeta)
      const startWithBundledPluginPredicate = (i18FileName) =>
        _.some(bundledPluginNames, (currPluginName) =>
          i18FileName.startsWith(currPluginName)
        )
      const i18Resources =
        // only bundle each resource once.
        _.uniq(
          // multiple i18n resources scenario returns an array.
          _.flatten(
            // Not all plugins have i18n resources, remove "undefined" values.
            _.compact(
              _.map(metadata.pluginsMeta, (currPlugin) => {
                if (!_.has(currPlugin, "i18n")) {
                  return undefined
                }

                if (_.isString(currPlugin.i18n)) {
                  return currPlugin.i18n
                } else if (_.isPlainObject(currPlugin.i18n)) {
                  /**
                   * To support multiple i18n resources reuse, e.g:
                   * "i18n" : {
                   *    "i18n": "com.sap.webide.annotationmodeler.ui/i18n/i18n",
                   *    "i18nAPI": "com.sap.webide.annotationmodeler.api/i18n/i18n"
                   * }
                   */
                  return _.values(currPlugin.i18n)
                }
                throw Error("i18n value may only be a string or a plain object")
              })
            )
          )
        )

      const bundledI18nResources = _.filter(
        i18Resources,
        startWithBundledPluginPredicate
      )
      const bundledPluginNamesByLength = utils.sortByLength(bundledPluginNames)
      const bundledI18nResourcesRealPathsAndNames = _.map(
        bundledI18nResources,
        (currI18nResource) => {
          const pluginNameOfI18nResource = _.find(
            bundledPluginNamesByLength,
            (currPluginName) => currI18nResource.startsWith(currPluginName)
          )
          const pluginUri =
            metadata.pluginsMeta[pluginNameOfI18nResource].baseURI
          const pathSuffix = currI18nResource.substring(
            pluginNameOfI18nResource.length
          )
          const currI18nPath = path.resolve(
            __dirname,
            `${pluginUri + pathSuffix}.properties`
          )
          return { path: currI18nPath, name: currI18nResource }
        }
      )

      const aI18nConfigs = _.map(
        bundledI18nResourcesRealPathsAndNames,
        (currPathAndName) => {
          const currI18nPath = currPathAndName.path
          const currI18nOrgKey = currPathAndName.name

          if (!fs.existsSync(currI18nPath)) {
            throw new Error(`Missing i18n file: -> ${currI18nPath}`)
          } else {
            let orgI18Text = fs.readFileSync(currI18nPath, "UTF-8")
            const oStats = fs.statSync(currI18nPath)
            if (!_.startsWith(orgI18Text, "#")) {
              orgI18Text = `#${orgI18Text}`
            }
            // #Sun Aug 07 20:04:58 UTC 2016
            const i18nTextWithDatePrefix = `#\n#${new Date(
              oStats.ctime.toString()
            )}\n${orgI18Text.substr(1, orgI18Text.length)}`
            const sKey = `${currI18nOrgKey.replace(/\./g, "/")}.properties`
            const escapedI18Text = stringEscape(i18nTextWithDatePrefix)
            return `\t\t"${sKey}":'${escapedI18Text}'\n`
          }
        }
      )

      const i18OutDir = `${actualOptions.outDir}/i18n`
      fs.ensureDirSync(i18OutDir)
      const i18ArtifactContents = utils.normalizelf(
        // eslint-disable-next-line prefer-template -- jQuery.sap preload string requires concatenation with dynamic i18n entries
        "jQuery.sap.registerPreloadedModules({\n" +
          '\t"name":"",\n' +
          '\t"version":"2.0",\n' +
          '\t"modules":{\n' +
          aI18nConfigs.join(",") +
          "}})\n"
      )

      fs.writeFileSync(`${i18OutDir}/config-preload.js`, i18ArtifactContents)
    },

    /**
     * Creates a JSON structure representing bundled WebIDE JSON Metadata (Plugins/Interfaces).
     * Note that this does not create any files, just the data structure in memory.
     *
     * @param {string} [target='./package.json'] - Webide package.json to be used as an entry point for the creation
     *    of the metadata bundle.
     * @param {string} [options.pluginsPrefix] - Prefix to apply to all plugins paths, for example "quickstart" --> "w5g/quickstart"
     *
     * @return {{ plugins : Object[], interfaces : Object[] }}
     */
    createMetadataJson: function createMetadataJson(target, options) {
      let packageJsonFullPath
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(target)) {
        packageJsonFullPath = DEFAULT_PACKAGE_LOCATION
      } else {
        packageJsonFullPath = utils.backslashesToSlashes(target)
      }

      let actualOptions = options
      if (_.isUndefined(actualOptions)) {
        actualOptions = {}
      }

      if (_.isUndefined(actualOptions.pluginsPrefix)) {
        actualOptions.pluginsPrefix = ""
      }

      const pathAndFile = utils.splitPathAndFile(packageJsonFullPath)
      const pkgPath = pathAndFile.path
      const pkgFile = pathAndFile.file
      const metadata = metadataReader(pkgPath, pkgFile)
      const configsToPluginMeta = metadata.configsToPluginMeta
      const configsToInterfaceMeta = metadata.configsToInterfaceMeta

      // Transform key names  - Plugins names --> Plugins paths
      function transformPluginNameAndRemoveBaseURI(obj) {
        return _.reduce(
          obj,
          (result, oldValue) => {
            const modifiedBaseURI = oldValue.baseURI.replace(/\\/g, "/")
            const newPluginName =
              actualOptions.pluginsPrefix +
              path.relative(pkgPath, modifiedBaseURI).replace(/\\/g, "/")
            const newValue = _.clone(oldValue)
            delete newValue.baseURI
            // eslint-disable-next-line no-param-reassign -- accumulator reassignment in reduce is intentional
            result[newPluginName] = newValue
            return result
          },
          {}
        )
      }

      function transformInterfaces(obj) {
        return _.reduce(
          obj,
          (result, oldValue) => {
            const newValue = _.clone(oldValue)
            delete newValue.baseURI
            // eslint-disable-next-line no-param-reassign -- accumulator reassignment in reduce is intentional
            result[oldValue.name] = newValue
            return result
          },
          {}
        )
      }

      const transformedConfigsToPluginMeta = _.mapValues(
        configsToPluginMeta,
        (currPluginsForJson) =>
          transformPluginNameAndRemoveBaseURI(currPluginsForJson)
      )
      const transformedConfigsToInterfaceMeta = _.mapValues(
        configsToInterfaceMeta,
        (currInterfacesToJson) => transformInterfaces(currInterfacesToJson)
      )

      // Assuming that each config will always contains at least one plugin
      const combinedGeneratedPreload = _.mapValues(
        transformedConfigsToPluginMeta,
        (currPluginsForJson, currConfigJsonPath) => {
          const actualJsonPreloadToReturn = {
            plugins: {},
            interfaces: {},
          }
          actualJsonPreloadToReturn.plugins = currPluginsForJson
          actualJsonPreloadToReturn.interfaces =
            transformedConfigsToInterfaceMeta[currConfigJsonPath]

          return actualJsonPreloadToReturn
        }
      )

      /** @type {any} */
      const flattenedGeneratedPreload = _.transform(
        combinedGeneratedPreload,
        (result, currPkgPreload) => {
          _.merge(result, currPkgPreload)
        },
        {}
      )

      return flattenedGeneratedPreload
    },

    /**
     * Write a WebIDE package metadata to a file.
     * Will write the output [outDir]/config-preload.json file.
     *
     * @param [target] - See target param in {@link createMetadataJson}.
     * @param [options] - See options param in in {@link createMetadataJson}.
     *                    With the addition of [outDir='dist'] property.
     */
    bundleMetadata: function bundleMetadata(target, options) {
      let actualOutDir = _.get(options, "outDir")
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(actualOutDir)) {
        actualOutDir = DEFAULT_OUT_DIR
      }

      const bundledMetadataJson = bundling.internal.createMetadataJson(
        target,
        options
      )
      fs.ensureDirSync(actualOutDir)
      fs.writeFileSync(
        `${actualOutDir}/config-preload.json`,
        utils.normalizelf(JSON.stringify(bundledMetadataJson))
      )
    },

    bundleCachePackageWrapper(orgPkgContents, outDir, cacheFolderName) {
      const wrapperPkgObj = {
        name: orgPkgContents.name,
        icon: orgPkgContents.icon,
        author: orgPkgContents.author,
        homepage: orgPkgContents.homepage,
        title: orgPkgContents.title,
        description: orgPkgContents.description,
        version: orgPkgContents.version,
        license: orgPkgContents.license,
        technical: true,
        bundledFeatures: {},
      }

      wrapperPkgObj.bundledFeatures[
        orgPkgContents.name + CACHED_FEATURE_SUFFIX
      ] = `file:${cacheFolderName}/package.json`

      const wrapperStringContents = JSON.stringify(wrapperPkgObj, null, "\t")
      fs.writeFileSync(`${outDir}/package.json`, wrapperStringContents)
    },

    modifyWrappedCachedPackage(target, outDir) {
      const packageJsonFileName = path.basename(target)
      const packageContents = utils.readJsonSync(
        `${outDir}/${packageJsonFileName}`
      )
      packageContents.name += CACHED_FEATURE_SUFFIX
      const newPackageContents = JSON.stringify(packageContents, null, "\t")
      fs.writeFileSync(`${outDir}/package.json`, newPackageContents)
    },

    /**
     * Checks that a bundled require.js artifact does not contain any none AMD resources.
     * This means that all the top level statements / expressions in the source file
     * must be require.js define(....) calls.
     *
     * @param {string} jsText - the source code to inspect
     * @returns {Array} - of error messages
     */
    findNoneAmdSource: function findNoneAmdSource(jsText) {
      // recursive tree walker to extract only the top level elements and ignore wrappers.
      function extractTopElements(item) {
        if (item.type === "SequenceExpression") {
          return _.flatMap(item.expressions, extractTopElements)
        } else if (item.type === "ExpressionStatement") {
          return extractTopElements(item.expression)
        }

        return [item]
      }

      const ast = acorn.parse(jsText, { ecmaVersion: 2020, locations: true })
      const topLevels = _.flatMap(ast.body, extractTopElements)

      const errorNodes = _.reject(
        topLevels,
        (node) =>
          node.type === "CallExpression" && node.callee.name === "define"
      )

      const errorOffsets = _.map(errorNodes, (node) => node.loc.start)

      return errorOffsets
    },

    bundleJavaScriptSourcesWebpack(webpackOptions) {
      return new Promise((resolve, reject) => {
        webpack(
          webpackOptions,
          (
            /** @type {any} */
            err,
            stats
          ) => {
            /* istanbul ignore next - I believe this branch only be entered due to internal error in webpack */
            if (err) {
              console.error(err.stack || err)
              if (err.details) {
                console.error(err.details)
                reject(err.details)
              } else {
                reject(err)
              }
              return
            }

            const info = stats.toJson()

            if (stats.hasErrors()) {
              console.error(info.errors)
              reject(
                info.errors
                  .map((e) =>
                    [e.moduleName, e.message].filter(Boolean).join("\n")
                  )
                  .join("\n")
              )
            }

            if (stats.hasWarnings()) {
              console.warn(info.warnings)
            }

            resolve()
          }
        )
      })
    },

    /**
     * Creates an AMD adapter entry point for webpack bundling
     * The entryPoint will be created in the <target> package.json directory.
     *
     * The entryPoint re-exports the feature services and commands as AMD modules
     * Thus enabling the loading of services/commands by the web ide which assumes they are available
     * as AMD modules with specific names.
     */
    createWebpackEntryPoint(target) {
      // TODO: this snippet to read the metadata is duplicated several times in bundling.js
      let packageJsonFullPath
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(target)) {
        packageJsonFullPath = DEFAULT_PACKAGE_LOCATION
      } else {
        packageJsonFullPath = utils.backslashesToSlashes(target)
      }

      const pathAndFile = utils.splitPathAndFile(packageJsonFullPath)
      const pkgPath = pathAndFile.path
      const pkgFile = pathAndFile.file
      const metadata = metadataReader(pkgPath, pkgFile)

      const amdModulesAndPaths = []
      _.forEach(metadata.pluginsMeta, (plugin) => {
        const relativePluginPath = `./${path.posix.relative(
          pkgPath,
          utils.backslashesToSlashes(plugin.baseURI)
        )}`
        const pluginName = plugin.name

        function addModuleAndPath(module) {
          // avoids bundling modules defined outside the current plugin.
          if (_.startsWith(module, pluginName)) {
            const modulePath = `${relativePluginPath}${module.substr(
              pluginName.length
            )}.js`
            amdModulesAndPaths.push({ module, modulePath })
          }
        }

        if (plugin.module) {
          addModuleAndPath(plugin.module)
        }

        _.forEach(plugin.provides.services, (service) => {
          addModuleAndPath(service.module)
        })

        _.forEach(
          plugin.configures.services["command:commands"],
          (commandConfig) => {
            addModuleAndPath(commandConfig.service)
          }
        )
      })

      const exports = _.map(
        amdModulesAndPaths,
        ({ module, modulePath }) =>
          `window.define("${module}", [], function() { return require("${modulePath}") })`
      )

      let header = "// This is a generated file, ignore it in .gitignore\n"
      header += "/* eslint-disable */\n\n"
      let entryPointText = header
      entryPointText += exports.join("\n")
      fs.writeFileSync(
        `${pkgPath}/webpack.entry.js`,
        utils.normalizelf(entryPointText)
      )
    },

    cleanWebpackEntryPoint(target) {
      // TODO: this snippet to read the metadata is duplicated several times in bundling.js
      let packageJsonFullPath
      /* istanbul ignore next - difficult to test without modifying CWD, should be tested in example repo */
      if (_.isUndefined(target)) {
        packageJsonFullPath = DEFAULT_PACKAGE_LOCATION
      } else {
        packageJsonFullPath = utils.backslashesToSlashes(target)
      }

      const pathAndFile = utils.splitPathAndFile(packageJsonFullPath)
      const pkgPath = pathAndFile.path
      fs.removeSync(`${pkgPath}/webpack.entry.js`)
    },
  },
}

module.exports = bundling
