import { VscodeWorkspace } from "../vscodeTypes";

export const ENABLE_AUTOFIX = "dependenciesValidation.enableAutoFix";
const DELAY_AUTOFIX = "dependenciesValidation.delayAutoFix";

export function isAutoFixEnabled(workspace: VscodeWorkspace): boolean {
  return workspace.getConfiguration().get(ENABLE_AUTOFIX, false);
}

export function getAutoFixDelay(workspace: VscodeWorkspace): number {
  return workspace.getConfiguration().get(DELAY_AUTOFIX, 0);
}
