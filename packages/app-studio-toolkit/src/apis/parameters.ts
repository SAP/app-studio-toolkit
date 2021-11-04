import { getLogger } from "../logger/logger";
import { optionalRequire } from "../utils/optional-require";

export async function getParameter(
  parameterName: string
): Promise<string | undefined> {
  const logger = getLogger().getChildLogger({ label: "getParameter" });
  const noSapPlugin = "NO_SAP_PLUGIN_FOUND";
  const sapPlugin = optionalRequire<any>("@sap/plugin") ?? noSapPlugin;

  if (sapPlugin === noSapPlugin) {
    logger.trace("Failed to load @sap/plugin, so returning undefined.");
    return;
  }
  logger.trace("@sap/plugin successfully loaded.");

  const configuration = await sapPlugin.window.configuration();
  logger.trace("Configuration successfully received.", { configuration });

  return configuration?.[parameterName] as string | undefined;
}
