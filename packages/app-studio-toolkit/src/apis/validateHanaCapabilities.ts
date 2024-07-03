import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const HANA_EXTENSION_ID = "sapse.webide-hdi-feature-vscode"; //calculation view extension

// eslint-disable-next-line @typescript-eslint/require-await -- the new implementation does not require await.
export async function hasHanaCapabilities(): Promise<boolean> {
  const logger = getLogger().getChildLogger({ label: "hasHanaCapabilities" });

  // Cap mode is determined by the existence of the Cap extension
  const hasHanaCapabilities = !!extensions.getExtension(HANA_EXTENSION_ID);
  logger.trace("Has Hana Capabilities", { hasHanaCapabilities });

  return hasHanaCapabilities;
}
