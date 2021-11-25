import { resolve, dirname } from "path";
import { isCurrentlySupported } from "./utils/packageJsonUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import {
  Dependency,
  DependenciesPropertyName,
  NPMDependencyIssue,
  NPMIssueType,
  NpmLsRDependencies,
} from "./types";

// ls --depth=0 shows only top-level dependencies
const LS_ARGS: string[] = ["ls", "--depth=0"];

async function listNodeModulesDeps(
  config: DepIssuesConfig
): Promise<NpmLsRDependencies> {
  return invokeNPMCommand<NpmLsRDependencies>(
    config.lsArgs,
    resolve(dirname(config.packageJsonPath))
  );
}

function getIssueType(dependency: Dependency): NPMIssueType | undefined {
  if (dependency.missing === true) return "missing";
  if (dependency.invalid === true) return "invalid";
  if (dependency.extraneous === true) return "extraneous";

  return undefined;
}

function getVersion(dependency: Dependency): string | undefined {
  return dependency["version"] || dependency["required"];
}

type DepIssuesConfig = {
  packageJsonPath: string;
  lsArgs: string[];
};

async function createDependencyIssues(
  config: DepIssuesConfig
): Promise<NPMDependencyIssue[]> {
  const { dependencies } = await listNodeModulesDeps(config);
  const devDependency = config.lsArgs.includes("--dev");

  const depWithIssues: NPMDependencyIssue[] = [];
  for (const depName in dependencies) {
    const dependency: Dependency = dependencies[depName];

    const type = getIssueType(dependency);
    if (type) {
      const version = getVersion(dependency);
      depWithIssues.push({
        name: depName,
        version,
        type,
        devDependency,
      });
    }
  }

  return depWithIssues;
}

export function filterDependencyIssues(
  npmDependencyIssues: NPMDependencyIssue[],
  depsPropName: DependenciesPropertyName
): NPMDependencyIssue[] {
  return npmDependencyIssues.filter(
    (npmDepIssue) =>
      npmDepIssue.devDependency === (depsPropName === "devDependencies")
  );
}

export async function findDependencyIssues(
  packageJsonPath: string
): Promise<NPMDependencyIssue[]> {
  const currentlySupported = await isCurrentlySupported(packageJsonPath);
  if (!currentlySupported) return [];

  const depIssuePromises = [
    // in order to get all types of dependency issue ls --depth=0 command should be executed thrice:
    //    1. ls --depth=0 --extraneous ---> returns extraneous packages
    //    2. ls --depth=0 --dev ---> returns devDependencies issues
    //    3. ls --depth=0 --prod ---> returns dependencies issues
    // all list are independent and describe different types of issues
    // creates extraneous packages
    //createDependencyIssues({ packageJsonPath, lsArgs: [...LS_ARGS, "--extraneous"] }),
    // creates devDependencies issues
    createDependencyIssues({ packageJsonPath, lsArgs: [...LS_ARGS] }),
    // creates dependencies issues
    createDependencyIssues({ packageJsonPath, lsArgs: [...LS_ARGS, "--dev"] }),
  ];
  const [/*extraneousIssues,*/ depsIssues, devDepsIssues] = await Promise.all(
    depIssuePromises
  );
  return [...depsIssues, ...devDepsIssues];
}
