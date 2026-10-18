[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# VSCode-Logging

VSCode-Logging is a set of libraries for implementing logging functionality in [VSCode Extensions](https://code.visualstudio.com/api/get-started/your-first-extension).

It contains the following packages:

- [![npm-vscode-logging-logger][npm-vscode-logging-logger-image]][npm-vscode-logging-logger-url] [@vscode-logging/logger](./packages/logger) A logging library for VSCode Extensions.
- [![npm-vscode-logging-types][npm-vscode-logging-types-image]][npm-vscode-logging-types-url] [@vscode-logging/types](./packages/types) Common Logger Type Signatures for [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) scenarios.
- [![npm-vscode-logging-wrapper][npm-vscode-logging-wrapper-image]][npm-vscode-logging-wrapper-url] [@vscode-logging/wrapper](./packages/wrapper) An optional wrapper and utilities to reduce boilerplate when consuming @vscode-logging/logger.

Usage examples are available in the [examples](./examples) folder.

[npm-vscode-logging-logger-image]: https://img.shields.io/npm/v/@vscode-logging/logger.svg
[npm-vscode-logging-logger-url]: https://www.npmjs.com/package/@vscode-logging/logger
[npm-vscode-logging-types-image]: https://img.shields.io/npm/v/@vscode-logging/types.svg
[npm-vscode-logging-types-url]: https://www.npmjs.com/package/@vscode-logging/types
[npm-vscode-logging-wrapper-image]: https://img.shields.io/npm/v/@vscode-logging/wrapper.svg
[npm-vscode-logging-wrapper-url]: https://www.npmjs.com/package/@vscode-logging/wrapper

## Architecture

The logger package exposes `getExtensionLogger` and wraps Winston transports for
VS Code output channels, rolling files, and console output. Child loggers share
the root configuration and add labels. `types` declares the interfaces so consumers
can accept a logger without depending on its implementation. `wrapper` adds VS Code
configuration and lifecycle helpers. The logger implementation is JavaScript under
`packages/logger/lib/`, checked against declarations with TypeScript; the wrapper
is TypeScript compiled into `dist/`. Examples show integration into extensions and libraries.

## Build and testing

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` at the monorepo root, followed by
root `pnpm ci` for workspace validation. For logger-only changes:

```sh
# Inside projects/vscode-logging/packages/logger:
pnpm type-check
pnpm test
pnpm coverage:run
pnpm coverage:check
pnpm ci
```

Logger and wrapper tests use Mocha and nyc; `coverage:check` enforces 100% branches,
lines, statements, and functions. Wrapper `pnpm ci` compiles before testing, whereas
logger `type-check` emits no output. The types-only package runs type checks and
has no test suite. Package scripts are declared in their respective manifests.

## Configuration

Consumers call `getExtensionLogger` with an extension name, level, and one or more
logging targets (`logPath`, `logOutputChannel`, or `logConsole`). The returned logger
supports changing level and source-location tracking; child loggers inherit those
changes. Source tracking is expensive and intended for debugging. The library has
no project `.env` requirement. Extensions can expose these options in VS Code
Settings, as demonstrated in [the examples](./examples).

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs workspace CI on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main`. Logger, types, and wrapper share a fixed
version group in [the Changesets configuration](../../.changeset/config.json),
while examples are ignored. Eligible library versions are published to npm;
there is no standalone service or VSIX deployment for the libraries. Follow the
root [release process](../../CONTRIBUTING.md#release-process).

## Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `project:vscode-logging`.

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md).
