import { ExtensionContext, window, extensions, workspace } from "vscode";
import { range } from "delay";
import { isEmpty, partial } from "lodash";
import { readUpgradeMetadata } from "./metadata";
import { applyUpgrades } from "./apply-upgrades";
import { getLogger, initLogger } from "./logger";
import {
  ConfigPropsKeys,
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
    await range(minDelay * MINUTE, maxDelay * MINUTE);
    const pkgJsonUris = await workspace.findFiles(
      "package.json",
      "**/node_modules/**"
    );
    await applyUpgrades(pkgJsonUris, upgradeMetadata.upgrades);
  }
}

// TODO:
//  - check whole flow with mis-alignment
//    - ensure output channel focus and notifications in mis-alignment work well in combination with update
//  - evaluate need / importance of usage analytics
//  - documentation (d.ts)
//  - documentation (extension)
//  - documentation (example)
//  - **unit** tests

// TODO: blocked
// - Choose initial random delay
