import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";
import { Contributors } from "../src/contributors";
import { VSCodeEvents } from "../src/vscode-events";
import { bas } from '@sap-devx/app-studio-toolkit-types';

const oRegisteredCommands = {};
const oRegisteredWebviewViewProviders = {};
const testVscode = {
    workspace: {
        getConfiguration: () => true
    },
    commands: {
        registerCommand: (id: string, cmd: any) => { _.set(oRegisteredCommands, id, cmd); return Promise.resolve(oRegisteredCommands); },
        executeCommand: () => Promise.resolve()
    },
    window: {
        registerWebviewPanelSerializer: () => true,
        registerWebviewViewProvider: (id: string, provider: any) => { _.set(oRegisteredWebviewViewProviders, id, provider); return Promise.resolve(oRegisteredWebviewViewProviders);}
    },
    extensions: {
        getExtension:(path: string) => Promise.resolve()
    }
};
mockVscode(testVscode, "src/extension.ts");
import * as extension from "../src/extension";
import * as loggerWrapper from "../src/logger/logger-wrapper";

describe('extension unit test', () => {
    let sandbox: any;
    let events: VSCodeEvents;
    let commandsMock: any;
    let windowMock: any;
    let workspaceMock: any;
    let loggerWrapperMock: any;
    let contributorsMock: any;
    let eventMock: any;
    let vscodeEventMock: any;
    const testContext: any = { 
        subscriptions: [], 
        extensionPath: "testExtensionpath", 
        globalState: {get: () => true, update: () => true}
    };

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        loggerWrapperMock = sandbox.mock(loggerWrapper);
        commandsMock = sandbox.mock(testVscode.commands);
        windowMock = sandbox.mock(testVscode.window);
        workspaceMock = sandbox.mock(testVscode.workspace);
        eventMock = sandbox.mock(testVscode.extensions);
        contributorsMock = sandbox.mock(Contributors);
        events = VSCodeEvents.getInstance();
        vscodeEventMock = sandbox.mock(events);
    });

    afterEach(() => {
        loggerWrapperMock.verify();
        commandsMock.verify();
        windowMock.verify();
        workspaceMock.verify();
        eventMock.verify();
        contributorsMock.verify();
        vscodeEventMock.verify();
    });

    describe('activate', () => {
        it("commands registration", async () => {
            // contributorsMock.expects("getContributors");
            loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges");
            loggerWrapperMock.expects("getLogger").once();
            const res: typeof bas = eventMock.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit")?.exports;
            vscodeEventMock.expects("setBasAPI").withExactArgs(res);
            await extension.activate(testContext);
            expect(_.size(_.keys(oRegisteredCommands))).to.be.equal(2);
            expect( _.get(oRegisteredCommands, "loadGuidedDevelopment")).to.be.not.undefined;
            expect(_.get(oRegisteredCommands, "guidedDevelopment.toggleOutput")).to.be.not.undefined;
            expect( _.get(oRegisteredCommands, "guidedDevelopment.refreshCenter")).to.be.not.undefined;
        });

        it("logger failure on extenion activation", async () => {
            const consoleMock = sandbox.mock(console);
            loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges").throws(new Error("activation error"));
            consoleMock.expects("error").withExactArgs('Extension activation failed due to Logger configuration failure:', "activation error");
            await extension.activate(null);
        });
    });

    it("deactivate", () => {
        extension.activate(testContext);
        extension.deactivate();
    });
});
