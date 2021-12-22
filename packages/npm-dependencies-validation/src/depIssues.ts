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
  if (!packageJsonExists) {
    return { problems: [] };
  }

  const currentlySupported = await isCurrentlySupported(absPackageJsonPath);
  if (!currentlySupported) {
    return { problems: [] };
  }

  const cwd = dirname(absPackageJsonPath);
  // dependencies issues and extraneous modules
  const depsCommandConfig = {
    commandArgs: [...LS_ARGS],
    cwd,
  };
  const npmProdLsResult = await invokeNPMCommandWithJsonResult<NpmLsResult>(
    depsCommandConfig
  );
  const prodProblems = npmProdLsResult.problems ?? [];
  // hack workaround for different behaviors of `npm ls` in different versions of npm
  if (!isEmpty(prodProblems)) {
    // early exit as we don't know if we can safely combine the results of prod/dev mode in all versions of npm.
    return { problems: prodProblems };
  }

  // in npm6 `devDeps` related issues and extraneous deps are not detected via the regular `npm ls` command (without `--dev`).
  const devDepsCommandConfig = { commandArgs: [...LS_ARGS, "--dev"], cwd };
  const npmDevLsResults = await invokeNPMCommandWithJsonResult<NpmLsResult>(
    devDepsCommandConfig
  );
  const devProblems = npmDevLsResults.problems ?? [];
  return { problems: devProblems };
}
