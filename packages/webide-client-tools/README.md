[![Continuous Integration](https://github.com/SAP/app-studio-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/SAP/app-studio-toolkit/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/%40sap-webide%2Fwebide-client-tools.svg)](https://badge.fury.io/js/%40sap-webide%2Fwebide-client-tools)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# webide-client-tools

## Description

Tools and flows for developing client-side features and extensions for [SAP Web IDE](https://developers.sap.com/topics/sap-webide.html)
based on npm ecosystem and standard OSS packages.

## Features

- **Bundling and Minification** of SAP Web IDE features:

  - Uses the [require.js optimizer](http://requirejs.org/docs/optimization.html) or [webpack](https://webpack.js.org/).

- **Testing**

  - Uses [Karma Test runner](https://github.com/karma-runner/karma).
  - Uses home-brewed APIs for programmatic access to SAP Web IDE services (Service Test Framework).

- **Local development server** for static resources:
  - Provides fast feedback loops.
  - Runs the bundled version of your feature locally.
  - Uses the [Connect](https://github.com/senchalabs/connect) Node.js middleware layer.
  - Uses an "in memory" backend mock.

## Requirements

- Node.js >= 20

## Installation

```
npm install @sap-webide/webide-client-tools --save-dev
```

## Usage and Documentation

- [API type definitions](./api.d.ts)
- [Example feature demonstrating client-tools capabilities](https://github.com/SAP/app-studio-toolkit/tree/main/packages/webide-client-tools/example)

## Development

```
npm install
npm test              # run tests with coverage
npm run lint          # ESLint
npm run type_check    # TypeScript type check
npm run ci            # full validation: format + type check + lint + test
```

## Known Issues

Full usage of this library requires the webide package as an npm peerDependency,
specifically for testing and development server flows.
This is currently not possible outside SAP's corporate network,
which means the library can only be used for bundling flows in external environments.

## Support

Open [issues](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md).

## Licensing

Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit).
