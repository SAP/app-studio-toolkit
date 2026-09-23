import { forEach } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { join, sep, normalize } from "path";

// this function removes "index" field that Theia adds to the task definition
export function cleanTasks(tasks: ConfiguredTask[]): void {
  forEach(tasks, (_) => {
    delete _.index;
  });
}

export const DEPLOY = "Deploy";
export const BUILD = "Build";
export const MISC = "Miscellaneous";

export function isMatchDeploy(intent: string): boolean {
  return /^deploy.*$/gi.test(intent);
}

export function isMatchBuild(intent: string): boolean {
  return /^build.*$/gi.test(intent);
}

export function isPathRelatedToFolder(path: string, folder: string): boolean {
  return normalize(join(path, sep)).startsWith(normalize(join(folder, sep)));
}
