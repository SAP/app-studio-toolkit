import { mockVscode } from "../mockUtil";
import { expect } from "chai";
import { createSandbox } from "sinon";
import { getParameter } from '../../src/apis/parameters';

const extensions = { getExtension: () => {} };
const testVscode = {
    extensions: extensions
};

mockVscode(testVscode, "src/parameters.ts");

describe("getParameter API", () => {
    let sandbox: any;
    let extensionsMock: any;

    const parameterName = "param1";

    beforeEach(() => {
        sandbox = createSandbox();
        extensionsMock = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
        extensionsMock.verify();
        sandbox.restore();
    });

    context("no @sap/plugin loaded", () => {
        it("should return undefined", async () => {
            const parameterValue = await getParameter(parameterName);
            expect(parameterValue).to.be.undefined;
        });
    });

    context("@sap/plugin loaded", () => {
        // no test for configuration is undefined, because . behaves the same on null and undefined
        describe("when configuration is null", () => { 
            let requireMock;
            
            before(() => {
                requireMock = require('mock-require');
                const sapPlugin = {
                    window: {
                        configuration: () => null
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            })

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
            let requireMock;
            
            before(() => {
                requireMock = require('mock-require');
                const sapPlugin = {
                    window: {
                        configuration: () => {}
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            })

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
            let requireMock;
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
            })

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
