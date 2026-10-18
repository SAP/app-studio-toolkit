# vscode-webview-rpc-lib

RPC library for VSCode WebViews — enables convenient bidirectional communication between a VSCode extension and its webviews.

## Packages

| Package                                   | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| [`@sap-devx/webview-rpc`](./package.json) | The RPC library (extension + browser builds) |

## Description

Provides a convenient way to communicate between a VSCode extension and its webviews using RPC calls. Invoke functions on the webview, receive callbacks, and vice versa.

`src/rpc-common.ts` maintains registered methods and pending request promises.
`RpcExtension` connects this protocol to a VS Code webview; `RpcBrowser` connects
it to browser message events. Requests carry an ID, method name, and arguments;
responses resolve or reject the corresponding promise. WebSocket adapters support
standalone browser/server consumers, including a multi-plugin namespace variant.

## How to Use

An example of using this library can be seen under the [`examples/rpc-example/`](./examples/rpc-example) folder (webview) and [`examples/rpc-example-ws/`](./examples/rpc-example-ws) folder (WebSocket variant).

### Installation

```bash
npm install @sap-devx/webview-rpc
```

### Initialization

In the extension side:

```ts
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
this._rpc = new RpcExtension(this._panel.webview);
```

In a bundled webview module:

```js
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser.js";

const vscode = acquireVsCodeApi();
let rpc = new RpcBrowser(window, vscode);
```

### Register Methods

```js
function add(a, b) {
  return a + b;
}
rpc.registerMethod({ func: add });
```

### Invoke

```js
rpc.invoke("add", 1, 2).then((response) => {
  console.log("1+2=" + response);
});
```

## Build and Development

Use Node 24.x and pnpm 11.1.1. Run these commands at the monorepo root. Compile
workspace dependencies first with root `pnpm ci` on a fresh checkout; for later
RPC-only changes, the package's `compile` script builds both adapters and type-checks tests.

```bash
# Install dependencies (from repo root)
pnpm install

# Compile extension/browser output and type-check tests
pnpm --filter @sap-devx/webview-rpc run compile

# Run tests
pnpm --filter @sap-devx/webview-rpc run test
```

## Testing

The package uses Jest with `jest.config.unit.js`; `pnpm test` inside this directory
runs TypeScript source tests through ts-jest and collects coverage. The test
TypeScript configuration uses `noEmit`; `compile-test` checks types without
generating test JavaScript. Package `pnpm ci` compiles, tests, and produces an npm
archive with `npm pack`. The examples have their own scripts; they are not substitutes
for the library's unit tests.

## Configuration

Register callable methods on the receiving adapter with `registerMethod` and invoke
them on the other side with `invoke`. Supply the webview/window transport objects
when constructing an adapter; an optional logger supports diagnostics. Use
`setResponseTimeout(milliseconds)` to change the default 3,600,000 ms response timeout.
WebSocket consumers provide their server connection. No BAS credentials, VS Code
settings, or project `.env` are required to compile and test the library.

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) validates the workspace on
Node 24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main` to open a version PR or publish eligible npm
packages. `@sap-devx/webview-rpc` is eligible under [the root configuration](../../.changeset/config.json);
its examples are ignored. This library has no VSIX or hosted-service deployment.
Follow the shared [release process](../../CONTRIBUTING.md#release-process).

## Contributing

Contributing information can be found in the [CONTRIBUTING.md](../../CONTRIBUTING.md) file.
