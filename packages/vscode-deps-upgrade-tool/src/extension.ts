import { ExtensionContext, window, extensions, workspace } from "vscode";
import * as delay from "delay";
import { isEmpty, partial, map } from "lodash";
import { readUpgradeMetadata } from "./metadata";
import { applyUpgrades } from "./apply-upgrades";
import { getLogger, initLogger } from "./logger";
import {
  getConfigProp as getConfigPropOrg,
  GetConfigPropOnlyProp,
} from "./settings";

const SECOND = 1000;
const MINUTE = SECOND * 60;

export function activate(context: ExtensionContext): void {
  const extensionName = context.extension.packageJSON.displayName;
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

  // helper to avoid sending `workspace.getConfiguration` everytime
  const getConfigProp: GetConfigPropOnlyProp = partial(
    getConfigPropOrg,
    workspace.getConfiguration
  );

  if (getConfigProp("ENABLED")) {
    const minDelay = getConfigProp("DELAY_MIN");
    const maxDelay = getConfigProp("DELAY_MAX");
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

// TODO:
//  - evaluate need / importance of usage analytics
//  - documentation (d.ts)
//  - documentation (extension)
//  - documentation (example)
//  - **unit** tests

// TODO: blocked
// - Choose initial random delay
