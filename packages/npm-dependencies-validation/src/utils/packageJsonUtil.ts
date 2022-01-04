// importing directly from `fs/promises` is not supported on nodejs 12
import { promises } from "fs";
const { readFile } = promises;
import { join, dirname } from "path";
import { FilePaths, PackageJson } from "../types";
import {
  createFilePaths,
  emptyJsonObject,
  isPathExist,
  toJsonObject,
} from "./fileUtil";

export const yarnManagerFiles = [
  "yarn.lock",
  ".yarnrc",
  ".yarnrc.yml",
  ".yarn",
];
export const pnpmManagerFiles = [
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  ".pnpmfile.cjs",
];
export const monorepoProps = ["workspaces"];

async function readJsonFile<T>(jsonFilePath: string): Promise<T> {
  try {
    const packageJsonContent = await readFile(jsonFilePath, "utf-8");
    return toJsonObject<T>(packageJsonContent);
  } catch (error) {
    return emptyJsonObject<T>();
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
  const content = await readJsonFile<PackageJson>(packageJsonPath);
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

export function getPackageJsonPaths(absPath: string): FilePaths {
  const packageJsonPaths: FilePaths = createFilePaths(absPath, "package.json");
  return packageJsonPaths;
}
