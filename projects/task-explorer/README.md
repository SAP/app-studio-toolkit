# Task Explorer

This project, migrated from [SAP/task-explorer](https://github.com/SAP/task-explorer), contains the tool for exploring tasks in [SAP Business Application Studio][sap bas] and [VS Code][vscode] projects.

## Packages

- [packages/task_contrib_types](./packages/task_contrib_types) — `@sap_oss/task_contrib_types`: Type signatures for task providers contributing to the Task Explorer.
- [packages/tasks_panel](./packages/tasks_panel) — `vscode-tasks-explorer-tasks-panel`: The Task Explorer VS Code extension (VSIX).
- [packages/vue_frontend_rpc](./packages/vue_frontend_rpc) — `@vscode-tasks-explorer/vue_frontend_rpc`: Vue 3 frontend bundled into the Task Explorer extension.

## Examples

- [examples/npm_task_contrib](./examples/npm_task_contrib) — `npm-task-contrib`: Sample Npm Task Contributor extension.
- [examples/vscode_task_contrib](./examples/vscode_task_contrib) — `vscode-task-contrib`: Sample VSCode Task Contributor extension.

## Support

Open an [issue](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).

[sap bas]: https://help.sap.com/viewer/product/SAP%20Business%20Application%20Studio/Cloud/en-USl
[vscode]: https://code.visualstudio.com/
