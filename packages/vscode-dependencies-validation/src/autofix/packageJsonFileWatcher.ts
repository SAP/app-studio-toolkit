import type { Uri, WorkspaceConfiguration } from "vscode";
import { VscodeWorkspace } from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import {
  debouncedFindAndFixDepsIssues,
  findAndFixDepsIssues,
  isNotInNodeModules,
} from "./util";

// TODO: what should happen after git clone ??
export function addProjectsWatcher(workspace: VscodeWorkspace): void {
  const wsConfig = workspace.getConfiguration();

  const fileWatcher = workspace.createFileSystemWatcher("**/{package.json}"); // TODO: PACKAGE_JSON_PATTERN does not work here ???

  fileWatcher.onDidChange((uri: Uri) =>
    onPackageJsonChangeEvent(uri, wsConfig)
  );
  fileWatcher.onDidCreate((uri: Uri) =>
    onPackageJsonCreateEvent(uri, wsConfig)
  );
}

function onPackageJsonChangeEvent(
  uri: Uri,
  wsConfig: WorkspaceConfiguration
): void {
  const { fsPath } = uri;
  if (shouldFixProject(wsConfig, fsPath)) {
    void debouncedFindAndFixDepsIssues(fsPath);
  }
}

function onPackageJsonCreateEvent(
  uri: Uri,
  wsConfig: WorkspaceConfiguration
): void {
  const { fsPath } = uri;
  if (shouldFixProject(wsConfig, fsPath)) {
    void findAndFixDepsIssues(fsPath);
  }
}

function shouldFixProject(
  wsConfig: WorkspaceConfiguration,
  packageJsonPath: string
): boolean {
  return isAutoFixEnabled(wsConfig) && isNotInNodeModules(packageJsonPath);
}
