const { existsSync } = require("fs");
const { resolve } = require("path");

// for use in productive flows (webpack-bundled, shipped inside the .vsix)
const bundledPath = resolve(__dirname, "..", "dist", "server.js");
// for dev flows (unbundled sources)
const sourcesPath = resolve(__dirname, "server.js");

// Prefer the bundled server if it was produced (production / packaged .vsix),
// otherwise fall back to the unbundled sources (development).
// The previous heuristic keyed off the existence of `node_modules`, which is
// unreliable under pnpm (it always creates a symlinked node_modules), so we
// detect the artifact directly instead.
/* istanbul ignore next - no tests (yet?) on bundled artifacts */
const serverPath = existsSync(bundledPath) ? bundledPath : sourcesPath;

module.exports = {
  SERVER_PATH: serverPath,
};
