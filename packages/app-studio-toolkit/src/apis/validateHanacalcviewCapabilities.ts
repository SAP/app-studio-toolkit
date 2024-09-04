import { getLogger } from "@sap/artifact-management";
import { extensions } from "vscode";

export const HANA_CALC_VIEW_EXTENSION_ID = "sapse.webide-hdi-feature-vscode"; //calculation view extension

// eslint-disable-next-line @typescript-eslint/require-await -- the new implementation does not require await.
export async function hasHanacalcviewCapabilities(): Promise<boolean> {
  const logger = getLogger().getChildLogger({
    label: "hasHanacalcviewCapabilities",
  });

  // Cap mode is determined by the existence of the Cap extension
  const hasHanacalcviewCapabilities = !!extensions.getExtension(
    HANA_CALC_VIEW_EXTENSION_ID
  );
  logger.trace("Has Hana Capabilities", { hasHanacalcviewCapabilities });

  return hasHanacalcviewCapabilities;
}
