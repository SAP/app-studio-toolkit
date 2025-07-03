import { commands, ExtensionContext, window, workspace } from "vscode";
import { getLogger, initLogger } from "./logger/logger";
import { ExtConfig } from "./types";
import { main } from "./flows/main";

export { activate };

async function activate(context: ExtensionContext): Promise<void> {
  initLogger({
    extensionName: context.extension.id,
    logUri: context.logUri,
    subscriptions: context.subscriptions,
    createOutputChannel: window.createOutputChannel,
  });

  getLogger().info(`Extension ${context.extension.id} activated`);
  const extConfig = readExtConfig();
  await main({
    ...extConfig,
    globalState: context.globalState,
  });

  context.subscriptions.push(
    commands.registerCommand("disk-usage.log-disk-usage", async () => {
      getLogger().info(`manual activation of disk-usage log/report command`);
      await window.showInformationMessage("hallo world");
    })
  );
}

function readExtConfig(): ExtConfig {
  const wsConfig = workspace.getConfiguration("vscode-disk-usage");
  const disable = wsConfig.get("disable", false);
  const initialDelay = wsConfig.get("initialDelay", 30);
  const daysBetweenRuns = wsConfig.get("daysBetweenRuns", 7);

  const extConfig = {
    disable,
    initialDelay,
    daysBetweenRuns,
  };

  getLogger().debug(`Extension config: ${JSON.stringify(extConfig, null, 2)}`);

  return extConfig;
}
