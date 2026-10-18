[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# Inquirer GUI

`inquirer-gui` is a UI component that displays [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)-compliant questions in an interactive HTML form, built with Vue 3 and Vuetify 3.

It contains the following packages:

- [![npm-inquirer-gui][npm-inquirer-gui-image]][npm-inquirer-gui-url] [@sap-devx/inquirer-gui](./packages/inquirer-gui) The core `Form` component.
- [![npm-controls-navigator][npm-controls-navigator-image]][npm-controls-navigator-url] [@sap-devx/controls-navigator](./packages/controls-navigator) A navigator control.
- [![npm-auto-complete-plugin][npm-auto-complete-plugin-image]][npm-auto-complete-plugin-url] [@sap-devx/inquirer-gui-auto-complete-plugin](./packages/auto-complete-plugin) Auto-complete plugin.
- [![npm-file-browser-plugin][npm-file-browser-plugin-image]][npm-file-browser-plugin-url] [@sap-devx/inquirer-gui-file-browser-plugin](./packages/file-browser-plugin) File browser plugin.
- [![npm-folder-browser-plugin][npm-folder-browser-plugin-image]][npm-folder-browser-plugin-url] [@sap-devx/inquirer-gui-folder-browser-plugin](./packages/folder-browser-plugin) Folder browser plugin.
- [![npm-label-plugin][npm-label-plugin-image]][npm-label-plugin-url] [@sap-devx/inquirer-gui-label-plugin](./packages/label-plugin) Label plugin.
- [![npm-login-plugin][npm-login-plugin-image]][npm-login-plugin-url] [@sap-devx/inquirer-gui-login-plugin](./packages/login-plugin) Login plugin.
- [![npm-radio-plugin][npm-radio-plugin-image]][npm-radio-plugin-url] [@sap-devx/inquirer-gui-radio-plugin](./packages/radio-button-plugin) Radio-button plugin.
- [![npm-single-checkbox-plugin][npm-single-checkbox-plugin-image]][npm-single-checkbox-plugin-url] [@sap-devx/inquirer-gui-single-checkbox-plugin](./packages/single-checkbox-plugin) Single-checkbox plugin.
- [![npm-tiles-plugin][npm-tiles-plugin-image]][npm-tiles-plugin-url] [@sap-devx/inquirer-gui-tiles-plugin](./packages/tiles-plugin) Tiles plugin.

Usage examples are available in the [examples](./examples) folder.

[npm-inquirer-gui-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui.svg
[npm-inquirer-gui-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui
[npm-controls-navigator-image]: https://img.shields.io/npm/v/@sap-devx/controls-navigator.svg
[npm-controls-navigator-url]: https://www.npmjs.com/package/@sap-devx/controls-navigator
[npm-auto-complete-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-auto-complete-plugin.svg
[npm-auto-complete-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-auto-complete-plugin
[npm-file-browser-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-file-browser-plugin.svg
[npm-file-browser-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-file-browser-plugin
[npm-folder-browser-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-folder-browser-plugin.svg
[npm-folder-browser-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-folder-browser-plugin
[npm-label-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-label-plugin.svg
[npm-label-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-label-plugin
[npm-login-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-login-plugin.svg
[npm-login-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-login-plugin
[npm-radio-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-radio-plugin.svg
[npm-radio-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-radio-plugin
[npm-single-checkbox-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-single-checkbox-plugin.svg
[npm-single-checkbox-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-single-checkbox-plugin
[npm-tiles-plugin-image]: https://img.shields.io/npm/v/@sap-devx/inquirer-gui-tiles-plugin.svg
[npm-tiles-plugin-url]: https://www.npmjs.com/package/@sap-devx/inquirer-gui-tiles-plugin

## Architecture

The core `packages/inquirer-gui/src/Form.vue` renders Inquirer-compatible questions
and coordinates answer validation. Plugins register Vue components for GUI question
types such as `file-browser`, `folder-browser`, `label`, and `tiles`.
`controls-navigator` renders prompt groups as tabs or steps. Consumers provide
question data, callbacks, and navigation state; the library does not run a backend
itself. Packages use Vite library builds to produce distributable JavaScript and
CSS in `dist/`. The examples demonstrate browser and VS Code integrations.

## Build and testing

Use Node 24.x and pnpm 11.1.1. Run `pnpm install` and `pnpm ci` from the monorepo
root to build the workspace and run the package CI scripts. For focused changes:

```sh
# Inside projects/inquirer-gui/packages/inquirer-gui:
pnpm build
pnpm test
# Inside projects/inquirer-gui/packages/controls-navigator:
pnpm build
pnpm test
```

The core, navigator, and most plugins use Jest with Vue test utilities. Coverage
settings live in the package Jest configuration and shared `jest.config.base.js`.
Scripts vary: for example, `tiles-plugin` has build-only CI and no test script.
Use `pnpm ci` inside the package you changed to run its declared checks.

## Configuration

Consumers install the Vue plugins and supply Inquirer question objects. Set
`guiOptions.type` to select a GUI plugin; callbacks such as `getFilePath`, `getPath`,
and `validate` connect questions to application behavior. These are application
callbacks, not environment variables. The [navigator guide](./packages/controls-navigator/README.md)
documents `promptIndex`, `prompts`, answers, navigation type, and navigation events.
The [file browser](./packages/file-browser-plugin/README.md),
[folder browser](./packages/folder-browser-plugin/README.md), and
[label](./packages/label-plugin/README.md) guides include question examples.
No BAS credentials or project `.env` are required to build the UI libraries.

## CI and release

The root [CI workflow](../../.github/workflows/ci.yml) runs `pnpm run ci` on Node
24.x for pushes and PRs targeting `main`. The [release workflow](../../.github/workflows/release.yml)
uses Changesets on pushes to `main`. The core, navigator, and production plugins
share a fixed group in [the Changesets configuration](../../.changeset/config.json);
examples are ignored. Eligible library packages are published to npm, with no
standalone service or VSIX deployment for the libraries. Follow the shared
[release process](../../CONTRIBUTING.md#release-process).

## Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `project:inquirer-gui`.

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md).
