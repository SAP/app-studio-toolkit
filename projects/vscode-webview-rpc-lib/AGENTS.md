# Webview RPC

This is the `@sap-devx/webview-rpc` library inside the app-studio-toolkit pnpm
workspace. Read the root guidance and this project's README.

- The shared protocol is in `src/rpc-common.ts`. `src/rpc-extension.ts` and
  `src/rpc-browser.ts` adapt it to VS Code and browser messages; WebSocket adapters
  are separate source files. Preserve request/response IDs and method registration.
- Use Node 24.x and pnpm 11.1.1. Run `pnpm install` and initial workspace `pnpm ci`
  from the monorepo root to build workspace dependencies.
- Inside this directory, `pnpm compile` builds extension/browser output and checks
  test types via three TypeScript configurations. Tests use `noEmit`. `pnpm test`
  runs TypeScript source tests with ts-jest and coverage; `pnpm ci` compiles, tests, and packs.
- Browser source imports use `.js` suffixes so emitted modules resolve in browsers.
- The library requires no project `.env` for local tests. Consumers supply transport
  objects and can override the response timeout through `setResponseTimeout`.
- Releases use the monorepo's Changesets workflow; examples are ignored by Changesets.
