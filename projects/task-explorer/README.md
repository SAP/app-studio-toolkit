# Task Explorer

This project, migrated from [SAP/task-explorer](https://github.com/SAP/task-explorer), contains the tool for exploring tasks in [SAP Business Application Studio][sap bas] and [VS Code][vscode] projects.

## Packages

- [packages/task_contrib_types](./packages/task_contrib_types) — `@sap_oss/task_contrib_types`: Type signatures for task providers contributing to the Task Explorer.
- [packages/tasks_panel](./packages/tasks_panel) — `vscode-tasks-explorer-tasks-panel`: The Task Explorer VS Code extension (VSIX).
- [packages/vue_frontend_rpc](./packages/vue_frontend_rpc) — `@vscode-tasks-explorer/vue_frontend_rpc`: Vue 3 frontend bundled into the Task Explorer extension.

## Examples

- [examples/npm_task_contrib](./examples/npm_task_contrib) — `npm-task-contrib`: Sample Npm Task Contributor extension.
- [examples/vscode_task_contrib](./examples/vscode_task_contrib) — `vscode-task-contrib`: Sample VSCode Task Contributor extension.

## Architecture

`packages/tasks_panel/src/extension.ts` discovers task contributors, creates the
task tree, and registers task creation, editing, execution, and termination commands.
Contributors implement the interfaces in `task_contrib_types`. The Vue 3/Vite
`vue_frontend_rpc` app supplies editor forms over RPC; tasks_panel copies its built
`dist/` into extension `dist/media/`. The example extensions demonstrate npm and
VS Code task contributions. The tasks_panel manifest has no `extensionDependencies` entry.

## Build and testing

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` and `pnpm ci` at the monorepo
root first to compile workspace dependencies and build the frontend before backend
packaging. For subsequent package-only changes:

```sh
# Inside projects/task-explorer/packages/tasks_panel:
pnpm compile
pnpm test
pnpm coverage
# Inside projects/task-explorer/packages/vue_frontend_rpc:
pnpm build
pnpm test
```

The backend uses Mocha/Chai and nyc. The frontend uses Jest, Vue Test Utils, and
jsdom, with coverage collected by its Jest configuration. Backend `pnpm ci` and
`pnpm ci:artifacts_only` copy existing frontend output; they do not build it.
See the [frontend development guide](./packages/vue_frontend_rpc/CONTRIBUTING.md)
for the mock backend playground and browser development.

## Configuration

The [extension manifest](./packages/tasks_panel/package.json) exposes
`vscode-tasks-explorer-tasks-panel.loggingLevel` (default `error`) and
`vscode-tasks-explorer-tasks-panel.sourceLocationTracking` (default `false`) in
VS Code Settings. Source-location tracking is intended for debugging. Contributor
extensions supply task definitions and editor behavior; no project `.env` or BAS
credentials are required for local compilation and unit tests.

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs workspace CI on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main`. tasks_panel and its frontend share a fixed
version group in [the Changesets configuration](../../.changeset/config.json).
The private backend produces a VSIX; matching artifacts are uploaded to GitHub
Releases. The types package and examples are ignored by Changesets. Follow the
root [release process](../../CONTRIBUTING.md#release-process); the workflows do
not publish to the VS Code Marketplace.

## Support

Open an [issue](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).

[sap bas]: https://help.sap.com/viewer/product/SAP%20Business%20Application%20Studio/Cloud/en-US
[vscode]: https://code.visualstudio.com/
