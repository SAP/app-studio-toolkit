import { dirname } from "path";
import {
  findDependencyIssues,
  invokeNPMCommand,
} from "@sap-devx/npm-dependencies-validation";
import { debounce, isEmpty } from "lodash";

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
