# cloud-foundry-tools

VS Code extension providing Cloud Foundry development tools (login, create/bind/unbind services). Part of app-studio-toolkit monorepo.

## Architecture

Three packages under `packages/`:

- **`backend/`** (`vscode-cf-tools`) — the VS Code extension. Entry point: `packages/backend/src/extension.ts`. Compiled output: `packages/backend/dist/extension.js`. Registers commands, views, and view-containers. Uses `packages/backend/src/chisel.ts` for SSH tunneling, `packages/backend/src/cfView.ts` for the tree view, and `packages/backend/src/commands.ts` / `packages/backend/src/cfViewCommands.ts` for CF command implementations.
- **`frontend/`** (`cloud-foundry-tools-frontend`) — Vue 3 UI (Vite). Built to `packages/frontend/dist/`, then copied into `packages/backend/dist/media/` by backend's `frontend:copy` script.
- **`wrapper/`** (`vscode-wing-cf-tools`) — deprecated wrapper extension; contains no new logic.

## Build

```sh
# Backend
cd packages/backend
pnpm compile          # tsc compile
pnpm ci               # clean + compile + coverage + bundle + frontend:all + package
pnpm ci:artifacts_only # clean + compile + webpack-dev + frontend:all + package
pnpm bundle           # webpack --mode production
pnpm package          # vsce package

# Frontend (after the backend section)
cd ../frontend
pnpm build            # vite build
pnpm ci               # clean + build + test
pnpm ci:artifacts_only # clean + build
pnpm dev              # vite dev server
```

Run extension locally: open project in VS Code, run `pnpm ci:artifacts_only` in backend, then launch **Run Extension** from Run panel.

## Testing

Backend uses Mocha + Chai; coverage via nyc. Frontend uses Jest.

```sh
# Backend
cd packages/backend
pnpm test       # mocha (no coverage)
pnpm coverage   # nyc mocha

# Frontend (after the backend section)
cd ../frontend
pnpm test       # jest
```

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`release.yml`** — triggered by pushes to `main`; uses Changesets to either open "Version Packages" PR or publish to npm + upload VSIX artifacts.
- **`commitlint.yml`** — enforces conventional commit message format.

Release flow uses Changesets. Backend and frontend versions are grouped in the root `.changeset/config.json`; the private extension is distributed as a VSIX.

## Configuration

The extension reads VS Code settings (declared under `contributes.configuration` in `packages/backend/package.json`). Logger preferences are configurable via VS Code Settings UI (search "CF").

No `.env` files or secrets are required for local development. Runtime dependency: **CF CLI v8** — install from https://github.com/cloudfoundry/cli/releases.
