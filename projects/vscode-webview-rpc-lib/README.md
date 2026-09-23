# vscode-webview-rpc-lib

RPC library for VSCode WebViews — enables convenient bidirectional communication between a VSCode extension and its webviews.

## Packages

| Package                                   | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| [`@sap-devx/webview-rpc`](./package.json) | The RPC library (extension + browser builds) |

## Description

Provides a convenient way to communicate between a VSCode extension and its webviews using RPC calls. Invoke functions on the webview, receive callbacks, and vice versa.

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

In the webview JS code:

```js
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

```bash
# Install dependencies (from repo root)
pnpm install

# Compile extension build
pnpm --filter @sap-devx/webview-rpc run compile-ext

# Compile browser build
pnpm --filter @sap-devx/webview-rpc run compile-browser

# Run tests
pnpm --filter @sap-devx/webview-rpc run test
```

## Contributing

Contributing information can be found in the [CONTRIBUTING.md](../../CONTRIBUTING.md) file.
