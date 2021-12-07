import type { DiagnosticCollection, Uri } from "vscode";
import { VscodeConfig, VscodeUriFile, VscodeWorkspace } from "../vscodeTypes";
import { getAutoFixDelay, isAutoFixEnabled } from "./configuration";
import { addProjectsWatcher as addPackageJsonFileWatcher } from "./packageJsonFileWatcher";
import { addUnsupportedFilesWatcher } from "./unsupportedFilesWatcher";
import { findAndFixDepsIssues } from "./fixUtil";
import { clearDiagnostics } from "../util";

export function activateDepsIssuesAutoFix(vscodeConfig: VscodeConfig): void {
  const { workspace, createUri, diagnosticCollection } = vscodeConfig;
  fixWorkspaceDepsIssues(workspace, diagnosticCollection, createUri);
  addPackageJsonFileWatcher(workspace, diagnosticCollection, createUri);
  addUnsupportedFilesWatcher(workspace, diagnosticCollection, createUri);
}

function fixWorkspaceDepsIssues(
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): void {
  setTimeout(() => {
    if (isAutoFixEnabled(workspace)) {
      void doWorkspaceDepsFixing(workspace, diagnosticCollection, createUri);
    }
  }, getAutoFixDelay(workspace));
}

function getPackageJsonUris(workspace: VscodeWorkspace): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**​/node_modules/**");
}

async function doWorkspaceDepsFixing(
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): Promise<void> {
  const packageJsonUris = await getPackageJsonUris(workspace);
  packageJsonUris.forEach((uri: Uri) => {
    const { fsPath } = uri;
    void findAndFixDepsIssues(fsPath).then(() =>
      clearDiagnostics(diagnosticCollection, fsPath, createUri)
    );
  });
}
