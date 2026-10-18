# guided-development

VS Code extension providing guided development workflows and tutorials. Part of app-studio-toolkit monorepo.

## Architecture

Three packages + examples under root:

- **`packages/backend/`** (`guided-development`) — VS Code extension. Entry point: `packages/backend/src/extension.ts`. Registers commands and webview panels for guided development flows. Supports WebSocket server mode via `ws:run` script for remote client connections.
- **`packages/frontend/`** — Vue 3 webview UI (Vue CLI). Built to `packages/frontend/dist/`, then copied into `packages/backend/dist/media/` by backend's `frontend:build` + `frontend:copy` scripts.
- **`packages/types/`** (`@sap_oss/guided-development-types`) — TypeScript type definitions shared between backend and contributor extensions.
- **`examples/`** — contributor example extensions demonstrating how to extend guided-development with custom workflows.

Extension declares `extensionDependencies` on `app-studio-toolkit`.

## Build

```sh
# Backend
cd packages/backend
pnpm compile          # tsc compile
pnpm ci               # clean + compile + coverage + bundle + frontend:build + frontend:copy + package
pnpm bundle           # webpack --mode production
pnpm package          # vsce package
pnpm ws:run           # run in WebSocket server mode

# Frontend (after the backend section)
cd ../frontend
pnpm build            # vue-cli-service build
pnpm serve            # vue-cli-service serve

# Types package (after the frontend section)
cd ../types
pnpm compile          # tsc compile
```

Run extension locally: open project in VS Code, run `pnpm ci` in backend, then launch **Run Extension** from Run panel.

## Testing

Backend uses Mocha + Chai; coverage via nyc.

```sh
cd packages/backend
pnpm test       # mocha (no coverage)
pnpm coverage   # nyc mocha
```

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`release.yml`** — triggered by pushes to `main`; uses Changesets to either open "Version Packages" PR or publish to npm + upload VSIX artifacts.
- **`commitlint.yml`** — enforces conventional commit message format.

Release flow uses Changesets. The private backend is packaged as VSIX; `@sap_oss/guided-development-types` is currently ignored by the root Changesets configuration.

## Configuration

No environment variables or `.env` files required for local development.

Extension settings are declared under `contributes.configuration` in `packages/backend/package.json` and configurable via VS Code Settings UI.

WebSocket mode can be configured via launch arguments when running `ws:run` script.
