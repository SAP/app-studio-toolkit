import { dirname } from "path";
import { isEmpty } from "lodash";
import { NpmLsResult } from "./types";
import { isCurrentlySupported, isPathExist } from "./utils/packageJsonUtil";
import { invokeNPMCommandWithJsonResult } from "./utils/npmUtil";

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
  const { problems = [] } = await invokeNPMCommandWithJsonResult<NpmLsResult>(
    depsCommandConfig
  );
  if (!isEmpty(problems)) return { problems };

  // devDependencies issues and extraneous modules
  const devDepsCommandConfig = { commandArgs: [...LS_ARGS, "--dev"], cwd };
  return invokeNPMCommandWithJsonResult<NpmLsResult>(devDepsCommandConfig);
}
