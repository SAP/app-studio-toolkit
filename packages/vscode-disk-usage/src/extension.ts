import { commands, ExtensionContext, window } from "vscode";
import { getLogger, initLogger } from "./logger/logger";

export function activate(context: ExtensionContext): void {
  initLogger(context);
  getLogger().info(`Extension ${context.extension.id} activated`);

  context.subscriptions.push(
    commands.registerCommand("disk-usage.log-disk-usage", async () => {
      await window.showInformationMessage("hallo world");
    })
  );
}
