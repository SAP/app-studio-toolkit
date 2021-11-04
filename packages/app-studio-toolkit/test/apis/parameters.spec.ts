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
import { getParameter } from "../../src/apis/parameters";

describe("getParameter API", () => {
  const parameterName = "param1";

  it("should return undefined", async () => {
    const parameterValue = await getParameter(parameterName);
    expect(parameterValue).to.be.undefined;
  });

  // no test for configuration is undefined, because . behaves the same on null and undefined
  describe("when configuration is null", () => {
    let requireMock: any;

    before(() => {
      requireMock = require("mock-require");
      const sapPlugin = {
        window: {
          configuration: () => null,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });

    it("should return undefined", async () => {
      const parameterValue = await getParameter(parameterName);
      expect(parameterValue).to.be.undefined;
    });

    after(() => {
      requireMock.stop("@sap/plugin");
    });
  });

  // no test for configuration containing other parameters, because [] --> to 'member access' behaves the same
  describe("when configuration is empty", () => {
    let requireMock: any;

    before(() => {
      requireMock = require("mock-require");
      const sapPlugin = {
        window: {
          configuration: () => "",
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });

    it("should return undefined", async () => {
      const parameterValue = await getParameter(parameterName);
      expect(parameterValue).to.be.undefined;
    });

    after(() => {
      requireMock.stop("@sap/plugin");
    });
  });

  // no test for value is undefined or null, because [] behaves the same on any value
  describe("when configuration contains the parameter name", () => {
    let getParameter: (parameterName: string) => Promise<string | undefined>;

    before(() => {
      const configuration = { param1: "bamba" };

      const parametersModule = proxyquire("../../src/apis/parameters", {
        "../utils/optional-require": {
          optionalRequire() {
            const sapPlugin = {
              window: {
                configuration: () => configuration,
              },
            };
            return sapPlugin;
          },
        },
      });
      getParameter = parametersModule.getParameter;
    });

    it("should return parameter value", async () => {
      const parameterValue = await getParameter(parameterName);
      expect(parameterValue).to.be.equal("bamba");
    });

    after(() => {
      requireMock.stop("@sap/plugin");
    });
  });
});
