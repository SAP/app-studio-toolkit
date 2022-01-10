import type { Uri } from "vscode";
import { debounce } from "lodash";
import { dirname } from "path";
import { isAutoFixEnabled } from "./configuration";
import {
  clearDiagnostics,
  findAndFixDepsIssues,
  isInsideNodeModules,
} from "../util";
import { VscodeFileEventConfig, VscodeWorkspace } from "../vscodeTypes";
import { getLogger } from "../logger/logger";

const logger = getLogger().getChildLogger({ label: "autofix_eventUtils" });

export const debouncedHandleProjectChange = debounce(handleProjectChange, 3000);

// TODO: would this get invoked while package.json is being edited flow?
//   may cause duplicate "npm i"...
//   attempt to filter out events for files which are actively edited?
async function handleProjectChange(
  uri: Uri,
  vscodeConfig: VscodeFileEventConfig
): Promise<void> {
  const { workspace, diagnosticCollection, outputChannel } = vscodeConfig;
  const fixProject = canBeFixed(workspace, uri);

  const projectPath = dirname(uri.fsPath);
  logger.trace(`${projectPath} project can be fixed - ${fixProject}`);

  if (fixProject) {
    await findAndFixDepsIssues(uri, outputChannel);

    logger.trace(`${projectPath} project issues are fixed`);

    clearDiagnostics(diagnosticCollection, uri);

    logger.trace(`${projectPath} project diagnostics are cleared`);
  }
}

function canBeFixed(workspace: VscodeWorkspace, uri: Uri): boolean {
  if (isInsideNodeModules(uri.fsPath)) return false;

  return isAutoFixEnabled(workspace);
}

export const internal = {
  handleProjectChange,
  logger,
};
