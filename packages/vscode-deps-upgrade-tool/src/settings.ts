import type { workspace } from "vscode";

export const ENABLED_CONFIG_PROP = "dependencyUpgrade.enabled";
export const LOGGING_LEVEL_CONFIG_PROP = "dependencyUpgrade.logging.level";
export const SOURCE_TRACKING_CONFIG_PROP =
  "dependencyUpgrade.logging.sourceLocationTracking";
export const DELAY_MIN_CONFIG_PROP = "dependencyUpgrade.delay.min";
export const DELAY_MAX_CONFIG_PROP = "dependencyUpgrade.delay.max";

// TODO: partial function application instead of copy pasta?
export function isEnabled(
  getConfiguration: typeof workspace["getConfiguration"]
): boolean {
  const wsConfig = getConfiguration();
  // TODO: test that the defaultValue here is aligned with the package.json default value
  const propVal = wsConfig.get(ENABLED_CONFIG_PROP, false);
  return propVal;
}

export function getMinInitialDelay(
  getConfiguration: typeof workspace["getConfiguration"]
): number {
  const wsConfig = getConfiguration();
  // TODO: test that the defaultValue here is aligned with the package.json default value
  const propVal = wsConfig.get(DELAY_MIN_CONFIG_PROP, 5);
  return propVal;
}

export function getMaxInitialDelay(
  getConfiguration: typeof workspace["getConfiguration"]
): number {
  const wsConfig = getConfiguration();
  // TODO: test that the defaultValue here is aligned with the package.json default value
  const propVal = wsConfig.get(DELAY_MAX_CONFIG_PROP, 15);
  return propVal;
}
