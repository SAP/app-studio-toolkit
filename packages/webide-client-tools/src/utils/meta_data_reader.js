"use strict"

const _ = require("lodash")
const fs = require("fs")
const pathUtils = require("path")
const utils = require("./utils")

function getFullInterfacePath(
  pluginsMeta,
  currPathAndReferencedBy,
  currInterfaceName
) {
  const pathParts = currPathAndReferencedBy.interfacePath.split("/")
  const pluginName = pathParts[0]
  if (currInterfaceName && _.isUndefined(pluginsMeta[pluginName])) {
    throw new Error(
      `interface declaration path must start with a valid plugin name. missing pluginName: ->$\{pluginName}<-
in interface: -> ${currInterfaceName} <-
in file -> ${pathUtils.resolve(currPathAndReferencedBy.referencedBy)} <-`
    )
  }
  const pathDirPrefix = pluginsMeta[pluginName].baseURI.replace(/\\/g, "/")
  const pathDirSuffix = _.initial(_.drop(pathParts)).join("/")
  const fileName = `${_.last(pathParts)}.json`
  return pathUtils.join(pathDirPrefix, pathDirSuffix, fileName)
}

const ROOT_CONFIG = true

const pluginFileName = "plugin.json"
const extPluginFileName = "plugin.ext.json"

const servicesAssumedToExist = {
  // the core service is registered manually on WATT startup
  core: undefined,
  featureConfig: undefined,
}

/* eslint-disable no-use-before-define -- functions below are mutually recursive; hoisting is relied upon */
module.exports = function (rootConfigFolder, rootConfigFIleName) {
  const actualRootConfigFolder = `${
    pathUtils.isAbsolute(rootConfigFolder)
      ? rootConfigFolder
      : `${process.cwd()}/${rootConfigFolder}`
  }`
  // logic starts here
  let pluginsMeta = {}
  const servicesMeta = _.clone(servicesAssumedToExist)
  let interfacesMeta = {}
  const configsToPluginMeta = {}
  const pluginToConfig = {}
  let configsToInterfaceMeta = {}
  let layers = []

  // @define {Object.<string, Object[]>} in theory there could be multiple extensions, therefor each value is an array
  const configsMeta = []

  // utilities under the same scope
  function readConfigsMeta(path, fileName, includedIn, isRoot) {
    function isExcluded(currInclude) {
      return _.some(
        [
          "{orion_server}",
          "extendedplugins",
          "ui5templates",
          "plugins/pluginrepository",
          "{innovation_config_path}",
          "w5g",
          "s8d",
          "uiadaptation",
        ],
        (currExclude) => currInclude.indexOf(currExclude) !== -1
      )
    }

    const fullPath = pathUtils.join(path, fileName)
    const resolvedPath = pathUtils.resolve(__dirname, fullPath)
    assertFileExists(resolvedPath, includedIn)
    const config = utils.readJsonSync(fullPath)
    const configWithDefaults = assignConfigDefaults(config, fullPath)

    if (isRoot) {
      layers = configWithDefaults.layers
    }

    configsMeta.push(configWithDefaults)
    const allIncludes = _.values(configWithDefaults.bundledFeatures).concat(
      _.values(configWithDefaults.optionalBundledFeatures)
    )
    const localIncludes = _.reject(allIncludes, isExcluded)

    const localDeprecatedConfigIncludes = _.reject(
      configWithDefaults.deprecatedConfigIncludes,
      isExcluded
    )
    localDeprecatedConfigIncludes.forEach((configInclude) => {
      console.warn(
        `Deprecated config file ${configInclude} included in ${fullPath} is skipped`
      )
    })

    const localIncludesPathsAndFiles = _.map(localIncludes, (currInclude) => {
      const currIncludeNoPrefix = removeFilePrefix(currInclude)
      const currFullPath = pathUtils.join(path, currIncludeNoPrefix)
      const currPathOnly = pathUtils.dirname(currFullPath)
      const currFileOnly = pathUtils.basename(currFullPath)
      return { path: currPathOnly, file: currFileOnly }
    })

    // recursive calls for included configs
    _.forEach(localIncludesPathsAndFiles, (pathAndFile) => {
      readConfigsMeta(pathAndFile.path, pathAndFile.file, fullPath)
    })

    // reading the plugins sections
    readPlugins(
      _.values(configWithDefaults.bundledPlugins),
      pluginFileName,
      path,
      fullPath
    )
    const extPlugins = _.values(configWithDefaults.deprecatedPluginExtensions)
    readPlugins(extPlugins, extPluginFileName, path, fullPath)
  }

  function readPlugins(pluginPaths, fileName, path, configPath) {
    function addConfigToPlugins(pluginMeta) {
      if (!_.has(configsToPluginMeta, configPath)) {
        configsToPluginMeta[configPath] = []
      }
      configsToPluginMeta[configPath].push(pluginMeta)
    }

    _.forEach(pluginPaths, (currPluginPath) => {
      const currPluginPathNoPrefix = removeFilePrefix(currPluginPath)
      const currPlugins = {}
      const currDirPath = pathUtils.join(path, currPluginPathNoPrefix)
      const currFullPath = pathUtils.join(currDirPath, fileName)
      assertFileExists(currFullPath, configPath)
      const currPluginJson = utils.readJsonSync(currFullPath)
      const pluginMetaWithDefaults = getPluginWithDefaults(
        currPluginJson,
        currDirPath
      )
      const pluginName = pluginMetaWithDefaults.name
      currPlugins[pluginName] = pluginMetaWithDefaults
      pluginsMeta = _.merge(pluginsMeta, currPlugins)
      addConfigToPlugins(pluginMetaWithDefaults)
      pluginToConfig[pluginMetaWithDefaults.name] = configPath
    })
  }

  function readInterfacesMeta() {
    const interfaceToPlugin = {}
    const providedInterfaces = _.reduce(
      pluginsMeta,
      (result, currPlugin) => {
        const clonedCurrPlugin = _.cloneDeep(currPlugin)
        //  additional parent path information needed for better error messages
        const interfaceAndParentPath = _.mapValues(
          clonedCurrPlugin.provides.interfaces,
          (currInterfacePath, interfaceName) => {
            interfaceToPlugin[interfaceName] = currPlugin.name
            return {
              interfacePath: currInterfacePath,
              referencedBy: currPlugin.baseURI,
            }
          }
        )
        // TODO: this will override previous interfaces with the same name.
        return _.merge(result, interfaceAndParentPath)
      },
      {}
    )

    const configUriToInterfaceNames = {}
    _.forEach(interfaceToPlugin, (pluginName, interfaceName) => {
      const currConfigUri = pluginToConfig[pluginName]
      if (!_.has(configUriToInterfaceNames, currConfigUri)) {
        configUriToInterfaceNames[currConfigUri] = []
      }
      configUriToInterfaceNames[currConfigUri].push(interfaceName)
    })

    interfacesMeta = _.mapValues(
      providedInterfaces,
      (currPathAndReferencedBy, currInterfaceName) => {
        const fullInterfacePath = getFullInterfacePath(
          pluginsMeta,
          currPathAndReferencedBy,
          currInterfaceName
        )
        assertFileExists(
          fullInterfacePath,
          // @ts-ignore
          currPathAndReferencedBy.referencedBy
        )
        const currInterfaceMeta = utils.readJsonSync(fullInterfacePath)
        return getInterfaceWithDefault(currInterfaceMeta, fullInterfacePath)
      }
    )

    configsToInterfaceMeta = _.mapValues(
      configUriToInterfaceNames,
      (interfacesNames) =>
        _.map(
          interfacesNames,
          (currInterfaceName) => interfacesMeta[currInterfaceName]
        )
    )
  }

  function readServicesMeta() {
    const providedServices = _.reduce(
      pluginsMeta,
      (result, currPlugin) =>
        // TODO: maybe also verify the service module exists?
        // TODO: will override services with same name
        _.merge(result, currPlugin.provides.services),
      {}
    )

    _.forEach(providedServices, (currServiceMeta, currServiceName) => {
      servicesMeta[currServiceName] = currServiceMeta
    })
  }

  function assertFileExists(path, referencedBy) {
    const referencedByOrNothing = _.isUndefined(referencedBy)
      ? "nothing"
      : referencedBy
    const resolvedPath = pathUtils.resolve(__dirname, path)
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `missing file: -> ${pathUtils.resolve(
          path
        )} <- it is referenced by: \n${pathUtils.resolve(
          referencedByOrNothing
        )}`
      )
    }
  }

  function assignConfigDefaults(config, configPath) {
    return _.defaults(config, {
      bundledPlugins: {},
      deprecatedPluginExtensions: {},
      deprecatedConfigIncludes: [],
      bundledFeatures: {},
      optionalBundledFeatures: {},
      baseURI: configPath,
    })
  }

  function getPluginWithDefaults(pluginJson, pluginPath) {
    return _.defaultsDeep(pluginJson, {
      baseURI: pluginPath,
      requires: { services: [] },
      provides: {
        services: {},
        interfaces: {},
      },
      configures: {
        services: {},
      },
      subscribes: {},
    })
  }

  function getInterfaceWithDefault(interfaceJson, interfacePath) {
    return _.defaultsDeep(interfaceJson, {
      baseURI: interfacePath,
      extends: [],
      configurationProperties: {},
      methods: {},
      events: {},
    })
  }

  function removeFilePrefix(path) {
    if (path.indexOf("file:") !== 0) {
      throw new Error(`Path ${path} does not contain the "file:" prefix`)
    }
    return path.substring("file:".length)
  }

  readConfigsMeta(
    actualRootConfigFolder,
    rootConfigFIleName,
    undefined,
    ROOT_CONFIG
  )
  readInterfacesMeta()
  readServicesMeta()

  return {
    pluginsMeta,
    servicesMeta,
    interfacesMeta,
    configsMeta,
    configsToPluginMeta,
    configsToInterfaceMeta,
    layers,
  }
}
/* eslint-enable no-use-before-define -- end of mutually recursive function declarations */
