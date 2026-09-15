const { resolve } = require("path");
const { readFileSync, writeFileSync, copyFileSync } = require("fs");
const { copySync, emptyDirSync } = require("fs-extra");
const { expect } = require("chai");
const { packageCommand } = require("@vscode/vsce/out/package");

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
const updatedPkgContents = JSON.stringify(pkgJson, null, 2);
writeFileSync(pkgJsonPath, updatedPkgContents);

// Ensure License and copywrite related files are part of the packaged .vsix
const rootMonoRepoDir = resolve(__dirname, "..", "..", "..");
const licenseRootMonoRepoPath = resolve(rootMonoRepoDir, "LICENSE");
const licenseExtPath = resolve(rootExtDir, "LICENSE");
copyFileSync(licenseRootMonoRepoPath, licenseExtPath);

const licensesDirPath = resolve(rootMonoRepoDir, "LICENSES");
const licensesDirExtPath = resolve(rootExtDir, "LICENSES");
emptyDirSync(licensesDirExtPath);
copySync(licensesDirPath, licensesDirExtPath);

const reuseDirPath = resolve(rootMonoRepoDir, ".reuse");
const reuseDirExtPath = resolve(rootExtDir, "LICENSES");
emptyDirSync(reuseDirExtPath);
copySync(reuseDirPath, reuseDirExtPath);

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
    // revert changes to the pkg.json, ensures clean git working directory
    writeFileSync(pkgJsonPath, pkgJsonOrgStr);
  });
