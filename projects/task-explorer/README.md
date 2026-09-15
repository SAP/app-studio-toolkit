[![CircleCI](https://circleci.com/gh/SAP/task-explorer.svg?style=svg)](https://circleci.com/gh/SAP/task-explorer)
[![Coverage Status](https://coveralls.io/repos/github/SAP/task-explorer/badge.svg?branch=main)](https://coveralls.io/github/SAP/task-explorer?branch=main)
[![Language grade: TypeScript](https://img.shields.io/lgtm/grade/javascript/g/SAP/task-explorer.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/SAP/task-explorer/context:javascript)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/task-explorer)](https://api.reuse.software/info/github.com/SAP/task-explorer)

# Task Explorer

![](screenshot.png)

This npm [mono-repo][mono-repo] contains the tool for exploring tasks in [SAP Business Application Studio][sap bas] and [VS Code][vscode] projects.

It currently contains:

- The [Task Explorer](./packages/tasks_panel) VS Code extension.

- The following packages:

  - [@task-explorer/task_contrib_types](./packages/task_contrib_types) Type signatures for task providers contributing to the Task Explorer.
  - [@task-explorer/tasks_panel](./packages/tasks_panel) The Task Explorer extension.
  - [@task-explorer/vue_frontend_rpc](./packages/vue_frontend_rpc) Task Explorer views.
  - [@task-explorer/vscode_task_contrib](./packages/vscode_task_contrib) A sample of the task provider that contributes to Task Explorer.

## Download and Installation

1. Clone this repository
2. Enter the `yarn install` command.
3. Enter the `yarn run ci` command.

### Run the VS Code extension with the provided sample

1. Start VS Code on your local machine, and click on **Open Workspace**.
2. Select this repo folder.
3. On the Debug panel, choose "Launch Tasks Panel with Sample Task Contributor", and click **Run**.

## Support

Open an [issue](https://github.com/SAP/task-explorer/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

[mono-repo]: https://github.com/babel/babel/blob/main/doc/design/monorepo.md
[sap bas]: https://help.sap.com/viewer/product/SAP%20Business%20Application%20Studio/Cloud/en-USl
[vscode]: https://code.visualstudio.com/

## Licensing

Please see our [LICENSE](https://raw.githubusercontent.com/SAP/task-explorer/main/LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available via the [REUSE tool](https://api.reuse.software/info/github.com/SAP/task-explorer).
