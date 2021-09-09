import { ExtensionContext, extensions, window } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";

async function activate(context: ExtensionContext): Promise<void> {
  // Access the BAS Toolkit apis via vscode's `getExtension`
  const basToolkitAPI: BasToolkit = extensions.getExtension(
    "SAPOSS.app-studio-toolkit"
  )?.exports;

  const workspaceAPI = basToolkitAPI.workspaceAPI;
  const outputChannel = window.createOutputChannel(context.extension.id);
  // TODO1: add README.
  // TODO2: Add sample project with meaningful results
  const rootProjectApi = await workspaceAPI.getProjects();
  const rootProjectDs = await rootProjectApi[0].readItems();
  const rootProjectText = JSON.stringify(rootProjectDs, null, "\t");
  outputChannel.appendLine(rootProjectText);
}

module.exports = {
  activate,
};
