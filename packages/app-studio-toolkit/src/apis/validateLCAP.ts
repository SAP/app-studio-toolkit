import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const LACP_EXTENSION_ID = "SAPSE.lcap-cockpit";

// eslint-disable-next-line @typescript-eslint/require-await -- the new implementation does not require await.
export async function isLCAPEnabled(): Promise<boolean> {
  return isLCAPEnabledSync();
}

export function isLCAPEnabledSync(): boolean {
  const logger = getLogger().getChildLogger({ label: "isLCAPEnabled" });

  // LCAP mode is determined by the existence of the LCAP extension
  const isLCAPEnabled = !!extensions.getExtension(LACP_EXTENSION_ID);
  logger.trace("LCAP enabled mode", { isLCAPEnabled });

  return isLCAPEnabled;
}
