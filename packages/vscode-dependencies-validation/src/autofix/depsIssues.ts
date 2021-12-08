import type { Uri } from "vscode";
import {
  VscodeFileEventConfig,
  VscodeUriFile,
  VscodeWorkspace,
} from "../vscodeTypes";
import {
  ENABLE_AUTOFIX,
  getAutoFixDelay,
  isAutoFixEnabled,
} from "./configuration";
import { addPackageJsonFileWatcher as addPackageJsonFileWatcher } from "./packageJsonFileWatcher";
import { addUnsupportedFilesWatcher } from "./unsupportedFilesWatcher";
import { findAndFixDepsIssues } from "../util";
import { clearDiagnostics } from "../util";

export function activateDepsIssuesAutoFix(
  vscodeConfig: VscodeFileEventConfig & VscodeUriFile
): void {
  fixWorkspaceDepsIssues(vscodeConfig);
  addPackageJsonFileWatcher(vscodeConfig);
  addUnsupportedFilesWatcher(vscodeConfig);

  onAutoFixChange(vscodeConfig);
}

function fixWorkspaceDepsIssues(vscodeConfig: VscodeFileEventConfig): void {
  setTimeout(() => {
    void doWorkspaceDepsIssuesFix(vscodeConfig);
  }, getAutoFixDelay(vscodeConfig.workspace));
}

function getPackageJsonUris(workspace: VscodeWorkspace): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**​/node_modules/**");
}

function onAutoFixChange(vscodeConfig: VscodeFileEventConfig): void {
  vscodeConfig.workspace.onDidChangeConfiguration((event) => {
    const affected = event.affectsConfiguration(ENABLE_AUTOFIX);
    if (affected) {
      void doWorkspaceDepsIssuesFix(vscodeConfig);
    }
  });
}

async function doWorkspaceDepsIssuesFix(
  vscodeConfig: VscodeFileEventConfig
): Promise<void> {
  const { workspace, diagnosticCollection, outputChannel } = vscodeConfig;
  if (!isAutoFixEnabled(workspace)) return;

  const packageJsonUris = await getPackageJsonUris(workspace);
  // TODO: should we do it in parrallel or sequentially ???
  packageJsonUris.forEach((uri: Uri) => {
    void findAndFixDepsIssues(uri, outputChannel).then(() =>
      clearDiagnostics(diagnosticCollection, uri)
    );
  });
}
