# NPM Dependencies Validation

This VS Code extension detects misalignment between the `dependencies` properties
in the `package.json` and the actual contents of the `node_modules` folder.

## Preview

![](https://raw.githubusercontent.com/SAP/app-studio-toolkit/main/packages/vscode-dependencies-validation/resources/example-manual-mode.png)

## Features

### "Manual" Mode

For **currently** opened `package.json` files in the editor:

1. The Problems View shows an error if there is a **missing** (direct) dependency
   or a **mismatch** between the declared (direct) dependency range
   and the actual version found in `node_modules`.
2. A "quick-fix" suggestion appears that would invoke an `npm install` to resolve the detected errors.
3. The output of the `npm install` "quick-fix" process is displayed in a "focused" output channel.

### "Automatic" Mode

For all **relevant** `package.json` files in the workspace, not limited to those opened in the editor:

1. The `npm install` command is automatically invoked **without** user interaction.
2. The output channel which displays the `npm install` terminal output will **not** be focused/brought to front.

This mode is meant to be used by "Low Code" users who prefer a **transparent** flow for resolving dependency issues.

## Known Limitations

### General:

- The `node_modules` folder changes are not tracked.
  For example, `rm -rf node_modules` will **not** trigger the dependency validations.
- Only **direct** dependencies are checked, not transitive ones.
- This extension (currently) only handles `npm` dependency issues:
  - No support for other `npm` clients, such as `yarn` or `pnpm`.
  - No Support for mono-repos with sub packages.

### Automatic Mode:

- No handling of the generated `package-lock` file.
  This means it is the end user's responsibility to commit the updated `package-lock` file to the source control.
- No (clear) indication to the end user if the `npm install` process failed
  as the relevant output channel is not "in focus".
- Potential unexpected results/behavior due to running `npm install`
  on the same folder in multiple processes, e.g.:
  1. An end user does a `git clone foo` and manually runs `npm i`
     at the same time as this extension's "automatic mode" is triggered.
  2. An end user uses a Yeoman generator which also triggers an `npm i`
     at the end of the generation at the same time as this extension's "automatic mode" is triggered.

## Installation

### From the VS Code Marketplace

This extension is not currently available on the VS Code marketplace.

### From GitHub Releases

1. Go to [GitHub Releases](https://github.com/sap/app-studio-toolkit/releases).
2. Search for the `vscode-dependencies-validation-x.y.z.vsix`
   archive under the latest release that contains it.
   - Replace `x.y.z` with the desired version number.
3. Follow the instructions for installing an extension from a `.vsix`
   file in the [VS Code user guide](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

## Extension Settings

The following settings are supported:

- `dependenciesValidation.enableAutoFix`: Enables the **automatic** fixing of dependency misalignment (false by default).
- `dependenciesValidation.delayAutoFix`: Causes a delay (in seconds) for the automatic fixing of dependency misalignment on startup.

## Support

Please open [issues](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
