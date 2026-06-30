import { createRequire } from "module";
const _require = createRequire(import.meta.url);

// ts-node/esm does not respect the "import" exports condition for packages without
// "type":"module". This hook forces @sap-devx/yeoman-ui-types to its ESM build.
const TYPES_ESM = new URL(
  "../../types/dist/esm/src/index.js",
  import.meta.url
).href;

// Synthetic URL used as the identity for the vscode shim module.
const VSCODE_SHIM_URL = "node:vscode-test-shim";

// The vscodeProxy module (TypeScript source) that provides getVscodeMock().
const VSCODE_PROXY_URL = new URL(
  "../src/utils/vscodeProxy.ts",
  import.meta.url
).href;

// These CJS packages have no __esModule flag and no static named exports detectable
// by Node's ESM loader. Named imports from them fail at link time without shimming.
const CJS_SHIM_PACKAGES = ["lodash", "@vscode-logging/logger"];

function resolvedPath(specifier) {
  try { return _require.resolve(specifier); } catch { return null; }
}

const shimPaths = Object.fromEntries(
  CJS_SHIM_PACKAGES.map((pkg) => [pkg, resolvedPath(pkg)]).filter(([, p]) => p)
);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@sap-devx/yeoman-ui-types") {
    return { url: TYPES_ESM, format: "module", shortCircuit: true };
  }
  if (specifier === "vscode") {
    return { url: VSCODE_SHIM_URL, format: "module", shortCircuit: true };
  }
  if (shimPaths[specifier]) {
    return { url: "file://" + shimPaths[specifier], format: "commonjs", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === VSCODE_SHIM_URL) {
    const source = [
      `import { getVscodeMock } from ${JSON.stringify(VSCODE_PROXY_URL)};`,
      "const mock = getVscodeMock();",
      "export const commands = mock.commands;",
      "export const window = mock.window;",
      "export const workspace = mock.workspace;",
      "export const Uri = mock.Uri;",
      "export const ViewColumn = mock.ViewColumn;",
      "export const ProgressLocation = mock.ProgressLocation;",
      "export const ExtensionContext = undefined;",
      "export const WebviewPanel = undefined;",
      "export const OutputChannel = undefined;",
      "export default mock;",
    ].join("\n");
    return { format: "module", source, shortCircuit: true };
  }

  const filePath = Object.values(shimPaths).find((p) => url === "file://" + p);
  if (!filePath) return nextLoad(url, context);

  const mod = _require(filePath);
  const keys = Object.keys(mod).filter(
    (k) => /^[a-zA-Z$_][a-zA-Z0-9$_]*$/.test(k) && k !== "default"
  );
  const namedExports = keys.map((k) => `export const ${k} = _mod[${JSON.stringify(k)}];`).join("\n");
  const source = [
    'import { createRequire as _cr } from "module";',
    `const _mod = _cr(import.meta.url)(${JSON.stringify(filePath)});`,
    "export default _mod;",
    namedExports,
  ].join("\n");
  return { format: "module", source, shortCircuit: true };
}
