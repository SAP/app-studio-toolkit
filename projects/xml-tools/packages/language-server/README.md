[![npm (scoped)](https://img.shields.io/npm/v/@xml-tools/language-server.svg)](https://www.npmjs.com/package/@xml-tools/language-server)

# @xml-tools/language-server

XML Language Server

Current Features:

- Syntax Diagnostics.

## Installation

With npm:

- `npm install @xml-tools/language-server`

With Yarn

- `yarn add @xml-tools/language-server`

## Usage

Please see the [TypeScript Definitions](./api.d.ts) for full API details.

A simple usage example:

```javascript
const { SERVER_PATH } = require("@xml-tools/language-server");

// SERVER_PATH is the only API currently and it is meant to expose the "main" module's absolute
// path which would then be executed in a different process
console.log(SERVER_PATH); // --> .../node_module/@xml-tools/language-server/lib/server.js
```

## Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `project:xml-tools`.

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md).
