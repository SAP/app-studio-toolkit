import { mockVscode } from "./mockUtil";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as sinon from "sinon";
import { IAction, ActionType } from "../src/actions/interfaces";
import { ActionsController } from '../src/actions/controller';
import { getParameter } from '../src/apis/parameters';
import * as vscode from "vscode";

use(chaiAsPromised);
const extensions = { getExtension: () => {} };
const testVscode = {
    extensions: extensions
};

mockVscode(testVscode, "src/api.ts");
mockVscode(testVscode, "src/logger/logger.ts");

import { bas } from "../src/api";

describe("api unit test", () => {
    let sandbox: any;
    let extensionsMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });
    
    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        extensionsMock = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
        extensionsMock.verify();
    });

    

    it("active extension exports are resolved", async () => {
        const extension = { 
            isActive: true,
            exports: "api"
        };

        extensionsMock.expects("getExtension").withExactArgs("myExt").returns(extension)
        const result = await bas.getExtensionAPI("myExt");
        expect(result).to.be.equal("api");
    });
    
    it("get actions - without defined actions", async () => {
        const result = await bas.getAction("myExt");
        expect(result).to.be.undefined;        
    });

    it("get actions - with two actions", async () => {
        const action1: IAction = {
			"id" : "action_1",
			"actionType" : ActionType.Command
		}
        const action2: IAction = {
			"id" : "action_2",
			"actionType" : ActionType.Snippet
		}
        ActionsController.actions.push(action1);
        ActionsController.actions.push(action2);

        const result = await bas.getAction("action_1");
        expect(result).to.includes(action1);

        const result2 = await bas.getAction("action_2");
        expect(result2).to.includes(action2);
        
    });

    it("loadActions", async () => {
        const action: IAction = {
			"id" : "abc123",
			"actionType" : ActionType.Command,
		}
        const allExtensioms = [{
            packageJSON: {
                "BASContributes": {
                    "actions": [action]
                },
            }
        }]
        _.set(vscode, "extensions.all", allExtensioms);

        ActionsController.loadActions();
        const result = await bas.getAction("abc123");
        expect(result.id).to.be.equal(action.id);
        expect(result.actionType).to.be.equal(action.actionType);
    });

    it("inactive extension is waited for", async () => {
        const extension = { 
            isActive: false,
            exports: "api"
        };

        extensionsMock.expects("getExtension").withExactArgs("myExt").returns(extension)
        await expect(promiseWithTimeout(bas.getExtensionAPI("myExt"), 1000)).to.be.rejectedWith("Timed out");
        extension.isActive = true;  
    });
    
    it("non existing extension is rejected", async () => {
        extensionsMock.expects("getExtension").withExactArgs("myExt").returns(undefined);
        await expect(bas.getExtensionAPI("myExt")).to.be.rejectedWith(`Extension myExt is not loaded`);
    });
});

function promiseWithTimeout(promise: any, timeout: number){
    return Promise.race([
    promise,
    new Promise(function(resolve, reject){
      setTimeout(function() { 
          reject(new Error("Timed out")); 
        }, timeout);
    })
  ]);
}

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
