# Example of vscode extension using conditional operator to enable the extension's command

An example demonstrating using VSCode [conditional `in` operator](https://code.visualstudio.com/api/references/when-clause-contexts#in-conditional-operator)
in conjunction with custom contexts created using `@sap/artifact-managment` project type information.

## pre-requisites

- **Nodejs**: An `active` or `maintenance` version.
- **pnpm**: version >= 6.x

## Initial setup

In commandline/shell at the **root** of this monorepo:

1. `pnpm i`.
2. `pnpm compile`.

In "Main" VSCode window:

1. `File` --> `Open Folder...` and select this mono repo's **root**.
2. go to `Run and Debug` tab,
3. select the launch configuration called `Run Toolkit with Artifact-Management Context Menus Example` in the dropdown.
4. click the `Start Debugging` green run icon.

In the newly opened VSCode "Extension Development Host" Window:

1. `File` -> `Open Folder` -> select the `samples/cap-project` folder under the root of this repo.
2. 'Add Folder to Workspace...' -> select the `samples/openui5` folder.
3. Open the output panel: `View` -> `Output`
4. Select `vscode-using-workspace-api` in the dropdown menu.
5. Inspect the printed `@sap/artifact-managment` project type hierarchy.

## Inspecting the context dependent commands

1. Select the `openui5` folder in the workspace explorer and right click on it --> you should see the `Deploy UI5 Application` menu appear in the context menu that opens.
2. Navigate to `openui5` --> `webapp` --> `manifest.json`. Select and right click on it --> this time you should see the two menus `Deploy UI5 Application` and `Edit UI5 Manifest` appears in the context menu that opens.
3. Select the `cap-project` folder in the workspace explorer and right click on it --> you should see the `Preview LCAP Application` menu appear in the context menu that opens.
4. Right click on another file in other project --> the mentioned context menus should not appear.

## Development clues

The solution relies on the ability to dynamically show / hide a menu item according to the current context at runtime. The computed context value is represented as a template: `bas_project_types:<value>`, where the list of valid values as follows:

```javascript
// Entities
"project", "module", "item";

// Components
"ui", "db", "service";

// Project types
("lcap");

// Plugins

// Cap
"cap", "entity", "db", "srv", "app", "workflowTaskEnabled";

// MDK
"mdk",
  "action",
  "application",
  "page",
  "rule",
  "global",
  "i18n",
  "style",
  "image",
  "taskui";

// UI5
("ui5");

// Workflow
("workflow");

// XSUAA
("xsuaa");

// Default
("");
```

The following code snippet shows an actual use case:

https://github.com/SAP/app-studio-toolkit/blob/main/examples/vscode-artifact-management-context-menus/package.json?plain=1#L55
