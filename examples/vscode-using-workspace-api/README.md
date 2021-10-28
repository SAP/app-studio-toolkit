# Example VSCode Extension using workspace instance

An example demonstrating usage of the `@sap/artifact-managment` APIs
exposed via the `App Studio Toolkit` VSCode Ext.

## pre-requisites

- **Nodejs**: An `active` or `maintenance` version.
- **pnpm**: version >= 6.x
- CAP Development Kit `npm install -g @sap/cds-dk` (must be **globally** installed).

## Initial setup

In commandline/shell at the **root** of this monorepo:

1. `pnpm install`.
2. `pnpm compile`.

In "Main" VSCode window:

1. `File` --> `Open Folder...` and select this mono repo's **root**.
2. go to `Run and Debug` tab,
3. select the launch configuration called `run Toolkit using workspace api instance` in the dropdown.
4. click the `Start Debugging` green run icon.

In the newly opened VSCode "Extension Development Host" Window:

1. `File` -> `Open Folder` -> select the `sample-cap-project` folder which is a **sibling** to this README.md
2. Open the output panel: `View` -> `Output`
3. Select `SAP OSS.project_using_workspace_api_instance` in the dropdown menu.
4. Inspect the printed `@sap/artifact-managment` project type hierarchy.
