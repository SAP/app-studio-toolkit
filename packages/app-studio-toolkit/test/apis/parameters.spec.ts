import { expect } from "chai";
import * as proxyquire from "proxyquire";
import { NOOP_LOGGER } from "@vscode-logging/wrapper";

type GetParamSignature = (parameterName: string) => Promise<string | undefined>;

describe("the getParameters utility", () => {
  function buildGetParamProxy(optionalRequireMock: any): GetParamSignature {
    const proxiedModule = proxyquire("../../src/apis/parameters", {
      "../utils/optional-require": {
        optionalRequire(): any {
          return optionalRequireMock;
        },
      },
      "../logger/logger": { getLogger: () => NOOP_LOGGER },
    });
    return proxiedModule.getParameter as GetParamSignature;
  }

  describe("when @sap/plugin is found", () => {
    let getParameterProxy: GetParamSignature;

    before(() => {
      const sapPlugin = {
        window: {
          configuration: () => ({ ima_aba: "bamba" }),
        },
      };
      getParameterProxy = buildGetParamProxy(sapPlugin);
    });

    it("returns its `window.configuration()` ", async () => {
      await expect(getParameterProxy("ima_aba")).to.eventually.equal("bamba");
    });
  });

  describe("when @sap/plugin is not found", () => {
    let getParameterProxy: GetParamSignature;

    before(() => {
      getParameterProxy = buildGetParamProxy(null);
    });

    it("returns undefined` ", async () => {
      await expect(getParameterProxy("actions")).to.eventually.be.undefined;
    });
  });

  describe("when @sap/plugin has an invalid configuration() value", () => {
    let getParameterProxy: GetParamSignature;

    before(() => {
      const sapPlugin = {
        window: {
          configuration: () => undefined,
        },
      };
      getParameterProxy = buildGetParamProxy(sapPlugin);
    });

    it("returns", async () => {
      await expect(getParameterProxy("foo")).to.eventually.be.undefined;
    });
  });

  describe("when @sap/plugin['configuration'] lacks the requested parameters", () => {
    let getParameterProxy: GetParamSignature;

    before(() => {
      const sapPlugin = {
        window: {
          configuration: () => ({ foo: "666" }),
        },
      };
      getParameterProxy = buildGetParamProxy(sapPlugin);
    });

    it("returns", async () => {
      await expect(getParameterProxy("bar")).to.eventually.be.undefined;
    });
  });
});
