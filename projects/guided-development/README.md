[![Continuous Integration](https://github.com/SAP/app-studio-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/SAP/app-studio-toolkit/actions/workflows/ci.yml)
![GitHub license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# Guided Development

![](screenshot.png)

## Description

The Guided Development extension allows developers to add generic code pieces to their
project and provides a wizard-like experience with minimal development effort.

This is part of the [app-studio-toolkit][mono-repo] monorepo and currently contains:

- [VSCode Extension](./packages/backend) — the backend part, which communicates with the
  system and hosts the Guide Center. Runs as a VSCode extension or a node.js application.
- [Guided Development UI](./packages/frontend) — the Guided Development standalone vue.js
  application, bundled into the extension.
- [![npm-guided-development-types][npm-types-image]][npm-types-url] [@sap_oss/guided-development-types](./packages/types)
  — the shared type signatures consumed by Guided Development contributors.
- [Contributor examples](./examples) — example VSCode extensions that show how to contribute
  guides to the Guide Center.

[mono-repo]: https://github.com/SAP/app-studio-toolkit
[npm-types-image]: https://img.shields.io/npm/v/@sap_oss/guided-development-types.svg
[npm-types-url]: https://www.npmjs.com/package/@sap_oss/guided-development-types

## Support

To get more help, support, and information please open a GitHub
[issue](https://github.com/SAP/app-studio-toolkit/issues/new?labels=project%3Aguided-development).

## Report an Issue

See [reporting and handling issues](../../CONTRIBUTING.md#report-an-issue) in the root CONTRIBUTING.md.
