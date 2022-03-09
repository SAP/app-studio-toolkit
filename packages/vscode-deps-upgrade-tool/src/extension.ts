import { ExtensionContext, window, extensions, workspace } from "vscode";
import { range } from "delay";
import { readUpgradeMetadata } from "./metadata";
import { applyUpgrades } from "./apply-upgrades";

const SECOND = 1000;
const MINUTE = SECOND * 60;

export function activate(context: ExtensionContext): void {
  // TODO: why don't we get it from the context?
  const extensionName = "vscode-deps-upgrade-tool";

  // intentionally not using await to avoid deadlocking the extension's `activate` function
  void updateOnStartup();
  const outputChannel = window.createOutputChannel(extensionName);
  // TODO: implement logger
  // initLogger(context, outputChannel, extensionName);

  // TODO:
  //   5. vscode settings (which?)

  // const logger = getLogger().getChildLogger({ label: "extension" });
  // logger.info("The Vscode Dependencies Upgrade Extension is active.");
}

async function updateOnStartup() {
  const upgradeMetadata = readUpgradeMetadata(extensions.all);
  const pkgJsonUris = await workspace.findFiles(
    "package.json",
    "**/node_modules/**"
  );

  // TODO: product definition for delay and evaluate need for user settings
  // await range(5 * MINUTE, 30 * MINUTE);
  await applyUpgrades(pkgJsonUris, upgradeMetadata);
}
