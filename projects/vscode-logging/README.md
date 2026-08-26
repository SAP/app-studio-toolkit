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

## Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `project:vscode-logging`.

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md).
