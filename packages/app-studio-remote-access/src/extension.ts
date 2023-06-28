import { commands } from "vscode";
import type { ExtensionContext } from "vscode";
import { initLogger, getLogger } from "./logger/logger";
import {
  cleanDevspaceConfig,
  closeTunnel,
  cmdDevSpaceConnectNewWindow,
} from "./commands";

export function activate(context: ExtensionContext): void {
  initLogger(context);

  context.subscriptions.push(
    commands.registerCommand(
      "remote-access.dev-space.connect-new-window",
      cmdDevSpaceConnectNewWindow
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "remote-access.dev-space.clean-devspace-config",
      cleanDevspaceConfig
    )
  );

  context.subscriptions.push(
    commands.registerCommand("remote-access.close-tunnel", closeTunnel)
  );

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The Remote-Acceess Extension is active.");
}

export function deactivate() {
  // kill opened ssh channel if exists
  closeTunnel();
}
