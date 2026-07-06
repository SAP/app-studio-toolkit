const { packageCommand } = require("vsce/out/package");
const { resolve } = require("path");

const rootExtDir = resolve(__dirname, "..");

// useYarn: true matches the repo convention; safe here because the extension is fully webpack-bundled.
packageCommand({
  cwd: rootExtDir,
  packagePath: undefined,
  baseContentUrl: undefined,
  baseImagesUrl: undefined,
  useYarn: true,
  ignoreFile: undefined,
  expandGitHubIssueLinks: undefined,
}).catch((e) => {
  console.error(e.message);
  process.exitCode = 1000;
});
