jest.mock("vm")

// testing via the API intentionally
const chai = require("chai")
const path = require("path")
const fs = require("fs-extra")
const _ = require("lodash")
const chaiAsPromised = require("chai-as-promised")
const bundlingApi = require("../src/api").bundling

chai.use(chaiAsPromised)
chai.use(require("chai-string"))

const expect = chai.expect

const pkg = path.resolve(__dirname, "resources/package.json")
const internalApi = bundlingApi.internal

/* eslint-disable no-unused-expressions -- chai assertions use property access as expressions */
describe("The, Exported bundling APIs", () => {
  function sharedAssertions(actual) {
    expect(actual.appDir).to.equal(
      `${path.resolve(__dirname, "resources").replace(/\\/g, "/")}/`
    )
    expect(actual.baseUrl).to.equal("./")
    expect(actual.optimize).to.equal("uglify2")
    expect(actual.useStrict).to.equal(true)
    expect(actual.paths).to.include({
      "sap.watt.bamba.quickstart": "../resources2/quickstart",
      "sap.watt.bamba.slowstart": "slowstart",
      sap: "empty:",
    })
  }

  describe("createRequireJSOptimizeOptions API", () => {
    it("can create optimize options using custom target", () => {
      const actual = internalApi.createRequireJSOptimizeOptions(pkg)

      expect(actual.modules[0].include).to.have.members([
        "sap.watt.bamba.quickstart/service/2",
        "sap.watt.bamba.quickstart/service/3",
        "sap.watt.bamba.quickstart/command/1",
        "sap.watt.bamba.quickstart/tips/4",
        "sap.watt.bamba.quickstart/utils/utils",
        "sap.watt.bamba.slowstart/service/6",
        "sap.watt.bamba.slowstart/service/7",
        "sap.watt.bamba.slowstart/command/5",
        "sap.watt.bamba.slowstart/extra/extra1",
        "sap.watt.bamba.slowstart/extra/extra2",
        "sap.watt.bamba.rapidstart/service/b2",
        "sap.watt.bamba.rapidstart/command/b1",
      ])

      expect(actual.dir).to.equal("dist")
      sharedAssertions(actual)
    })

    it("can create optimize options using ignore option", () => {
      const actual = internalApi.createRequireJSOptimizeOptions(pkg, {
        ignore: "**/extra/*.js",
      })

      expect(actual.modules[0].include).to.have.members([
        "sap.watt.bamba.quickstart/service/2",
        "sap.watt.bamba.quickstart/service/3",
        "sap.watt.bamba.quickstart/command/1",
        "sap.watt.bamba.quickstart/tips/4",
        "sap.watt.bamba.quickstart/utils/utils",
        "sap.watt.bamba.slowstart/service/6",
        "sap.watt.bamba.slowstart/service/7",
        "sap.watt.bamba.slowstart/command/5",
        "sap.watt.bamba.rapidstart/service/b2",
        "sap.watt.bamba.rapidstart/command/b1",
      ])

      expect(actual.dir).to.equal("dist")
      sharedAssertions(actual)
    })

    it("Will throw an error when using the deprecated <additionalResources> option", () => {
      const bundleFunc = () =>
        internalApi.createRequireJSOptimizeOptions(pkg, {
          additionalResources: "bamba",
        })
      expect(bundleFunc).to.throw(
        "<additionalResources> is no longer supported since version 0.5.0"
      )
    })

    it("Will throw an error when the target package.json does not include a version property", () => {
      const noVersionPkg = path.resolve(
        __dirname,
        "resources/no_version_package.json"
      )
      const bundleFunc = () => bundlingApi.bundleFeature(noVersionPkg)
      expect(bundleFunc).to.throw(
        "The target package.json does not contain a valid version field!"
      )
    })

    it("can create optimize options using custom (standard) requireJS Options", () => {
      const customOptions = {
        paths: {
          "sap.watt.saptoolsets.ui5.common.docuutils": "empty:",
        },
        uglify2: {
          mangle: false,
        },
      }
      const actual = internalApi.createRequireJSOptimizeOptions(pkg, {
        optimizeOptions: customOptions,
        outDir: "bamba",
      })
      expect(actual.dir).to.equal("bamba")
      expect(actual.paths).to.include({
        "sap.watt.saptoolsets.ui5.common.docuutils": "empty:",
      })
      expect(actual.uglify2).to.include({ mangle: false })
      sharedAssertions(actual)
    })
  })

  describe("optimizeUsingRequireJS API", () => {
    const distFolder = path.resolve(__dirname, "dist")
    const expectedOutputFile = `${distFolder}/config-preload.js`

    beforeEach(() => {
      fs.removeSync(distFolder)
    })

    it("can bundle using requirejs optimizer", () =>
      internalApi
        .bundleJavaScriptSources(pkg, {
          optimizeOptions: {
            dir: distFolder,
          },
        })
        .then(() => {
          const outputContents = fs.readFileSync(expectedOutputFile, "UTF-8")
          expect(outputContents).to.include("FOO")
          expect(outputContents).to.include("BAR")
          expect(outputContents).to.include("HELLO WORLD")
        }))

    afterEach(() => {
      fs.removeSync(distFolder)
    })
  })

  describe("bundleI18n API", () => {
    const distFolder = path.resolve(__dirname, "dist")
    const jQuery = {
      sap: {},
    }

    beforeEach(() => {
      fs.removeSync(distFolder)
    })

    it("can bundle i18n", () => {
      internalApi.bundleI18n(pkg, { outDir: distFolder })
      const actualOutputContents = fs.readFileSync(
        `${distFolder}/i18n/config-preload.js`,
        "UTF-8"
      )
      // haxxxx to test evaluated code
      jQuery.sap.registerPreloadedModules = function (i18nContents) {
        expect(i18nContents.version).to.equal("2.0")
        expect(_.keys(i18nContents.modules)).include.members([
          "sap/watt/bamba/quickstart/i18n/i18n.properties",
          "sap/watt/bamba/slowstart/i18n/i18n.properties",
          "sap/watt/bamba/rapidstart/i18n/i18n.properties",
        ])
        expect(_.keys(i18nContents.modules)).to.have.lengthOf(3)
        expect(
          i18nContents.modules["sap/watt/bamba/slowstart/i18n/i18n.properties"]
        )
          .to.contain("osem")
          .and.to.contain("bamba")
          .and.to.contain("A schema with the name ''{0}'' already exists")
          .and.to.contain("hellllllo \\'world\\'")

        expect(
          i18nContents.modules["sap/watt/bamba/quickstart/i18n/i18n.properties"]
        )
          .to.contain("quick_start_dialog_label")
          // after evaluation (eval) the escaping disappears
          .and.to.contain("'should be escaped'")
          .and.to.contain("'should be escaped at start'")
          .and.to.contain("first newline!")
          .and.to.contain("more newline!")

        expect(
          i18nContents.modules["sap/watt/bamba/rapidstart/i18n/i18n.properties"]
        )
          .to.contain("abc")
          .and.to.contain("123")
      }
      // eslint-disable-next-line no-eval -- eval is required to execute and test the generated JavaScript bundle output
      eval(actualOutputContents)
    })

    it('will ignore "external" i18n resources when bundling', () => {
      const pkgFilter = path.resolve(
        __dirname,
        "resources/package_i18n_filter.json"
      )

      internalApi.bundleI18n(pkgFilter, { outDir: distFolder })
      const actualOutputContents = fs.readFileSync(
        `${distFolder}/i18n/config-preload.js`,
        "UTF-8"
      )
      // haxxxx to test evaluated code
      jQuery.sap.registerPreloadedModules = function (i18nContents) {
        expect(i18nContents.version).to.equal("2.0")
        expect(_.keys(i18nContents.modules))
          .include.members([
            "sap/watt/bamba/quickstart/i18n/i18n.properties",
            "sap/watt/bamba/slowstart/i18n/i18n.properties",
          ])
          .and // this property file was filtered out.
          .to.not.include.members(["i/am/external/i18n/i18n.properties"])
        expect(_.keys(i18nContents.modules)).to.have.lengthOf(2)
      }
      // eslint-disable-next-line no-eval -- eval is required to execute and test the generated JavaScript bundle output
      eval(actualOutputContents)
    })

    it("Will throw an error if i18n file does not exist", () => {
      const pkgi18n = path.resolve(
        __dirname,
        "resources/package_missing_i18n.json"
      )
      const bundlei18nFunc = () =>
        internalApi.bundleI18n(pkgi18n, {
          additionalResources: "bamba",
        })
      const missingi18nFilePath = path.resolve(
        __dirname,
        "resources/missingi18n/i18n/i18n.properties"
      )
      expect(bundlei18nFunc).to.throw(
        `Missing i18n file: -> ${missingi18nFilePath}`
      )
    })

    it("Will throw an error if i18n property is of an invalid type", () => {
      const pkgi18n = path.resolve(
        __dirname,
        "resources/package_wrong_type_i18n.json"
      )
      const bundlei18nFunc = () => internalApi.bundleI18n(pkgi18n)

      expect(bundlei18nFunc).to.throw(
        `i18n value may only be a string or a plain object`
      )
    })

    afterEach(() => {
      fs.removeSync(distFolder)
    })
  })

  describe("createMetadataJson API", () => {
    it("can bundle metadata with default options", () => {
      const actual = internalApi.createMetadataJson(pkg)

      expect(actual.plugins).to.include.keys([
        "../resources2/quickstart",
        "slowstart",
        "common/rapidstart",
      ])
      expect(_.keys(actual.plugins)).to.have.lengthOf(3)

      expect(actual.interfaces).to.include.keys([
        "sap.watt.bamba.quickstart.QuickStartService",
        "sap.watt.bamba.slowstart.W5GOutline",
        "sap.watt.bamba.rapidstart.W5GOutline",
      ])
      expect(_.keys(actual.interfaces)).to.have.lengthOf(3)

      expect(actual.plugins["common/rapidstart"].description).to.include(
        "from bundled feature"
      )
      expect(actual.plugins.slowstart.description).to.include("Bamba")
      expect(
        actual.interfaces["sap.watt.bamba.slowstart.W5GOutline"]
          .configurationProperties
      ).to.deep.equal({
        contextMenu: { type: "string", multiple: false },
      })
    })

    it("can bundle metadata with pluginPrefix option", () => {
      const actual = internalApi.createMetadataJson(pkg, {
        pluginsPrefix: "PREFIX_",
      })
      expect(actual.plugins).to.include.keys([
        "PREFIX_../resources2/quickstart",
        "PREFIX_slowstart",
        "PREFIX_common/rapidstart",
      ])
      expect(actual.interfaces).to.include.keys([
        "sap.watt.bamba.quickstart.QuickStartService",
        "sap.watt.bamba.slowstart.W5GOutline",
        "sap.watt.bamba.rapidstart.W5GOutline",
      ])

      expect(actual.plugins.PREFIX_slowstart.description).to.include("Bamba")
      expect(
        actual.interfaces["sap.watt.bamba.slowstart.W5GOutline"]
          .configurationProperties
      ).to.deep.equal({
        contextMenu: { type: "string", multiple: false },
      })

      expect(actual.plugins["PREFIX_common/rapidstart"].description).to.include(
        "from bundled feature"
      )

      expect(_.keys(actual.plugins)).to.have.lengthOf(3)
      expect(_.keys(actual.interfaces)).to.have.lengthOf(3)
    })

    it("Will work the same with empty options object or no options object", () => {
      const actual = internalApi.createMetadataJson(pkg)
      const actualEmptyOptions = internalApi.createMetadataJson(pkg, {})
      expect(actual).to.deep.equal(actualEmptyOptions)
    })
  })

  describe("bundleMetadata API", () => {
    const distFolder = path.resolve(__dirname, "dist")

    beforeEach(() => {
      fs.removeSync(distFolder)
    })

    it("can bundle bundleMetadata", () => {
      internalApi.bundleMetadata(pkg, { outDir: distFolder })
      const actualOutputText = fs.readFileSync(
        `${distFolder}/config-preload.json`,
        "UTF-8"
      )
      const actualOutputJson = JSON.parse(actualOutputText)

      expect(actualOutputJson.plugins).to.include.keys([
        "../resources2/quickstart",
        "slowstart",
        "common/rapidstart",
      ])
      expect(actualOutputJson.interfaces).to.include.keys([
        "sap.watt.bamba.quickstart.QuickStartService",
        "sap.watt.bamba.slowstart.W5GOutline",
        "sap.watt.bamba.rapidstart.W5GOutline",
      ])

      expect(
        actualOutputJson.plugins["common/rapidstart"].description
      ).to.include("from bundled feature")
      expect(actualOutputJson.plugins.slowstart.description).to.include("Bamba")
      expect(
        actualOutputJson.interfaces["sap.watt.bamba.slowstart.W5GOutline"]
          .configurationProperties
      ).to.deep.equal({
        contextMenu: { type: "string", multiple: false },
      })

      expect(_.keys(actualOutputJson.plugins)).to.have.lengthOf(3)
      expect(_.keys(actualOutputJson.interfaces)).to.have.lengthOf(3)
    })

    afterEach(() => {
      fs.removeSync(distFolder)
    })
  })

  function defineBundleFeatureSpecs(bundler) {
    describe(`bundleFeature API - ${bundler}`, () => {
      const bundleTestTimeout = 10000
      const distFolder = path.resolve(__dirname, "dist")
      const expectedJSOutputFile = `${distFolder}/config-preload.js`
      const expectedMetadataOutputFile = `${distFolder}/config-preload.json`
      const expectedI18nOutputFile = `${distFolder}/i18n/config-preload.js`
      const tempJSOutputFile = `${path.dirname(pkg)}/config-preload.js`
      const tempEntryPointFile = `${path.dirname(pkg)}/webpack.entry.js`

      beforeEach(() => {
        fs.removeSync(distFolder)
      })

      it(
        "can perform full Feature bundling",
        () =>
          bundlingApi
            .bundleFeature(pkg, {
              outDir: distFolder,
              enableCaching: false,
              bundler,
            })
            .then((result) => {
              const jsOutputContents = fs.readFileSync(
                expectedJSOutputFile,
                "UTF-8"
              )
              expect(jsOutputContents).to.include("FOO")

              const metadataOutputContents = JSON.parse(
                fs.readFileSync(expectedMetadataOutputFile, "UTF-8")
              )
              expect(metadataOutputContents.plugins).to.include.keys([
                "../resources2/quickstart",
                "slowstart",
              ])

              const i18nOutputContents = fs.readFileSync(
                expectedI18nOutputFile,
                "UTF-8"
              )
              expect(i18nOutputContents).to.include(
                "quick_start_dialog_project_name_invalid"
              )

              expect(result.outDir).to.endsWith("dist")
            }),
        bundleTestTimeout
      )

      it(
        "can perform full Feature bundling with caching capability",
        () => {
          const deferred = bundlingApi.bundleFeature(pkg, {
            outDir: distFolder,
            bundler,
          })

          deferred.then((result) => {
            const foldersInDist = fs
              .readdirSync(distFolder)
              .filter((file) =>
                fs.statSync(path.join(distFolder, file)).isDirectory()
              )
            // should only be one timestamp folder...
            expect(foldersInDist.length).to.equal(1)
            const timeStamp = foldersInDist[0]
            const distTimeStamp = `${distFolder}/${timeStamp}`
            const expectedJSOutputFileTimeStamp = `${distTimeStamp}/config-preload.js`
            const expectedMetadataOutputFileTimeStamp = `${distTimeStamp}/config-preload.json`
            const expectedI18nOutputFileTimeStamp = `${distTimeStamp}/i18n/config-preload.js`

            const jsOutputContents = fs.readFileSync(
              expectedJSOutputFileTimeStamp,
              "UTF-8"
            )
            expect(jsOutputContents).to.include("FOO")

            const metadataOutputContents = JSON.parse(
              fs.readFileSync(expectedMetadataOutputFileTimeStamp, "UTF-8")
            )
            expect(metadataOutputContents.plugins).to.include.keys([
              "../resources2/quickstart",
              "slowstart",
            ])

            const i18nOutputContents = fs.readFileSync(
              expectedI18nOutputFileTimeStamp,
              "UTF-8"
            )
            expect(i18nOutputContents).to.include(
              "quick_start_dialog_project_name_invalid"
            )

            const wrapperPkgContents = JSON.parse(
              fs.readFileSync(`${distFolder}/package.json`, "UTF-8")
            )
            expect(wrapperPkgContents.name).to.equal("sample_extentsion")

            expect(
              Object.keys(wrapperPkgContents.bundledFeatures).length
            ).to.equal(1)
            const wrappedPath =
              wrapperPkgContents.bundledFeatures["sample_extentsion.cached"]
            expect(wrappedPath).to.equal(`file:${timeStamp}/package.json`)

            const cachedPkgContents = JSON.parse(
              fs.readFileSync(`${distTimeStamp}/package.json`, "UTF-8")
            )
            expect(cachedPkgContents.name).to.equal("sample_extentsion.cached")

            expect(result.outDir).to.match(/dist\/v1.0.0_[0-9]+$/) // E.g. dist/v1.0.0_1509023563870
          })
          return deferred
        },
        bundleTestTimeout
      )

      it(
        "can perform full Feature bundling when using backslashes in the path",
        () =>
          bundlingApi
            .bundleFeature(pkg.replace(/\//g, "\\"), {
              outDir: distFolder,
              enableCaching: false,
              bundler,
            })
            .then(() => {
              const jsOutputContents = fs.readFileSync(
                expectedJSOutputFile,
                "UTF-8"
              )
              expect(jsOutputContents).to.include("FOO")

              const metadataOutputContents = JSON.parse(
                fs.readFileSync(expectedMetadataOutputFile, "UTF-8")
              )
              expect(metadataOutputContents.plugins).to.include.keys([
                "../resources2/quickstart",
                "slowstart",
              ])

              const i18nOutputContents = fs.readFileSync(
                expectedI18nOutputFile,
                "UTF-8"
              )
              expect(i18nOutputContents).to.include(
                "quick_start_dialog_project_name_invalid"
              )
            }),
        bundleTestTimeout
      )

      describe("cleanOutDir", () => {
        const tempOutFile = `${distFolder}/bamba.js`

        it(
          "will delete the target directory by default when doing full feature bundling by default",
          () => {
            fs.ensureDirSync(distFolder)
            fs.writeFileSync(tempOutFile, "foo()", "UTF-8")

            const deferred = bundlingApi.bundleFeature(pkg, {
              outDir: distFolder,
              bundler,
            })

            deferred.then(() => {
              expect(fs.existsSync(tempOutFile)).to.be.false
            })

            return deferred
          },
          bundleTestTimeout
        )

        it(
          "will NOT delete the target directory when doing full bundling if the cleanOutDir option was disabled",
          () => {
            fs.ensureDirSync(distFolder)
            fs.writeFileSync(tempOutFile, "foo()", "UTF-8")

            fs.ensureDirSync(distFolder)
            fs.writeFileSync(tempOutFile, "foo()", "UTF-8")

            const deferred = bundlingApi.bundleFeature(pkg, {
              outDir: distFolder,
              cleanOutDir: false,
              bundler,
            })

            deferred.then(() => {
              expect(fs.existsSync(tempOutFile)).to.be.true
            })

            return deferred
          },
          bundleTestTimeout
        )
      })

      if (bundler === "requirejs") {
        describe("Bundling validations", () => {
          const pkgAmd = path.resolve(
            __dirname,
            "resources/package_amd_check.json"
          )

          it("Will detect AND reject none AMD resources in bundled artifacts", () => {
            const deferred = bundlingApi.bundleFeature(pkgAmd, {
              outDir: distFolder,
            })
            return expect(deferred).to.be.rejectedWith(
              "None amd source at location"
            )
          })

          it("Will detect And warn about none AMD resources in bundled artifacts (Validations disabled", () => {
            const deferred = bundlingApi.bundleFeature(pkgAmd, {
              outDir: distFolder,
              javaScriptOpts: {
                ignoreValidations: true,
              },
            })
            return expect(deferred).to.be.fulfilled
          })
        })
      }

      if (bundler === "webpack") {
        let customOutFile
        describe("custom webpack config", () => {
          it("Can be provided", () => {
            const defaultConfig = bundlingApi.getDefaultWebpackConfig(pkg)
            expect(defaultConfig.output.filename).to.endsWith(
              "config-preload.js"
            )

            const customConfig = _.cloneDeep(defaultConfig)
            customConfig.output.filename = "bamba.js"
            customOutFile = `${customConfig.output.path}/bamba.js`
            return bundlingApi
              .bundleFeature(pkg, {
                bundler,
                outDir: distFolder,
                webpackConfig: customConfig,
              })
              .then(() => {
                expect(fs.existsSync(`${customConfig.output.path}/bamba.js`)).to
                  .be.true
              })
          })

          afterEach(() => {
            if (customOutFile) {
              fs.removeSync(customOutFile)
              fs.removeSync(`${customOutFile}.map`)
            }
          })
        })

        describe("webpack copying into nested folder", () => {
          const nestedDistFolder = path.resolve(__dirname, "resources/dist")

          it("won't go into endless loop", () =>
            expect(
              bundlingApi.bundleFeature(pkg, {
                bundler,
                outDir: nestedDistFolder,
              })
            ).to.be.rejectedWith("Cannot copy"))

          afterEach(() => {
            fs.removeSync(nestedDistFolder)
          })
        })

        describe("webpack excluding runtime dependencies", () => {
          const runtimeDepPkg = path.resolve(
            __dirname,
            "resources/runtime_dep/package.json"
          )

          it("automatically skip com.sap.watt runtime dependencies ", () =>
            // the promise will be rejected if we could not resolve the
            // ""sap/watt/something/somewhere/somehow.js" amd dependency in b2.js
            expect(
              bundlingApi.bundleFeature(runtimeDepPkg, {
                bundler,
                outDir: distFolder,
              })
            ).to.be.fulfilled)

          afterEach(() => {
            const jsOut = path.resolve(
              `${path.dirname(runtimeDepPkg)}/config-preload.js`
            )
            fs.removeSync(jsOut)
            fs.removeSync(`${jsOut}.map`)
          })
        })

        describe("webpack bundling plugin module", () => {
          const pluginModuleBundle = path.resolve(
            __dirname,
            "resources/plugin_module_property/package.json"
          )

          it("Will add the plugin module to the bundle ", () => {
            // the promise will be rejected if we could not resolve the
            // ""sap/watt/something/somewhere/somehow.js" amd dependency in b2.js
            return bundlingApi
              .bundleFeature(pluginModuleBundle, {
                bundler,
                outDir: distFolder,
                enableCaching: false,
              })
              .then(() => {
                const expectedOutputFile = `${distFolder}/config-preload.js`
                const outputContents = fs.readFileSync(
                  expectedOutputFile,
                  "UTF-8"
                )
                expect(outputContents).to.include("from plugin.js yey")
              })
          })

          afterEach(() => {
            const jsOut = path.resolve(
              `${path.dirname(pluginModuleBundle)}/config-preload.js`
            )
            fs.removeSync(jsOut)
            fs.removeSync(`${jsOut}.map`)
          })
        })

        describe("webpack ignoring modules from outside the plugin", () => {
          const pluginModuleBundle = path.resolve(
            __dirname,
            "resources/module_outside_plugin/package.json"
          )

          it("Will add the plugin module to the bundle ", () => {
            // the promise will be rejected if we could not resolve the
            // ""sap/watt/something/somewhere/somehow.js" amd dependency in b2.js
            return bundlingApi
              .bundleFeature(pluginModuleBundle, {
                bundler,
                outDir: distFolder,
                enableCaching: false,
              })
              .then(() => {
                const expectedOutputFile = `${distFolder}/config-preload.js`
                const outputContents = fs.readFileSync(
                  expectedOutputFile,
                  "UTF-8"
                )
                expect(outputContents).to.not.include("from plugin.js yey")
              })
          })

          afterEach(() => {
            const jsOut = path.resolve(
              `${path.dirname(pluginModuleBundle)}/config-preload.js`
            )
            fs.removeSync(jsOut)
            fs.removeSync(`${jsOut}.map`)
          })
        })

        describe("webpack error reporting", () => {
          it("will fail & report an invalid webpack config", () => {
            const myConfig = bundlingApi.getDefaultWebpackConfig(pkg)
            myConfig.mode = "bamba"

            return expect(
              bundlingApi.bundleFeature(pkg, {
                bundler,
                webpackConfig: myConfig,
                outDir: distFolder,
              })
            ).to.be.rejectedWith(
              "Webpack has been initialized using a configuration object that does not match the API schema"
            )
          })

          describe("module resolution error", () => {
            const webpackErrOPkg = path.resolve(
              __dirname,
              "resources/webpack_error/package.json"
            )

            it("will fail & report", () => {
              return expect(
                bundlingApi.bundleFeature(webpackErrOPkg, {
                  bundler,
                  outDir: distFolder,
                })
              ).to.be.rejectedWith(
                "./rapidstart/service/b2.js\nModule not found: Error: Can't resolve 'bamba'"
              )
            })

            afterEach(() => {
              const warningDir = path.resolve(path.dirname(webpackErrOPkg))
              const jsOut = path.resolve(warningDir, "config-preload.js")
              const entryOut = path.resolve(warningDir, "webpack.entry.js")

              fs.removeSync(jsOut)
              fs.removeSync(`${jsOut}.map`)
              fs.removeSync(entryOut)
            })
          })

          describe("static analysis warning", () => {
            const warnningSample = path.resolve(
              __dirname,
              "resources/webpack_warning/package.json"
            )

            it("will NOT fail & report a static analysis warning", () => {
              return expect(
                bundlingApi.bundleFeature(warnningSample, {
                  bundler,
                  outDir: distFolder,
                })
              ).to.be.fulfilled
            })

            afterEach(() => {
              const warningDir = path.resolve(path.dirname(warnningSample))
              const jsOut = path.resolve(warningDir, "config-preload.js")
              const entryOut = path.resolve(warningDir, "webpack.entry.js")

              fs.removeSync(jsOut)
              fs.removeSync(`${jsOut}.map`)
              fs.removeSync(entryOut)
            })
          })
        })
      }

      afterEach(() => {
        fs.removeSync(distFolder)
        fs.removeSync(tempJSOutputFile)
        fs.removeSync(`${tempJSOutputFile}.map`)
        fs.removeSync(tempEntryPointFile)
      })
    })
  }

  defineBundleFeatureSpecs("webpack")
  defineBundleFeatureSpecs("requirejs")

  describe(`bundleFeature API - edge cases`, () => {
    const distFolder = path.resolve(__dirname, "dist")

    it("Will fail if given invalid bundler parameter", () => {
      expect(() =>
        bundlingApi.bundleFeature(pkg, {
          bundler: "bamba",
          outDir: distFolder,
        })
      ).to.throw("unrecognized <bundler> option value: <bamba>")
    })

    afterEach(() => {
      fs.removeSync(distFolder)
    })
  })
})
/* eslint-enable no-unused-expressions -- end of chai assertion block */
