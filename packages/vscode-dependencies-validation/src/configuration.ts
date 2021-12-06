import type { WorkspaceConfiguration } from "vscode";

const ENABLE_AUTOMATIC_FIX = "dependenciesValidation.enableAutomaticFix";

const TIMEOUT_ON_ACTIVATE = "dependenciesValidation.timeoutOnActivate";

export function isAutoDepsFixingEnabled(
  wsConfig: WorkspaceConfiguration
): boolean {
  return wsConfig.get(ENABLE_AUTOMATIC_FIX, false);
}

export function getTimeoutOnActivate(wsConfig: WorkspaceConfiguration): number {
  return wsConfig.get(TIMEOUT_ON_ACTIVATE, 0); // default is no timeout
}

export function onUpdate(wsConfig: WorkspaceConfiguration): void {
  wsConfig.inspect(ENABLE_AUTOMATIC_FIX);
}
