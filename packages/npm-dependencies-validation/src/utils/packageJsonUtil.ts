import { access, readFile } from "fs/promises";
import { constants } from "fs";
import { join, dirname, sep, relative } from "path";
import { VscodeFsUri, VscodeWsFolder } from "../types";

const invalidProjectFiles = [
  "yarn.lock",
  ".yarnrc",
  ".yarnrc.yml",
  ".yarn/",
  "./node_modules/.yarn-integrity",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  ".pnpmfile.cjs",
  "./node_modules/.pnpm/",
];

const invalidPackageJsonProperties = ["workspaces", "engines.pnpm", "pnpm"];

async function readJsonFile(
  packageJsonPath: string
): Promise<{ name: string } | undefined> {
  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf-8");
    const content: { name: string } = JSON.parse(packageJsonContent);
    return content;
  } catch (error: any) {
    console.debug(`${packageJsonPath} file content is invalid. ${error.stack}`);
  }
}

async function isPathExist(packageJsonPath: string): Promise<boolean> {
  try {
    await access(packageJsonPath, constants.R_OK | constants.W_OK);
    return true;
  } catch (error: any) {
    console.debug(`${packageJsonPath} file is not accessible. ${error.stack}`);
    return false;
  }
}

async function findParentPackageJsonPath(
  wsFolders: Readonly<VscodeWsFolder[]> | undefined,
  uri: VscodeFsUri
): Promise<string | undefined> {
  const { fsPath: packgeJsonPath } = uri;

  const parentFolder = wsFolders?.find((wsFolder: VscodeWsFolder) => {
    return packgeJsonPath.startsWith(wsFolder.uri.fsPath);
  });

  if (!parentFolder) return;

  const parentWsFolderPath = parentFolder.uri.fsPath;
  const location = dirname(packgeJsonPath);
  const relativePath = relative(parentFolder.uri.fsPath, location);

  const relativeParts = ["", ...relativePath.split(sep)];
  // what if it is invalid ??
  let candidate = parentWsFolderPath;

  for (const part of relativeParts) {
    candidate = join(candidate, part);
    const candidatePackageJson = join(candidate, "package.json");
    if (
      (await isPathExist(candidatePackageJson)) &&
      (await readJsonFile(candidatePackageJson))
    ) {
      break;
    }
  }

  return candidate ?? location;
}

export async function isValidPackageJson(
  wsFolders: Readonly<VscodeWsFolder[]> | undefined,
  uri: VscodeFsUri
): Promise<boolean> {
  const parentPackageJsonPath = await findParentPackageJsonPath(wsFolders, uri);

  if (!parentPackageJsonPath) return false;

  let validPath = true;
  for (const file of invalidProjectFiles) {
    validPath = await isPathExist(join(parentPackageJsonPath, file));
    if (!validPath) {
      break;
    }
  }

  return validPath;
}
