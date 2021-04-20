import { expect } from "chai";
import { extend } from "lodash";
import { createSandbox, stub } from "sinon";
import { getParameter } from '../../src/apis/parameters';

describe("getParameter", () => {
    let sandbox: any;
    const WS_BASE_URL = "WS-BASE-VALUE";
    const parameterName = "param1";

    before(() => {
        sandbox = createSandbox();
    });
    
    after(() => {
        sandbox.restore();
    });

    // it("not on BAS ---> returns undefined", async () => {
    //     stubEnv({ WS_BASE_URL: "" });
    //     const parameterValue = await getParameter(parameterName);
    //     expect(parameterValue).to.be.undefined;
    // });

    it("no @sap/plugin loaded ---> returns undefined", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.undefined;
    });

    it("@sap/plugin loaded, configuration is null ---> returns undefined", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const requireMock = require('mock-require');

        const sapPlugin = {
            window: {
                configuration: () => null
            }
        };            
        requireMock('@sap/plugin', sapPlugin);

        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.undefined;
        requireMock.stop('@sap/plugin');
    });

    it("@sap/plugin loaded, configuration is undefined ---> returns undefined", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const requireMock = require('mock-require');

        const sapPlugin = {
            window: {
                configuration: () => undefined
            }
        };            
        requireMock('@sap/plugin', sapPlugin);

        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.undefined;
        requireMock.stop('@sap/plugin');
    });

    it("@sap/plugin loaded, parameter name doesn't exist in the configuration ---> returns undefined", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const requireMock = require('mock-require');

        const configuration = {};
        const sapPlugin = {
            window: {
                configuration: () => configuration
            }
        };            
        requireMock('@sap/plugin', sapPlugin);

        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.undefined;
        requireMock.stop('@sap/plugin');
    });

    it("@sap/plugin loaded, parameter name exists in the configuration ---> returns the parameter value", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const requireMock = require('mock-require');
        const expectedParameterValue = "param1value";
        const configuration = {param1: expectedParameterValue};
        const sapPlugin = {
            window: {
                configuration: () => configuration
            }
        };            
        requireMock('@sap/plugin', sapPlugin);

        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.equal(expectedParameterValue);
        requireMock.stop('@sap/plugin');
    });

    it("@sap/plugin loaded, parameter name exists in the configuration with null value ---> returns the parameter value", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const requireMock = require('mock-require');
        const expectedParameterValue = null;
        const configuration = {param1: expectedParameterValue};
        const sapPlugin = {
            window: {
                configuration: () => configuration
            }
        };            
        requireMock('@sap/plugin', sapPlugin);

        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.equal(expectedParameterValue);
        requireMock.stop('@sap/plugin');
    });

    it("@sap/plugin loaded, parameter name exists in the configuration with undefined value ---> returns the parameter value", async () => {
        stubEnv({ WS_BASE_URL: WS_BASE_URL });
        const requireMock = require('mock-require');
        const expectedParameterValue = undefined;
        const configuration = {param1: expectedParameterValue};
        const sapPlugin = {
            window: {
                configuration: () => configuration
            }
        };            
        requireMock('@sap/plugin', sapPlugin);

        const parameterValue = await getParameter(parameterName);
        expect(parameterValue).to.be.equal(expectedParameterValue);
        requireMock.stop('@sap/plugin');
    });
});

/**
 * Stub key-> value object to the environment variable for testing purpose
 * @param newValues - The key-> valye to set the environment
 */
 function stubEnv(newValues: Record<string, unknown>): void {
    const extendedEnv = extend({}, process.env, newValues);
    stub(process, "env").value(extendedEnv);
  }
