# vscode-logging

VS Code logging library providing structured logging capabilities for VS Code extensions.

## Architecture

Three published packages under `packages/`:

- **`logger/`** (`@vscode-logging/logger`) — The core logging library for VS Code extensions. Provides structured logging with configurable log levels, output channels, and extensibility points.
- **`types/`** (`@vscode-logging/types`) — Common Logger type signatures and interfaces shared across the ecosystem.
- **`wrapper/`** (`@vscode-logging/wrapper`) — Optional wrapper that reduces boilerplate when initializing and using loggers in VS Code extensions.

Additional directory:

- **`examples/`** — Usage examples demonstrating logger integration patterns.

The three library packages are consumed via npm by VS Code extensions. The `examples/` directory also includes extension examples.

## Build

```sh
# from packages/logger/ directory:
pnpm run ci              # full CI: type-check + coverage:run + coverage:check
pnpm run type-check      # TypeScript compilation check (tsc)
```

Development workflow: the logger implementation lives in `packages/logger/lib/*.js`
with declarations in `api.d.ts`; `type-check` checks JavaScript and declarations
without emitting output. The wrapper has TypeScript sources compiled to `dist/`.
Run the relevant package's `ci` script for its type checks and tests.

## Testing

Tests use Mocha with nyc (Istanbul) for coverage. **100% coverage is enforced** via `coverage:check`.

```sh
# from packages/logger/ directory:
pnpm run test            # mocha (no coverage)
pnpm run coverage:run    # nyc mocha (generates coverage report)
pnpm run coverage:check  # nyc check-coverage (enforces 100% thresholds)
```

Coverage thresholds are strict: branches, lines, functions, and statements must all reach 100%.

## CI/CD & Deployment

GitHub Actions at monorepo root (`.github/workflows/`):

- **`ci.yml`** — runs `pnpm run ci` on Node 24.x for pushes and PRs.
- **`commitlint.yml`** — enforces conventional commit message format.
- **`release.yml`** — Changesets-based release workflow; publishes packages to npm when changesets are merged to main.

To cut a release:

```sh
# from monorepo root:
pnpm changeset          # create a changeset describing the change
# commit and merge the changeset, then merge the generated Version Packages PR
```

## Configuration

No environment variables or VS Code settings are required. This is a pure Node.js library consumed as a dependency.

**Prerequisites:**

- Node.js 20+
- pnpm workspace manager (installed at monorepo root)

Consumers install from npm:

```sh
npm install @vscode-logging/logger
```

Logging behavior (log level, output channels) is configured programmatically by the consuming VS Code extension at runtime.
