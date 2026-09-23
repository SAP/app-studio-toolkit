import { ConfiguredTask } from "@sap_oss/task_contrib_types";

export const NPM_TYPE = "npm";

export interface NpmDefinitionType extends ConfiguredTask {
  taskType?: string;
  script: string;
  path?: string;
}
