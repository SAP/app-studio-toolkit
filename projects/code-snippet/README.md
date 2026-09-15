[![CircleCI](https://circleci.com/gh/SAP/code-snippet.svg?style=svg)](https://circleci.com/gh/SAP/code-snippet)
[![Coverage Status](https://coveralls.io/repos/github/SAP/code-snippet/badge.svg?branch=master)](https://coveralls.io/github/SAP/code-snippet?branch=master)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/SAP/code-snippet.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/SAP/code-snippet/context:javascript)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![GitHub license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/code-snippet)](https://api.reuse.software/info/github.com/SAP/code-snippet)
[![dependentbot](https://api.dependabot.com/badges/status?host=github&repo=SAP/code-snippet)](https://dependabot.com/)

# Code Snippet Framework

The VSCode Code Snippet framework enables extension developers
to display a GUI form to end users and generate or edit source code snippets based on the
end user's answers to those questions.

## Description

This is the npm mono-repo for the VSCode Code Snippet framework.

It currently contains the following packages:

- [code-snippet](./packages/backend) The VSCode extension part of Code Snippet framework.
- [code-snippet-frontend](./packages/frontend) the user interface part of the Code Snippet framework.
- [vscode-snippet-contrib](./examples/vscode-snippet-contrib) A sample VSCode extension utilizing the Code Snippet framework.
- [![npm-code-snippet-types][npm-code-snippet-types-image]][npm-code-snippet-types-url] [@sap-devx/code-snippet-types](./packages/types)
  TypeScript type definitions to assist in using the Code Snippet framework.

[npm-code-snippet-types-image]: https://img.shields.io/npm/v/@sap-devx/code-snippet-types.svg
[npm-code-snippet-types-url]: https://www.npmjs.com/package/@sap-devx/code-snippet-types

## How to obtain support

To get more help, support, and information please open a github [issue](https://github.com/SAP/code-snippet/issues).

## Contributing

Contributing information can be found in the [CONTRIBUTING.md](CONTRIBUTING.md) file.
