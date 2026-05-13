"use strict"

const childProcess = require("child_process")
const path = require("path")
const fs = require("fs-extra")

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

describe("karma integration tests", () => {
  function clean() {
    fs.removeSync(path.resolve(__dirname, "../example/coverage"))
  }

  beforeAll(clean)

  it("can test a sample feature", () => {
    const exampleDir = path.resolve(__dirname, "../example")
    childProcess.execSync("npm run test", {
      cwd: exampleDir,
      stdio: "inherit",
    })

    // todo: check coverage dir contents
  })

  afterAll(clean)
})
