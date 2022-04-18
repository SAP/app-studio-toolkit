import { resolve } from "path";
import { readJsonSync } from "fs-extra";
import { expect } from "chai";
import { forEach, values, keys } from "lodash";
import {
  CONFIG_PROPS_AND_FULL_NAME,
  CONFIG_PROPS_AND_DEFAULTS,
  ConfigPropsKeys,
} from "../src/settings";

describe("`settings` module ", () => {
  const pkgJsonPath = resolve(__dirname, "..", "..", "package.json");
  const pkgJsonValue = readJsonSync(pkgJsonPath);

  describe("`CONFIG_PROPS_AND_FULL_NAME` property", () => {
    context(
      "`CONFIG_PROPS_AND_FULL_NAME` is subset of `contributes.configuration.properties`",
      () => {
        forEach(CONFIG_PROPS_AND_FULL_NAME, (vscodeSettingFQN) => {
          it(`settings \`${vscodeSettingFQN}\` is defined in package.json`, () => {
            const pkgJsonProps =
              pkgJsonValue?.contributes?.configuration?.properties;
            expect(pkgJsonProps).to.have.property(vscodeSettingFQN);
          });
        });
      }
    );

    context(
      "`contributes.configuration.properties` is subset of `CONFIG_PROPS_AND_FULL_NAME`",
      () => {
        const pkgJsonProps =
          pkgJsonValue?.contributes?.configuration?.properties;
        forEach(pkgJsonProps, (_, vscodeSettingFQN) => {
          it(`settings \`${vscodeSettingFQN}\` is defined in \`CONFIG_PROPS_AND_FULL_NAME\``, () => {
            expect(values(CONFIG_PROPS_AND_FULL_NAME)).to.include(
              vscodeSettingFQN
            );
          });
        });
      }
    );
  });

  describe("`CONFIG_PROPS_AND_DEFAULTS` property", () => {
    it("has exactly the same keys as `CONFIG_PROPS_AND_FULL_NAME`", () => {
      expect(keys(CONFIG_PROPS_AND_DEFAULTS)).to.deep.equal(
        keys(CONFIG_PROPS_AND_FULL_NAME)
      );
    });

    context(
      "`CONFIG_PROPS_AND_DEFAULTS` values match those in the package.json['contributes.configuration.properties']`",
      () => {
        forEach(
          CONFIG_PROPS_AND_DEFAULTS,
          (defaultPropValue, shortPropName) => {
            const vscodeSettingFQN =
              CONFIG_PROPS_AND_FULL_NAME[shortPropName as ConfigPropsKeys];
            it(`settings \`${vscodeSettingFQN}\` default value is aligned`, () => {
              const pkgJsonProps =
                pkgJsonValue?.contributes?.configuration?.properties;
              const defaultPkgJsonValue =
                pkgJsonProps?.[vscodeSettingFQN]?.default;
              expect(defaultPropValue).to.equal(defaultPkgJsonValue);
            });
          }
        );
      }
    );
  });
});
