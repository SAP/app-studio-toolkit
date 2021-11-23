import { access, readFile } from "fs/promises";
import { constants } from "fs";
import { join, dirname } from "path";
import { VscodeUri } from "../types";

const yarnManagerFiles = [
  "yarn.lock",
  ".yarnrc",
  ".yarnrc.yml",
  ".yarn",
  "./node_modules/.yarn-integrity",
];
const pnpmManagerFiles = [
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  ".pnpmfile.cjs",
  "./node_modules/.pnpm",
];
const monorepoProps = ["workspaces"];

async function readJsonFile(packageJsonUri: VscodeUri): Promise<any> {
  try {
    const packageJsonContent = await readFile(packageJsonUri.fsPath, "utf-8");
    const content: { name: string } = JSON.parse(packageJsonContent);
    return content;
  } catch (error) {
    return {};
  }
}

async function isPathExist(absPath: string): Promise<boolean> {
  try {
    await access(absPath, constants.R_OK | constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

async function pathContainsAnyOfFiles(
  fileNames: string[],
  absPath: string
): Promise<boolean> {
  for (const fileName of fileNames) {
    const packageJsonDirPath = join(dirname(absPath));
    if (await isPathExist(join(packageJsonDirPath, fileName))) {
      return true;
    }
  }

  return false;
}

function isManagedByYarn(packageJsonFileUri: VscodeUri): Promise<boolean> {
  return pathContainsAnyOfFiles(yarnManagerFiles, packageJsonFileUri.fsPath);
}

function isManagedByPnpm(packageJsonFileUri: VscodeUri): Promise<boolean> {
  return pathContainsAnyOfFiles(pnpmManagerFiles, packageJsonFileUri.fsPath);
}

async function isMonoRepoRoot(packageJsonFileUri: VscodeUri): Promise<boolean> {
  const content = await readJsonFile(packageJsonFileUri);
  return monorepoProps.some((property) => {
    return property in content;
  });
}

export async function isCurrentlySupported(
  packageJsonUri: VscodeUri
): Promise<boolean> {
  // if (isSubPackageInMonoRepo()) return false; --- not for now

  if (await isManagedByYarn(packageJsonUri)) return false;

  if (await isManagedByPnpm(packageJsonUri)) return false;

  if (await isMonoRepoRoot(packageJsonUri)) return false;

  return true;
}
