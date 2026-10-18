# yeoman-ui (Application Wizard)

A VS Code extension (`yeoman-ui`) that provides a rich webview-based UI for running Yeoman generators, packaged as part of the `app-studio-toolkit` pnpm monorepo. The extension is published as `SAPOS.yeoman-ui` on the VS Code Marketplace.

## Architecture

Mini-monorepo under `projects/yeoman-ui/`. Five sub-packages under `packages/`:

| Package                    | npm name                    | Role                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/backend`         | `yeoman-ui`                 | VS Code extension (TypeScript/ESM). Entry point: `src/extension.ts`, compiled to `dist/extension.js`. Registers commands, manages `YeomanUIPanel` and `ExploreGensPanel` webview panels, and exposes a WebSocket server mode (`src/webSocketServer/`). |
| `packages/frontend`        | `yeoman-ui-frontend`        | Vue 3 + Vite webview UI. Two apps: `src/youi/` (wizard form) and `src/exploregens/` (generator browser). Built to `dist/`, then copied into backend's `dist/media/` via `frontend:copy` script.                                                        |
| `packages/types`           | `@sap-devx/yeoman-ui-types` | Types and runtime helpers for generator authors (e.g. `IPrompt`, `Prompts`, `AppWizard`). Published to npm.                                                                                                                                            |
| `packages/generator-foodq` | (private)                   | Sample Yeoman generator used for manual testing and demos.                                                                                                                                                                                             |
| `packages/yeoman-env-v3`   | `yeoman-env-v3`             | Workspace-local fork/wrapper of Yeoman environment v3 for backward compatibility with older generators.                                                                                                                                                |

Key backend files:

- `src/extension.ts` — `activate()`: registers all VS Code commands and panels
- `src/panels/YeomanUIPanel.ts` — main wizard webview panel
- `src/panels/ExploreGensPanel.ts` — generator browser webview panel
- `src/yeomanui.ts` — core Yeoman runner logic
- `src/webSocketServer/youi.ts` — standalone WebSocket server entry point (for browser dev mode)

## Build

All commands run from within the sub-package directory unless otherwise noted.

```sh
# From repo root:
pnpm install                    # install all workspace dependencies

# Inside packages/backend:
pnpm compile                    # tsc (outputs to dist/)
pnpm webpack                    # webpack dev bundle → dist/extension.js
pnpm bundle                     # webpack production bundle
pnpm ci                         # clean + compile + coverage + bundle + frontend:copy + package + coverage:copy

# Inside packages/frontend:
pnpm build                      # vite production build → dist/
pnpm build-dev                  # vite dev build
pnpm serve                      # vite dev server (http://localhost:5173)
pnpm ci                         # clean + build + coverage + coverage:copy
```

The full CI build from repo root (`pnpm ci`) runs package CI scripts in dependency
order. Run it before backend-only builds, which require the frontend output and
workspace dependencies to have been built already.

## Testing

Backend: Mocha + Chai + Sinon + c8 (coverage). Test files: `packages/backend/test/*.spec.ts`.
Frontend: Jest + Vue Test Utils. Test files: `packages/frontend/test/**/*.spec.js`.

```sh
# Inside packages/backend:
pnpm test                       # mocha (no coverage)
pnpm coverage                   # c8 mocha (with coverage)

# Inside packages/frontend:
pnpm test                       # jest
pnpm coverage                   # jest with coverage
```

## CI/CD & Deployment

GitHub Actions (`.github/workflows/` at repo root):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs to `main`. Uploads VSIX artifacts.
- **`commitlint.yml`** — enforces conventional commit messages on `main` PRs.
- **`release.yml`** — triggered on every push to `main`; uses [Changesets](https://github.com/changesets/changesets) to either open a "Version Packages" PR or publish to npm and upload VSIX to GitHub Releases.

To cut a release:

1. Merge the auto-generated "Version Packages" PR (created by Changesets).
2. The `release.yml` workflow publishes to npm and uploads `.vsix` to GitHub Releases automatically.

## Configuration

No environment variables are required for local development.

Runtime (injected by BAS platform):

| Variable      | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `WS_BASE_URL` | BAS server base URL; used to detect local vs. BAS-remote run mode |

Development requirements:

- **pnpm** (enforced — `preinstall` hook blocks npm/yarn)
- **Node.js ≥20**
- The extension depends on `SAPOSS.app-studio-toolkit` (`extensionDependencies` in backend `package.json`)
