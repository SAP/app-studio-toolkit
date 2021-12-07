import type { Uri } from "vscode";
import { VscodeWorkspace } from "../vscodeTypes";
import { getAutoFixDelay, isAutoFixEnabled } from "./configuration";
import { addProjectsWatcher as addPackageJsonFileWatcher } from "./packageJsonFileWatcher";
import { addUnsupportedFilesWatcher } from "./unsupportedFilesWatcher";
import { findAndFixDepsIssues } from "./util";

export function activateDepsIssuesAutoFix(workspace: VscodeWorkspace): void {
  fixWorkspaceProjects(workspace);
  addPackageJsonFileWatcher(workspace);
  addUnsupportedFilesWatcher(workspace);
}

function fixWorkspaceProjects(workspace: VscodeWorkspace): void {
  const wsConfig = workspace.getConfiguration();
  setTimeout(() => {
    if (isAutoFixEnabled(wsConfig)) {
      void executeWorkspaceDepsFixing(workspace);
    }
  }, getAutoFixDelay(wsConfig));
}

function getPackageJsonUris(workspace: VscodeWorkspace): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**​/node_modules/**");
}

async function executeWorkspaceDepsFixing(
  workspace: VscodeWorkspace
): Promise<void> {
  const packageJsonUris = await getPackageJsonUris(workspace);
  packageJsonUris.forEach(({ fsPath }) => {
    void findAndFixDepsIssues(fsPath);
  });
}
