# NPM Dependencies Validation

This VS Code extension detects mis-alignment between the `package.json` "dependencies" / "devDependencies"
sections and the actual contents of the `node_modules` folder.

## Preview

![](https://raw.githubusercontent.com/SAP/app-studio-toolkit/main/packages/vscode-dependencies-validation/resources/example-manual-mode.png)

## Features

### "Manual" Mode

For **currently** opened `package.json` files in the editor:

1. Problems view: shows an error for a **missing** (direct) dependency.
2. Problems view: shows an error for a **mismatch** between the declared (direct) dependency range
   and the actual version found in `node_modules`
3. Suggest a "quick-fix" that would invoke `npm install` to resolve detected errors.
4. Displays the output of the `npm install` "quick-fix" process in a "focused" output channel.

### "Automatic" Mode

In "automatic" mode:

- The `npm install` command will be auto-magically invoked **without** user interaction.
  - For all **relevant** `package.json` files in the workspace, not limited to those opened in the editor.
- The output channel which displays the `npm install` terminal output will **not** be focused / brought to front.

This mode is meant to service "Low Code" users who prefer a **transparent** flow for resolving dependencies issues.

## Known Limitations

### General:

- `node_modules` folder changes are not tracked, for example `rm -rf node_modules`
  will **not** trigger the dependencies validations.
- Only **direct** dependencies are checked, not transitive ones.
- This extension (currently) only handles npm dependencies issues:
  - No support for other npm clients, e.g: yarn / pnpm.
  - No Support for mono-repos with node projects hierarchy.

### Automatic Mode:

- No handling of the generated `package-lock` file.
  This means it is the end user's responsibility to commit the updated `package-lock` file to the source control.
- No (clear) indication to the end user if the `npm install` process failed as the relevant output channel is not "in focus".
- Potential unexpected results / behavior due to running `npm install` on the same folder in multiple different processes, e.g:
  1. An end user does a `git clone foo` and manually runs `npm i`,
     at the same time as this extension's "automatic mode" is triggered.
  2. An end user uses a Yeoman generator which also triggers an `npm i` at the end of the generation,
     at the same time as this extension's "automatic mode" is triggered.

## Installation

### From the VS Code Marketplace

This extension is not currently available on the VS Code marketplace.

### From GitHub Releases

1. Go to [GitHub Releases](https://github.com/sap/app-studio-toolkit/releases).
2. Search for the `vscode-dependencies-validation-x.y.z.vsix ` archive under the latest release which contains it.
   - (Replace `x.y.z` with the desired version number.)
3. Follow the instructions for installing an extension from a `.vsix` file in the [VSCode's guide](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

## Extension Settings

The following settings are supported:

- `dependenciesValidation.enableAutoFix`: Enables the **automatic** fixing of dependency misalignment (false by default).
- `dependenciesValidation.delayAutoFix`: Delay (in seconds) for the automatic fixing of dependency misalignment on startup.

## Support

Please open [issues](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
