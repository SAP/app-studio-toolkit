import { getLogger } from "../logger/logger";
import { optionalRequire } from "../utils/optional-require";

export async function isLCAPEnabled(): Promise<boolean | undefined> {
  const logger = getLogger().getChildLogger({ label: "isLCAPEnabled" });
  const noSapPlugin = "NO_SAP_PLUGIN_FOUND";
  const sapPlugin = optionalRequire<any>("@sap/plugin") ?? noSapPlugin;

  if (sapPlugin === noSapPlugin) {
    logger.trace("Failed to load @sap/plugin, so returning undefined.");
    return;
  }
  logger.trace("@sap/plugin successfully loaded.");

  const isLCAPEnabled = await sapPlugin.window.isLCAPEnabled();
  logger.trace("LCAP enabled successfully received.", { isLCAPEnabled });

  return isLCAPEnabled as boolean | undefined;
}
