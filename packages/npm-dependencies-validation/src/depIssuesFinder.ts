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

const NO_ISSUES = undefined;
const PKG_JSON_DEFAULT_DEPS: PackageJsonDeps = {
  dependencies: {},
  devDependencies: {},
};
Object.freeze(PKG_JSON_DEFAULT_DEPS);

export async function findDependencyIssues(
  absPath: string
): Promise<DepIssue[]> {
  const rootDeps = await readRootDeps(absPath);
  const nodeModulesPath = resolve(dirname(absPath), "node_modules");

  const depsIssues = await validateDepsIssues({
    deps: rootDeps.dependencies,
    nodeModulesPath,
    isDev: false,
  });

  const devDepsIssues = await validateDepsIssues({
    deps: rootDeps.devDependencies,
    nodeModulesPath,
    isDev: true,
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
          })) ??
          (await validateMismatchDep({
            depPkgJsonPath,
            depName,
            expectedVerRange,
            isDev: opts.isDev,
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
}): Promise<MissingDepIssue | undefined> {
  const pkgJsonExists = await pathExists(opts.depPkgJsonPath);
  if (!pkgJsonExists) {
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
}): Promise<MismatchDepIssue | undefined> {
  const { version: actualVersion } = (await readJson(
    opts.depPkgJsonPath
  )) as PackageJson;

  // edge case of missing `version` property in package.json is ignored
  if (actualVersion === undefined) {
    return NO_ISSUES;
  }

  if (!satisfies(actualVersion, opts.expectedVerRange)) {
    return {
      type: "mismatch" as "mismatch",
      name: opts.depName,
      expected: opts.expectedVerRange,
      actual: actualVersion,
      isDev: opts.isDev,
    };
  } else {
    return NO_ISSUES;
  }
}
