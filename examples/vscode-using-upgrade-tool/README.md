# Example VSCode Using Upgrade Tool

This VSCode Extension and resources demonstrate:

- Configuring the NPM Dependency Upgrade Tool.
- The upgrade Tool in action updating a `package.json` file.
- The mis-alignment Tool, aligning the `node_module` contents with the new `package.json` contents

## Configuration

This is accomplished via the `BASContributes.upgrade.nodejs` property in the extension's [`package.json`](./package.json)

```json5
{
  // ... other VSCode/Npm  package.json properties
  BASContributes: {
    upgrade: {
      nodejs: [
        {
          package: "@ui5/cli",
          version: {
            from: "^1.12.0",
            to: "^2.11",
          },
        },
        {
          package: "eslint",
          version: {
            from: "^7.0.0",
            to: "^8.11.0",
          },
        },
      ],
    },
  },
}
```

## pre-requisites

- **Nodejs**: An `active` or `maintenance` version.
- **pnpm**: version >= 6.x

## Initial setup (once)

In commandline/shell at the **root** of this monorepo:

1. `pnpm install`.
2. `pnpm compile`.

## Example Flow

This flow will automatically modify a pair of dependencies in a `package.json` and then automatically
trigger "npm install" to "apply" the changes to the `node_modules` folder.

1. Open the **root** of this monorepo in VSCode.
2. In "Run and Debug" panel choose "Run upgrade scenario sample".
3. In the new VSCode "Extension Development Host" window choose `File -> Open Folder...`.
4. Choose the [sample-openui5-package folder](./sample-openui5-package).
5. Open (double click) the [package.json](./sample-openui5-package/package.json) file.
6. Wait ~12 seconds and note how the `@ui5/cli` and the `eslint` versions in the `devDependencies`.
   are updated according to the metadata defined in this extension's `package.json`.
7. Also note that an `output channel` is automatically brought into focus where an `npm install` process output is displayed.
   This is because the `NPM Dependencies Validation` VSCode extension is also enabled in this launch configuration
   and automatically handles mis-alignments between a `package.json` and the installed modules in `node_modules` folder.

## Additional Resources

- [NPM Dependency Upgrade Tool](../../packages/vscode-deps-upgrade-tool/README.md)
- [NPM Dependencies Validation Tool](../../packages/vscode-dependencies-validation/README.md)
