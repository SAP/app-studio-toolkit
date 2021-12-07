import type { DiagnosticCollection, Uri } from "vscode";
import {
  VscodeDepsIssuesConfig,
  VscodeOutputChannel,
  VscodeUriFile,
  VscodeWorkspace,
} from "../vscodeTypes";
import { getAutoFixDelay, isAutoFixEnabled } from "./configuration";
import { addProjectsWatcher as addPackageJsonFileWatcher } from "./packageJsonFileWatcher";
import { addUnsupportedFilesWatcher } from "./unsupportedFilesWatcher";
import { findAndFixDepsIssues } from "./fixUtil";
import { clearDiagnostics } from "../util";

export function activateDepsIssuesAutoFix(
  vscodeConfig: VscodeDepsIssuesConfig
): void {
  fixWorkspaceDepsIssues(vscodeConfig);
  addPackageJsonFileWatcher(vscodeConfig);
  addUnsupportedFilesWatcher(vscodeConfig);
}

// TODO: run fixing on config update

function fixWorkspaceDepsIssues(vscodeConfig: VscodeDepsIssuesConfig): void {
  const { workspace, createUri, diagnosticCollection, outputChannel } =
    vscodeConfig;

  setTimeout(() => {
    if (isAutoFixEnabled(workspace)) {
      void doWorkspaceDepsFixing(
        workspace,
        diagnosticCollection,
        createUri,
        outputChannel
      );
    }
  }, getAutoFixDelay(workspace));
}

function getPackageJsonUris(workspace: VscodeWorkspace): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**​/node_modules/**");
}

async function doWorkspaceDepsFixing(
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const packageJsonUris = await getPackageJsonUris(workspace);
  // TODO: should we do it in parrallel or sequentially ???
  packageJsonUris.forEach((uri: Uri) => {
    const { fsPath } = uri;
    void findAndFixDepsIssues(fsPath, outputChannel).then(() =>
      clearDiagnostics(diagnosticCollection, fsPath, createUri)
    );
  });
}
