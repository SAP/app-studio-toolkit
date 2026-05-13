const expect = require("chai").expect
const _ = require("lodash")
const path = require("path")
const metadataReader = require("../../src/utils/meta_data_reader")

/* eslint-disable no-unused-expressions -- chai assertions use property access as expressions */
describe("The metaDataReader", () => {
  it("should fail given an invalid path", () => {
    expect(() => {
      metadataReader("../hello_invalid_world", "bamba.json")
    }).to.throw("missing file")
  })

  it("should fail given an plugin that provides an interface in an incorrect manner", () => {
    const pkgPath = path.resolve(__dirname, "./resources/invalidInterfaceDecl")
    expect(() => {
      metadataReader(pkgPath, "package.json")
    }).throw("interface declaration path must start with a valid plugin name")
  })

  it("should fail when plugin path does not contain file prefix", () => {
    const pkgPath = path.resolve(__dirname, "./resources/invalidPluginPath")
    expect(() => {
      metadataReader(pkgPath, "package.json")
    }).to.throw('Path common does not contain the "file:" prefix')
  })

  it("should fail when feature path does not contain file prefix", () => {
    const pkgPath = path.resolve(__dirname, "./resources/invalidFeaturePath")
    expect(() => {
      metadataReader(pkgPath, "package.json")
    }).to.throw('Path inner does not contain the "file:" prefix')
  })

  it("should not add plugins from deprecated config includes", () => {
    const pkgPath = path.resolve(__dirname, "./resources/deprecatedInclude")
    const plugins = metadataReader(pkgPath, "package.json").pluginsMeta
    expect(_.keys(plugins)).to.have.members(["common"])
    expect(_.keys(plugins)).to.not.have.members(["core"])
  })
})

/* eslint-enable no-unused-expressions -- end of chai assertion block */
