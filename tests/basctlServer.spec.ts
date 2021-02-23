import { assert, expect } from "chai";
import * as sinon from "sinon";
import * as net from 'net';
import * as fs from 'fs';
import { ActionJsonKey, ActionType } from "../src/actions/interfaces";
import { mockVscode } from "./mockUtil";

const testVscode = {
    Uri: { parse: (value?: string, strict?: boolean) => {} },
    workspace: {
        getConfiguration: () => {}
    },
    window: {
        showErrorMessage: (message: string, ...items: string[]): Thenable<string | undefined> => {return Promise.resolve(undefined);}
    }
};

const testSocket = {
    on: (event: "data", listener: (data: Buffer) => void) => {},
    write: (buffer: Uint8Array | string, cb?: (err?: Error) => void) => true
}

const testServer = {
    listen: (path: string, backlog?: number, listeningListener?: () => void) => {},
    close: (callback?: (err?: Error) => void) => {}
}

mockVscode(testVscode, "src/actions/performer.ts");
mockVscode(testVscode, "src/actions/actionsFactory.ts");
import * as performer from '../src/actions/performer';
import * as actionsFactory from '../src/actions/actionsFactory';
import { closeBasctlServer, startBasctlServer } from "../src/actions/basctlServer";
import { Stream } from "stream";


describe("basctlServer", () => {
    let sandbox: any;
    let performerMock: any;
    let actionsFactoryMock: any;
    let windowMock: any;
    let fsMock: any;
    let netMock: any;
    let socketMock: any;
    let serverMock: any;

        
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        performerMock = sandbox.mock(performer);
        actionsFactoryMock = sandbox.mock(actionsFactory.ActionsFactory);
        windowMock = sandbox.mock(testVscode.window);
        // fs
        fsMock = sandbox.mock(fs);
        // net
        netMock = sandbox.mock(net);
        socketMock = sandbox.mock(testSocket);
        serverMock = sandbox.mock(testServer);
    });

    afterEach(() => {
        setTimeout(() => {
            actionsFactoryMock.verify();
            performerMock.verify();
            windowMock.verify();
    
            fsMock.verify();
            netMock.verify();
            socketMock.verify();
            serverMock.verify();
            performerMock.verify();
            actionsFactoryMock.verify();
        }, 50);
        sandbox.restore();
    });

    it("startBasctlServer socket exists, " +
        "unlink successfull, " +
        "listen successful, " +
        "handle request received valid JSON, " + 
        "create action successful," +
        "perform action successful", () => {    
            mockIpc();
            startBasctlServer()   
    });

    it("startBasctlServer socket exists, " +
       "unlink successfull, " +
       "listen successful, " +
       "handle request received valid JSON, " + 
       "create action successful," +
       "perform action fails", () => {    
            mockIpc({ performFails: true });
            startBasctlServer()   
    });

    it("startBasctlServer socket exists, " +
       "unlink successfull, " +
       "listen successful, " +
       "handle request received invalid JSON, " + 
       "create action successful," +
       "perform action successful", () => {    
            mockIpc({ invalidJsonInBuffer: true });
            startBasctlServer()   
    });

    it("startBasctlServer socket exists, " +
       "unlink successfull, " +
       "listen fails ", () => {    
            mockIpc({ socketInUse: true });
            startBasctlServer()   
    });

    it("startBasctlServer socket doesn't exist, " +
       "listen successful ", () => {    
            mockIpc({ socketDoesNotExist: true });
            startBasctlServer()   
     });

    it("startBasctlServer socket exists, " +
       "unlink fails", () => {    
            mockIpc({ unlinkFails: true });
            expect(() => startBasctlServer()).to.throw('Failed to unlink socket /extbin/basctlSocket:')
    });

    it("closes if server exists", () => {
        mockIpc();
        startBasctlServer()
        serverMock.expects('close').once();
        closeBasctlServer()
    });

    it("does nothing if server doesn't exist", () => {
        closeBasctlServer()
    });

    function mockIpc(
        options?: { 
            socketDoesNotExist?: boolean,
            unlinkFails?: boolean,
            socketInUse?: boolean,
            performFails?: boolean, 
            invalidJsonInBuffer?: boolean }) {
        if(options && options.socketDoesNotExist) {
            fsMock.expects('stat').yields(new Error("Socket does not exist"));
        } else {
            fsMock.expects('stat').yields(undefined);
            if(options && options.unlinkFails) {
                fsMock.expects('unlink').yields(new Error("Socket is locked !"));
                return;
            } else {
                fsMock.expects('unlink').yields(undefined);
            }
        }
        netMock.expects('createServer').yields(socketMock.object).returns(serverMock.object);
        if(options && options.socketInUse) {
            serverMock.expects('listen').withExactArgs('/extbin/basctlSocket').once().throws(new Error("Socket already serving a server"));
            windowMock.expects('showErrorMessage').withArgs(sinon.match("Socket already serving a server")).once();
            return;
        } else {
            serverMock.expects('listen').withExactArgs('/extbin/basctlSocket').once();
        }
        let dataObject: any;
        dataObject = {
            [ActionJsonKey.ActionType]: ActionType.Command,
            [ActionJsonKey.CommandName]: 'dummy-command'
        }
        let actionObject: any;
        actionObject = {
            "name": "myAction"
        }
        let result = {
            "status": "success"
        }
        if(options && options.invalidJsonInBuffer) {
            socketMock.expects('on').withArgs('data').yields("invalid json");
            windowMock.expects('showErrorMessage').withArgs(sinon.match("SyntaxError: Unexpected token i in JSON at position 0")).once();
            dataObject = {};
        } else {
            socketMock.expects('on').withArgs('data').yields(JSON.stringify(dataObject));
        }        
        
        actionsFactoryMock.expects('createAction').withExactArgs(dataObject).returns(actionObject);
        if(options && options.performFails) {
            performerMock.expects('_performAction').withExactArgs(actionObject).throws(new Error("Perform failed !"));
            windowMock.expects('showErrorMessage').withArgs(sinon.match("Perform failed !")).once();
        } else {
            performerMock.expects('_performAction').withExactArgs(actionObject).returns(result);
            socketMock.expects('write').withExactArgs(JSON.stringify({result}));
        }
        
    };
});