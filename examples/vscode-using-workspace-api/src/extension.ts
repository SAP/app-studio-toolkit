import { ExtensionContext, extensions, window } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";

async function activate(context: ExtensionContext): Promise<void> {
  // Access the BAS Toolkit apis via vscode's `getExtension`
  const basToolkitAPI: BasToolkit = extensions.getExtension(
    "SAPOSS.app-studio-toolkit"
  )?.exports;

  const workspaceAPI = basToolkitAPI.workspaceAPI;
  const outputChannel = window.createOutputChannel(context.extension.id);
  const projects = await workspaceAPI.getProjects();
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
