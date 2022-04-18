import { expect } from "chai";
import {
  readUpgradeMetadata,
  validateUpgradeSchema,
  validatePackageProperty,
  validateVersionProperty,
} from "../src/metadata";

describe("`metadata` module ", () => {
  describe("`readUpgradeMetadata()` function ", () => {
    it("will aggregate metadata from the extensions", () => {
      const ui5CliUpgrade = {
        package: "@ui5/cli",
        version: {
          from: "^1.12.0",
          to: "^2.11",
        },
      };

      const eslintUpgrade = {
        package: "eslint",
        version: {
          from: "^7.0.0",
          to: "^8.11.0",
        },
      };

      const allExtensions = [
        {
          packageJSON: {
            BASContributes: {
              upgrade: {
                nodejs: [ui5CliUpgrade],
              },
            },
          },
        },
        {
          packageJSON: {
            BASContributes: {
              upgrade: {
                nodejs: [eslintUpgrade],
              },
            },
          },
        },
      ];
      const { upgrades, issues } = readUpgradeMetadata(allExtensions);

      expect(issues).to.be.empty;
      expect(upgrades).to.deep.equalInAnyOrder([ui5CliUpgrade, eslintUpgrade]);
    });

    it("will exclude invalid metadata from the aggregation", () => {
      const ui5CliUpgrade = {
        package: "@ui5/cli",
        version: {
          from: "^1.12.0",
          to: "^2.11",
        },
      };

      const eslintUpgradeInvalid = {
        package: "eslint",
        version: {
          fromTypo: "^7.0.0",
          to: "^8.11.0",
        },
      };

      const allExtensions = [
        {
          packageJSON: {
            BASContributes: {
              upgrade: {
                nodejs: [ui5CliUpgrade],
              },
            },
          },
        },
        {
          packageJSON: {
            BASContributes: {
              upgradeTypo: {
                nodejs: [],
              },
            },
          },
        },
        {
          packageJSON: {
            name: "Foo",
            BASContributes: {
              upgrade: {
                nodejs: [eslintUpgradeInvalid],
              },
            },
          },
        },
      ];
      const { upgrades, issues } = readUpgradeMetadata(allExtensions);

      expect(issues).to.deep.equal([
        "In extension: <Foo> nodejs upgrade specs: missing `version.from` property",
      ]);
      expect(upgrades).to.deep.equalInAnyOrder([ui5CliUpgrade]);
    });
  });

  describe("`validateUpgradeSchema()` function ", () => {
    context("invalid", () => {
      it("will detect both `package` and `version` issues", () => {
        const issues = validateUpgradeSchema({
          // @ts-expect-error -- intentional wrong input
          package: 666,
          version: {
            from: "^1.12.0",
            // @ts-expect-error -- intentional wrong input
            toTypo: "^2.11",
          },
        });

        expect(issues).to.have.lengthOf(2);
        expect(issues).to.deep.equalInAnyOrder([
          "the `package` property must be a string literal",
          "missing `version.to` property",
        ]);
      });
    });

    context("valid", () => {
      it("will not detect issues for valid upgrade specs", () => {
        const issues = validateUpgradeSchema({
          package: "@ui5/cli",
          version: {
            from: "^1.12.0",
            to: "^2.11",
          },
        });

        expect(issues).to.be.empty;
      });
    });
  });

  describe("`validatePackageProperty()` function ", () => {
    context("invalid", () => {
      it("will detect missing `package` property", () => {
        const packageProp = {
          packageTypo: "@ui5/cli",
        };

        const issues = validatePackageProperty(packageProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(/missing .package. property/);
      });

      it("will detect a none string type `package` property", () => {
        const packageProp = {
          package: /not-a-string/,
        };

        const issues = validatePackageProperty(packageProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(
          /the .package. property must be a string literal/
        );
      });

      it("will detect an invalid npm name `package` property", () => {
        const packageProp = {
          package: "UPPER_CASE_NOT_ALLOWED",
        };

        const issues = validatePackageProperty(packageProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(
          /the .package. property must be a valid npm package name/
        );
      });
    });

    context("valid", () => {
      it("will not detect issues for a valid Package prop", () => {
        const packageProp = {
          package: "@ui5/cli",
        };

        const issues = validatePackageProperty(packageProp);
        expect(issues).to.be.empty;
      });
    });
  });

  describe("`validateVersionProperty()` function ", () => {
    context("invalid", () => {
      it("will detect missing `version` property", () => {
        const versionProp = {
          versionTypo: {
            from: "^7.0.0",
            to: "^8.11.0",
          },
        };

        const issues = validateVersionProperty(versionProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(/missing .version. property/);
      });

      it("will detect missing `version.from` property", () => {
        const versionProp = {
          version: {
            fromTypo: "^7.0.0",
            to: "^8.11.0",
          },
        };

        const issues = validateVersionProperty(versionProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(/missing .version\.from. property/);
      });

      it("will detect missing `version.to` property", () => {
        const versionProp = {
          version: {
            from: "^7.0.0",
            toTypo: "^8.11.0",
          },
        };

        const issues = validateVersionProperty(versionProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(/missing .version\.to. property/);
      });

      it("will detect a none string type `version.from` property", () => {
        const versionProp = {
          version: {
            from: 666,
            to: "^8.11.0",
          },
        };

        const issues = validateVersionProperty(versionProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(
          /.version\.from. property must be a string literal/
        );
      });

      it("will detect a none string type `version.to` property", () => {
        const versionProp = {
          version: {
            from: "^7.0.0",
            to: 666,
          },
        };

        const issues = validateVersionProperty(versionProp);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0]).to.match(
          /.version\.to. property must be a string literal/
        );
      });
    });

    context("valid", () => {
      it("will not detect issues for a valid version prop", () => {
        const versionProp = {
          version: {
            from: "^7.0.0",
            to: "^8.11.0",
          },
        };

        const issues = validateVersionProperty(versionProp);
        expect(issues).to.be.empty;
      });
    });
  });
});
