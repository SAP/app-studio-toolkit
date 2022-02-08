import { ExtensionContext, window } from "vscode";

export function activate(context: ExtensionContext): void {
  // TODO: why don't we get it from the context?
  const extensionName = "vscode-deps-upgrade-tool";

  const outputChannel = window.createOutputChannel(extensionName);
  // TODO: implement logger
  // initLogger(context, outputChannel, extensionName);

  // TODO:
  //   0. locate metadata for upgrades
  //   1. collect pkg.json files
  //   2. apply upgrades (delay on start? e.g 15mins? or maybe a random range?)
  //   3. option : apply upgrades AGAIN every specific interval?
  //   4. notifications (grouped?) (what happens to a notification if it is ignored?)
  //   5. vscode settings
  //   6. exclude by pkg.json property
  //   7. manual mode (via problems view per opened file or via notifications?)

  // const logger = getLogger().getChildLogger({ label: "extension" });
  // logger.info("The Vscode Dependencies Validation Extension is active.");
}
