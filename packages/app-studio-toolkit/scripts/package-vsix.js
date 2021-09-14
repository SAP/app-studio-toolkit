const { expect } = require("chai");
const { resolve } = require("path");
const { readFileSync, writeFileSync } = require("fs");
const { writeJsonSync } = require("fs-extra");

const rootExtDir = resolve(__dirname, "..");
const pkgJsonPath = resolve(rootExtDir, "package.json");
// Read & save the original literal representation of the pkg.json
// To avoid dealing with re-formatting (prettier) later on.
const pkgJsonOrgStr = readFileSync(pkgJsonPath, "utf8");
const pkgJson = JSON.parse(pkgJsonOrgStr);
// During development flows the `main` should point to the compiled sourced
// for fast dev feedback loops.
expect(pkgJson.main).to.equal("./dist/src/extension");
// During production flows the main should point to the bundled sources
// to reduce loading time.
pkgJson.main = "./dist/extension";
writeJsonSync(pkgJsonPath, pkgJson, { spaces: 2, EOF: "\n" });

// TODO: wrap this `proxyquire` to inject custom logic to select
//  the contents of the node_module directory as well.
//  can we brute force this and select everything from node_modules easily?
const { packageCommand } = require("vsce/out/package");
// Time to create the VSIX.
packageCommand({
  cwd: rootExtDir,
  packagePath: undefined,
  baseContentUrl: undefined,
  baseImagesUrl: undefined,
  useYarn: true,
  ignoreFile: undefined,
  expandGitHubIssueLinks: undefined,
})
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1000;
  })
  .finally(() => {
    // revert changes to the pkg.json, ensure clean git working directory
    writeFileSync(pkgJsonPath, pkgJsonOrgStr);
  });
