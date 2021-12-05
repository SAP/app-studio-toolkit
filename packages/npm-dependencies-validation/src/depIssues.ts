import { dirname } from "path";
import { NpmLsResult } from "./types";
import { isCurrentlySupported, isPathExist } from "./utils/packageJsonUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import { isEmpty } from "lodash";

// ls --depth=0 shows only top-level dependencies
const LS_ARGS: string[] = ["ls", "--depth=0"];

export async function findDependencyIssues(
  absPackageJsonPath: string
): Promise<NpmLsResult> {
  const packageJsonExists = await isPathExist(absPackageJsonPath);
  if (!packageJsonExists) return { problems: [] };

  const currentlySupported = await isCurrentlySupported(absPackageJsonPath);
  if (!currentlySupported) return { problems: [] };

  const cwd = dirname(absPackageJsonPath);
  // dependencies issues and extraneous modules
  const depsCommandConfig = {
    commandArgs: [...LS_ARGS],
    cwd,
  };
  const npmLsResult = await invokeNPMCommand<NpmLsResult>(depsCommandConfig);
  if (!isEmpty(npmLsResult.problems)) return npmLsResult;

  // devDependencies issues and extraneous modules
  const devDepsCommandConfig = { commandArgs: [...LS_ARGS, "--dev"], cwd };
  return invokeNPMCommand<NpmLsResult>(devDepsCommandConfig);
}
