# Cloud Foundry Tools

This project, migrated from [SAP/cloud-foundry-tools](https://github.com/SAP/cloud-foundry-tools), contains the VS Code extension that provides tools for easy application development with Cloud Foundry (login, create service, bind service, unbind service, and more) in [SAP Business Application Studio][sap bas] and [VS Code][vscode].

## Packages

- [packages/backend](./packages/backend) — `vscode-cf-tools`: The Cloud Foundry Tools VS Code extension (VSIX).
- [packages/frontend](./packages/frontend) — `cloud-foundry-tools-frontend`: Vue 3 frontend bundled into the extension.
- [packages/wrapper](./packages/wrapper) — `vscode-wing-cf-tools`: Deprecated wrapper extension kept for backward compatibility; redirects users to `vscode-cf-tools`.

## Support

Open an [issue](https://github.com/SAP/app-studio-toolkit/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).

[sap bas]: https://help.sap.com/viewer/product/SAP%20Business%20Application%20Studio/Cloud/en-US
[vscode]: https://code.visualstudio.com/
