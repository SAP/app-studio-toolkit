import { resolve, dirname } from "path";
import { isCurrentlySupported, readJsonFile } from "./utils/packageJsonUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import {
  DependenciesPropertyName,
  NPMDependencyIssue,
  NpmLsDependencies,
  PackageJson,
  NpmLsIssueType,
  NpmLsDependencyWithIssue,
  NpmLsResult,
  NpmLsDependenciesWithIssues,
  NpmLsDependency,
} from "./types";

// ls --depth=0 shows only top-level dependencies
const LS_ARGS: string[] = ["ls", "--depth=0"]; //TODO: without --no-package-lock issues are not returned when there is package-lock.json
// TODO: with --no-package-lock all missing dependencies are installed

async function listNodeModulesDeps(
  config: DepIssuesConfig
): Promise<NpmLsResult> {
  const { packageJsonPath, lsArgs } = config;
  return invokeNPMCommand<NpmLsResult>(
    lsArgs,
    resolve(dirname(packageJsonPath))
  );
}

function isDependencyWithIssue(npmLsDep: NpmLsDependency): boolean {
  const npmLsDepWithIssue = npmLsDep as NpmLsDependencyWithIssue;
  return (
    !!npmLsDepWithIssue.extraneous ||
    !!npmLsDepWithIssue.missing ||
    !!npmLsDepWithIssue.invalid
  );
}

function getIssueType(
  dependencyWithIssue: NpmLsDependencyWithIssue
): NpmLsIssueType {
  if (dependencyWithIssue.missing) return "missing";
  if (dependencyWithIssue.invalid) return "invalid";
  return "extraneous";
}

function getVersion(
  dependencyWithIssue: NpmLsDependencyWithIssue,
  devDepenedncy: boolean,
  packageJson: PackageJson,
  depName: string
): string | undefined {
  const version = dependencyWithIssue.required || dependencyWithIssue.version;

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

function getDependenciesWithIssues(
  npmLsDeps: NpmLsDependencies
): NpmLsDependenciesWithIssues {
  const npmLsDepsWithIssues: NpmLsDependenciesWithIssues = {};
  for (const depName in npmLsDeps) {
    const npmLsDep: NpmLsDependency = npmLsDeps[depName];

    if (isDependencyWithIssue(npmLsDep)) {
      npmLsDepsWithIssues[depName] = npmLsDep as NpmLsDependencyWithIssue;
    }
  }

  return npmLsDepsWithIssues;
}

async function createDependencyIssues(
  config: DepIssuesConfig,
  packageJson: PackageJson
): Promise<NPMDependencyIssue[]> {
  const { dependencies } = await listNodeModulesDeps(config);
  const npmLsDepsWithIssues = getDependenciesWithIssues(dependencies);
  const devDependency = config.lsArgs.includes("--dev");

  return constructNPMDepIssues(npmLsDepsWithIssues, devDependency, packageJson);
}

function constructNPMDepIssues(
  npmLsDepsWithIssues: NpmLsDependenciesWithIssues,
  devDependency: boolean,
  packageJson: PackageJson
): NPMDependencyIssue[] {
  const npmDepsWithIssues: NPMDependencyIssue[] = [];
  for (const name in npmLsDepsWithIssues) {
    const depWithissue = npmLsDepsWithIssues[name];

    const type = getIssueType(depWithissue);

    const version = getVersion(depWithissue, devDependency, packageJson, name);
    if (!version) continue;

    npmDepsWithIssues.push({
      name,
      version,
      type,
      devDependency,
      problems: depWithissue.problems,
    });
  }

  return npmDepsWithIssues;
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
