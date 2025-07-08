import { commands, ExtensionContext, window, workspace } from "vscode";
import { core } from "@sap/bas-sdk";
import { isFeatureEnabled } from "@sap-devx/feature-toggle-node";
import { getLogger, initLogger } from "./logger/logger";
import { ExtConfig } from "./types";
import { manualReport } from "./flows/manual";
import { HOME_DIR } from "./helper-logic/constants";
import { automatedReport } from "./flows/automated";

export { activate };

async function activate(context: ExtensionContext): Promise<void> {
  initLogger({
    extensionName: context.extension.id,
    logUri: context.logUri,
    subscriptions: context.subscriptions,
    createOutputChannel: window.createOutputChannel,
  });

  getLogger().info(`Extension ${context.extension.id} activated`);

  if (!(await core.isAppStudio())) {
    getLogger().warn(
      "Not Running in a BAS Dev Space, extension features are disabled"
    );
  } else {
    // TODO: remove || true before merge -- for testing only as FF is not yet available
    if ((await isFeatureEnabled("disk-usage", "automatedReport")) || true) {
      const extConfig = readExtConfig();
      await automatedReport({
        ...extConfig,
        globalState: context.globalState,
        homeFolder: HOME_DIR,
      });
    } else {
      getLogger().info(
        `Feature 'automatedReport' for disk-usage is disabled via feature toggle.`
      );
    }

    context.subscriptions.push(
      commands.registerCommand("disk-usage.log-disk-usage", async () => {
        getLogger().info(`manual activation of disk-usage log/report command`);
        await manualReport(HOME_DIR);
      })
    );
  }
}

function readExtConfig(): ExtConfig {
  const wsConfig = workspace.getConfiguration("vscode-disk-usage.report");
  const disable = wsConfig.get("disable", false);
  const initialDelay = wsConfig.get("initialDelay", 30);
  const daysBetweenRuns = wsConfig.get("daysBetweenRuns", 7);

  const extConfig = {
    disable,
    initialDelay,
    daysBetweenRuns,
  };

  getLogger().info(`Extension config: ${JSON.stringify(extConfig, null, 2)}`);

  return extConfig;
}
