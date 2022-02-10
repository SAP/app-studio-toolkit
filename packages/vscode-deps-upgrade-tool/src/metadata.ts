import type { extensions } from "vscode";
import { filter, map, isEmpty, isArray, flatten, has, isString } from "lodash";
import { parse as parseSemVer } from "semver";
import * as isValidPkgName from "validate-npm-package-name";
import { NodeUpgradeSpec } from "@sap-devx/app-studio-toolkit-types";

export function readUpgradeMetadata(
  allExtensions: typeof extensions.all
): NodeUpgradeSpec[] {
  const allUpgradeSpec: any[] = map(
    allExtensions,
    (_) => _.packageJSON?.BASContributes?.upgrade?.nodejs as unknown
  );
  const nonEmptyUpgradeSpecs: NodeUpgradeSpec[][] = filter(
    allUpgradeSpec,
    (_) => {
      return _ !== undefined && isArray(_) && !isEmpty(_);
    }
  );

  const flatNodeUpgradeSpec: NodeUpgradeSpec[] = flatten(nonEmptyUpgradeSpecs);

  const validUpgradeSpec: NodeUpgradeSpec[] = filter(
    flatNodeUpgradeSpec,
    matchesUpgradeSchema
  );

  return validUpgradeSpec;
}

export function matchesUpgradeSchema(
  upgradeSpec: Partial<NodeUpgradeSpec>
): boolean {
  if (!has(upgradeSpec, "version")) {
    return false;
  }

  return true;
}

export function matchPackageProperty(
  value: any
): value is Pick<NodeUpgradeSpec, "package"> {
  // top level properties
  if (!has(value, "package")) {
    return false;
  } else {
    const pkgSpec = value.package;
    if (isString(pkgSpec)) {
      if (!isValidPkgName(pkgSpec)) {
        return false;
      }
    } else if (isFromToObjSpec(pkgSpec)) {
      if (!matchFromToProp(pkgSpec.from) || !matchFromToProp(pkgSpec.to)) {
        return false;
      }
    } else {
      // neither `string` nor { from:string, to:string }
      return false;
    }
  }

  // alles goot
  return true;
}

export function isFromToObjSpec(value: any): value is { from: any; to: any } {
  return has(value, "from") && has(value, "from");
}

export function matchFromToProp(value: any): value is string {
  if (!isString(value)) {
    return false;
  } else if (parseSemVer(value) === null) {
    return false;
  }

  return true;
}
