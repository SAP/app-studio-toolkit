import { spawnCommand } from "./utils/npmUtil";
import { resolve } from "path";
import { isValidPackageJson } from "./utils/packageJsonUtil";
import {
  DependencyIssue,
  IssueType,
  VscodeFsUri,
  VscodeWsFolder,
} from "./types";

const LS_DEPS = ["ls", "--depth=0"]; // dependencies and extraneous modules
const LS_DEV_DEPS = [...LS_DEPS, "--dev"]; // devDependencies

async function getDepsStatus(path: string, devDeps: boolean): Promise<any> {
  return spawnCommand(devDeps ? [...LS_DEV_DEPS] : [...LS_DEPS], resolve(path));
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
  wsFolders: Readonly<VscodeWsFolder[]> | undefined,
  uri: VscodeFsUri
): Promise<DependencyIssue[]> {
  if (!(await isValidPackageJson(wsFolders, uri))) return [];

  const results = await Promise.all([
    getIssues(uri.fsPath),
    getIssues(uri.fsPath, true),
  ]);
  return [...results[0], ...results[1]];
}

export { DependencyIssue };

// probably use git repos that we talked about for json line search (see in Teams)
