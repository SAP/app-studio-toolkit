[![Continuous Integration](https://github.com/SAP/app-studio-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/SAP/app-studio-toolkit/actions/workflows/ci.yml)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# app-studio-toolkit

## Description

With the app-studio-toolkit extension, you can benefit from a rich tools for executing common platform tasks. This extension allows developers to execute common actions as "Launch Code-Snippet", "Run VS Code command", "Open File", "Execute handler".

## How to obtain support

To get more help, support, and information please open a github [issue](https://github.com/SAP/app-studio-toolkit/issues).

## Contributing

Contributing information can be found in the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Architecture

This is a pnpm monorepo. Primary packages live under `packages/`; additional nested sub-projects live under `projects/`. Most projects are self-contained mini-monorepos with their own sub-packages; `vscode-mta-tools` and `vscode-webview-rpc-lib` are single root packages without a nested `packages/` structure.

### `packages/`

| Package                          | Description                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `app-studio-toolkit`             | Main VS Code extension — action broker, Project API, BAS authentication, dev space manager |
| `app-studio-remote-access`       | Connects a local VS Code desktop to BAS dev spaces                                         |
| `app-studio-toolkit-types`       | TypeScript type definitions for the extension's exported API                               |
| `app-studio-toolkit-themes`      | VS Code theme for BAS                                                                      |
| `vscode-dependencies-validation` | Diagnostics and quick-fixes for npm dependency issues                                      |
| `npm-dependencies-validation`    | Core npm dependency detection logic (used by `vscode-dependencies-validation`)             |
| `vscode-deps-upgrade-tool`       | Upgrades `package.json` dependencies via `BASContributes.upgrade.nodejs` metadata          |
| `vscode-disk-usage`              | Disk usage reports for BAS dev spaces                                                      |
| `vsix-zst`                       | Repackages VSIX archives as Zstandard-compressed TAR files                                 |
| `webide-client-tools`            | Client-side tools for web IDE integrations                                                 |

### `projects/`

| Project                   | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `cloud-foundry-tools`     | VS Code tools for Cloud Foundry                   |
| `cloud-foundry-tools-api` | API types for Cloud Foundry tools                 |
| `code-snippet`            | Code snippet launcher framework                   |
| `guided-development`      | Guided development framework                      |
| `inquirer-gui`            | VS Code GUI renderer for Inquirer.js prompts      |
| `task-explorer`           | Task explorer VS Code extension                   |
| `vscode-logging`          | Structured logging library for VS Code extensions |
| `vscode-mta-tools`        | VS Code Multi-Target Application tools            |
| `vscode-webview-rpc-lib`  | RPC library for VS Code WebViews                  |
| `xml-tools`               | XML language tools                                |
| `yeoman-ui`               | Yeoman generator UI for VS Code                   |

## Configuration

The following environment variables are injected by the BAS platform at runtime:

| Variable       | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| `WS_BASE_URL`  | Base URL of the BAS server; used to detect run mode (local vs. BAS remote) |
| `H2O_URL`      | BAS landscape URL; used to construct the "open in VS Code" deep link       |
| `WORKSPACE_ID` | Current dev space ID                                                       |
| `TENANT_PLAN`  | Tenant plan name (used by `vscode-disk-usage`)                             |
| `TENANT_PACK`  | Tenant pack name (used by `vscode-disk-usage`)                             |

No secrets or config files are required for local development.
