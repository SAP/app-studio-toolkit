import { dirname } from "path";
import { NpmLsResult } from "./types";
import { isCurrentlySupported, isPathExist } from "./utils/packageJsonUtil";
import { invokeNPMCommand } from "./utils/npmUtil";

// ls --depth=0 shows only top-level dependencies
const LS_ARGS: string[] = ["ls", "--depth=0"];

export async function findDependencyIssues(
  absPackageJsonPath: string
): Promise<NpmLsResult> {
  const packageJsonExists = await isPathExist(absPackageJsonPath);
  if (!packageJsonExists) return { problems: [] };

  const currentlySupported = await isCurrentlySupported(absPackageJsonPath);
  if (!currentlySupported) return { problems: [] };

  // dependencies issues and extraneous modules
  const commandConfig = {
    commandArgs: [...LS_ARGS],
    cwd: dirname(absPackageJsonPath),
  };
  const npmLsResult = await invokeNPMCommand<NpmLsResult>(commandConfig);
  const problemsLength = npmLsResult.problems?.length || 0;
  if (problemsLength != 0) return npmLsResult;

  // devDependencies issues and extraneous modules
  commandConfig.commandArgs.push("--dev");
  return invokeNPMCommand<NpmLsResult>(commandConfig);
}
