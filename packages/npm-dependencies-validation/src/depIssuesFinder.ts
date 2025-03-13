import { pathExists, readJson } from "fs-extra";
import { dirname, resolve } from "path";
import { compact, map } from "lodash";
import { satisfies } from "semver";
import { PackageJson } from "type-fest";
import {
  DepIssue,
  MismatchDepIssue,
  MissingDepIssue,
  PackageJsonDeps,
  SemVerRange,
} from "./types";
import { retrieveDistTags } from "./utils/npmUtil";
const NO_ISSUES = undefined;
const PKG_JSON_DEFAULT_DEPS: PackageJsonDeps = {
  dependencies: {},
  devDependencies: {},
};
Object.freeze(PKG_JSON_DEFAULT_DEPS);

export async function findDependencyIssues(
  absPath: string
): Promise<DepIssue[]> {
  const isMonorepoFlag = await isMonorepo(absPath);
  const rootDeps = await readRootDeps(absPath);
  const nodeModulesPath = resolve(dirname(absPath), "node_modules");

  const depsIssues = await validateDepsIssues({
    deps: rootDeps.dependencies,
    nodeModulesPath,
    isDev: false,
    isMonorepo: isMonorepoFlag,
  });

  const devDepsIssues = await validateDepsIssues({
    deps: rootDeps.devDependencies,
    nodeModulesPath,
    isDev: true,
    isMonorepo: isMonorepoFlag,
  });

  return [...depsIssues, ...devDepsIssues];
}

async function readRootDeps(
  absPath: string
): Promise<Required<PackageJsonDeps>> {
  const defaultEmptyDepsProps: Required<PackageJsonDeps> = {
    dependencies: {},
    devDependencies: {},
  };

  let depsAndDevDeps: Required<PackageJsonDeps>;
  try {
    depsAndDevDeps = {
      // ensure the `dependencies` and `devDependencies` property **exist**
      ...defaultEmptyDepsProps,
      ...((await readJson(absPath, {
        throws: false,
      })) as PackageJsonDeps),
    };
  } catch {
    return defaultEmptyDepsProps;
  }

  return depsAndDevDeps;
}

async function validateDepsIssues(opts: {
  deps: PackageJsonDeps["dependencies" | "devDependencies"];
  nodeModulesPath: string;
  isDev: boolean;
  isMonorepo: boolean;
}): Promise<DepIssue[]> {
  // using `Promise.all` because `map` is not promise aware.
  // This also means the file system access is done concurrently.
  const allValidationResults: (DepIssue | undefined)[] = await Promise.all(
    map(opts.deps, async (expectedVerRange, depName) => {
      try {
        const depPkgJsonPath = resolve(
          opts.nodeModulesPath,
          depName,
          "package.json"
        );
        return (
          (await validateMissingDep({
            depPkgJsonPath,
            depName,
            isDev: opts.isDev,
            isMonorepo: opts.isMonorepo,
          })) ??
          (await validateMismatchDep({
            depPkgJsonPath,
            depName,
            expectedVerRange,
            isDev: opts.isDev,
            isMonorepo: opts.isMonorepo,
          }))
        );
      } catch (e) {
        // intentionally ignoring promise rejections / exceptions
        // as we are only interested in "real" npm issues we can report to the end user
        /* istanbul ignore next -- Too low benefit for testing this edge case  */
        return NO_ISSUES;
      }
    })
  );

  const actualValidationIssues = compact(allValidationResults);
  return actualValidationIssues;
}

async function validateMissingDep(opts: {
  depPkgJsonPath: string;
  depName: string;
  isDev: boolean;
  isMonorepo: boolean;
}): Promise<MissingDepIssue | undefined> {
  const pkgJsonExists = await pathExists(opts.depPkgJsonPath);
  if (!pkgJsonExists) {
    if (opts.isMonorepo) {
      const depInRootModules = await isDepInRootModules(
        opts.depPkgJsonPath,
        opts.depName
      );
      if (depInRootModules) {
        return NO_ISSUES;
      }
    }
    return {
      type: "missing" as "missing",
      name: opts.depName,
      isDev: opts.isDev,
    };
  } else {
    return NO_ISSUES;
  }
}

async function validateMismatchDep(opts: {
  depPkgJsonPath: string;
  depName: string;
  expectedVerRange: SemVerRange;
  isDev: boolean;
  isMonorepo: boolean;
}): Promise<MismatchDepIssue | undefined> {
  const pkgJsonExists = await pathExists(opts.depPkgJsonPath);
  if (!pkgJsonExists && opts.isMonorepo) {
    opts.depPkgJsonPath = await getDepInRootNodeModules(
      opts.depPkgJsonPath,
      opts.depName
    );
  }
  const { version: actualVersion } = (await readJson(
    opts.depPkgJsonPath
  )) as PackageJson;
  let expectedVerRange = opts.expectedVerRange;

  // edge case of missing `version` property in package.json is ignored
  // or the case of a local file dependency
  if (actualVersion === undefined || expectedVerRange.includes("file:")) {
    return NO_ISSUES;
  }

  let isIssie = false;
  if (!satisfies(actualVersion, expectedVerRange)) {
    // assume it's a disttag, attempt to get the referenced version
    expectedVerRange = await retrieveDistTags(opts);
    if (
      expectedVerRange === opts.expectedVerRange ||
      !satisfies(actualVersion, expectedVerRange)
    ) {
      isIssie = true;
    }
  }
  if (isIssie) {
    return {
      type: "mismatch" as "mismatch",
      name: opts.depName,
      expected: expectedVerRange,
      actual: actualVersion,
      isDev: opts.isDev,
    };
  } else {
    return NO_ISSUES;
  }
}

async function isMonorepo(absPath: string): Promise<boolean> {
  const packageJsonPath = resolve(absPath, "package.json");
  const lernaJsonPath = resolve(absPath, "lerna.json");
  const pnpmWorkspaceYamlPath = resolve(absPath, "pnpm-workspace.yaml");

  // Check for lerna.json or pnpm-workspace.yaml
  if (
    (await pathExists(lernaJsonPath)) ||
    (await pathExists(pnpmWorkspaceYamlPath))
  ) {
    return true;
  }

  // Check for workspaces property in package.json
  if (await pathExists(packageJsonPath)) {
    const packageJson = await readJson(packageJsonPath);
    if (packageJson.workspaces) {
      return true;
    }
  }

  // Check parent directories recursively
  const parentDir = dirname(absPath);
  if (parentDir !== absPath) {
    return isMonorepo(parentDir);
  }

  return false;
}

async function isDepInRootModules(
  depPkgJsonPath: string,
  depName: string
): Promise<boolean> {
  try {
    const pootDepPgkJsonPath = await getDepInRootNodeModules(
      depPkgJsonPath,
      depName
    );
    return await pathExists(pootDepPgkJsonPath);
  } catch (error) {
    console.error(`Error checking if ${depPkgJsonPath} exists: ${error}`);
    return false;
  }
}

async function getDepInRootNodeModules(
  depPkgJsonPath: string,
  depName: string
): Promise<string> {
  const projectRoot = await getProjectRoot(depPkgJsonPath);
  const pootDepPgkJsonPath = resolve(
    projectRoot,
    "node_modules",
    depName,
    "package.json"
  );
  return pootDepPgkJsonPath;
}

async function getProjectRoot(absPath: string): Promise<string> {
  let currentDir = dirname(absPath);

  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = resolve(currentDir, "package.json");
    const lernaJsonPath = resolve(currentDir, "lerna.json");
    const pnpmWorkspaceYamlPath = resolve(currentDir, "pnpm-workspace.yaml");

    // Check for lerna.json
    if (await pathExists(lernaJsonPath)) {
      return currentDir;
    }

    // Check for pnpm-workspace.yaml
    if (await pathExists(pnpmWorkspaceYamlPath)) {
      return currentDir;
    }

    // Check for workspaces property in package.json
    if (await pathExists(packageJsonPath)) {
      const packageJson = await readJson(packageJsonPath);
      if (packageJson.workspaces) {
        return currentDir;
      }
    }

    currentDir = dirname(currentDir);
  }

  throw new Error("Project root with workspaces not found");
}
