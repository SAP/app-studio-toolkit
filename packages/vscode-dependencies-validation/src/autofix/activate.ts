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
    void findDepsIssuesFixThemAndCleanProblemsView(vscodeConfig);
  }, getAutoFixDelay(vscodeConfig.workspace));
}

function getPackageJsonUris(workspace: VscodeWorkspace): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**​/node_modules/**");
}

function onAutoFixChange(vscodeConfig: VscodeFileEventConfig): void {
  vscodeConfig.workspace.onDidChangeConfiguration((event) => {
    const affected = event.affectsConfiguration(ENABLE_AUTOFIX);
    if (affected) {
      void findDepsIssuesFixThemAndCleanProblemsView(vscodeConfig);
    }
  });
}

async function findDepsIssuesFixThemAndCleanProblemsView(
  vscodeConfig: VscodeFileEventConfig
): Promise<void> {
  const { workspace, diagnosticCollection, outputChannel } = vscodeConfig;
  if (!isAutoFixEnabled(workspace)) return;

  const packageJsonUris = await getPackageJsonUris(workspace);

  // works sequentially
  for (const uri of packageJsonUris) {
    await findAndFixDepsIssues(uri, outputChannel);
    clearDiagnostics(diagnosticCollection, uri);
  }
}
