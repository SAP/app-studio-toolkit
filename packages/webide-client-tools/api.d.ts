// ----------------------------------------------------------------
// -------------------------- Dev Server --------------------------
// ----------------------------------------------------------------

/**
 *  A configuration of Connect Middleware functions.
 *  NOTE: The <path> property is optional
 *  and the middleware property may be an array.
 */
import { Server } from "http"
import { Configuration as WebpackConfiguration } from "webpack"

export type MiddlewareOptions = {
  path?: string
  middleware: Function | Array<Function>
}[]

export type DefaultMiddlewareOptions = {
  diHost?: string
  diPort?: number
  minikubeIp?: string
}

export interface DevServerAPI {
  /**
   * Starts a static connect web server serving the CWD.
   */
  startConnect: (options?: {
    port?: number
    customMiddlewares?: MiddlewareOptions[]
    builtInMiddlewareOpts?: DefaultMiddlewareOptions
  }) => Server

  /**
   * Returns the default middleware required to run SAP Web IDE locally on a connect webserver.
   * This means redirects for "env.json" files with "local" configurations
   * and reverse proxies for DI.
   */
  getDefaultMiddleware: (
    options?: DefaultMiddlewareOptions
  ) => MiddlewareOptions
}

export declare const devServer: DevServerAPI

// ----------------------------------------------------------------
// -------------------------- Karma -------------------------------
// ----------------------------------------------------------------

export interface KarmaAPI {
  /**
   * Returns the default properties to be used in SAP Web IDE Karma configuration.
   * This can be used directly; however, @see "buildKarmaConfig"
   * for a convenience utility to assist building Karma configurations.
   *
   * See @link http://karma-runner.github.io/1.0/config/configuration-file.html
   * for details.
   */
  defaultProps: () => Object

  /**
   * @param version - SAPUI5 version.
   * @param baseUrl - URL where SAPUI5 is hosted.
   *
   * @returns a full URL to "sap-ui-core.js".
   */
  getUi5VersionUrl: (version: string, baseUrl: string) => string
}

export declare const karma: KarmaAPI

// ----------------------------------------------------------------
// -------------------------- Bundling ----------------------------
// ----------------------------------------------------------------

export interface BundlingAPI {
  /**
   * Bundles an SAP Web IDE feature, including JS sources, “i18n” files, and JSON metadata.
   * It does not include the bundling of any SAPUI5 resources. Use tools provided by SAPUI5 to bundle those.
   *
   * Returns a promise with an object. The object properties:
   *  outDir: output directory containing the bundled files. The output directory's name may not be known
   *          in advance as it may include a timestamp when the caching option is enabled. By exposing the
   *          exact name, custom post-processing steps may be more easily implemented by the user.
   *
   */
  bundleFeature: (
    target: string,
    options?: {
      /**
       * Which JavaScript bundler to use.
       * Note that each of the bundlers have their configuration key.
       * - "javascriptOpts" for requirejs.
       * - "webpackConfiguration" for webpack.
       */
      bundler?: "webpack" | "requirejs"

      /**
       * Output directory for the bundle.
       * Default value is "dist".
       */
      outDir?: string

      /**
       *  Bundle into "outDir/[VERSION]_[TIMESTAMP]/" instead of "outDir/"
       *  and create a wrapper "package.json" file in the "outDir/package.json" file to enable caching support.
       *  Default value is "true".
       */
      enableCaching?: boolean

      /**
       * Should the output directory be cleaned prior to the bundling?
       * This is enabled by default. If you have custom code that creates additional
       * packaged artifacts in this directory, disabling this option should be considered.
       * Default value is "true".
       */
      cleanOutDir?: boolean

      /**
       * SubOptions for the javaScript bundling phase.
       * The are only relevant when using the require.js optimizer for bundling.
       */
      javaScriptOpts?: {
        /**
         * Custom configurations for the "require.js" optimizer.
         * For details, @link http://requirejs.org/docs/optimization.html#options.
         */
        optimizeOptions?: Object

        /**
         *  Will only log validation errors on the bundled artifacts
         *  instead of throwing an error that rejects the promise.
         *  Enable it only if you are an advanced user and understand
         *  the ramifications.
         *  @link {https://github.com/SAP/webide-client-tools/blob/master/FAQ.md#VALIDATE
         */
        ignoreValidations?: boolean

        /**
         * Ignored glob patterns, by default all JS resources (recursively)
         * in the directory of the "plugin.json" file are bundled. However,
         * some special edge cases may require exclusion.
         * For details about valid pattern syntax, @link https://github.com/isaacs/node-glob.
         */
        ignore?: string | string[]
      }

      /**
       * The webpack configuration
       * - Mutually exclusive with providing javaScriptOpts.
       * - For details see:
       *   @link {https://webpack.js.org/concepts/}
       *   @link {https://www.npmjs.com/package/@types/webpack}
       */
      webpackConfig?: WebpackConfiguration

      /**
       * SubOptions for the JSON file metadata bundling phase.
       */
      metadataOpts?: {
        /**
         * Prefix to apply to all plugin paths, such as "quickstart" --> "prefix/quickstart".
         */
        pluginsPrefix?: string
      }
    }
  ) => Promise<{ outDir: string }>

  /**
   * Returns the default configuration for bundling webide JavaScript resources
   * Using webpack. Use this as the starting point in creating your own
   * webpack.config.js file.
   */
  getDefaultWebpackConfig: (target?: string) => WebpackConfiguration

  /**
   * Internal utilities to construct the "bundleFeature" flow.
   * These are exposed as unofficial APIs to enable the creation of advanced flows by end users.
   * However, they receive the same level of support as the official APIs.
   */
  internal: any
}

export declare const bundling: BundlingAPI

// ----------------------------------------------------------------
// -------------------------- STF ---------------------------------
// ----------------------------------------------------------------

export type PluginDescription = {
  pluginName: string
  sURI: string
  required?: boolean
}

export type PluginsTransformDef = {
  remove?: (string | RegExp)[]
  add?: PluginDescription[]
}

export type MockPresets = "IN_MEMORY_BACKEND"

export type WebIDEServiceProxy = Object

export type AMDModule = Object

export interface STF_API {
  /**
   *
   * @param [options.urlParams] {Object.<string, string>} -
   *                     Additional url params, for example:
   *                     {
   *                     	 user:"TECHNICAL_USER",
   *                       myKey:"myValue"
   *                     }
   *
   *
   * @return {Promise<Window>} For the window where SAP Web Ide is running.
   *                           This is resolved when the SAP Web IDE core has finished loading (all_plugins_started).
   */
  startWebIDE: (
    /**
     * Unique ID for this SAP Web IDE instance.
     */
    id: string,
    options?: {
      /**
       * An SAP Web IDE feature configuration to be used as
       * the root configuration when starting SAP Web IDE.
       */
      featureConfig?: Object

      /**
       * An SAP Web IDE "env.json" object (NOT a URL link to one).
       */
      env?: Object

      /**
       * Definition of SAP Web IDE plugin transformation that happens BEFORE
       * any plugins are registered in the "pluginRegistry". This allows using mock
       * plugins or adding plugins to the SAP Web IDE instance that starts during tests.
       */
      pluginsTransformDef?: PluginsTransformDef

      /**
       * Common presets for using "pluginsTransformDef" to mock (i.e., replace) SAP Web IDE capabilities.
       * Most commonly used to mock the back-end service to allow testing with an "in-memory"
       * fake file system.
       */
      mocks?: MockPresets[]

      /**
       * Default value is: "/base/node_modules/webide/src/main/webapp/index.html".
       */
      html?: string

      /**
       * Path to load SAPUI5 from this instance of SAP Web IDE.
       */
      ui5Root?: string

      /**
       * Flag to enable or disable the use of the "sap-ui-debug=true" flag in the SAP Web IDE URL.
       */
      ui5Debug?: boolean

      /**
       * Flag to enable or disable the use of the "sap-ide-debug=true" flag in the SAP Web IDE URL.
       */
      ideDebug?: boolean

      /**
       * Additional url params passed to the webide instance for example:
       *                     {
       *                     	 user: "TECHNICAL_USER",
       *                       myFlag: "myValue"
       *                     }
       */
      urlParams?: { [key: string]: string }
    }
  ) => Promise<void>

  shutdownWebIde(
    /**
     * ID of the SAP Web IDE instance to shut down.
     */
    id: string
  ): void

  /**
   * Exposes a service from the SAP Web IDE instance.
   */
  getService(
    /**
     * ID of the SAP Web IDE instance to shut down.
     */
    id: string,
    serviceName: string
  ): Promise<WebIDEServiceProxy>

  /**
   * Utility to get a partial <getService> function with a bound "suiteName" argument.
   * This can be used to reduce verbosity and mistakes coming from copying pasting.
   */
  getServicePartial(
    id: string
  ): (serviceName: string) => Promise<WebIDEServiceProxy>

  /**
   * Exposes the "require.js" AMD modules from the "iframe" of the SAP Web IDE instance.
   */
  require(id: string, depPaths: string[]): Promise<AMDModule>

  /**
   * Exposes the original AMD module of an SAP Web IDE service proxy.
   * This can allow accessing "private" methods on a service.
   */
  getServicePrivateImpl(Service: WebIDEServiceProxy): Promise<AMDModule>
}

export declare const STF: STF_API

export as namespace webideClientTools
