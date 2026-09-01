import * as vscode from "vscode";
import * as sinon from "sinon";
import { expect } from "chai";
import * as _ from "lodash";
import { GuidedDevelopment } from "../src/guided-development";
import { AppLog } from "../src/app-log";
import { AppEvents } from '../src/app-events';
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { IChildLogger } from "@vscode-logging/logger";
import { fail } from "assert";
import { IItem, ICollection, CollectionType, IItemExecuteContext, IItemCommandContext, IItemUriContext, IItemSnippetContext } from "../src/types";
import { IInternalCollection, IInternalItem } from "./Collection";
import { BasAction, ICommandAction, IExecuteAction, IUriAction, ISnippetAction } from "@sap-devx/app-studio-toolkit-types";

const testVscode = {
    extensions: {
        getExtension:(path: string) => Promise.resolve()
    }
};

describe('guidedDevelopment unit test', () => {
    let sandbox: any;
    let loggerMock: any;
    let rpcMock: any;
    let appEventsMock: any;
    let guidedDevMock: any;
    let eventMock: any;

    class TestEvents implements AppEvents {
        public performAction(action: BasAction): Promise<any> {
            return;
        }
        public setData(extensionId: string, collections: ICollection[], items: IItem[]): void {
            
        }
    }
    class TestRpc implements IRpc {
        public  timeout: number;
        public promiseCallbacks: Map<number, IPromiseCallbacks>;
        public methods: Map<string, IMethod>;
        public sendRequest(): void {
            return;
        }            
        public sendResponse(): void {
            return;
        } 
        public setResponseTimeout(): void {
            return;
        }
        public registerMethod(): void {
            return;
        } 
        public unregisterMethod(): void {
            return;
        } 
        public listLocalMethods(): string[] {
            return [];
        }
        public handleResponse(): void {
            return;
        } 
        public listRemoteMethods(): Promise<string[]> {
            return Promise.resolve([]);
        }
        public invoke(): Promise<any> {
            return Promise.resolve();
        }
        public handleRequest(): Promise<void> {
            return Promise.resolve();
        }
    }
    class TestOutputChannel implements AppLog {
        public log(): void {
            return;
        }            
        public writeln(): void {
            return;
        } 
        public create(): void {
            return;
        }  
        public force(): void {
            return;
        } 
        public conflict(): void {
            return;
        }  
        public identical(): void {
            return;
        }  
        public skip(): void {
            return;
        } 
        public showOutput(): boolean {
            return false;
        }  
    }

    const testLogger = {debug: () => {}, error: () => {}, fatal: () => {}, warn: () => {}, info: () => {}, trace: () => {}, getChildLogger: () => ({} as IChildLogger)};

    const rpc = new TestRpc();
    const outputChannel = new TestOutputChannel();
    const appEvents = new TestEvents();
    const guidedDevelopment: GuidedDevelopment = new GuidedDevelopment(rpc, appEvents, outputChannel, testLogger, {}, []);

    before(() => {
        sandbox = sinon.createSandbox();
        _.set(vscode, "Uri.parse", (path: string) => {
            return {
                fsPath: path
            };
        });
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        rpcMock = sandbox.mock(rpc);
        loggerMock = sandbox.mock(testLogger);
        appEventsMock = sandbox.mock(appEvents);
        guidedDevMock = sandbox.mock(guidedDevelopment);
        eventMock = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
        rpcMock.verify();
        loggerMock.verify();
        appEventsMock.verify();
        guidedDevMock.verify();
        eventMock.verify();
    });

    it("constructor", () => {
        try {
            new GuidedDevelopment(undefined, appEvents,  outputChannel, testLogger, {}, []);
            fail("contructor should throw an exception");
        } catch (error) {
            expect(error.message).to.be.equal("rpc must be set");
        }
    });

    it("getState", async () => {
        const state = await guidedDevelopment["getState"]();
        expect(state).to.deep.equal({});
    });

    describe("setCollections", () => {
        it("set collections1", async () => {
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: []
            };
            await guidedDevelopment["setCollections"]([collection1]);
            expect(guidedDevelopment["collections"]).to.have.length(1);
            expect(guidedDevelopment["collections"]).to.have.members([collection1]);
        });
    });

    describe("getItem", () => {
        it("return subItem", async () => {
            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                labels: []
            };
            const fqid2 = "extName1.extPublisher1.id2";
            const item2: IInternalItem = {
                id: "id2",
                fqid: fqid2,
                description: "description2",
                title: "title2",
                labels: [],
                items: [item1]
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item2]
            };
            await guidedDevelopment["setCollections"]([collection1]);
            const foundItem = guidedDevelopment["getItem"](fqid2);
            expect(foundItem.fqid).to.equal(fqid2);
            const foundSubItem = guidedDevelopment["getItem"](fqid1);
            expect(foundSubItem.fqid).to.equal(fqid1);
        });

        it("return subSubItem", async () => {
            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                labels: []
            };
            const fqid2 = "extName1.extPublisher1.id2";
            const item2: IInternalItem = {
                id: "id2",
                fqid: fqid2,
                description: "description2",
                title: "title2",
                labels: [],
                items: [item1]
            };
            const fqid3 = "extName1.extPublisher1.id3";
            const item3: IInternalItem = {
                id: "id3",
                fqid: fqid3,
                description: "description3",
                title: "title2",
                labels: [],
                items: [item2]
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item3]
            };
            await guidedDevelopment["setCollections"]([collection1]);
            const foundItem = guidedDevelopment["getItem"](fqid3);
            expect(foundItem.fqid).to.equal(fqid3);
            const foundSubItem = guidedDevelopment["getItem"](fqid1);
            expect(foundSubItem.fqid).to.equal(fqid1);
        });

        it("subItem doen't contain fqid or item doesn't exist", async () => {
            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                description: "description1",
                title: "title1",
                labels: []
            };
            const fqid2 = "extName1.extPublisher1.id2";
            const item2: IInternalItem = {
                id: "id2",
                fqid: fqid2,
                description: "description2",
                title: "title2",
                labels: [],
                items: [item1]
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item2]
            };
            await guidedDevelopment["setCollections"]([collection1]);
            const foundItem = guidedDevelopment["getItem"](fqid1);
            expect(foundItem).to.be.undefined;
        });
    });

    describe("onFrontendReady", () => {
        it("flow is successfull", async () => {
        rpcMock.expects("invoke").withExactArgs("showCollections", [[{
            description: "description1",
            id: "id1",
            itemIds: [],
            items: [{
                description: "description2",
                fqid: "extName1.extPublisher1.id2",
                id: "id2",
                items: [{
                    description: "description1",
                    id: "id1",
                    labels: [],
                    title: "title1"
                }],
                labels: [],
                title: "title2"
            }],
            title: "title1",
            type: 0
            }], undefined]);
            await guidedDevelopment["onFrontendReady"]();
        });
        
        it("rpc throws error", async () => {
            const errorMessage = "rpc failed";
            rpcMock.expects("invoke").throws(new Error(errorMessage));
            guidedDevMock.expects("getErrorInfo");
            loggerMock.expects("error");
            await guidedDevelopment["onFrontendReady"]();
        });

        it("rpc throws error with ptefix message", async () => {
            const errorMessage = "rpc failed";
            const prefix = "prefix message: "

            rpcMock.expects("invoke").throws(new Error(errorMessage));
            guidedDevelopment["logError"](errorMessage, prefix);
            guidedDevMock.expects("getErrorInfo");
            loggerMock.expects("error");
            
            await guidedDevelopment["onFrontendReady"]();
        });
    });

    describe("toggleOutput", () => {
        it("output is false", () => {
            const res = guidedDevelopment["toggleOutput"]();
            expect(res).to.be.false;
        });
    });

    describe("getErrorInfo", () => {
        it("message is string error", () => {
            const errorInfo = "Error Info";
            const res = guidedDevelopment["getErrorInfo"](errorInfo);
            expect(res).to.be.equal(errorInfo);
        });
        it("message error from parametr", () => {
            const error: any = {
                name: "name",
                message: "message",
                stack: "stack"
            }
            const res = guidedDevelopment["getErrorInfo"](error);
            expect(res).to.be.equal(`name: ${error.name}\n message: ${error.message}\n stack: ${error.stack}\n string: ${error.toString()}\n`);
        });
        it("without error message as parameter", () => {
            const res = guidedDevelopment["getErrorInfo"]();
            expect(res).to.be.equal(``);
        });
    });

    describe("performAction", () => {
        class testExecuteItemContext implements IItemExecuteContext {
            params?: any[];
            project: string;
        }
        class testCommandItemContext implements IItemExecuteContext {
            params?: any[];
            project: string;
        }
        class testSnippetItemContext implements IItemSnippetContext {
            context?: any;
            project: string;
        }
        class testUriItemContext implements IItemUriContext {
            project: string;
            uri?: vscode.Uri;
        }
        class testExecuteItemAction implements IExecuteAction {
            executeAction: (params?: any[]) => Thenable<any>;
            params?: any[];
            actionType: "EXECUTE";
        }
        class testCommandItemAction implements ICommandAction {
            name: string;
            params?: any[];
            actionType: "COMMAND";
        }
        class testSnippetItemAction implements ISnippetAction {
            contributorId: string;
            snippetName: string;
            context: any;
            actionType: "SNIPPET";
        }
        class testUriItemAction implements IUriAction {
            actionType: "URI";
            uri: vscode.Uri;
        }

        it("no context", async () => {
            let action = new testExecuteItemAction();
            action.executeAction = () => {
                console.log("action");
                return Promise.resolve();
            };
            action.actionType = "EXECUTE";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1);
        });

        it("execute command action, with context, index 1", async () => {
            let context: IItemExecuteContext;
            context = new testExecuteItemContext();
            context.project = "project";
            context.params = ["params"];

            let action = new testExecuteItemAction();
            action.executeAction = () => {
                console.log("action");
                return Promise.resolve();
            };
            action.actionType = "EXECUTE";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1, context);
        });

        it("execute command action - without context", async () => {
            let action = new testExecuteItemAction();
            action.executeAction = () => {
                console.log("workbench.action.openGlobalSettings");
                return Promise.resolve();
            };
            action.actionType = "EXECUTE";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1, new testExecuteItemContext());
        });

        it("command action, with context, index 2", async () => {
            let context: IItemCommandContext;
            context = new testCommandItemContext();
            context.project = "project";
            context.params = ["params"];

            let action = new testCommandItemAction();
            action.params = ["param"];
            action.actionType = "COMMAND";
            action.name = "Open"

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action2: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action2.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,2, context);
        });

        it("command action - without context", async () => {
            let action = new testCommandItemAction();
            action.params = ["param"];
            action.actionType = "COMMAND";
            action.name = "Open"

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action2: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action2.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,2, new testCommandItemContext());
        });

        it("Snippet tool action, with context, 2 actions", async () => {
            let context: IItemSnippetContext;
            context = new testSnippetItemContext();
            context.project = "project";
            context.context = "context";

            let action = new testSnippetItemAction();
            action.snippetName = "snippet";
            action.contributorId = "contributorId";
            action.context = "context";
            action.actionType = "SNIPPET";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                action2: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1, context);
        });

        it("Snippet tool action - without context", async () => {
            let action = new testSnippetItemAction();
            action.snippetName = "snippet";
            action.contributorId = "contributorId";
            action.context = "context";
            action.actionType = "SNIPPET";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                action2: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1, new testSnippetItemContext());
        });

        it("Uri, with uri as context", async () => {
            let context: IItemUriContext;
            context = new testUriItemContext();
            context.uri = vscode.Uri.parse("");
            context.project = "project";

            let action = new testUriItemAction();
            action.actionType = "URI";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1, context);
        });

        it("Uri, without uri as context", async () => {
            let context: IItemUriContext;
            context = new testUriItemContext();
            context.project = "project";

            let action = new testUriItemAction();
            action.actionType = "URI";

            const fqid1 = "extName1.extPublisher1.id1";
            const item1: IInternalItem = {
                id: "id1",
                fqid: fqid1,
                description: "description1",
                title: "title1",
                action1: {
                    title: "Open title",
                    name: "Open",
                    action: action
                },
                labels: []
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [],
                type: CollectionType.Platform,
                items: [item1]
            };

            appEventsMock.expects("performAction").withExactArgs(item1.action1.action);
            await guidedDevelopment["setCollections"]([collection1]);
            await guidedDevelopment["performAction"](fqid1,1, context);
        });
    });
});
