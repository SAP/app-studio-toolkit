import { isEmpty } from "lodash";
import { NpmLsResult } from "./types";
import { doesPathExist } from "./utils/fileUtil";
import { invokeNPMCommandWithJsonResult } from "./utils/npmUtil";
import {
  createPackageJsonPaths,
  isCurrentlySupported,
} from "./utils/packageJsonUtil";

// ls --depth=0 shows only top-level dependencies
const LS_ARGS: string[] = ["ls", "--depth=0"];

export async function findDependencyIssues(
  absPath: string
): Promise<NpmLsResult> {
  const { filePath, dirPath: cwd } = createPackageJsonPaths(absPath);
  const shouldFind = await shouldFindDependencyIssues(filePath);
  if (!shouldFind) {
    return { problems: [] };
  }

  // dependencies issues and extraneous modules
  const depsCommandConfig = {
    commandArgs: [...LS_ARGS],
    cwd,
  };
  const npmProdLsResult = await invokeNPMCommandWithJsonResult<NpmLsResult>(
    depsCommandConfig
  );
  const prodProblems = getProblems(npmProdLsResult);
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

  return { problems: getProblems(npmDevLsResults) };
}

function getProblems(npmLsResult: NpmLsResult): string[] {
  return npmLsResult.problems ?? [];
}

async function shouldFindDependencyIssues(
  packageJsonPath: string
): Promise<boolean> {
  const packageJsonExists = await doesPathExist(packageJsonPath);
  if (!packageJsonExists) return false;

  const currentlySupported = await isCurrentlySupported(packageJsonPath);
  if (!currentlySupported) return false;

  return true;
}
