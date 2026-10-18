# Cloud Foundry Tools

This project, migrated from [SAP/cloud-foundry-tools](https://github.com/SAP/cloud-foundry-tools), contains the VS Code extension that provides tools for easy application development with Cloud Foundry (login, create service, bind service, unbind service, and more) in [SAP Business Application Studio][sap bas] and [VS Code][vscode].

## Packages

- [packages/backend](./packages/backend) — `vscode-cf-tools`: The Cloud Foundry Tools VS Code extension (VSIX).
- [packages/frontend](./packages/frontend) — `cloud-foundry-tools-frontend`: Vue 3 frontend bundled into the extension.
- [packages/wrapper](./packages/wrapper) — `vscode-wing-cf-tools`: Deprecated wrapper extension kept for backward compatibility; redirects users to `vscode-cf-tools`.

## Architecture

The backend starts in `packages/backend/src/extension.ts`, registers CF commands
and a target/service tree, and invokes `@sap/cf-tools` for CLI operations. The Vue 3
frontend supplies webview forms. Backend `frontend:all` builds the frontend and
copies its `dist/` into `packages/backend/dist/media/`; webpack bundles the extension
to `dist/extension.js`. The wrapper only installs the active extension as a dependency.

## Build and testing

Use Node 24.x (the CI version) and pnpm 11.1.1. Install and validate from the monorepo root:

```sh
pnpm install
pnpm ci
```

For a backend build without tests, run `pnpm ci:artifacts_only` inside
`projects/cloud-foundry-tools/packages/backend`. It builds and copies the frontend
and packages a VSIX. Backend and wrapper tests use Mocha/Chai; `pnpm test` runs tests
and `pnpm coverage` runs them through nyc in either package. The backend coverage
suite also needs its test resources: use backend `pnpm ci` to compile and copy them.
Frontend tests use Jest: run `pnpm test` inside `packages/frontend`; it has no
separate `coverage` script.

## Configuration

Install CF CLI v8 and the `targets` and service-info plugins described in the
[backend prerequisites](./packages/backend/README.md#prerequisite-dependencies).
Log in and select the CF API, organization, and space through the CLI or extension.
The extension reads this CLI state rather than a project `.env` file. VS Code
settings in [the backend manifest](./packages/backend/package.json) control
`CloudFoundryTools.showTargetInformation`, logging level (default `error`), and
source-location tracking (default `false`, intended for debugging).

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs `pnpm run ci` on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
runs on pushes to `main` and uses Changesets to create a version PR or release.
Backend and frontend share a fixed version group in [the Changesets configuration](../../.changeset/config.json).
The private backend is packaged as a VSIX; matching artifacts are uploaded to
GitHub Releases by the release workflow. The deprecated wrapper is ignored by
Changesets. Follow the root [release process](../../CONTRIBUTING.md#release-process);
the workflows do not publish to the VS Code Marketplace.

## Support

Open an [issue](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).

[sap bas]: https://help.sap.com/viewer/product/SAP%20Business%20Application%20Studio/Cloud/en-US
[vscode]: https://code.visualstudio.com/
