import { mockVscode } from "./mockUtil";
import { expect, assert, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as sinon from "sinon";
import { IAction, ActionType } from "../src/actions/interfaces";
import { ActionsController } from '../src/actions/controller';
import * as vscode from "vscode";

use(chaiAsPromised);
const extensions = { getExtension: () => {} };
const testVscode = {
    extensions: extensions
};

mockVscode(testVscode, "src/api.ts"/*, testSapPlugin*/);

import { bas } from "../src/api";
import { extend, inRange, reject } from "lodash";
import { stub } from "sinon";

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

    context("getParameter", () => {
        const WS_BASE_URL = "WS-BASE-VALUE";
        const parameterName = "param1";

        it("not on BAS ---> returns null", async () => {
            stubEnv({ WS_BASE_URL: "" });
            const parameterValue = await bas.getParameter(parameterName);
            expect(parameterValue).to.be.null;
        });

        it("on BAS, no @sap/plugin loaded ---> returns null", async () => {
            stubEnv({ WS_BASE_URL: WS_BASE_URL });
            const parameterValue = await bas.getParameter(parameterName);
            expect(parameterValue).to.be.null;
        });

        it("on BAS, @sap/plugin loaded, parameter name doesn't exist in the configuration ---> returns null", async () => {
            stubEnv({ WS_BASE_URL: WS_BASE_URL });
            var requireMock = require('mock-require');
 
            const configuration = {};
            const sapPlugin = {
                window: {
                    configuration: () => configuration
                }
            };            
            requireMock('@sap/plugin', sapPlugin);

            const parameterValue = await bas.getParameter(parameterName);
            expect(parameterValue).to.be.null;
            requireMock.stop('@sap/plugin');
        });

        it("on BAS, @sap/plugin loaded, parameter name exists in the configuration ---> returns the parameter value", async () => {
            stubEnv({ WS_BASE_URL: WS_BASE_URL });
            var requireMock = require('mock-require');
            const expectedParameterValue = "param1value";
            const configuration = {param1: expectedParameterValue};
            const sapPlugin = {
                window: {
                    configuration: () => configuration
                }
            };            
            requireMock('@sap/plugin', sapPlugin);

            const parameterValue = await bas.getParameter(parameterName);
            expect(parameterValue).to.be.equal(expectedParameterValue);
            requireMock.stop('@sap/plugin');
        });
    })
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

/**
 * Stub key-> value object to the environment variable for testing purpose
 * @param newValues - The key-> valye to set the environment
 */
 function stubEnv(newValues: Record<string, unknown>): void {
    const extendedEnv = extend({}, process.env, newValues);
    stub(process, "env").value(extendedEnv);
  }