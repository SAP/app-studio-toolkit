import type { extensions } from "vscode";
import { filter, map, isEmpty, isArray, flatten, has, isString } from "lodash";
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

  // todo: log errors somewhere
  // todo: how to link errors back to **exact** extensions which provided them
  const validUpgradeSpec: NodeUpgradeSpec[] = filter(
    flatNodeUpgradeSpec,
    matchesUpgradeSchema
  );

  return validUpgradeSpec;
}

export function matchesUpgradeSchema(
  upgradeSpec: Partial<NodeUpgradeSpec>
): boolean {
  if (!matchPackageProperty(upgradeSpec.package)) {
    return false;
  }

  if (!matchVersionProperty(upgradeSpec.version)) {
    return false;
  }

  return true;
}

export function matchPackageProperty(
  value: any
): value is NodeUpgradeSpec["package"] {
  if (!has(value, "package")) {
    return false;
  } else {
    const pkgSpec = value.package;
    if (isString(pkgSpec)) {
      if (!isValidPkgName(pkgSpec)) {
        return false;
      }
    } else {
      return false;
    }
  }

  // alles goot
  return true;
}

export function matchVersionProperty(
  value: any
): value is NodeUpgradeSpec["version"] {
  if (!has(value, "package")) {
    return false;
  } else {
    const versionSpec = value.version;
    if (!isFromToObjSpec(versionSpec)) {
      return false;
    }
  }

  // alles goot
  return true;
}

export function isFromToObjSpec(value: any): value is { from: any; to: any } {
  if (has(value, "from")) {
    if (!matchFromOrToProp(value.from)) {
      return false;
    }
  } else {
    return false;
  }

  if (has(value, "to")) {
    if (!matchFromOrToProp(value.to)) {
      return false;
    }
  } else {
    return false;
  }

  // alles goot
  return true;
}

export function matchFromOrToProp(value: any): value is string {
  // we are not matching for exact SemVer strings or SemVer ranges because
  // a package may use a none SemVer identifier for the versions
  // and rely on strict version equality for applying the upgrade
  if (!isString(value)) {
    return false;
  }

  return true;
}
