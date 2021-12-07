import type { DiagnosticCollection, Uri } from "vscode";
import { dirname, join } from "path";
import {
  yarnManagerFiles,
  pnpmManagerFiles,
  isPathExist,
} from "@sap-devx/npm-dependencies-validation";
import { VscodeUriFile, VscodeWorkspace } from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import { findAndFixDepsIssues } from "./fixUtil";
import { clearDiagnostics, isNotInNodeModules } from "../util";

export function addUnsupportedFilesWatcher(
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): void {
  const unsupportedFilesPattern = constructUnsupportedFilesPattern();
  const fileWatcher = workspace.createFileSystemWatcher(
    unsupportedFilesPattern
  );

  fileWatcher.onDidCreate((uri: Uri) =>
    onFileSystemEvent(uri, workspace, diagnosticCollection, createUri)
  );
  fileWatcher.onDidDelete((uri: Uri) =>
    onFileSystemEvent(uri, workspace, diagnosticCollection, createUri)
  );
}

function onFileSystemEvent(
  uri: Uri,
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): void {
  const packageJsonPath = getPackageJsonPath(uri.fsPath);
  void shouldFixProject(workspace, packageJsonPath).then(async (shouldFix) => {
    if (shouldFix) {
      await findAndFixDepsIssues(packageJsonPath);
      clearDiagnostics(diagnosticCollection, packageJsonPath, createUri);
    }
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
  workspace: VscodeWorkspace,
  packageJsonPath: string
): Promise<boolean> {
  const pathExists = await isPathExist(packageJsonPath);
  if (!pathExists) return false;

  return isAutoFixEnabled(workspace) && isNotInNodeModules(packageJsonPath);
}
