import { VscodeWorkspace } from "../vscodeTypes";

export const ENABLE_AUTOFIX = "dependenciesValidation.enableAutoFix";
const DELAY_AUTOFIX = "dependenciesValidation.delayAutoFix";

export function isAutoFixEnabled(workspace: VscodeWorkspace): boolean {
  const wsConfig = workspace.getConfiguration();
  return wsConfig.get(ENABLE_AUTOFIX, false);
}

export function getAutoFixDelay(workspace: VscodeWorkspace): number {
  const wsConfig = workspace.getConfiguration();
  return wsConfig.get(DELAY_AUTOFIX, 0);
}

export const internal = {
  DELAY_AUTOFIX,
};
