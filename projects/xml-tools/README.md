[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# XML-Tools

XML-Tools is an npm [mono-repo][mono-repo] that contains tools & libraries for [Extensible Markup Language][xml] (XML).
These tools & libraries are mainly focused on capabilities for implementing Editor Services flows in IDEs, for example:
Content Assist and Diagnostics.

It currently contains the following packages:

- [![npm-xml-tools-parser][npm-xml-tools-parser-image]][npm-xml-tools-parser-url] [@xml-tools/parser](./packages/parser) A Fault Tolerant XML Parser which outputs a [Concrete Syntax Tree][cst].
- [![npm-xml-tools-ast][npm-xml-tools-ast-image]][npm-xml-tools-ast-url] [@xml-tools/ast](./packages/ast) XML [Abstract Syntax Tree][ast].
- [![npm-xml-tools-ast-position][npm-xml-tools-ast-position-image]][npm-xml-tools-ast-position-url] [@xml-tools/ast-position](./packages/ast-position) XML Abstract Syntax Tree position utilities.
- [![npm-xml-tools-content-assist][npm-xml-tools-content-assist-image]][npm-xml-tools-content-assist-url] [@xml-tools/content-assist](./packages/content-assist) Extensible Content Assist APIs for XML.
- [![npm-xml-tools-validation][npm-xml-tools-validation-image]][npm-xml-tools-validation-url] [@xml-tools/validation](./packages/validation) Extensible Validation APIs for XML.
- [![npm-xml-tools-constraints][npm-xml-tools-constraints-image]][npm-xml-tools-constraints-url] [@xml-tools/constraints](./packages/constraints) Validations for XML constraints.
- [![npm-xml-tools-simple-schema][npm-xml-tools-simple-schema-image]][npm-xml-tools-simple-schema-url] [@xml-tools/simple-schema](./packages/simple-schema) Simple XML Schema represented as a JavaScript object literal.
- [![npm-xml-tools-language-server][npm-xml-tools-language-server-image]][npm-xml-tools-language-server-url] [@xml-tools/language-server](./packages/language-server) XML Language Server.
- [![npm-xml-tools-common][npm-xml-tools-common-image]][npm-xml-tools-common-url] [@xml-tools/common](./packages/common) Shared Utilities for xml-tools packages.
- [XML Toolkit](./packages/xml-toolkit) A private VS Code extension using the language server.

## Architecture

The parser returns a fault-tolerant CST and tokens. `ast` converts these into an
AST, and `ast-position` maps source positions. `validation`, `constraints`, and
`simple-schema` provide checks; `content-assist` and `simple-schema` expose
completion APIs for consumers. The language server currently uses parsing and
well-formedness checks to publish diagnostics. It does not register completion or
hover handlers. XML Toolkit starts that server when an XML document is opened.

## Build and testing

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` and `pnpm ci` at the monorepo
root for workspace validation. Core libraries are JavaScript with TypeScript
declarations; their checks do not require a TypeScript compilation step:

```sh
# Inside projects/xml-tools/packages/parser (also applies to most core libraries):
pnpm type-check
pnpm test
pnpm coverage:run
pnpm coverage:check
pnpm ci
```

Core tests use Mocha and nyc with 100% coverage thresholds. Scripts vary: language-server
uses `pnpm coverage` and `pnpm bundle`; XML Toolkit uses `pnpm bundle` and
`pnpm package`, with VS Code extension tests under `pnpm test`. XML Toolkit's CI
packages the extension but does not run its extension-host test suite. Inspect
the relevant manifest before selecting a command.

## Configuration

Library consumers pass XML text, CST/tokens, ASTs, schemas, validators, and suggestion
providers through the APIs. See [simple-schema](./packages/simple-schema/README.md)
for schema configuration and [content-assist](./packages/content-assist/README.md)
for provider configuration. The libraries need no BAS credentials or project `.env`.
XML Toolkit requires VS Code compatible with `^1.56.0`, activates on XML documents,
and declares no `contributes.configuration` settings. The language server accepts
an optional `initializationOptions.consumer` identifier.

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs workspace CI on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main`. XML packages are independently versioned under
[the root configuration](../../.changeset/config.json); eligible libraries publish
to npm and the private XML Toolkit builds a VSIX. Matching VSIX artifacts are uploaded
to GitHub Releases; the workflow does not publish to Marketplace. Follow the root
[release process](../../CONTRIBUTING.md#release-process).

[npm-xml-tools-parser-image]: https://img.shields.io/npm/v/@xml-tools/parser.svg
[npm-xml-tools-parser-url]: https://www.npmjs.com/package/@xml-tools/parser
[npm-xml-tools-ast-image]: https://img.shields.io/npm/v/@xml-tools/ast.svg
[npm-xml-tools-ast-url]: https://www.npmjs.com/package/@xml-tools/ast
[npm-xml-tools-ast-position-image]: https://img.shields.io/npm/v/@xml-tools/ast-position.svg
[npm-xml-tools-ast-position-url]: https://www.npmjs.com/package/@xml-tools/ast-position
[npm-xml-tools-content-assist-image]: https://img.shields.io/npm/v/@xml-tools/content-assist.svg
[npm-xml-tools-content-assist-url]: https://www.npmjs.com/package/@xml-tools/content-assist
[npm-xml-tools-validation-image]: https://img.shields.io/npm/v/@xml-tools/validation.svg
[npm-xml-tools-validation-url]: https://www.npmjs.com/package/@xml-tools/validation
[npm-xml-tools-constraints-url]: https://www.npmjs.com/package/@xml-tools/constraints
[npm-xml-tools-constraints-image]: https://img.shields.io/npm/v/@xml-tools/constraints.svg
[npm-xml-tools-simple-schema-image]: https://img.shields.io/npm/v/@xml-tools/simple-schema.svg
[npm-xml-tools-simple-schema-url]: https://www.npmjs.com/package/@xml-tools/simple-schema
[npm-xml-tools-language-server-image]: https://img.shields.io/npm/v/@xml-tools/language-server.svg
[npm-xml-tools-language-server-url]: https://www.npmjs.com/package/@xml-tools/language-server
[npm-xml-tools-common-image]: https://img.shields.io/npm/v/@xml-tools/common.svg
[npm-xml-tools-common-url]: https://www.npmjs.com/package/@xml-tools/common

## Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `project:xml-tools`.

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md).

[mono-repo]: https://github.com/babel/babel/blob/master/doc/design/monorepo.md
[xml]: https://www.w3.org/XML/
[ast]: https://en.wikipedia.org/wiki/Abstract_syntax_tree
[cst]: https://en.wikipedia.org/wiki/Parse_tree
