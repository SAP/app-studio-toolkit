[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

## Description

The **VS Code Multi-Target Application (MTA) tools** extension is a VS Code extension for development of multi-target applications.
It can be used to build multitarget applications using the [Cloud MTA Build Tool](https://github.com/SAP/cloud-mta-build-tool), to deploy the build result to Cloud Foundry and to create MTA module from template.
The extension is being developed and currently contains limited features.

### Requirements

Make sure that you are familiar with the multi-target application concept and terminology. For background and detailed information, see [Multi-Target Application Model](https://www.sap.com/documents/2016/06/e2f618e4-757c-0010-82c7-eda71af511fa.html).

Make sure the following tools are installed in your environment:

- `GNU Make 4.2.1` or later to build MTA project.
- [Cloud MTA Build Tool](https://github.com/SAP/cloud-mta-build-tool) to build MTA project.
- [Cloud Foundry CLI](https://github.com/cloudfoundry/cli) to work with Cloud Foundry.
- [MultiApps CF CLI Plugin](https://github.com/cloudfoundry-incubator/multiapps-cli-plugin) to deploy MTA archive to Cloud Foundry.
- [MTA tool](https://github.com/SAP/cloud-mta) to add MTA modules.
- [Yeoman-ui extension](https://github.com/SAP/app-studio-toolkit) to add MTA modules.

## Architecture

This is a single extension package. `src/extension.ts` registers commands for MTA
build, MTAR deployment, and adding modules, along with build/deploy task providers
and validation. Command implementations live in `src/commands/`, task providers
in `src/task-providers/`, and validation logic in `src/validations/`. The commands
invoke external MTA/CF tools; the extension also contributes task-editor interfaces
for Task Explorer. TypeScript compilation and webpack produce the extension bundle
at `dist/extension.js`.

## Build and testing

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` and `pnpm ci` at the monorepo
root first to build workspace dependencies. Inside `projects/vscode-mta-tools`:

```sh
pnpm compile
pnpm test
pnpm coverage
pnpm ci
```

Tests use Mocha/Chai and nyc. `nyc.config.js` enforces 90% branches/functions and
95% lines/statements. Package `ci` cleans, compiles, runs coverage, bundles, and
creates a VSIX with `scripts/package-vsix.js`. Runtime build/deploy operations
require the external tools listed above; unit tests use mocks for external operations.

## Configuration

Install the external tools above on PATH and log in to CF before deploying.
The [manifest](./package.json) exposes `MTA Tools.loggingLevel` (default `error`)
and `MTA Tools.sourceLocationTracking` (default `false`) through VS Code Settings.
Use source tracking only for debugging. The extension depends on `sapos.yeoman-ui`
for generator-based module creation. No project `.env` is required for unit tests.

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs workspace CI on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
runs on pushes to `main` and uses Changesets to create a version PR or release.
This private extension is versioned under [the root Changesets configuration](../../.changeset/config.json)
and packaged as a VSIX. The release workflow uploads matching VSIX artifacts to
GitHub Releases; it does not publish to VS Code Marketplace. Follow the root
[release process](../../CONTRIBUTING.md#release-process).

### Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `project:vscode-mta-tools`.

### Contributing

Contributions are greatly appreciated.
See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md) for details.

## Licensing

Please see our [LICENSE](https://github.com/SAP/app-studio-toolkit/blob/main/LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available via the [REUSE tool](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit).
