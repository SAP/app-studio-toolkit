import { ExtensionContext, window, extensions, workspace } from "vscode";
import * as delay from "delay";
import { isEmpty, map } from "lodash";
import { readUpgradeMetadata } from "./metadata";
import { applyUpgrades } from "./apply-upgrades";
import { getLogger, initLogger } from "./logger";
import { getConfigProp } from "./settings";

const SECOND = 1000;
const MINUTE = SECOND * 60;

export function activate(context: ExtensionContext): void {
  // The `context.extension.packageJSON.displayName` does not work in Theia
  // So we must duplicate the string.
  // TODO: a unit test which validates this duplication
  const extensionDisplayName = "NPM Dependency Upgrade Tool";
  const outputChannel = window.createOutputChannel(extensionDisplayName);
  initLogger(context, outputChannel, extensionDisplayName);

  // intentionally not using await to avoid deadlocking the extension's `activate` function
  void updateOnStartup();
  const logger = getLogger().getChildLogger({ label: "extension" });
  logger.info(`The ${extensionDisplayName} Extension is active.`);
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

  const wsGetCfg = workspace.getConfiguration;

  if (getConfigProp(wsGetCfg, "ENABLED")) {
    const minDelay = getConfigProp(wsGetCfg, "DELAY_MIN");
    const maxDelay = getConfigProp(wsGetCfg, "DELAY_MAX");
    const randomDelay = minDelay + Math.random() * (maxDelay - minDelay);
    getLogger().trace("Selected initial delay (minutes)", { randomDelay });
    await delay(randomDelay * MINUTE);
    const pkgJsonUris = await workspace.findFiles(
      "package.json",
      "**/node_modules/**"
    );
    const pkgJsonFsPaths = map(pkgJsonUris, (_) => _.fsPath);
    getLogger().trace("package.json files to check for upgrade:", {
      uris: pkgJsonFsPaths,
    });
    await applyUpgrades(pkgJsonUris, upgradeMetadata.upgrades);
  }
}
