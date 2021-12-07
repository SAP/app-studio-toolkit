import type { Uri, WorkspaceConfiguration } from "vscode";
import { dirname, join } from "path";
import {
  yarnManagerFiles,
  pnpmManagerFiles,
  isPathExist,
} from "@sap-devx/npm-dependencies-validation";
import { VscodeWorkspace } from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import { findAndFixDepsIssues, isNotInNodeModules } from "./util";

export function addUnsupportedFilesWatcher(workspace: VscodeWorkspace): void {
  const wsConfig = workspace.getConfiguration();
  const unsupportedFilesPattern = constructUnsupportedFilesPattern();
  const fileWatcher = workspace.createFileSystemWatcher(
    unsupportedFilesPattern
  );

  fileWatcher.onDidCreate((uri: Uri) => onFileSystemEvent(uri, wsConfig));
  fileWatcher.onDidDelete((uri: Uri) => onFileSystemEvent(uri, wsConfig));
}

function onFileSystemEvent(uri: Uri, wsConfig: WorkspaceConfiguration): void {
  const packageJsonPath = getPackageJsonPath(uri.fsPath);
  void shouldFixProject(wsConfig, packageJsonPath).then((shouldFix) => {
    if (shouldFix) return findAndFixDepsIssues(packageJsonPath);
  });
}

function getPackageJsonPath(filePath: string): string {
  return join(dirname(filePath), "package.json");
}

function constructUnsupportedFilesPattern(): string {
  const unsupportedFiles = [...yarnManagerFiles, ...pnpmManagerFiles];
  return `**/{${unsupportedFiles.join(",")}}`;
}

async function shouldFixProject(
  wsConfig: WorkspaceConfiguration,
  packageJsonPath: string
): Promise<boolean> {
  const pathExists = await isPathExist(packageJsonPath);
  if (!pathExists) return false;

  return isAutoFixEnabled(wsConfig) && isNotInNodeModules(packageJsonPath);
}
