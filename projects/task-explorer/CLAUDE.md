# task-explorer

VS Code extension providing task management and exploration UI. Part of app-studio-toolkit monorepo.

## Architecture

Three packages + two examples under root:

- **`packages/task_contrib_types/`** (`@sap_oss/task_contrib_types`) — TypeScript type definitions for task provider contributors. Defines the contract between task-explorer and contributor extensions.
- **`packages/tasks_panel/`** (`vscode-tasks-explorer-tasks-panel`) — VS Code extension. Entry point: `packages/tasks_panel/src/extension.ts`. Registers task explorer panel, commands, and task provider system.
- **`packages/vue_frontend_rpc/`** (`@vscode-tasks-explorer/vue_frontend_rpc`) — Vue 3 webview UI (Vite). Built to `packages/vue_frontend_rpc/dist/`, then copied into `packages/tasks_panel/dist/media/` by tasks_panel's `frontend:copy` script.
- **`examples/npm_task_contrib/`** — sample npm task contributor extension.
- **`examples/vscode_task_contrib/`** — sample VSCode task contributor extension.

The tasks_panel manifest does not declare `extensionDependencies`. Contributor
extensions expose task-provider APIs that the backend discovers at runtime.

## Build

```sh
# tasks_panel (backend)
cd packages/tasks_panel
pnpm compile          # tsc compile
pnpm ci               # clean + compile + coverage + bundle + frontend:copy + package
pnpm ci:artifacts_only # clean + compile + bundle + frontend:copy + package (no tests)
pnpm bundle           # webpack --mode production
pnpm package          # vsce package

# vue_frontend_rpc (after the backend section)
cd ../vue_frontend_rpc
pnpm build            # vite build
pnpm serve            # vite dev server

# task_contrib_types (after the frontend section)
cd ../task_contrib_types
pnpm compile          # tsc compile
```

Run extension locally: open project in VS Code, run `pnpm ci` in tasks_panel, then launch **Run Extension** from Run panel.

## Testing

Backend (tasks_panel) uses Mocha + Chai; coverage via nyc. Frontend uses Jest + @vue/test-utils.

```sh
# Backend
cd packages/tasks_panel
pnpm test       # mocha (no coverage)
pnpm coverage   # nyc mocha

# Frontend (after the backend section)
cd ../vue_frontend_rpc
pnpm test       # jest
```

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`release.yml`** — triggered by pushes to `main`; uses Changesets to either open "Version Packages" PR or publish to npm + upload VSIX artifacts.
- **`commitlint.yml`** — enforces conventional commit message format.

Release flow uses Changesets. The private tasks_panel is packaged as VSIX; `@sap_oss/task_contrib_types` is currently ignored by the root Changesets configuration.

## Configuration

No environment variables or `.env` files required for local development.

Extension settings are declared under `contributes.configuration` in `packages/tasks_panel/package.json` and configurable via VS Code Settings UI.
