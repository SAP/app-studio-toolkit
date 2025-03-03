# SAP Business Application Studio Toolkit

The SAP Business Application Studio toolkit includes essential capabilities that will improve your SAP Business Application Studio development experience, making it easier and faster.

This toolkit is a prerequisite for other extensions that require its SAP capabilities.

## Telemetry and Data Collection

This extension collects usage data to help improve SAP products and enhance the user experience. The collected data is sent to SAP in accordance with our [Privacy Statement](https://www.sap.com/about/legal/privacy.html).

If you prefer not to share usage data, you can disable telemetry by setting `sapbas.telemetryEnabled` to false in your VS Code settings.

## Project API

Provides the SAP project structure (for example SAP HANA, SAP Fiori, CAP, MDK, etc.), project type, metadata and details. See [Example VSCode Extension using workspace instance](https://github.com/SAP/app-studio-toolkit/blob/main/examples/vscode-using-workspace-api/README.md#example-vscode-extension-using-workspace-instance).
For more information about Project API, see [Artifact Management](https://www.npmjs.com/package/@sap/artifact-management).

## Action Broker Framework

This framework allows you to run commands, tasks, and launch configuration files. The action can be run immediately or according to previously specified times.
For example, see [Action Emitter](https://github.com/SAP/app-studio-toolkit/blob/main/examples/sample-action-client/README.md) and [Scheduled Actions](https://github.com/SAP/app-studio-toolkit/tree/main/examples/scheduled-actions-workspace).

## Authentication to SAP Business Application Studio

This ensures the ability to leverage SAP Business Application Studio resources.
For example, when working remotely using VS Code, it allows you to do the following:

- Add landscapes to your VS Code installation.<br>![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/connect-new-landscape.png?raw=true)
- Log in to a landscape.<br>![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/login-to-bas.png?raw=true)
- Access the dev spaces within the landscapes.<br>![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/access-to-devspaces.png?raw=true)

## Dev Space Manager

Allows you to create, delete, and edit your dev spaces.<br>

![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/browse-bas-landscape.png?raw=true)
