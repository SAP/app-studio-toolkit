import { extensions, window } from "vscode";
import { BasToolkit, sam } from "@sap-devx/app-studio-toolkit-types";

async function activate(): Promise<void> {
  // Access the BAS Toolkit apis via vscode's `getExtension`
  const basToolkitAPI: BasToolkit = extensions.getExtension(
    "SAPOSS.app-studio-toolkit"
  )?.exports;

  const workspaceAPI = basToolkitAPI.workspaceAPI;
  // `context.extension.id` does not seem to work on Theia
  const outputChannel = window.createOutputChannel(
    "vscode-using-workspace-api"
  );

  // note the usage of the `sam` "types namespace"
  const projects: sam.ProjectApi[] = await workspaceAPI.getProjects();

  if (projects.length > 0) {
    // naively only print the **first** project found...
    const rootProjectDs = await projects[0].readItems();
    const rootProjectText = JSON.stringify(rootProjectDs, null, "\t");
    outputChannel.appendLine("Found `@sap/artifact-manager` Project:");
    outputChannel.appendLine(rootProjectText);
  } else {
    outputChannel.appendLine(
      "No `@sap/artifact-manager` Projects found in the workspace"
    );
  }
}

module.exports = {
  activate,
};
