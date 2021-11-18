import { access, readFile } from "fs/promises";
import { constants } from "fs";
import { join, dirname, sep, relative } from "path";
import { VscodeFsUri, VscodeWsFolder } from "../types";

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
const npm7Properties = ["workspaces"];

async function readJsonFile(packageJsonUri: VscodeFsUri): Promise<any> {
  try {
    const packageJsonContent = await readFile(packageJsonUri.fsPath, "utf-8");
    const content: { name: string } = JSON.parse(packageJsonContent);
    return content;
  } catch (error: any) {
    return {};
  }
}

async function isPathExist(packageJsonPath: string): Promise<boolean> {
  try {
    await access(packageJsonPath, constants.R_OK | constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// async function findParentPackageJsonPath(
//   wsFolders: Readonly<VscodeWsFolder[]> | undefined,
//   uri: VscodeFsUri
// ): Promise<string | undefined> {
//   const { fsPath: packgeJsonPath } = uri;

//   const parentFolder = wsFolders?.find((wsFolder: VscodeWsFolder) => {
//     return packgeJsonPath.startsWith(wsFolder.uri.fsPath);
//   });

//   if (!parentFolder) return;

//   const parentWsFolderPath = parentFolder.uri.fsPath;
//   const location = dirname(packgeJsonPath);
//   const relativePath = relative(parentFolder.uri.fsPath, location);

//   const relativeParts = ["", ...relativePath.split(sep)];
//   let candidate = parentWsFolderPath;

//   for (const part of relativeParts) {
//     candidate = join(candidate, part);
//     const candidatePackageJson = join(candidate, "package.json");
//     if (
//       (await isPathExist(candidatePackageJson)) &&
//       (await readJsonFile(candidatePackageJson))
//     ) {
//       break;
//     }
//   }

//   return candidate ?? location;
// }

async function hasNonNPMManagerFiles(
  fileNames: string[],
  packageJsonFileUri: VscodeFsUri
): Promise<boolean> {
  for (const fileName of fileNames) {
    const packageJsonDirPath = join(dirname(packageJsonFileUri.fsPath));
    if (await isPathExist(join(packageJsonDirPath, fileName))) {
      return true;
    }
  }

  return false;
}

function isManagedByYarn(packageJsonFileUri: VscodeFsUri): Promise<boolean> {
  return hasNonNPMManagerFiles(yarnManagerFiles, packageJsonFileUri);
}

function isManagedByPnpm(packageJsonFileUri: VscodeFsUri): Promise<boolean> {
  return hasNonNPMManagerFiles(pnpmManagerFiles, packageJsonFileUri);
}

async function isMonoRepoRoot(
  packageJsonFileUri: VscodeFsUri
): Promise<boolean> {
  const content = await readJsonFile(packageJsonFileUri);
  return npm7Properties.some((property) => {
    return property in content;
  });
}

export async function isManagedByNpm6(
  packageJsonUri: VscodeFsUri
): Promise<boolean> {
  // if (isSubPackageInMonoRepo()) return false; --- not for now

  if (await isManagedByYarn(packageJsonUri)) return false;

  if (await isManagedByPnpm(packageJsonUri)) return false;

  if (await isMonoRepoRoot(packageJsonUri)) return false;

  return true;
}
