# cloud-foundry-tools-api

This project is part of the [app-studio-toolkit][mono-repo] monorepo and currently contains:

- [![npm-cf-tools][npm-image]][npm-url] [@sap/cf-tools](./packages/cloud-foundry-tools-api)
  — a set of APIs for easy application development with Cloud Foundry.

[mono-repo]: https://github.com/SAP/app-studio-toolkit
[npm-image]: https://img.shields.io/npm/v/@sap/cf-tools.svg
[npm-url]: https://www.npmjs.com/package/@sap/cf-tools

## Architecture

The single `@sap/cf-tools` package is a Node.js library, not an extension.
`packages/cloud-foundry-tools-api/src/index.ts` exports APIs for CLI authentication,
targets, organizations, spaces, applications, services, and local bindings. The
implementations run CF CLI queries and parse their output into typed results;
consumers such as Cloud Foundry Tools provide the VS Code UI. TypeScript builds to
`out/`, with the entry point `out/src/index.js`. See the [API examples](./packages/cloud-foundry-tools-api/README.md).

## Build and testing

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` at the monorepo root. Inside
`projects/cloud-foundry-tools-api/packages/cloud-foundry-tools-api`:

```sh
pnpm compile
pnpm test
pnpm coverage
pnpm ci
```

Tests use Mocha/Chai and mock CLI operations; `coverage` runs them with nyc.
The package's `ci` cleans, compiles, and runs coverage. Root `pnpm ci` validates
this package together with its consumers and the rest of the workspace.

## Configuration

CF CLI v8 must be available on PATH. Login and target selection are held in CF
CLI configuration; `cfGetConfigFilePath` resolves `.cf/config.json` below
`CF_HOME` when supplied, otherwise below the user's home directory. Named targets
use `.cf/targets/<target>.config.json`. APIs accept credentials, endpoints, and
resource identifiers as arguments; do not commit credentials. Local binding APIs
can read or write application environment files. The library has no VS Code settings.

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) validates the workspace on
Node 24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main`, but `@sap/cf-tools` is currently in
[the ignore list](../../.changeset/config.json). It is not published by that workflow.
The package is consumed from the workspace during development; there is no VSIX
to deploy. See the shared [release process](../../CONTRIBUTING.md#release-process)
for packages eligible for release.

## Support

To get more help, support, and information please open a GitHub
[issue](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label it with `project:cloud-foundry-tools-api`.

## Report an Issue

Please report issues in the [GitHub bug tracking system](https://github.com/SAP/app-studio-toolkit/issues).
