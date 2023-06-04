import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const CAP_EXTENSION_ID = "SAPSE.vscode-cds";

// eslint-disable-next-line @typescript-eslint/require-await -- the new implementation does not require await.
export async function hasCapCapabilities(): Promise<boolean> {
  const logger = getLogger().getChildLogger({ label: "hasCapCapabilities" });

  // Cap mode is determined by the existence of the Fiori extension
  const hasFioriCapabilities = !!extensions.getExtension(CAP_EXTENSION_ID);
  logger.trace("Has Cap Capabilities", { hasFioriCapabilities });

  return hasFioriCapabilities;
}
