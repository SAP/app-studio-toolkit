const { packageCommand } = require("vsce/out/package");
const { resolve } = require("path");

packageCommand({
  cwd: resolve(__dirname, ".."),
  useYarn: true,
}).catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
