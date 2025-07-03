import { commands, ExtensionContext, Memento, window, workspace } from "vscode";
import { isFeatureEnabled } from "@sap-devx/feature-toggle-node";
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

  const isDiskUsageFeatureEnabled = await isFeatureEnabled(
    "disk-usage",
    "automatedReport"
  );
  // TODO: remove condition for testing before FT is released.
  if (isDiskUsageFeatureEnabled) {
    await runReport(context.globalState);
  }

  context.subscriptions.push(
    commands.registerCommand("disk-usage.log-disk-usage", async () => {
      getLogger().info(`manual activation of disk-usage log/report command`);
      await runReport(context.globalState);
    })
  );
}

async function runReport(globalState: Memento): Promise<void> {
  const extConfig = readExtConfig();
  await main({
    ...extConfig,
    globalState,
  });
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
