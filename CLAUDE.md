# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a pnpm monorepo of VS Code extensions and supporting libraries for SAP Business Application Studio (BAS). The main deliverable is the `app-studio-toolkit` VS Code extension, which provides the action broker framework, Project API, BAS authentication, and dev space manager used by other BAS extensions.

## Commands

### Root (runs across all packages)

```bash
pnpm install        # install all dependencies
pnpm compile        # clean + TypeScript build for all packages
pnpm compile:watch  # watch mode — recompiles on change
pnpm ci             # full CI build (compile + lint + test + bundle + package)
```

### Per sub-package (run inside `packages/<name>/`)

```bash
pnpm test           # run unit tests
pnpm coverage       # run tests with coverage report
pnpm ci             # full CI build for this package only
```

## Architecture

pnpm workspace with packages under `packages/` and nested sub-projects under `projects/`. Each `projects/*` directory is itself a mini-monorepo with its own `packages/` sub-directories.

### `packages/` — primary packages

| Package                          | Description                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `app-studio-toolkit`             | Main VS Code extension — action broker, Project API, BAS authentication, dev space manager |
| `app-studio-remote-access`       | Connects a local VS Code desktop to BAS dev spaces                                         |
| `app-studio-toolkit-types`       | TypeScript type definitions for the extension's exported API                               |
| `app-studio-toolkit-themes`      | VS Code theme for BAS                                                                      |
| `vscode-dependencies-validation` | Diagnostics and quick-fixes for npm dependency issues                                      |
| `npm-dependencies-validation`    | Core npm dependency detection logic (used by `vscode-dependencies-validation`)             |
| `vscode-deps-upgrade-tool`       | Upgrades `package.json` dependencies via `BASContributes.upgrade.node` metadata            |
| `vscode-disk-usage`              | Disk usage reports for BAS dev spaces                                                      |
| `vsix-zst`                       | Repackages VSIX archives as Zstandard-compressed TAR files                                 |
| `webide-client-tools`            | Client-side tools for web IDE integrations                                                 |

### `projects/` — nested sub-projects

Each is a self-contained project with its own sub-packages:

| Project                   | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `cloud-foundry-tools`     | VS Code tools for Cloud Foundry                   |
| `cloud-foundry-tools-api` | API types for Cloud Foundry tools                 |
| `code-snippet`            | Code snippet launcher framework                   |
| `feature-toggle-node`     | Feature flag/toggle library for Node.js           |
| `guided-development`      | Guided development framework                      |
| `inquirer-gui`            | VS Code GUI renderer for Inquirer.js prompts      |
| `task-explorer`           | Task explorer VS Code extension                   |
| `vscode-logging`          | Structured logging library for VS Code extensions |
| `vscode-mta-tools`        | VS Code Multi-Target Application tools            |
| `vscode-webview-rpc-lib`  | RPC library for VS Code WebViews                  |
| `xml-tools`               | XML language tools                                |
| `yeoman-ui`               | Yeoman generator UI for VS Code                   |

## Key Dependencies

- **`@sap/bas-sdk`** — BAS platform SDK; used for environment detection and landscape APIs
- **`@sap/artifact-management`** — Provides the Project API (SAP project types, metadata, structure)
- **`@vscode-logging/wrapper`** — Structured logging wrapper over VS Code output channels

## Testing

Most packages use **Mocha + Chai + Sinon** for unit tests and **nyc/Istanbul** for coverage. `packages/webide-client-tools` uses **Jest** instead. Coverage is enforced at 100% for all branches/lines/functions/statements (configured in each package's `nyc.config.js`).

```bash
pnpm test       # run tests (in a sub-package)
pnpm coverage   # run tests with coverage enforcement
```

## Configuration

The following environment variables are read at runtime (injected by BAS, not set by developers):

| Variable       | Package                                   | Description                                                                |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `WS_BASE_URL`  | `app-studio-toolkit`                      | Base URL of the BAS server; used to detect run mode (local vs. BAS remote) |
| `H2O_URL`      | `app-studio-toolkit`                      | BAS landscape URL; used to construct the "open in VS Code" deep link       |
| `WORKSPACE_ID` | `app-studio-toolkit`, `vscode-disk-usage` | Current dev space ID                                                       |
| `TENANT_PLAN`  | `vscode-disk-usage`                       | Tenant plan name for disk usage reporting                                  |
| `TENANT_PACK`  | `vscode-disk-usage`                       | Tenant pack name for disk usage reporting                                  |

No secrets or config files are required for local development or CI. The only prerequisite is `pnpm@11` and Node.js ≥20.

## Development Notes

- Use **pnpm** (not npm or yarn). The `packageManager` field pins `pnpm@11.1.1`.
- Node.js **≥20** is required (`engines.node` in root `package.json`).
- Commit messages must follow [conventional-commits](https://www.conventionalcommits.org/) format — enforced by a pre-commit hook and CI. Use `git cz` (requires commitizen) to construct valid messages.
- Versioning and releases are managed via [ChangeSets](https://github.com/changesets/changesets). Merge the auto-generated "Version Packages" PR to trigger a release.
