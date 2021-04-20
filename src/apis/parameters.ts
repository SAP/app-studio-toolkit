import { getLogger } from '../logger/logger';

export async function getParameter(parameterName: string) : Promise<string | undefined> {
    const optionalRequire = require("optional-require")(require);
    const noSapPlugin = "NO_SAP_PLUGIN_FOUND";
    const sapPlugin = optionalRequire('@sap/plugin') ?? noSapPlugin;
  
    if (sapPlugin === noSapPlugin) {
        getLogger().error("Failed to load @sap/plugin, so returning undefined.");
        return undefined;
    } 
    getLogger().trace("@sap/plugin successfully loaded.");

    const configuration = await sapPlugin.window.configuration();
    getLogger().trace("Configuration successfully received.", {configuration});

    const parameterValue = configuration?.[parameterName];
    getLogger().trace(`configuration[${parameterName}]=${parameterValue}`, {parameterName, parameterValue});
    return parameterValue;
}
