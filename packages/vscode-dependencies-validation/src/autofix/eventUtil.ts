import type { Uri } from "vscode";
import { debounce } from "lodash";
import { dirname } from "path";
import { IChildLogger } from "@vscode-logging/types";
import { isAutoFixEnabled } from "./configuration";
import {
  clearDiagnostics,
  findAndFixDepsIssues,
  isInsideNodeModules,
} from "../util";
import { VscodeFileEventConfig, VscodeWorkspace } from "../vscodeTypes";
import { getLogger } from "../logger/logger";

function logger(): IChildLogger {
  return getLogger().getChildLogger({ label: "autofix_eventUtils" });
}

// TODO: discuss: rename to debouncedHandlePkgJsonAutoFix?
//       or `optimizedXYZ` because debounce is just one way to effectively handle rapid events
export const debouncedHandleProjectChange = debounce(handleProjectChange, 3000);

// TODO: discuss: rename to handlePkgJsonAutoFix? because it seems specific to auto-fix
async function handleProjectChange(
  uri: Uri,
  vscodeConfig: VscodeFileEventConfig
): Promise<void> {
  const { workspace, diagnosticCollection, outputChannel } = vscodeConfig;
  if (!isAutoFixEnabled(workspace)) {
    return;
  }
  const fixProject = canBeFixed(workspace, uri);

  const projectPath = dirname(uri.fsPath);
  logger().trace(`${projectPath} project can be fixed - ${fixProject}`);

  if (fixProject) {
    await findAndFixDepsIssues(uri, outputChannel);

    logger().trace(`${projectPath} project issues are fixed`);

    clearDiagnostics(diagnosticCollection, uri);

    logger().trace(`${projectPath} project diagnostics are cleared`);
  }
}

function canBeFixed(workspace: VscodeWorkspace, uri: Uri): boolean {
  if (isInsideNodeModules(uri.fsPath)) return false;
  // TODO: to discuss: should we ensure this is a package.json file?
  return true;
}

export const internal = {
  handleProjectChange,
};
