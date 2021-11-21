import { resolve, dirname } from "path";
import { isCurrentlySupported } from "./utils/packageJsonUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import {
  Dependency,
  NPMDependencyIssue,
  NPMIssueType,
  NpmLsRDependencies,
  VscodeUri,
} from "./types";

// ls --depth=0 shows only top-level dependencies

// dependencies and extraneous packages
const LS_ARGS = ["ls", "--depth=0"];
// devDependencies
const LS_DEV_ARGS = [...LS_ARGS, "--dev"];

async function listNodeModulesDeps(
  config: DepIssuesConfig
): Promise<NpmLsRDependencies> {
  return invokeNPMCommand<NpmLsRDependencies>(
    config.devDependency ? [...LS_DEV_ARGS] : [...LS_ARGS],
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
  devDependency: boolean;
};

async function createDependencyIssues(
  config: DepIssuesConfig
): Promise<NPMDependencyIssue[]> {
  const { dependencies } = await listNodeModulesDeps(config);

  const depWithIssues: NPMDependencyIssue[] = [];
  for (const depName in dependencies) {
    const dependency: Dependency = dependencies[depName];

    const type = getIssueType(dependency);
    const version = getVersion(dependency);
    if (type && version) {
      depWithIssues.push({
        name: depName,
        version,
        type,
        devDependency: config.devDependency,
      });
    }
  }

  return depWithIssues;
}

export async function findDependencyIssues(
  uri: VscodeUri
): Promise<NPMDependencyIssue[]> {
  const currentlySupported = await isCurrentlySupported(uri);
  if (!currentlySupported) return [];

  const packageJsonPath = uri.fsPath;
  const depIssuePromises = [
    // in order to get all types of dependency issue ls --depth=0 command should be executed twice:
    //    1. ls --depth=0 ---> returns extraneous packages and dependeny issues
    //    2. ls --depth=0 ---> returns devDependencies issues
    // both list are independent and describe different types of issues
    // creates extraneous packages and dependeny issues
    createDependencyIssues({ packageJsonPath, devDependency: false }),
    // creates devDependencies issues
    createDependencyIssues({ packageJsonPath, devDependency: true }),
  ];
  const [depsAndRedundantIssues, devDepsIssues] = await Promise.all(
    depIssuePromises
  );
  return [...depsAndRedundantIssues, ...devDepsIssues];
}
