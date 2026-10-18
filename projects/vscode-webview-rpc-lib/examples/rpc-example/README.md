# VS Code Webview RPC Example

This extension demonstrates bidirectional calls between a VS Code extension and a webview.
`src/extension.ts` registers `RpcExtension` methods and opens the HTML in `src/media/`.

## Setup and build

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` and `pnpm ci` at the monorepo root
first to compile the RPC library and workspace dependencies. Inside this example:

```sh
pnpm compile
pnpm copy
```

`compile` builds the extension into `out/`; `copy` places the webview assets in
`out/media/`, which the extension reads when opening the panel.

## Run the example

Open this example folder in VS Code and launch its extension-host debug configuration.
In the Extension Development Host, run **Open Webview** before **Send Message to Webview**.
The latter invokes `runFunctionInWebview`; the extension also registers `showMessage`
so the webview can call back and display a VS Code information prompt.

The manifest requires VS Code compatible with `^1.38.0` and declares no extension
settings. This example has no `test` script; library tests run in the parent RPC package.
It is private and ignored by the monorepo's Changesets releases.
