# code-snippet

VS Code extension for code snippet generation and management. Part of app-studio-toolkit monorepo.

## Architecture

Four packages + one example under root:

- **`packages/backend/`** (`code-snippet-tool`) — VS Code extension. Entry point: `packages/backend/src/extension.ts`. Registers commands and webview panels for snippet generation.
- **`packages/frontend/`** — Vue 3 webview UI (Vite). Built to `packages/frontend/dist/`, then copied into `packages/backend/dist/media/` by backend's `frontend:copy` script.
- **`packages/types/`** (`@sap-devx/code-snippet-types`) — TypeScript type definitions shared between backend and contributor extensions.
- **`packages/wrapper/`** (`code-snippet`) — deprecated wrapper extension; contains no new logic.
- **`examples/vscode-snippet-contrib/`** — sample contributor extension demonstrating how to extend the code snippet tool.

## Build

```sh
# Backend
cd packages/backend
pnpm compile          # tsc compile
pnpm ci               # clean + compile + coverage + bundle + frontend:copy + package
pnpm bundle           # webpack --mode production
pnpm package          # vsce package

# Frontend (after the backend section)
cd ../frontend
pnpm build            # vite build
pnpm serve            # vite dev server
pnpm test             # frontend tests

# Types package (after the frontend section)
cd ../types
pnpm compile          # tsc compile
```

Run extension locally: open project in VS Code, run `pnpm ci` in backend, then launch **Run Extension** from Run panel.

## Testing

Backend uses Mocha + Chai; coverage via nyc. Frontend has its own test suite.

```sh
# Backend
cd packages/backend
pnpm test       # mocha (no coverage)
pnpm coverage   # nyc mocha

# Frontend (after the backend section)
cd ../frontend
pnpm test       # frontend tests
```

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`release.yml`** — triggered by pushes to `main`; uses Changesets to either open "Version Packages" PR or publish to npm + upload VSIX artifacts.
- **`commitlint.yml`** — enforces conventional commit message format.

Release flow uses Changesets. Backend published as VSIX; types package published to npm as `@sap-devx/code-snippet-types`.

## Configuration

No environment variables or `.env` files required for local development.

Extension settings are declared under `contributes.configuration` in `packages/backend/package.json` and configurable via VS Code Settings UI.
