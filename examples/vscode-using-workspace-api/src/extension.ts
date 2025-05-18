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

  // delay the benchmark to allow vscode to finish loading and
  // have more consistent results
  const initalDelay = 1000 * 10; // 10 seconds
  setTimeout(async () => {
    const projects: sam.ProjectApi[] = await workspaceAPI.getProjects();
    outputChannel.appendLine(
      `found <${projects.length}> projects in the workspace`
    );
    const start = new Date();
    for (const project of projects) {
      // The API's list:
      // getProjectInfo()
      // readDetailItems()
      const projectInfo = await project.getProjectInfo();
      const projectDetailed = await project.readDetailItems();
      const x = 5;
    }
    const end = new Date();
    const total = end.getTime() - start.getTime();
    outputChannel.appendLine(
      `Time taken to read all project details: ${total}ms`
    );
  }, initalDelay);


}

module.exports = {
  activate,
};
