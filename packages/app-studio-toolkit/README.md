# SAP Business Application Studio Toolkit

The SAP Business Application Studio toolkit includes essential capabilities that will improve your SAP Business Application Studio development experience, making it easier and faster.

This toolkit is a prerequisite for other extensions that require its SAP capabilities.

## Project API

Provides the SAP project structure (for example SAP HANA, SAP Fiori, CAP, MDK, etc.), project type, metadata and details. See [Example VSCode Extension using workspace instance](https://github.com/SAP/app-studio-toolkit/blob/main/examples/vscode-using-workspace-api/README.md#example-vscode-extension-using-workspace-instance).
For more information about Project API, see [Artifact Management](https://www.npmjs.com/package/@sap/artifact-management).

## Action Broker Framework

This framework allows you to run commands, tasks, and launch configuration files. The action can be run immediately or according to previously specified times.
For example, see [Action Emitter](https://github.com/SAP/app-studio-toolkit/blob/main/examples/sample-action-client/README.md) and [Scheduled Actions](https://github.com/SAP/app-studio-toolkit/tree/main/examples/scheduled-actions-workspace).

## Remote Connect

Remotely connect to SAP Business Application Studio dev spaces directly from a local Visual Studio Code desktop application. See [Access SAP Business Application Studio from VS Code](https://help.sap.com/docs/bas/sap-business-application-studio/working-remotely).
![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/remote-con.png?raw=true)

## Authentication to SAP Business Application Studio

This ensures the ability to leverage SAP Business Application Studio resources.
For example, when working remotely using VS Code, it allows you to do the following:

- Add landscapes to your VS Code installation.
  ![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/connect-new-landscape.png?raw=true)
- Log in to a landscape
  ![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/login-to-bas.png?raw=true)
- Access the dev spaces within the landscapes.
  ![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/access-to-devspaces.png?raw=true)

## Dev Space Manager

Allows you to create, delete, and edit your dev spaces.

![](https://github.com/SAP/app-studio-toolkit/blob/main/packages/app-studio-toolkit/assets/browse-bas-landscape.png?raw=true)
