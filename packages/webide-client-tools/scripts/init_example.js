const childProcess = require("child_process")
const path = require("path")

const exampleDir = path.resolve(__dirname, "../example")
const rootDir = path.resolve(__dirname, "../")

// setup
childProcess.execSync("npm install", { cwd: exampleDir, stdio: "inherit" })
childProcess.execSync("npm link", { cwd: rootDir, stdio: "inherit" })
childProcess.execSync("npm link @sap-webide/webide-client-tools", {
  cwd: exampleDir,
  stdio: "inherit",
})
