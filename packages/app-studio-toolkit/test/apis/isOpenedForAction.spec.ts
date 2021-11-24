import { expect } from "chai";
import { mockVscode } from "../mockUtil";

const testVscode = {
  window: {
    createOutputChannel: () => "",
  },
  ExtensionContext: {},
};

mockVscode(testVscode, "dist/src/logger/logger.js");
import { isOpenedForAction } from "../../src/apis/isOpenedForAction";

describe("validate isOpenedForAction API", () => {
  it("should return undefined when sapPlugin does not exist", async () => {
    const parameterValue = await isOpenedForAction();
    expect(parameterValue).to.be.undefined;
  });

  describe("when pkg-action is not found", () => {
    let requireMock = require("mock-require");
    before(() => {
      requireMock = require("mock-require");
      const configuration = {};
      const sapPlugin = {
        window: {
          configuration: () => configuration,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });
    after(() => {
      requireMock.stop("@sap/plugin");
    });

    it("should return undefined", async () => {
      const parameterValue = await isOpenedForAction();
      expect(parameterValue).to.be.undefined;
    });
  });

  describe("when pkg-action is release", () => {
    let requireMock = require("mock-require");
    before(() => {
      requireMock = require("mock-require");
      const configuration = { "pkg-action": "release" };
      const sapPlugin = {
        window: {
          configuration: () => configuration,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });
    after(() => {
      requireMock.stop("@sap/plugin");
    });

    it("should return true", async () => {
      const parameterValue = await isOpenedForAction();
      expect(parameterValue).to.be.true;
    });
  });

  describe("when pkg-action is invalid", () => {
    let requireMock = require("mock-require");
    before(() => {
      requireMock = require("mock-require");
      const configuration = { "pkg-action": "notAValidValue" };
      const sapPlugin = {
        window: {
          configuration: () => configuration,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });
    after(() => {
      requireMock.stop("@sap/plugin");
    });

    it("should return false", async () => {
      const parameterValue = await isOpenedForAction();
      expect(parameterValue).to.be.false;
    });
  });
});
