import type { workspace } from "vscode";

export const CONFIG_PROPS_AND_FULL_NAME: Record<ConfigPropsKeys, string> = {
  ENABLED: "dependencyUpgrade.enabled",
  LOGGING_LEVEL: "dependencyUpgrade.logging.level",
  SOURCE_TRACKING: "dependencyUpgrade.logging.sourceLocationTracking",
  DELAY_MIN: "dependencyUpgrade.delay.min",
  DELAY_MAX: "dependencyUpgrade.delay.max",
};

export const CONFIG_PROPS_AND_DEFAULTS = {
  ENABLED: false,
  LOGGING_LEVEL: "error",
  SOURCE_TRACKING: false,
  DELAY_MIN: 5,
  DELAY_MAX: 15,
};

export type ConfigPropsKeys = keyof typeof CONFIG_PROPS_AND_DEFAULTS;

/* istanbul ignore next -- little value in implementing tests for this function (mainly VSCode APIS...) */
export function getConfigProp<R extends ConfigPropsKeys>(
  getConfiguration: typeof workspace["getConfiguration"],
  prop: R
): typeof CONFIG_PROPS_AND_DEFAULTS[R] {
  const wsConfig = getConfiguration();
  const propVal = wsConfig.get(
    CONFIG_PROPS_AND_FULL_NAME[prop],
    CONFIG_PROPS_AND_DEFAULTS[prop]
  );
  return propVal;
}
