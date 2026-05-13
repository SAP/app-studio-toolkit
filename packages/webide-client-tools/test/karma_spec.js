"use strict"

jest.mock("vm")

const expect = require("chai").expect
const karma = require("../src/api").karma

/* eslint-disable no-unused-expressions -- chai assertions use property access as expressions */
describe("utils get ui5 version", () => {
  it("ui5 empty", () => {
    const ui5Version = karma.getUi5VersionUrl("")
    expect(ui5Version).to.not.be.undefined
  })

  it("ui5 not found", () => {
    const ui5Version = karma.getUi5VersionUrl()
    expect(ui5Version).to.not.be.undefined
  })

  it("user uses specific ui5 version", () => {
    const ui5Version = karma.getUi5VersionUrl(
      "1.44.7",
      "https://sapui5.hana.ondemand.com/"
    )
    expect(ui5Version).to.not.be.undefined
  })
})

describe("utils get webide config", () => {
  it("should return a config when no files are provided", () => {
    const config = karma.defaultProps()
    expect(config).to.contain.all.keys(["files", "openui5", "client"])
  })
})
/* eslint-enable no-unused-expressions -- end of chai assertion block */
