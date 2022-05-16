import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const LACP_EXTENSION_ID = "SAPSE.lcap-cockpit";

export async function isLCAPEnabled(): Promise<boolean> {
  const logger = getLogger().getChildLogger({ label: "isLCAPEnabled" });

  // LCAP mode is determined by the existence of the LCAP extension
  const isLCAPEnabled = !!extensions.getExtension(LACP_EXTENSION_ID);
  logger.trace("LCAP enabled mode", { isLCAPEnabled });

  return Promise.resolve(isLCAPEnabled);
}
