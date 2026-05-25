const { Server, config } = require("karma")
const path = require("path")

const karmaConfig = config.parseConfig(
  path.resolve(__dirname, "../karma.conf.js")
)

// CI only configurations
karmaConfig.singleRun = true
karmaConfig.browsers = ["ChromeHeadless"]

const server = new Server(karmaConfig, (exitCode) => {
  console.error(`Karma has exited with ${exitCode}`)
  process.exit(exitCode)
})
server.start()
