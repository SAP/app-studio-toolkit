# Contributing to yeoman-ui

> For general contribution guidelines (DCO, Legal, Code of Conduct, How to Contribute) see the [root CONTRIBUTING.md](../../CONTRIBUTING.md).

## Development Environment

### pre-requisites

- [pnpm](https://pnpm.io/installation) >= 9
- A [Long-Term Support version](https://nodejs.org/en/about/releases/) of node.js >= 20
- [VSCode](https://code.visualstudio.com/) 1.39.2 or higher or [Theia](https://www.theia-ide.org/) 0.12 or higher.

### Initial Setup

The initial setup is trivial:

- clone this repo
- `pnpm install`

### Commit Messages format.

This project enforces the [conventional-commits][conventional_commits] commit message formats.
The possible commits types prefixes are limited to those defined by [conventional-commit-types][commit_types].
This promotes a clean project history and enables automatically generating a changelog.

[commit_types]: https://github.com/commitizen/conventional-commit-types/blob/master/index.json
[conventional_commits]: https://www.conventionalcommits.org/en/v1.0.0/

### Formatting.

[Prettier](https://prettier.io/) is used to ensure consistent code formatting in this repository.

If you get a formatting error you can run `pnpm format:fix`.

### Compiling

First time run `pnpm ci` from the repo root.

Use the following scripts at the repo's **root** to compile **all** the TypeScript sub-packages.

- `pnpm compile`

These scripts may also be available inside the sub-packages. However, it is recommended to
use the top-level compilation scripts to avoid forgetting to (re-)compile a sub-package's dependency.

#### Run the yeoman framework in dev mode

Dev mode allows you to run the yeoman framework in the browser, using vite for fast development cycles, and easy debug tools.
To run it do the following:

- comment out the [logger instantiating](./packages/backend/src/utils/env.ts#L38) in env.ts source file.
- in the packages/backend folder run `webpack` or `webpack-dev:watch`, then run the server.
  ```bash
  pnpm webpack
  pnpm ws:run
  ```
- in the packages/frontend folder run `serve`
  ```bash
  pnpm serve
  ```
- open the browser on `http://localhost:5173/index.html` to access the framework.

#### Run the explore generators framework in dev mode

Dev mode allows you to run the explore generators framework in the browser, using vite for fast development cycles, and easy debug tools.
To run it do the following:

- comment out the [logger instantiating](./packages/backend/src/utils/env.ts#L38) in env.ts source file.
- in the packages/backend folder run `webpack` or `webpack-dev:watch`, then run the server.
  ```bash
  pnpm webpack-dev:watch
  pnpm ws:egRun
  ```
- in the packages/frontend folder run `serve`
  ```bash
  pnpm serve
  ```
- open the browser on `http://localhost:5173/exploregens/index.html` to access the framework.

#### Run the VSCode extension

- Start VSCode on your local machine, and click on open workspace. Select this repo folder.
- On the debug panel choose `Run Extension`, and click on the `Run` button.

#### Advanced scenarios

- [Build & install the yeoman example generator](packages/generator-foodq/README.md)

### Testing

[Mocha][mocha] and [Chai][chai] are used for unit-testing and [Istanbul/Nyc][istanbul] for coverage reports for the TypeScript sub-packages and [Jest][jest] is used for unit-testing and coverage reports for the Vue sub-packages.

[mocha]: https://mochajs.org/
[chai]: https://www.chaijs.com
[istanbul]: https://istanbul.js.org/
[jest]: https://jestjs.io/

- To run the tests execute `pnpm test` in a specific sub-package.
- To run the tests with **coverage** run `pnpm coverage` in a specific sub-package.

### Code Coverage

Code Coverage is enforced for all productive code in this mono repo.

- Specific statements/functions may be [excluded][ignore_coverage] from the report.
  - However, the reason for each exclusion must be documented.

[ignore_coverage]: https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md

### Full Build

To run the full **C**ontinuous **I**ntegration build run `pnpm ci` in either the top-level package or a specific subpackage.
(When running in a specific package, ensure to run at least once in the top-level package.)

### Release Life-Cycle.

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing.

### Release Process

Performing a release requires push permissions to the repository.

- Ensure you are on the default branch and synced with origin.
- Create a changeset with `pnpm changeset` and commit the generated file.
- Merge to `main` — the CI will open a "Version Packages" PR automatically.
- Merging that PR triggers the release and publishes packages to npm.
