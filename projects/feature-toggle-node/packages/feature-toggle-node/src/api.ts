import { log } from "./logger";
import { findToggleAndReturnState } from "./client";

function validateFeatureToggleName(extensionName: string, toggleName: string): void {
  if (!extensionName || !toggleName) {
    const errStr = !extensionName ? "extension " : "";
    throw new Error(`Feature toggle ${errStr}name can not be empty, null or undefined`);
  }
}

export async function isFeatureEnabled(extensionName: string, toggleName: string): Promise<boolean> {
  log(`Checking if Extension Name: "${extensionName}", Feature Toggle Name: "${toggleName}" is enabled`);

  const ftName = `${extensionName}.${toggleName}`;

  try {
    validateFeatureToggleName(extensionName, toggleName);
    return await findToggleAndReturnState(ftName);
  } catch (err) {
    const logErr = `[ERROR] Failed to determine if feature toggle ${ftName} is enabled. Returning feature DISABLED. Error message: ${err}`;
    log(logErr);
    return false;
  }
}
