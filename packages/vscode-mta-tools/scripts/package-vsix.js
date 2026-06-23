const { packageCommand } = require("vsce/out/package");
const { resolve } = require("path");

packageCommand({
  cwd: resolve(__dirname, ".."),
  packagePath: undefined,
  baseContentUrl: undefined,
  baseImagesUrl: undefined,
  useYarn: true,
  ignoreFile: undefined,
  expandGitHubIssueLinks: undefined,
}).catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
