// ts-node/esm does not respect the "import" exports condition for packages without
// "type":"module". This hook forces @sap-devx/yeoman-ui-types to its ESM build.
// It also intercepts "vscode" imports and provides the test mock, since vscode
// is not installed as an npm package and cannot be resolved by Node's ESM resolver.

const TYPES_ESM = new URL(
  "../../types/dist/esm/src/index.js",
  import.meta.url
).href;

const VSCODE_SHIM_URL = "node:vscode-test-shim";

const VSCODE_PROXY_URL = new URL(
  "../src/utils/vscodeProxy.ts",
  import.meta.url
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@sap-devx/yeoman-ui-types") {
    return { url: TYPES_ESM, format: "module", shortCircuit: true };
  }
  if (specifier === "vscode") {
    return { url: VSCODE_SHIM_URL, format: "module", shortCircuit: true };
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
      "export const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };",
      "export const ExtensionContext = undefined;",
      "export const WebviewPanel = undefined;",
      "export const OutputChannel = undefined;",
      "export default mock;",
    ].join("\n");
    return { format: "module", source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
