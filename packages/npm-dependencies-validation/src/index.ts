import { spawnCommand } from "./utils/npmUtil";
import { resolve, dirname } from "path";
import { isManagedByNpm6 } from "./utils/packageJsonUtil";
import {
  DependencyIssue,
  IssueType,
  NpmLsDependency,
  VscodeFsUri,
} from "./types";

const LS_DEPS = ["ls", "--depth=0"]; // dependencies and extraneous modules
const LS_DEV_DEPS = [...LS_DEPS, "--dev"]; // devDependencies

async function getDepsStatus(
  packageJsonPath: string,
  devDeps: boolean
): Promise<any> {
  // try to use DependencyType ???
  return spawnCommand(
    devDeps ? [...LS_DEV_DEPS] : [...LS_DEPS],
    resolve(dirname(packageJsonPath))
  );
}

function getProblemType(dependency: NpmLsDependency): IssueType | undefined {
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
      if (type !== "extraneous") {
        problematicDep.devDependency = devDeps;
      }
      problematicDeps.push(problematicDep);
    }
  }
  return problematicDeps;
}

export async function getDependencyIssues(
  uri: VscodeFsUri
): Promise<DependencyIssue[]> {
  const managedByNpm6 = await isManagedByNpm6(uri);
  if (!managedByNpm6) return [];

  const [depsAndRedundantIssues, devDepsIssues] = await Promise.all([
    getIssues(uri.fsPath),
    getIssues(uri.fsPath, true), // config object ???
  ]);
  return [...depsAndRedundantIssues, ...devDepsIssues];
}
