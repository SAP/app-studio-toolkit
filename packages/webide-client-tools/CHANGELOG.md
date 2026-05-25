# Changelog

## 5.0.0

### Major Changes

- 5731b53: Modernize package: webpack 5, Node 20, dependency and tooling cleanup

  Breaking changes:

  - Minimum Node.js version is now 20 (engines: ">=20")
  - webpack upgraded from 4 to 5; the `webpackConfig` option passed to
    `bundleFeature` must now use the webpack 5 API:
    - `output.library` replaces `output.libraryTarget`
    - The externals function signature changed to `({ request }, callback)`

  Bug fixes:

  - Fixed `new Buffer()` deprecation in middleware.js (replaced with Buffer.from())
  - Fixed webpack callback leaving promise unresolved when stats is undefined
  - Fixed webpack error objects being serialized as "[object Object]"

  Dependency updates:

  - glob upgraded to 11.1.0
  - Removed `http` npm stub (Node.js built-in, never needed)
  - Removed `@types/webpack` (webpack 5 ships its own type definitions)
  - Removed stale `resolutions` block (yarn-only syntax, ignored by pnpm)

  Tooling / housekeeping:

  - Jest coverage output redirected to `.nyc_output` to integrate with the
    monorepo merge-coverage pipeline
  - Added `publishConfig: { access: "public" }` so changeset publish works
    correctly for this scoped package
  - Removed standalone release scripts (release.sh and related) superseded
    by the monorepo changeset release flow
  - ESLint configuration aligned between package-level and root-level runs
  - Removed outdated CONTRIBUTING.md (root CONTRIBUTING.md covers the monorepo)
  - README updated: badges, links, Node requirement, added development section

See [git history](https://github.com/SAP/app-studio-toolkit/commits/main/packages/webide-client-tools) for changes.
