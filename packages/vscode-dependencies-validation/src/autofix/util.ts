import {
  findDependencyIssues,
  invokeNPMCommand,
} from "@sap-devx/npm-dependencies-validation";
import { debounce, isEmpty } from "lodash";
import { dirname } from "path";
import { PACKAGE_JSON_PATTERN } from "../constants";

export async function findAndFixDepsIssues(
  packageJsonPath: string
): Promise<void> {
  const { problems } = await findDependencyIssues(packageJsonPath);
  if (isEmpty(problems)) return;

  // TODO: what about output channel in case of automatic fixing ???
  return invokeNPMCommand({
    commandArgs: ["install"],
    cwd: dirname(packageJsonPath),
  });
}

export const debouncedFindAndFixDepsIssues = debounce(
  findAndFixDepsIssues,
  3000
);

export function isNotInNodeModules(absPath: string): boolean {
  return PACKAGE_JSON_PATTERN.test(absPath);
}
