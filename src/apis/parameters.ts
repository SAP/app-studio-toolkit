import { getLogger } from '../logger/logger';

export async function getParameter(parameterName: string) : Promise<string | undefined> {
    const logger = getLogger().getChildLogger({label: "getParameter"});
    const optionalRequire = require("optional-require")(require);
    const noSapPlugin = "NO_SAP_PLUGIN_FOUND";
    const sapPlugin = optionalRequire('@sap/plugin') ?? noSapPlugin;
  
    if (sapPlugin === noSapPlugin) {
        logger.trace("Failed to load @sap/plugin, so returning undefined.");
        return undefined;
    } 
    logger.trace("@sap/plugin successfully loaded.");

    const configuration = await sapPlugin.window.configuration();
    logger.trace("Configuration successfully received.", {configuration});

    const parameterValue = configuration?.[parameterName];
    return parameterValue;
}
