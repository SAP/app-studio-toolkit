import type { Uri } from "vscode";
import { isAutoFixEnabled } from "./configuration";
import {
  clearDiagnostics,
  findAndFixDepsIssues,
  isNotInNodeModules,
} from "../util";
import { VscodeFileEventConfig, VscodeWorkspace } from "../vscodeTypes";

export async function handlePackageJsonEvent(
  uri: Uri,
  vscodeConfig: VscodeFileEventConfig
): Promise<void> {
  const { workspace, diagnosticCollection, outputChannel } = vscodeConfig;
  if (canBeFixed(workspace, uri)) {
    await findAndFixDepsIssues(uri, outputChannel);
    clearDiagnostics(diagnosticCollection, uri);
  }
}

function canBeFixed(workspace: VscodeWorkspace, uri: Uri): boolean {
  return isAutoFixEnabled(workspace) && isNotInNodeModules(uri);
}
