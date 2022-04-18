import type { Uri } from "vscode";
import type { PackageJson } from "type-fest";
import { Edit, JSONPath, modify, applyEdits } from "jsonc-parser";
import { flatMap, filter, isString } from "lodash";
import { satisfies, subset, valid, validRange } from "semver";
import { readFile, writeFile } from "fs-extra";
import { NodeUpgradeSpec } from "@sap-devx/app-studio-toolkit-types";
import { getLogger } from "./logger";

export async function applyUpgrades(
  pkgJsonUris: Uri[],
  upgrades: NodeUpgradeSpec[]
): Promise<void> {
  for (const pkgUri of pkgJsonUris) {
    try {
      const pkgText = await readFile(pkgUri.fsPath, "utf-8");
      const pkgValue = JSON.parse(pkgText);
      const editedText = computeEditedPkgText(pkgText, pkgValue, upgrades);
      await persistToFs(pkgUri, editedText);
    } catch (e) {
      /* istanbul ignore next -- edge case of extreme failure, not worth testing */
      getLogger().error(`failed to upgrade ${pkgUri.fsPath}`, {
        errMsg: e.message,
      });
    }
  }
}

export function computeEditedPkgText(
  pkgText: string,
  pkgValue: PackageJson,
  upgrades: NodeUpgradeSpec[]
) {
  const depsUpgrades = pickApplicableUpgrades(pkgValue.dependencies, upgrades);
  const devDepsUpgrades = pickApplicableUpgrades(
    pkgValue.devDependencies,
    upgrades
  );
  const depsTextEdits = createTextEditsForUpgrade(
    pkgText,
    depsUpgrades,
    "dependencies"
  );
  const devDepsTextEdits = createTextEditsForUpgrade(
    pkgText,
    devDepsUpgrades,
    "devDependencies"
  );
  const editedText = applyEdits(pkgText, [
    ...depsTextEdits,
    ...devDepsTextEdits,
  ]);

  return editedText;
}

export function pickApplicableUpgrades(
  deps: PackageJson["dependencies" | "devDependencies"],
  upgrades: NodeUpgradeSpec[]
): NodeUpgradeSpec[] {
  const applicableUpgrades = filter(upgrades, (_) => {
    const depName = _.package;
    const pkgJsonVersion = deps?.[depName];
    const upgradeFrom = _.version.from;

    if (!isString(pkgJsonVersion)) {
      return false;
    }

    // strict equality matching allows limited support for none semVer versions
    const isExactVersionMatch = pkgJsonVersion === upgradeFrom;
    const isVersionInRangeMatch = !!(
      valid(pkgJsonVersion) && satisfies(pkgJsonVersion, upgradeFrom)
    );
    // If the version in the pkg.json is a range, it must be a subset of the `upgradeFrom` version, e.g:
    // - [^1.1.6] ∈ [^1.1.1]
    // - [^1.1.1] ∉ [^1.1.6]  (1.1.1, 1.1.2,...) are not contained in ^1.1.6 which means x >=1.1.6 AND x <2.0.0
    const isRangeSubsetMatch = !!(
      validRange(pkgJsonVersion) && subset(pkgJsonVersion, upgradeFrom)
    );

    return isExactVersionMatch || isVersionInRangeMatch || isRangeSubsetMatch;
  });

  return applicableUpgrades;
}

export function createTextEditsForUpgrade(
  pkgText: string,
  upgrades: NodeUpgradeSpec[],
  devProp: keyof Pick<PackageJson, "dependencies" | "devDependencies">
): Edit[] {
  const allEdits = flatMap(upgrades, (_) => {
    const depName = _.package;
    const depPath: JSONPath = [devProp, depName];

    return modify(pkgText, depPath, _.version.to, {});
  });
  return allEdits;
}

export async function persistToFs(pkgUri: Uri, pkgText: string): Promise<void> {
  await writeFile(pkgUri.fsPath, pkgText);
}
