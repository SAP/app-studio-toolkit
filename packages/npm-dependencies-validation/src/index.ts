import { spawnCommand } from "./npmUtil";
import { resolve, join } from "path";
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import { DependencyIssue, IssueType } from "./types";

const LS_DEPS = ["ls", "--depth=0", "--json"]; // dependencies and extraneous modules
const LS_DEV_DEPS = [...LS_DEPS, "--dev"]; // devDependencies

async function isValidJsonFile(packageJsonPath: string): Promise<boolean> {
  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf-8");
    JSON.parse(packageJsonContent);
    return true;
  } catch (error: any) {
    console.debug(
      `${packageJsonPath} file content is invalid. ${
        error.stack || error.message
      }`
    );
    return false;
  }
}

async function isPathExist(packageJsonPath: string): Promise<boolean> {
  try {
    await access(packageJsonPath, constants.R_OK | constants.W_OK);
    return true;
  } catch (error: any) {
    console.debug(
      `${packageJsonPath} file is not accessible. ${
        error.stack || error.message
      }`
    );
    return false;
  }
}

async function getDepsStatus(path: string, devDeps: boolean): Promise<any> {
  const resolvedPath = resolve(path);
  const packageJsonPath = join(resolve(path), "package.json");

  // package.json must exist and be valid json
  if (
    !(await isPathExist(packageJsonPath)) ||
    !(await isValidJsonFile(packageJsonPath))
  ) {
    return Promise.resolve({});
  }

  return spawnCommand(devDeps ? [...LS_DEV_DEPS] : [...LS_DEPS], resolvedPath);
}

function getProblemType(dependency: any): IssueType | undefined {
  if (dependency.missing) return "missing";
  if (dependency.invalid) return "invalid";
  if (dependency.extraneous) return "extraneous";
}

async function getIssues(
  path: string,
  devDeps = false
): Promise<DependencyIssue[]> {
  const { dependencies } = await getDepsStatus(path, devDeps);

  const problematicDeps: DependencyIssue[] = [];
  for (const name in dependencies) {
    const dependency = dependencies[name];
    const type = getProblemType(dependency);
    if (type) {
      const version = dependency.version ?? dependency.required;
      const problematicDep: DependencyIssue = {
        name,
        version,
        type,
      };
      if (type != "extraneous") {
        problematicDep.devDependency = devDeps;
      }
      problematicDeps.push(problematicDep);
    }
  }
  return problematicDeps;
}

export async function getDependencyIssues(
  path: string
): Promise<DependencyIssue[]> {
  const results = await Promise.all([getIssues(path), getIssues(path, true)]);
  return [...results[0], ...results[1]];
}

// TODO: check in BAS on big project CAP or UI5 or Fiori

// TODO: meeting with Ido about performance problems

// create vscode extension in app-studio-toolkit and show errors only for first level package.json projects
// probably use git repos that we talked about for json line search (see in Teams)
