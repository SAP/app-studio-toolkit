[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

## Description

The **VS Code Multi-Target Application (MTA) tools** extension is a VS Code extension for development of multi-target applications.
It can be used to build multitarget applications using the [Cloud MTA Build Tool](https://github.com/SAP/cloud-mta-build-tool), to deploy the build result to Cloud Foundry and to create MTA module from template.
The extension is being developed and currently contains limited features.

### Requirements

Make sure that you are familiar with the multi-target application concept and terminology. For background and detailed information, see [Multi-Target Application Model](https://www.sap.com/documents/2016/06/e2f618e4-757c-0010-82c7-eda71af511fa.html).

Make sure the following tools are installed in your environment:

- `GNU Make 4.2.1` or later to build MTA project.
- [Cloud MTA Build Tool](https://github.com/SAP/cloud-mta-build-tool) to build MTA project.
- [Cloud Foundry CLI](https://github.com/cloudfoundry/cli) to work with Cloud Foundry.
- [MultiApps CF CLI Plugin](https://github.com/cloudfoundry-incubator/multiapps-cli-plugin) to deploy MTA archive to Cloud Foundry.
- [MTA tool](https://github.com/SAP/cloud-mta) to add MTA modules.
- [Yeoman-ui extension](https://github.com/SAP/app-studio-toolkit) to add MTA modules.

### Support

Please report issues [here](https://github.com/SAP/app-studio-toolkit/issues/new/choose) and label them with `vscode-mta-tools`.

### Contributing

Contributions are greatly appreciated.
See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md) for details.

## Licensing

Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available via the [REUSE tool](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit).
