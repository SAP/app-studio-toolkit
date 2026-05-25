const expect = require("chai").expect
const childProcess = require("child_process")
const path = require("path")
const fs = require("fs-extra")

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

describe("Bundling integration tests", () => {
  beforeAll(() => {
    fs.removeSync(path.resolve(__dirname, "../example/dist"))
  })

  it("can bundle a sample feature", () => {
    const exampleDir = path.resolve(__dirname, "../example")
    childProcess.execSync("npm run bundle", {
      cwd: exampleDir,
      stdio: "inherit",
    })

    // Find the cached dir name
    const distFolder = path.join(exampleDir, "dist")
    const foldersInDist = fs
      .readdirSync(distFolder)
      .filter((file) => fs.statSync(path.join(distFolder, file)).isDirectory())
    expect(foldersInDist.length).to.equal(1)
    const timeStamp = foldersInDist[0]
    const distTimeStamp = `${distFolder}/${timeStamp}`

    // Check the preload files exist
    expect(fs.existsSync(path.join(distTimeStamp, "config-preload.js"))).to.be
      .true
    expect(fs.existsSync(path.join(distTimeStamp, "config-preload.json"))).to.be
      .true
    expect(fs.existsSync(path.join(distTimeStamp, "i18n/config-preload.js"))).to
      .be.true
  })

  afterAll(() => {
    fs.removeSync(path.resolve(__dirname, "../example/dist"))
    fs.removeSync(path.resolve(__dirname, "../example/config-preload.js"))
  })
})
