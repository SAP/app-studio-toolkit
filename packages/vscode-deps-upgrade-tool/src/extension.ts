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
  // const logger = getLogger().getChildLogger({ label: "extension" });
  // logger.info("The Vscode Dependencies Upgrade Extension is active.");
}

async function updateOnStartup() {
  const upgradeMetadata = readUpgradeMetadata(extensions.all);

  // TODO: do we want to do additional filtering (e.g yarn project?)
  //   Probably not because the auto upgrade is still relevant even if the followup `npm` is not executed
  const pkgJsonUris = await workspace.findFiles(
    "package.json",
    "**/node_modules/**"
  );

  // TODO: product definition for delay and evaluate need for user settings
  // await range(5 * MINUTE, 30 * MINUTE);
  await applyUpgrades(pkgJsonUris, upgradeMetadata);
}

// TODO:
//  - check whole flow with mis-alignment
//    - ensure output channel focus and notifications in mis-alignment work well in combination with update
//  - Choose initial random delay
//  - input validation (probably important to ensure correctness and for extension developers avoiding mistakes)
//  - logger
//  - settings (disabled by default minimum)
//  - evaluate need / important of usage analytics
//  - documentation (d.ts)
//  - documentation (extension)
//  - documentation (example)
//  - **unit** tests