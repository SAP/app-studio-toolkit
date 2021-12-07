import { access, readFile } from "fs/promises";
import { constants } from "fs";
import { join, dirname } from "path";
import { PackageJson } from "../types";

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

async function readJsonFile(jsonFilePath: string): Promise<PackageJson> {
  try {
    const packageJsonContent = await readFile(jsonFilePath, "utf-8");
    const content: PackageJson = JSON.parse(packageJsonContent);
    return content;
  } catch (error) {
    return {} as PackageJson;
  }
}

export async function isPathExist(absPath: string): Promise<boolean> {
  try {
    await access(absPath, constants.R_OK);
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
    // in case a file/dir name is found we exit the for-of loop
    if (await isPathExist(join(dirname(absPath), fileName))) return true;
  }

  return false;
}

function isManagedByYarn(packageJsonPath: string): Promise<boolean> {
  return pathContainsAnyOfFiles(yarnManagerFiles, packageJsonPath);
}

function isManagedByPnpm(packageJsonPath: string): Promise<boolean> {
  return pathContainsAnyOfFiles(pnpmManagerFiles, packageJsonPath);
}

async function isMonoRepoRoot(packageJsonPath: string): Promise<boolean> {
  const content = await readJsonFile(packageJsonPath);
  return monorepoProps.some((property) => {
    return property in content;
  });
}

export async function isCurrentlySupported(
  packageJsonPath: string
): Promise<boolean> {
  // if (isSubPackageInMonoRepo()) return false; --- not for now

  if (await isManagedByYarn(packageJsonPath)) return false;

  if (await isManagedByPnpm(packageJsonPath)) return false;

  if (await isMonoRepoRoot(packageJsonPath)) return false;

  return true;
}

export const internal = {
  readJsonFile,
};
