import type { workspace } from "vscode";

// TODO: test that the full names here is aligned with the package.json full names value
export const CONFIG_PROPS_AND_FULL_NAME: Record<ConfigPropsKeys, string> = {
  ENABLED: "dependencyUpgrade.enabled",
  LOGGING_LEVEL: "dependencyUpgrade.logging.level",
  SOURCE_TRACKING: "dependencyUpgrade.logging.sourceLocationTracking",
  DELAY_MIN: "dependencyUpgrade.delay.min",
  DELAY_MAX: "dependencyUpgrade.delay.max",
};

// TODO: test that the defaultValue here is aligned with the package.json default value
// TODO: test that both `CONFIG_PROPS_AND_FULL_NAME` and `CONFIG_PROPS_AND_DEFAULTS` have same set of keys
export const CONFIG_PROPS_AND_DEFAULTS = {
  ENABLED: false,
  LOGGING_LEVEL: "error",
  SOURCE_TRACKING: false,
  DELAY_MIN: 5,
  DELAY_MAX: 15,
};

export type ConfigPropsKeys = keyof typeof CONFIG_PROPS_AND_DEFAULTS;

// using _.partial does not property infer this type (minus the `getConfiguration` parameter)
// so we are defining it ourselves.
export type GetConfigPropOnlyProp = <R extends ConfigPropsKeys>(
  prop: R
) => typeof CONFIG_PROPS_AND_DEFAULTS[R];

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
