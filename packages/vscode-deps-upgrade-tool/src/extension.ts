import { ExtensionContext, window, extensions, workspace } from "vscode";
import { range } from "delay";
import { isEmpty } from "lodash";
import { readUpgradeMetadata } from "./metadata";
import { applyUpgrades } from "./apply-upgrades";
import { getLogger, initLogger } from "./logger";

const SECOND = 1000;
const MINUTE = SECOND * 60;

export function activate(context: ExtensionContext): void {
  const extensionName = context.extension.packageJSON.name;
  const outputChannel = window.createOutputChannel(extensionName);
  initLogger(context, outputChannel, extensionName);

  // intentionally not using await to avoid deadlocking the extension's `activate` function
  void updateOnStartup();
  const logger = getLogger().getChildLogger({ label: "extension" });
  logger.info(`The ${extensionName} Extension is active.`);
}

async function updateOnStartup() {
  const upgradeMetadata = readUpgradeMetadata(extensions.all);

  const issues = upgradeMetadata.issues;
  if (!isEmpty(issues)) {
    getLogger().error(
      `Detected ${issues.length} problems in upgrade specifications`,
      { issues }
    );
  }
  // TODO: product definition for delay and evaluate need for user settings
  // await range(5 * MINUTE, 30 * MINUTE);
  const pkgJsonUris = await workspace.findFiles(
    "package.json",
    "**/node_modules/**"
  );
  await applyUpgrades(pkgJsonUris, upgradeMetadata.upgrades);
}

// TODO:
//  - check whole flow with mis-alignment
//    - ensure output channel focus and notifications in mis-alignment work well in combination with update
//  - Choose initial random delay
//  - settings (disabled by default minimum)
//  - evaluate need / important of usage analytics
//  - documentation (d.ts)
//  - documentation (extension)
//  - documentation (example)
//  - **unit** tests
//  - logging entries
