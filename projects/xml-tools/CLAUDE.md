# xml-tools

Suite of XML parsing, validation, and language server packages for robust XML tooling in editors and applications.

## Architecture

Ten packages under `packages/` (the VS Code extension is private):

### Core Parsing & AST

- **`parser/`** (`@xml-tools/parser`) — Fault-tolerant XML parser producing a Concrete Syntax Tree (CST). Handles malformed XML gracefully.
- **`ast/`** (`@xml-tools/ast`) — XML Abstract Syntax Tree representation and traversal utilities.
- **`ast-position/`** (`@xml-tools/ast-position`) — AST position utilities for mapping between CST nodes and source locations.

### Validation & Content Assist

- **`content-assist/`** (`@xml-tools/content-assist`) — Extensible Content Assist APIs for XML completion suggestions (elements, attributes, values).
- **`validation/`** (`@xml-tools/validation`) — Extensible Validation APIs for XML document validation against schemas.
- **`constraints/`** (`@xml-tools/constraints`) — XML constraint validations (uniqueness, referential integrity, cardinality).

### Schema & Common

- **`simple-schema/`** (`@xml-tools/simple-schema`) — Simple XML Schema representation as JavaScript objects; schema definition DSL.
- **`common/`** (`@xml-tools/common`) — Shared utilities and helper functions used across packages.

### Language Server & Extension

- **`language-server/`** (`@xml-tools/language-server`) — XML Language Server (LSP) implementation providing diagnostics, completion, and hover support.
- **`xml-toolkit/`** — VS Code extension wrapping the language server; provides XML editing features in VS Code.

**Dependency flow:** parser → ast → ast-position → validation/content-assist → language-server → xml-toolkit (VS Code extension).

## Build

```sh
# from a core library directory such as packages/parser:
pnpm run ci              # clean + type-check + coverage:run + coverage:check
pnpm run type-check      # tsc --noEmit checks declaration files

# from packages/language-server or packages/xml-toolkit:
pnpm run bundle          # webpack
```

**Packages with webpack bundling:** `language-server`, `xml-toolkit`.

Core library implementations are JavaScript; use `type-check` for declarations and `ci` for validation. Scripts vary by package; `xml-toolkit` has no `compile` or `type-check` script.

## Testing

Tests use Mocha with nyc (Istanbul) for coverage. **100% coverage is enforced** for parser and core packages.

```sh
# from a core library directory such as packages/parser:
pnpm run test            # mocha
pnpm run coverage:run    # nyc mocha
pnpm run coverage:check  # enforces coverage thresholds

# from packages/language-server:
pnpm run coverage       # nyc mocha

# from packages/xml-toolkit:
pnpm run test            # VS Code extension test runner
```

Test suites cover:

- Parser: malformed XML, edge cases, CST correctness
- AST: tree construction, traversal, position mapping
- Validation: constraint checking, schema validation
- Content Assist: completion suggestions at various cursor positions
- Language Server: LSP protocol compliance, document synchronization

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`commitlint.yml`** — enforces conventional commit message format.
- **`release.yml`** — Changesets-based release workflow; runs on pushes to main; publishes eligible npm packages and uploads VSIX artifacts to GitHub Releases. It does not publish to VS Code Marketplace.

To cut a release:

```sh
# from monorepo root:
pnpm changeset          # create a changeset describing the change
# commit and merge the changeset, then merge the generated Version Packages PR
```

Individual packages are versioned independently (not fixed mode); changesets determine which packages bump versions based on changes.

## Configuration

Pure Node.js libraries; no environment variables required.

**Prerequisites:**

- Node.js 20+
- pnpm workspace manager (installed at monorepo root)

**For VS Code extension (`xml-toolkit`):**

- VS Code ^1.56.0 (see packages/xml-toolkit/package.json)
- The extension manifest does not declare a `contributes.configuration` section.

Consumers install library packages from npm:

```sh
npm install @xml-tools/parser
npm install @xml-tools/ast
```

Language server and extension are consumed via VS Code Marketplace or .vsix installation.
