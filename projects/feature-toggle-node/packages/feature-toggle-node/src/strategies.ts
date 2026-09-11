import { ContextData, createContextEntity } from "./current_context";
import { convertPluralNameToSingular } from "./utils";
import { Toggle } from "./client";

export interface IterateableContext extends ContextData {
  [key: string]: string;
}

enum ParametersNames {
  environments = "environments",
  infrastructures = "infrastructures",
  landscapes = "landscapes",
  subaccounts = "subaccounts",
  users = "users",
  wss = "wss",
  tenantids = "tenantids",
}

/*
 * isMatchStrategies iterates over parameters in ParametersNames enum
 * takes value by parameter name of toggle and parameter from currentContext
 * return true if any of currentContext parameter presented in toggle
 * */
export function isMatchStrategies(toggle: Toggle): boolean {
  const currentContext: IterateableContext = createContextEntity();
  if (currentContext) {
    for (const parameterName of Object.values(ParametersNames)) {
      const parameterValue = toggle[parameterName];

      const singularParamName = convertPluralNameToSingular(parameterName);
      const currentContextParamValue = currentContext[singularParamName];

      if (currentContextParamValue && parameterValue?.length && parameterValue.includes(currentContextParamValue)) {
        return true;
      }
    }
  }

  return false;
}

export function isToggleEnabled(toggle: Toggle): boolean {
  return !toggle.disabled && toggle.strategies ? isMatchStrategies(toggle) : !toggle.disabled;
}
