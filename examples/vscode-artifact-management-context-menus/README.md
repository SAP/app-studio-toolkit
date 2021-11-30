# Example VSCode Extension using workspace instance

An example demonstrating using VSCode [conditional `in` operator](https://code.visualstudio.com/api/references/when-clause-contexts#in-conditional-operator)
in conjunction with custom contexts created using `@sap/artifact-managment` project type information.

TODO: finish description

## pre-requisites

- **Nodejs**: An `active` or `maintenance` version.
- **Yarn**: version 1.x
- CAP Development Kit `npm install -g @sap/cds-dk` (must be **globally** installed).

## Initial setup

In commandline/shell at the **root** of this monorepo:

1. `yarn`.
2. `yarn compile`.

In "Main" VSCode window:

1. `File` --> `Open Folder...` and select this mono repo's **root**.
2. go to `Run and Debug` tab,
3. select the launch configuration called `Run Toolkit with Project Type Context Menus Example` in the dropdown.
4. click the `Start Debugging` green run icon.

In the newly opened VSCode "Extension Development Host" Window:

1. `File` -> `Open Folder` -> select the `samples/cap-project` folder under the root of this repo.
2. Open the output panel: `View` -> `Output`
3. Select `SAP OSS.project_using_workspace_api_instance` in the dropdown menu.
4. Inspect the printed `@sap/artifact-managment` project type hierarchy.
