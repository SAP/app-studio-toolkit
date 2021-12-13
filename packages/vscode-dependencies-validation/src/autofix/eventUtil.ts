import type { Uri } from "vscode";
import { debounce } from "lodash";
import { isAutoFixEnabled } from "./configuration";
import {
  clearDiagnostics,
  findAndFixDepsIssues,
  isInsideNodeModules,
} from "../util";
import { VscodeFileEventConfig, VscodeWorkspace } from "../vscodeTypes";

export const debouncedHandleProjectChange = debounce(handleProjectChange, 3000);

async function handleProjectChange(
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
  if (isInsideNodeModules(uri.fsPath)) return false;

  return isAutoFixEnabled(workspace);
}

export const internal = {
  handleProjectChange,
};
