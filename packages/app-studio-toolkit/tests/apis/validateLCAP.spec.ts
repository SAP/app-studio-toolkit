import { expect } from "chai";
import { mockVscode } from "../mockUtil";

const testVscode = {
  window: {
    createOutputChannel: () => "",
  },
  ExtensionContext: {},
};

mockVscode(testVscode, "src/logger/logger.ts");
import { isLCAPEnabled } from "../../src/apis/validateLCAP";

describe("validate LCAP  API", () => {
  it("should return undefined", async () => {
    const parameterValue = await isLCAPEnabled();
    expect(parameterValue).to.be.undefined;
  });

  describe("when is lcap is not found", () => {
    let requireMock: any;

    before(() => {
      requireMock = require("mock-require");
      const sapPlugin = {
        window: {
          isLCAPEnabled: () => undefined,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });

    it("should return undefined", async () => {
      const parameterValue = await isLCAPEnabled();
      expect(parameterValue).to.be.undefined;
    });

    after(() => {
      requireMock.stop("@sap/plugin");
    });
  });

  describe("when is LCAP is true", () => {
    let requireMock: any;
    const expectedBool = true;

    before(() => {
      requireMock = require("mock-require");
      const isLCAP = true;
      const sapPlugin = {
        window: {
          isLCAPEnabled: () => isLCAP,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });

    it("should return parameter value", async () => {
      const isLCAP = await isLCAPEnabled();
      expect(isLCAP).to.be.equal(expectedBool);
    });

    after(() => {
      requireMock.stop("@sap/plugin");
    });
  });
});
