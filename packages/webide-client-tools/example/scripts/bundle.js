/**
 * modify the optional arguments for custom bundling flows.
 */
var path = require("path")
// TODO: Remove temp hack due to some issues with the metadata reader and supplying either "./package.json" or "package.json"
// arguments.
var pkgPath = path.resolve(__dirname, "../package.json")
require("@sap-webide/webide-client-tools")
  .bundling.bundleFeature(pkgPath, { bundler: "webpack" })
  // bundleFeature is async and returns a promise, in case of an error we want to exit the process with
  // an error code and terminate any future steps

  // if we were using bundleFeature in a task runner (grunt/gulp) we would have to create
  // specific task runner errors
  // for example:
  // https://gruntjs.com/api/grunt.fail
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
