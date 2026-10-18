# Code Snippet Framework

The VS Code Code Snippet framework enables extension developers to display a GUI form to end users and generate or edit source code snippets based on the end user's answers.

## Description

This project contains the Code Snippet framework packages migrated into the SAP app-studio-toolkit monorepo.

It currently contains the following packages:

- [code-snippet-tool](./packages/backend) - the VS Code extension backend for the Code Snippet framework.
- [code-snippet-frontend](./packages/frontend) - the user interface part of the Code Snippet framework.
- [code-snippet](./packages/wrapper) - the VS Code wrapper extension.
- [@sap-devx/code-snippet-types](./packages/types) - TypeScript type definitions to assist in using the Code Snippet framework.
- [vscode-snippet-contrib](./examples/vscode-snippet-contrib) - a sample VS Code extension using the Code Snippet framework.

## Architecture

`packages/backend/src/extension.ts` registers commands and the snippet webview.
Contributor extensions supply questions and generation/edit behavior; the backend
routes validation and answers between those contributions and the Vue 3/Vite
frontend. The frontend uses Inquirer GUI. Its `dist/` is copied into backend
`dist/media/` for packaging. The types package defines the contribution contract;
the deprecated wrapper depends on the active extension.

## Build and testing

Use Node 24.x and pnpm 11.1.1. From the monorepo root, run `pnpm install` and
`pnpm ci` to build dependencies, types, frontend, and backend in workspace order.
For later package-only changes:

```sh
# Inside projects/code-snippet/packages/frontend:
pnpm build
pnpm test
# Inside projects/code-snippet/packages/backend:
pnpm compile
pnpm test
pnpm coverage
```

Backend and wrapper tests use Mocha/Chai with nyc coverage. The frontend uses Jest
and collects coverage through its test configuration. Backend `pnpm ci` bundles
and packages a VSIX, but requires the frontend `dist/` and workspace dependencies
to be built first; `frontend:copy` copies output and does not build it.

## Configuration

No project `.env` or credentials are needed for local development. In VS Code
Settings, `Code Snippet.loggingLevel` defaults to `error` and
`Code Snippet.sourceLocationTracking` defaults to `false`; enable the latter only
for debugging. The [backend manifest](./packages/backend/package.json) declares
these settings. Snippet questions and output behavior are configured by contributor
extensions; see the [contributor example](./examples/vscode-snippet-contrib).

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs workspace CI on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main`. Backend and frontend share a fixed group in
[the Changesets configuration](../../.changeset/config.json); the types package is
eligible for npm publishing, while the wrapper and example are ignored. The
private backend produces a VSIX; the release workflow uploads matching VSIX files
to GitHub Releases and does not publish to Marketplace. Follow the root
[release process](../../CONTRIBUTING.md#release-process).

## How to obtain support

To get help, support, or report an issue, open a GitHub issue in [SAP/app-studio-toolkit](https://github.com/SAP/app-studio-toolkit/issues).

## Contributing

Contributing information can be found in the repository-level [CONTRIBUTING.md](../../CONTRIBUTING.md) file.
