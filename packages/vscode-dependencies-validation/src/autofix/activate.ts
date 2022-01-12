import type { ConfigurationChangeEvent, Uri } from "vscode";
import { IChildLogger } from "@vscode-logging/types";
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
import { findAndFixDepsIssues, clearDiagnostics } from "../util";
import { getLogger } from "../logger/logger";

function logger(): IChildLogger {
  return getLogger().getChildLogger({ label: "activate" });
}

export function activateDepsIssuesAutoFix(
  vscodeConfig: VscodeFileEventConfig & VscodeUriFile
): void {
  fixWorkspaceDepsIssues(vscodeConfig);
  addPackageJsonFileWatcher(vscodeConfig);

  onAutoFixChange(vscodeConfig);
}

function fixWorkspaceDepsIssues(vscodeConfig: VscodeFileEventConfig): void {
  setTimeout(() => {
    void findDepsIssuesFixThemAndCleanProblemsView(vscodeConfig);
  }, getAutoFixDelay(vscodeConfig.workspace));
}

function getPackageJsonUris(workspace: VscodeWorkspace): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**/node_modules/**");
}

function onAutoFixChange(vscodeConfig: VscodeFileEventConfig): void {
  vscodeConfig.workspace.onDidChangeConfiguration(
    handleConfigurationChange(vscodeConfig)
  );
}

function handleConfigurationChange(vscodeConfig: VscodeFileEventConfig): any {
  return (event: ConfigurationChangeEvent) => {
    const affected = event.affectsConfiguration(ENABLE_AUTOFIX);
    logger().trace(`${ENABLE_AUTOFIX} configuration is affected - ${affected}`);
    if (affected) {
      void findDepsIssuesFixThemAndCleanProblemsView(vscodeConfig);
    }
  };
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
