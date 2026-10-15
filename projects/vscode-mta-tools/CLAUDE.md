# vscode-mta-tools

VS Code extension providing Multi-Target Application (MTA) development tools for SAP projects: build, deploy, and module management.

## Architecture

Single VS Code extension with monolithic structure (no sub-packages).

**Entry point:** `src/extension.ts` — Registers commands, task providers, and MTA validation.

**Key source directories:**

- **`src/commands/`** — Command implementations:
  - `addModuleCommand.ts` — Add new MTA modules to mta.yaml
  - `mtaBuildCommand.ts` — Build MTA archives (MTAR)
  - `mtarDeployCommand.ts` — Deploy MTAR to Cloud Foundry
- **`src/task-providers/`** — VS Code task providers for MTA build and deploy operations
- **`src/logger/`** — Logging infrastructure

Compiled output: `dist/extension.js` (TypeScript → JavaScript via tsc, then bundled via webpack).

## Build

```sh
pnpm run ci              # clean + compile + coverage + bundle + package
pnpm run compile         # tsc (TypeScript compilation)
pnpm run bundle          # webpack --mode production
pnpm run package         # node ./scripts/package-vsix.js (creates .vsix)
```

Run extension locally: open project in VS Code, run `pnpm run ci`, then launch **Run Extension** from the Run panel.

## Testing

Tests use Mocha with nyc (Istanbul) for coverage.

```sh
pnpm run test            # mocha (no coverage)
pnpm run coverage        # nyc mocha (generates coverage report)
```

Tests validate command registration, task provider behavior, and MTA build/deploy workflows.

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`commitlint.yml`** — enforces conventional commit message format.
- **`release.yml`** — Changesets-based release workflow; runs on pushes to main; uses Changesets for versioning/npm releases and uploads VSIX artifacts to GitHub Releases. It does not publish to VS Code Marketplace.

To cut a release:

```sh
# from monorepo root:
pnpm changeset          # create a changeset describing the change
# commit and merge the changeset, then merge the generated Version Packages PR
```

## Configuration

No environment variables are required for development.

**Runtime dependencies** (must be installed and on PATH):

- **GNU Make** 4.2.1+ — MTA module build orchestration
- **Cloud MTA Build Tool** — `mbt` CLI for building MTAR archives (install from https://sap.github.io/cloud-mta-build-tool/)
- **Cloud Foundry CLI** v8 — `cf` CLI for deployment
- **MultiApps CF CLI Plugin** — `cf deploy` command support (install via `cf install-plugin multiapps`)

**Prerequisites:**

- Node.js 20+
- pnpm workspace manager
- VS Code ^1.53.0 (see package.json)

Extension settings (declared under `contributes.configuration` in `package.json`) configure logging level and source-location tracking via VS Code Settings UI (search "MTA").
