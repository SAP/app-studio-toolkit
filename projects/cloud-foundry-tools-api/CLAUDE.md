# cloud-foundry-tools-api

Node.js library providing APIs for interacting with Cloud Foundry CLI. Part of app-studio-toolkit monorepo.

## Architecture

Single package: `packages/cloud-foundry-tools-api` (npm name: `@sap/cf-tools`).

This is a **Node.js library**, not a VS Code extension. It provides programmatic APIs for Cloud Foundry operations:

- CF CLI command wrappers
- Service management
- Application deployment helpers
- Space and organization management

Used as a dependency by other tools in the monorepo, including cloud-foundry-tools extension.

## Build

```sh
cd packages/cloud-foundry-tools-api
pnpm compile        # tsc compile
pnpm ci             # clean + compile + coverage
pnpm compile:watch  # watch mode
```

Output: TypeScript compiled to `out/` directory.

## Testing

Uses Mocha + Chai; coverage via nyc.

```sh
cd packages/cloud-foundry-tools-api
pnpm test       # mocha (no coverage)
pnpm coverage   # nyc mocha
```

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`release.yml`** — triggered by pushes to `main`; uses Changesets to either open "Version Packages" PR or publish to npm.
- **`commitlint.yml`** — enforces conventional commit message format.

The package is named `@sap/cf-tools`, but the monorepo Changesets configuration currently ignores it; the root release workflow does not publish this package.

## Configuration

Runtime dependency: **CF CLI v8** must be installed and available on PATH.

CF operations require CLI authentication and target state. Local binding APIs can read or write environment files.

The library reads CF CLI configuration from standard CF CLI locations (`~/.cf/config.json`).
