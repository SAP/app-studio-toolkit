import { ConfiguredTask } from "@sap_oss/task_contrib_types";

export const NPM_SCRIPT_TYPE = "npm-script";
export const NPM_SCRIPT_TASK_TYPE = "Miscellaneous";

export interface NPMScriptDefinitionType extends ConfiguredTask {
  taskType: string;
  packageJSONPath: string;
  script: string;
  arguments: string;
}
