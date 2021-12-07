import type { WorkspaceConfiguration } from "vscode";
import { VscodeWorkspace } from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import {
  debouncedFindAndFixDepsIssues,
  findAndFixDepsIssues,
  isNotInNodeModules,
} from "./util";

// TODO: need to add file watcher for unsupported package manager files and properties
// TODO: somebody added yarl.lock in filesystem (not via vscode) ??
// TODO: what should happen after git clone ??
export function addProjectsWatcher(workspace: VscodeWorkspace): void {
  const wsConfig = workspace.getConfiguration();

  const fileWatcher = workspace.createFileSystemWatcher("**/package.json"); // TODO: PACKAGE_JSON_PATTERN does not work here ???
  fileWatcher.onDidChange(({ fsPath }) => {
    if (shouldFixProject(wsConfig, fsPath)) {
      void debouncedFindAndFixDepsIssues(fsPath);
    }
  });

  fileWatcher.onDidCreate(({ fsPath }) => {
    if (shouldFixProject(wsConfig, fsPath)) {
      void findAndFixDepsIssues(fsPath);
    }
  });

  fileWatcher.onDidDelete(({ fsPath }) => {
    //TODO: check if we need it ??
    if (shouldFixProject(wsConfig, fsPath)) {
      void findAndFixDepsIssues(fsPath);
    }
  });
}

function shouldFixProject(
  wsConfig: WorkspaceConfiguration,
  packageJsonPath: string
): boolean {
  return isAutoFixEnabled(wsConfig) && isNotInNodeModules(packageJsonPath);
}
