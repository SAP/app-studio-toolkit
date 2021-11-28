import { resolve, dirname } from "path";
import { isCurrentlySupported, readJsonFile } from "./utils/packageJsonUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import {
  DependenciesPropertyName,
  NPMDependencyIssue,
  NPMDependencyWithIssue,
  NPMIssueType,
  NpmLsDependencies,
  PackageJson,
  InvalidDependency,
  MissingDependency,
  ExtraneousDependency,
} from "./types";

// ls --depth=0 shows only top-level dependencies
const LS_ARGS: string[] = ["ls", "--depth=0"];

async function listNodeModulesDeps(
  config: DepIssuesConfig
): Promise<NpmLsDependencies> {
  return invokeNPMCommand<NpmLsDependencies>(
    config.lsArgs,
    resolve(dirname(config.packageJsonPath))
  );
}

function isMissingDependency(
  dependencyWithIssue: NPMDependencyWithIssue
): dependencyWithIssue is MissingDependency {
  return "missing" in dependencyWithIssue;
}

function isInvalidDependency(
  dependencyWithIssue: NPMDependencyWithIssue
): dependencyWithIssue is InvalidDependency {
  return "invalid" in dependencyWithIssue;
}

function isExtraneousDependency(
  dependencyWithIssue: NPMDependencyWithIssue
): dependencyWithIssue is ExtraneousDependency {
  return "extraneous" in dependencyWithIssue;
}

function getIssueType(
  dependencyWithIssue: NPMDependencyWithIssue
): NPMIssueType | undefined {
  if (isMissingDependency(dependencyWithIssue)) return "missing";
  if (isInvalidDependency(dependencyWithIssue)) return "invalid";
  if (isExtraneousDependency(dependencyWithIssue)) return "extraneous";

  return undefined;
}

function getVersion(
  dependencyWithIssue: NPMDependencyWithIssue,
  devDepenedncy: boolean,
  packageJson: PackageJson,
  depName: string
): string | undefined {
  let version: string | undefined;
  if (isMissingDependency(dependencyWithIssue)) {
    version = dependencyWithIssue.required;
  } else if (isInvalidDependency(dependencyWithIssue)) {
    version = dependencyWithIssue.version;
  } else if (isExtraneousDependency(dependencyWithIssue)) {
    version = dependencyWithIssue.version;
  }

  return (
    version ?? getVersionFromPackageJson(depName, devDepenedncy, packageJson)
  );
}

function getVersionFromPackageJson(
  depName: string,
  devDepenedncy: boolean,
  packageJson: PackageJson
): string | undefined {
  const depsPropName: DependenciesPropertyName = devDepenedncy
    ? "devDependencies"
    : "dependencies";
  return packageJson[depsPropName]?.[depName];
}

type DepIssuesConfig = {
  packageJsonPath: string;
  lsArgs: string[];
};

async function createDependencyIssues(
  config: DepIssuesConfig,
  packageJson: PackageJson
): Promise<NPMDependencyIssue[]> {
  const { dependencies } = await listNodeModulesDeps(config);
  const devDependency = config.lsArgs.includes("--dev");

  const depWithIssues: NPMDependencyIssue[] = [];
  for (const depName in dependencies) {
    const dependencyWithIssue: NPMDependencyWithIssue = dependencies[depName];

    const type: NPMIssueType | undefined = getIssueType(dependencyWithIssue);
    const version: string | undefined = getVersion(
      dependencyWithIssue,
      devDependency,
      packageJson,
      depName
    );
    if (type && version) {
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

export async function findDependencyIssues(
  packageJsonPath: string
): Promise<NPMDependencyIssue[]> {
  const currentlySupported = await isCurrentlySupported(packageJsonPath);
  if (!currentlySupported) return [];

  const packageJson = await readJsonFile(packageJsonPath);
  const depIssuePromises = [
    // in order to get all types of dependency issue ls --depth=0 command should be executed twice:
    //    1. ls --depth=0 ---> returns extraneous packages and dependencies issies
    //    2. ls --depth=0 --dev ---> returns devDependencies issues
    // all list are independent and describe different types of issues
    // creates dependencies issues and extraneous packages
    createDependencyIssues(
      { packageJsonPath, lsArgs: [...LS_ARGS] },
      packageJson
    ),
    // creates devDependencies issues
    createDependencyIssues(
      { packageJsonPath, lsArgs: [...LS_ARGS, "--dev"] },
      packageJson
    ),
  ];
  const [depsIssues, devDepsIssues] = await Promise.all(depIssuePromises);
  return [...depsIssues, ...devDepsIssues];
}
