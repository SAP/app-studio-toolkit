import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const FIORI_EXTENSION_ID = "SAPSE.sap-ux-application-modeler-extension";

// eslint-disable-next-line @typescript-eslint/require-await -- the new implementation does not require await.
export async function hasFioriCapabilities(): Promise<boolean> {
  const logger = getLogger().getChildLogger({ label: "hasFioriCapabilities" });

  // Fiori mode is determined by the existence of the Fiori extension
  const hasFioriCapabilities = !!extensions.getExtension(FIORI_EXTENSION_ID);
  logger.trace("Has Fiori Capabilities", { hasFioriCapabilities });

  return hasFioriCapabilities;
}
