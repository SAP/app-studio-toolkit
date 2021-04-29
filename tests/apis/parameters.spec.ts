import { expect } from "chai";
import { mockVscode } from "../mockUtil";

const testVscode = {
    window: {
        createOutputChannel: () => ""
    },
    ExtensionContext: {}
};

mockVscode(testVscode, "src/logger/logger.ts");
import { getParameter } from '../../src/apis/parameters';

describe("getParameter API", () => {
    const parameterName = "param1";

    context("no @sap/plugin loaded", () => {
        it("should return undefined", async () => {
            const parameterValue = await getParameter(parameterName);
            expect(parameterValue).to.be.undefined;
        });
    });

    context("@sap/plugin loaded", () => {
        // no test for configuration is undefined, because . behaves the same on null and undefined
        describe("when configuration is null", () => { 
            let requireMock: any;
            
            before(() => {
                requireMock = require('mock-require');
                const sapPlugin = {
                    window: {
                        configuration: () => null
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            });

            it("should return undefined", async () => {
                const parameterValue = await getParameter(parameterName);
                expect(parameterValue).to.be.undefined;
            });
            
            after(() => {
                requireMock.stop('@sap/plugin');
            });
        });
    });
      
    context("@sap/plugin loaded", () => {
        // no test for configuration containing other parameters, because [] --> to 'member access' behaves the same
        describe("when configuration is empty", () => { 
            let requireMock: any;
            
            before(() => {
                requireMock = require('mock-require');
                const sapPlugin = {
                    window: {
                        configuration: () => ""
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            });

            it("should return undefined", async () => {
                const parameterValue = await getParameter(parameterName);
                expect(parameterValue).to.be.undefined;
            });
            
            after(() => {
                requireMock.stop('@sap/plugin');
            });
        });
    });
      
    context("@sap/plugin loaded", () => {
        // no test for value is undefined or null, because [] behaves the same on any value
        describe("when configuration contains the parameter name", () => { 
            let requireMock: any;
            const expectedParameterValue = "param1value";
            
            before(() => {
                requireMock = require('mock-require');
                const configuration = {param1: expectedParameterValue};
                const sapPlugin = {
                    window: {
                        configuration: () => configuration
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            });

            it("should return parameter value", async () => {
                const parameterValue = await getParameter(parameterName);
                expect(parameterValue).to.be.equal(expectedParameterValue);
            });
            
            after(() => {
                requireMock.stop('@sap/plugin');
            });
        });
    });
});
