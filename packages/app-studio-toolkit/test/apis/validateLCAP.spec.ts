import * as proxyquire from "proxyquire";
import { expect } from "chai";
import { mockVscode } from "../mockUtil";

const testVscode = {
  window: {
    createOutputChannel: () => "",
  },
  ExtensionContext: {},
};

mockVscode(testVscode, "dist/src/logger/logger.js");
import { isLCAPEnabled } from "../../src/apis/validateLCAP";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";

describe("validate LCAP  API", () => {
  it("should return undefined", async () => {
    const parameterValue = await isLCAPEnabled();
    expect(parameterValue).to.be.undefined;
  });

  describe("when is lcap is not found", () => {
    let isLCAPEnabled: BasToolkit["isLCAPEnabled"];

    before(() => {
      const validateLCAPModule = proxyquire("../../src/apis/validateLCAP", {
        "../utils/optional-require": {
          optionalRequire() {
            const sapPlugin = {
              window: {
                isLCAPEnabled: () => undefined,
              },
            };
            return sapPlugin;
          },
        },
      });

      isLCAPEnabled = validateLCAPModule.isLCAPEnabled;
    });

    it("should return undefined", async () => {
      const parameterValue = await isLCAPEnabled();
      expect(parameterValue).to.be.undefined;
    });
  });

  describe("when is LCAP is true", () => {
    let isLCAPEnabled: BasToolkit["isLCAPEnabled"];

    before(() => {
      const validateLCAPModule = proxyquire("../../src/apis/validateLCAP", {
        "../utils/optional-require": {
          optionalRequire() {
            const sapPlugin = {
              window: {
                isLCAPEnabled: () => true,
              },
            };
            return sapPlugin;
          },
        },
      });
      isLCAPEnabled = validateLCAPModule.isLCAPEnabled;
    });

    it("should return undefined", async () => {
      const parameterValue = await isLCAPEnabled();
      expect(parameterValue).to.be.true;
    });
  });
});
