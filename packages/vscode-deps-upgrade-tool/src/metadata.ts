import type { extensions, Extension } from "vscode";
import { filter, flatMap, forEach, has, isEmpty, isString, map } from "lodash";
import * as isValidPkgName from "validate-npm-package-name";
import { NodeUpgradeSpec } from "@sap-devx/app-studio-toolkit-types";

export function readUpgradeMetadata(
  allExtensions: readonly Pick<Extension<any>, "packageJSON">[]
): {
  upgrades: NodeUpgradeSpec[];
  issues: string[];
} {
  const upgrades: NodeUpgradeSpec[] = [];
  const issues: string[] = [];
  forEach(allExtensions, (ext) => {
    // many istanbul ignore statements due to:
    // https://github.com/istanbuljs/istanbuljs/issues/526
    const extName = ext.packageJSON.name;
    /* istanbul ignore next */
    const basContributes = ext.packageJSON?.BASContributes;
    /* istanbul ignore next */
    const upgrade = basContributes?.upgrade;
    /* istanbul ignore next */
    const nodesJSUpgrades = upgrade?.nodejs;
    const extUpgrades = nodesJSUpgrades ?? [];

    const extValidUpgrades = filter(extUpgrades, (_) =>
      isEmpty(validateUpgradeSchema(_))
    );
    upgrades.push(...extValidUpgrades);

    const extIssues = flatMap(extUpgrades, validateUpgradeSchema);
    const extIssuesWithPkgNamePrefix = map(
      extIssues,
      (_) => `In extension: <${extName}> nodejs upgrade specs: ${_}`
    );
    issues.push(...extIssuesWithPkgNamePrefix);
  });

  return { upgrades, issues };
}

export function validateUpgradeSchema(
  upgradeSpec: Partial<NodeUpgradeSpec>
): string[] {
  const packagePropIssues = validatePackageProperty(upgradeSpec);
  const versionPropIssues = validateVersionProperty(upgradeSpec);

  return [...packagePropIssues, ...versionPropIssues];
}

export function validatePackageProperty(value: any): string[] {
  const issues: string[] = [];

  if (!has(value, "package")) {
    issues.push("missing `package` property");
  } else {
    const pkgSpec = value.package;
    if (isString(pkgSpec)) {
      if (!isValidPkgName(pkgSpec).validForNewPackages) {
        issues.push("the `package` property must be a valid npm package name");
      }
    } else {
      issues.push("the `package` property must be a string literal");
    }
  }

  return issues;
}

export function validateVersionProperty(value: any): string[] {
  const issues: string[] = [];

  if (!has(value, "version")) {
    issues.push("missing `version` property");
  } else {
    const version = value.version;
    if (has(version, "from")) {
      if (!isString(version.from)) {
        issues.push("`version.from` property must be a string literal");
      }
    } else {
      issues.push("missing `version.from` property");
    }

    if (has(version, "to")) {
      if (!isString(version.to)) {
        issues.push("`version.to` property must be a string literal");
      }
    } else {
      issues.push("missing `version.to` property");
    }
  }

  return issues;
}
