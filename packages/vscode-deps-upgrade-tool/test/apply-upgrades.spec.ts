import { resolve } from "path";
import { expect } from "chai";
import { readFile, writeFile, readJson } from "fs-extra";
import { URI } from "vscode-uri";
import { PackageJson } from "type-fest";
import {
  applyUpgrades,
  computeEditedPkgText,
  pickApplicableUpgrades,
  createTextEditsForUpgrade,
} from "../src/apply-upgrades";
import { applyEdits } from "jsonc-parser";

describe("`apply-upgrades` module ", () => {
  describe("`applyUpgrades()` function", () => {
    let fixturePath: string;
    let originalFixtureText: string;

    before(async () => {
      // relative to `dist` folder output
      fixturePath = resolve(
        __dirname,
        "..",
        "..",
        "test",
        "fixtures",
        "apply-upgrades",
        "package.json"
      );
      originalFixtureText = await readFile(fixturePath, "utf-8");
      const fixtureVal = JSON.parse(originalFixtureText);
      // ensure the fixture was reverted to its "original" form
      expect(fixtureVal.dependencies["@ui5/cli"]).to.equal("1.12.2");
      expect(fixtureVal.devDependencies["mocha"]).to.equal("7.10.1");
    });

    it("Can perform version upgrades at the file system level", async () => {
      const upgrades = [
        {
          package: "@ui5/cli",
          version: {
            from: "^1.12.0",
            to: "^2.11",
          },
        },
        {
          package: "mocha",
          version: {
            from: "^7.0.0",
            to: "^8.0.0",
          },
        },
      ];

      const fixtureUri = URI.file(fixturePath);
      await applyUpgrades([fixtureUri], upgrades);
      const fixtureValAfter = await readJson(fixturePath);
      expect(fixtureValAfter.dependencies["@ui5/cli"]).to.equal("^2.11");
      expect(fixtureValAfter.devDependencies["mocha"]).to.equal("^8.0.0");
    });

    after(async () => {
      // revert
      await writeFile(fixturePath, originalFixtureText);
    });
  });

  describe("`computeEditedPkgText()` function", () => {
    it("will compute upgrade edits for both dependencies and dev-dependencies", () => {
      const pkgJsonValue: PackageJson = {
        name: "OnlyDeps",
        dependencies: {
          "@ui5/cli": "1.12.2",
          lodash: "4.17.0",
        },
        devDependencies: {
          mocha: "7.10.1",
        },
      };

      const pkgJsonText = JSON.stringify(pkgJsonValue, null, 2);

      const upgrades = [
        {
          package: "@ui5/cli",
          version: {
            from: "^1.12.0",
            to: "^2.11",
          },
        },
        {
          package: "mocha",
          version: {
            from: "^7.0.0",
            to: "^8.0.0",
          },
        },
      ];

      const editedPkgJsonText = computeEditedPkgText(
        pkgJsonText,
        pkgJsonValue,
        upgrades
      );

      const editedPkgJsonValue = JSON.parse(editedPkgJsonText);
      expect(editedPkgJsonValue).to.deep.equal({
        name: "OnlyDeps",
        dependencies: {
          "@ui5/cli": "^2.11",
          lodash: "4.17.0",
        },
        devDependencies: {
          mocha: "^8.0.0",
        },
      });
    });
  });

  describe("`pickApplicableUpgrades()` function", () => {
    context("valid", () => {
      const additionalUpgrades = [
        {
          package: "lodash",
          version: {
            from: "^4.0.0",
            to: "^4.17.0",
          },
        },
      ];

      it("will pick exact version matches", () => {
        const deps = {
          "@ui5/cli": "1.12.0-beta",
        };

        const upgradesToPick = [
          {
            package: "@ui5/cli",
            version: {
              from: "1.12.0-beta",
              to: "1.12.3",
            },
          },
        ];
        const upgrades = [...upgradesToPick, ...additionalUpgrades];

        const pickedUpgrades = pickApplicableUpgrades(deps, upgrades);
        expect(pickedUpgrades).to.deep.equal(upgradesToPick);
      });

      it("will pick when the version satisfies the upgrade range", () => {
        const deps = {
          "@ui5/cli": "1.13.0",
        };

        const upgradesToPick = [
          {
            package: "@ui5/cli",
            version: {
              from: "^1.12.0",
              to: "^1.12.3",
            },
          },
        ];
        const upgrades = [...upgradesToPick, ...additionalUpgrades];

        const pickedUpgrades = pickApplicableUpgrades(deps, upgrades);
        expect(pickedUpgrades).to.deep.equal(upgradesToPick);
      });

      it("will pick when the version range is strictly contained in the upgrade range", () => {
        const deps = {
          "@ui5/cli": "^1.13.0",
        };

        const upgradesToPick = [
          {
            package: "@ui5/cli",
            version: {
              from: "^1.12.0",
              to: "^1.12.3",
            },
          },
        ];
        const upgrades = [...upgradesToPick, ...additionalUpgrades];

        const pickedUpgrades = pickApplicableUpgrades(deps, upgrades);
        expect(pickedUpgrades).to.deep.equal(upgradesToPick);
      });
    });

    context("invalid", () => {
      it("will not pick when the version is not a string literal", () => {
        const deps: any = {
          "@ui5/cli": 666,
        };

        const upgrades = [
          {
            package: "@ui5/cli",
            version: {
              from: "^1.12.0",
              to: "^1.12.3",
            },
          },
        ];

        const pickedUpgrades = pickApplicableUpgrades(deps, upgrades);
        expect(pickedUpgrades).to.be.empty;
      });

      it("will not pick when the version does not satisfies the upgrade range", () => {
        const deps: any = {
          // 1.10.0 ∉ ^1.12.0
          "@ui5/cli": "1.10.0",
        };

        const upgrades = [
          {
            package: "@ui5/cli",
            version: {
              from: "^1.12.0",
              to: "^1.12.3",
            },
          },
        ];

        const pickedUpgrades = pickApplicableUpgrades(deps, upgrades);
        expect(pickedUpgrades).to.be.empty;
      });

      it("will not pick when the target package when no deps are provided", () => {
        const upgrades = [
          {
            package: "@ui5/cli",
            version: {
              from: "^1.12.0",
              to: "^1.12.3",
            },
          },
        ];

        const pickedUpgrades = pickApplicableUpgrades(undefined, upgrades);
        expect(pickedUpgrades).to.be.empty;
      });
    });
  });

  describe("`createTextEditsForUpgrade()` function", () => {
    it("can create edits for `dependencies`", () => {
      const pkgJson: PackageJson = {
        name: "OnlyDeps",
        dependencies: {
          "@ui5/cli": "1.12.2",
        },
      };

      const pkgJsonText = JSON.stringify(pkgJson, null, 2);

      const upgrades = [
        {
          package: "@ui5/cli",
          version: {
            from: "^1.12.0",
            to: "^2.11",
          },
        },
      ];

      const edits = createTextEditsForUpgrade(
        pkgJsonText,
        upgrades,
        "dependencies"
      );

      expect(edits).to.have.lengthOf(1);
      const editedPkgJsonText = applyEdits(pkgJsonText, edits);
      const editedPkgJson = JSON.parse(editedPkgJsonText);
      expect(editedPkgJson).to.deep.equal({
        name: "OnlyDeps",
        dependencies: {
          "@ui5/cli": "^2.11",
        },
      });
    });

    it("can create edits for `devDependencies`", () => {
      const pkgJson: PackageJson = {
        name: "OnlyDeps",
        devDependencies: {
          "@ui5/cli": "1.12.2",
        },
      };

      const pkgJsonText = JSON.stringify(pkgJson, null, 2);

      const upgrades = [
        {
          package: "@ui5/cli",
          version: {
            from: "^1.12.0",
            to: "^2.11",
          },
        },
      ];

      const edits = createTextEditsForUpgrade(
        pkgJsonText,
        upgrades,
        "devDependencies"
      );

      expect(edits).to.have.lengthOf(1);
      const editedPkgJsonText = applyEdits(pkgJsonText, edits);
      const editedPkgJson = JSON.parse(editedPkgJsonText);
      expect(editedPkgJson).to.deep.equal({
        name: "OnlyDeps",
        devDependencies: {
          "@ui5/cli": "^2.11",
        },
      });
    });
  });
});
