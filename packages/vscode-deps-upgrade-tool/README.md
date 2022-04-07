# NPM Dependency Upgrade Tool

This VS Code extension applies changes to a `package.json` file's dependencies and devDependencies sections.
The changes to be applied are defined by metadata provided by **other** VSCode extensions in the
`BASContributes.upgrade.nodejs` section of their `package.json`, for example:

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

For full API Documentation for the `NodeUpgradeSpec` structure see:
[@sap-devx/app-studio-toolkit-types](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit-types/api.d.ts).

For an example of contributing upgrade metadata see the
[vscode-using-upgrade-tool](https://github.com/SAP/app-studio-toolkit/tree/main/examples/vscode-using-upgrade-tool) example.

## Features

### "Manual" Mode

Not yet implemented.

### "Automatic" Mode

Will scan and apply changes to all **relevant** `package.json` files in the workspace.
According to the metadata provided by **other** extensions available in the workspace.

This flow is meant for **citizen developers** in **Low-Code** scenarios as:

- The changes are applied **automatically** without user interaction.
- The changes are applied on all `package.json` in the project, which means there is a hidden assumption
  that the **contributed** upgrades metadata matches the projects in the workspace. In other words
  that the development scenario is **limited** and it's domain **known in advance**.

## Known Limitations

### General:

- The Upgrade Tool **only** modifies the `package.json` a different tool ([NPM Dependencies Validation](https://github.com/SAP/app-studio-toolkit/tree/main/packages/vscode-dependencies-validation))
  is responsible for automatically invoking an `npm install` command to apply the changes to the `node_modules` folder.
- The Upgrade Tool is only trigger **once** on workspace initialization.

## Installation

### From the VS Code Marketplace

This extension is not currently available on the VS Code marketplace.

### From GitHub Releases

1. Go to [GitHub Releases](https://github.com/sap/app-studio-toolkit/releases).
2. Search for the `vscode-deps-upgrade-tool-x.y.z.vsix`
   archive under the latest release that contains it.
   - Replace `x.y.z` with the desired version number.
3. Follow the instructions for installing an extension from a `.vsix`
   file in the [VS Code user guide](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

## Extension Settings

TODO: update settings details

The following settings are supported:

- `dependencyUpgrade.enabled`: Enables the automatic dependency updates (`false` by default).
- `dependencyUpgrade.delay.min`: Minimum time to wait after workspace start before pending dependency upgrades would be applied (`5` by default).
- `dependencyUpgrade.delay.max` : Maximum time to wait after workspace start before pending dependency upgrades would be applied (`15` by default).

## Support

Please open [issues](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
