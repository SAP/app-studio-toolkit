/* istanbul ignore file */
/**
 * Workaround to: https://github.com/microsoft/vscode-vsce/issues/300
 *
 * The extension is webpack-bundled, but it loads the language server in a
 * separate process from `@xml-tools/language-server`'s bundled `dist/server.js`
 * (webpack marks that package as `external`). So the VSIX must include the
 * language-server package's `dist/` alongside the extension bundle.
 *
 * vsce derives the files to package from the package manager's dependency
 * listing, which does not work reliably here (pnpm's symlinked node_modules).
 * We therefore hot-patch vsce's dependency resolution to include exactly the
 * extension root plus the resolved language-server package directory.
 *
 * Migrated from the standalone SAP/xml-tools repo, which relied on yarn's
 * `nohoist`. Under pnpm we resolve the sibling package via `require.resolve`
 * instead, which follows pnpm's symlinks correctly.
 */
const proxyquire = require("proxyquire");
const { resolve } = require("path");
const {
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
  cpSync,
} = require("fs");

const rootExtDir = resolve(__dirname, "..");

// Resolve the language-server package via the extension's OWN node_modules
// symlink (pnpm creates node_modules/@xml-tools/language-server -> the sibling
// package). We deliberately use this symlink path rather than its realpath:
// vsce rejects file paths that escape the extension root ("../language-server/..."),
// so the package must appear as a CHILD of the extension dir.
const langServerDir = resolve(
  rootExtDir,
  "node_modules",
  "@xml-tools",
  "language-server"
);

// **Hot-Patching** vsce using proxyquire so it packages exactly these dirs.
const getDepsStub = {
  getDependencies: async () => [rootExtDir, langServerDir],
};
const { packageCommand } = proxyquire("vsce/out/package", {
  "./npm": getDepsStub,
});

const pkgJsonPath = resolve(rootExtDir, "package.json");
// Read & save the original literal representation of the pkg.json
// to avoid dealing with re-formatting (prettier) later on.
const pkgJsonOrgStr = readFileSync(pkgJsonPath, "utf8");
const pkgJson = JSON.parse(pkgJsonOrgStr);

// Ensure License / copyright files are part of the packaged .vsix.
// Done BEFORE mutating package.json so a copy failure leaves pkg.json pristine.
// Sourced from the monorepo root (five levels up: scripts -> xml-toolkit ->
// packages -> xml-tools -> projects -> repo root).
const rootMonoRepoDir = resolve(__dirname, "..", "..", "..", "..", "..");
copyFileSync(
  resolve(rootMonoRepoDir, "LICENSE"),
  resolve(rootExtDir, "LICENSE")
);

const licensesDirExtPath = resolve(rootExtDir, "LICENSES");
rmSync(licensesDirExtPath, { recursive: true, force: true });
cpSync(resolve(rootMonoRepoDir, "LICENSES"), licensesDirExtPath, {
  recursive: true,
});

// During development flows the `main` points to the compiled sources for fast
// dev feedback loops; for the packaged .vsix it must point to the bundle.
pkgJson.main = "./dist/extension";
writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");

packageCommand({
  cwd: rootExtDir,
  packagePath: undefined,
  baseContentUrl: undefined,
  baseImagesUrl: undefined,
  useYarn: false,
  ignoreFile: undefined,
  expandGitHubIssueLinks: undefined,
})
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 666;
  })
  .finally(() => {
    // revert changes to the pkg.json, ensure clean git working directory
    writeFileSync(pkgJsonPath, pkgJsonOrgStr);
  });
