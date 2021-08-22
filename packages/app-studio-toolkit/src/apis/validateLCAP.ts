import { getLogger } from "../logger/logger";

export async function isLCAPEnabled(): Promise<boolean | undefined> {
  const logger = getLogger().getChildLogger({ label: "isLCAPEnabled" });
  const optionalRequire = require("optional-require")(require);
  const noSapPlugin = "NO_SAP_PLUGIN_FOUND";
  const sapPlugin = optionalRequire("@sap/plugin") ?? noSapPlugin;

  if (sapPlugin === noSapPlugin) {
    logger.trace("Failed to load @sap/plugin, so returning undefined.");
    return;
  }
  logger.trace("@sap/plugin successfully loaded.");

  const isLCAPEnabled = await sapPlugin.window.isLCAPEnabled();
  logger.trace("LCAP enabled successfully received.", { isLCAPEnabled });

  return isLCAPEnabled as boolean | undefined;
}
