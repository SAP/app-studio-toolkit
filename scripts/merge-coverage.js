/**
 * This script will create a **merged** coverage reports from all sub-packages.
 * This report will can be found at the root `coverage` dir and will also be uploaded to coveralls.io
 * - based on https://github.com/istanbuljs/istanbuljs/blob/1fe490e51909607137ded25b1688581c9fd926cd/monorepo-merge-reports.js
 */
const { dirname, join, resolve } = require("path");
const { spawnSync } = require("child_process");

const rimraf = require("rimraf");
const makeDir = require("make-dir");
const glob = require("glob");

process.chdir(resolve(__dirname, ".."));
rimraf.sync(".nyc_output");
makeDir.sync(".nyc_output");

// Merge coverage data from each package so we can generate a complete reports.
// Includes both root-level packages and packages nested under projects/*.
const nycOutputs = [
  ...glob.sync("packages/*/.nyc_output"),
  ...glob.sync("projects/*/packages/*/.nyc_output"),
];
nycOutputs.forEach((nycOutput) => {
  const cwd = dirname(nycOutput);
  // Use the package's path (not just its basename) for the merged file name so
  // same-named packages across projects (e.g. */packages/types) do not collide.
  const mergedName = cwd.replace(/[\\/]/g, "__") + ".json";
  const { status, stderr } = spawnSync(
    resolve("node_modules", ".bin", "nyc"),
    ["merge", ".nyc_output", join(__dirname, "..", ".nyc_output", mergedName)],
    {
      encoding: "utf8",
      shell: true,
      cwd,
    }
  );

  if (status !== 0) {
    console.error(stderr);
    process.exit(status);
  }
});

// Create merged report
const { status, stderr } = spawnSync(
  resolve("node_modules", ".bin", "nyc"),
  ["report", "--reporter=lcov"],
  {
    encoding: "utf8",
    shell: true,
    cwd: resolve(__dirname, ".."),
  }
);

if (status !== 0) {
  console.error(stderr);
  process.exit(status);
}
