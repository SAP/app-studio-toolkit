import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const LCAP_EXTENSION_ID = "saposs.lcap-guided-development-kit";

// eslint-disable-next-line @typescript-eslint/require-await -- the new implementation does not require await.
export async function isLCAPEnabled(): Promise<boolean> {
  return isLCAPEnabledSync();
}

export function isLCAPEnabledSync(): boolean {
  const logger = getLogger().getChildLogger({ label: "isLCAPEnabled" });

  // LCAP mode is determined by the existence of the LCAP extension
  const isLCAPEnabled = !!extensions.getExtension(LCAP_EXTENSION_ID);
  logger.trace("LCAP enabled mode", { isLCAPEnabled });

  return isLCAPEnabled;
}
