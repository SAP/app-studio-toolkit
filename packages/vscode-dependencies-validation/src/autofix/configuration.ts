import type { WorkspaceConfiguration } from "vscode";

const ENABLE_AUTOFIX = "dependenciesValidation.enableAutoFix";
const DELAY_AUTOFIX = "dependenciesValidation.delayAutoFix";

export function isAutoFixEnabled(wsConfig: WorkspaceConfiguration): boolean {
  return wsConfig.get(ENABLE_AUTOFIX, false);
}

export function getAutoFixDelay(wsConfig: WorkspaceConfiguration): number {
  return wsConfig.get(DELAY_AUTOFIX, 0);
}
