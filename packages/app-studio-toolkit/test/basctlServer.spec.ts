import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox, match } from "sinon";
import * as net from "net";
import * as fs from "fs";
import { mockVscode } from "./mockUtil";

const testVscode = {
  Uri: {
    parse: () => "",
  },
  workspace: {
    getConfiguration: () => "",
  },
  window: {
    showErrorMessage: () => Promise.reject(),
  },
};

const testSocket = {
  on: () => "",
  write: () => true,
};

const testServer = {
  listen: () => "",
  close: () => "",
};

mockVscode(testVscode, "dist/src/actions/performer.js");
mockVscode(testVscode, "dist/src/actions/actionsFactory.js");
import * as performer from "../src/actions/performer";
import * as actionsFactory from "../src/actions/actionsFactory";
import {
  closeBasctlServer,
  startBasctlServer,
} from "../src/basctlServer/basctlServer";

describe("basctlServer", () => {
  let sandbox: SinonSandbox;
  let performerMock: SinonMock;
  let actionsFactoryMock: SinonMock;
  let windowMock: SinonMock;
  let fsMock: SinonMock;
  let netMock: SinonMock;
  let socketMock: SinonMock;
  let serverMock: SinonMock;

  beforeEach(() => {
    sandbox = createSandbox();
    performerMock = sandbox.mock(performer);
    actionsFactoryMock = sandbox.mock(actionsFactory.ActionsFactory);
    windowMock = sandbox.mock(testVscode.window);
    fsMock = sandbox.mock(fs);
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
    }, 100);
    sandbox.restore();
  });

  it(`startBasctlServer socket exists, 
        unlink successfull, 
        listen successful, 
        handle request received valid JSON, 
        create action successful,
        perform action successful`, () => {
    mockIpc();
    startBasctlServer();
  });

  it(`startBasctlServer socket exists, 
        unlink successfull, 
        listen successful, 
        handle request received valid JSON, 
        create action successful,
        perform action fails`, () => {
    mockIpc({ performFails: true });
    startBasctlServer();
  });

  it(`startBasctlServer socket exists, 
        unlink successfull, 
        listen successful, 
        handle request received invalid JSON, 
        create action successful,
        perform action successful`, () => {
    mockIpc({ invalidJsonInBuffer: true });
    startBasctlServer();
  });

  it(`startBasctlServer socket exists, 
        unlink successfull, 
        listen fails`, () => {
    mockIpc({ socketInUse: true });
    startBasctlServer();
  });

  it(`startBasctlServer socket doesn't exist, 
        listen successful`, () => {
    mockIpc({ socketDoesNotExist: true });
    startBasctlServer();
  });

  it(`startBasctlServer socket exists, 
        unlink fails`, () => {
    mockIpc({ unlinkFails: true });
    expect(() => startBasctlServer()).to.throw(
      "Failed to unlink socket /extbin/basctlSocket:"
    );
  });

  it("does nothing if server doesn't exist", () => {
    closeBasctlServer();
  });

  function mockIpc(options?: {
    socketDoesNotExist?: boolean;
    unlinkFails?: boolean;
    socketInUse?: boolean;
    performFails?: boolean;
    invalidJsonInBuffer?: boolean;
  }) {
    if (options && options.socketDoesNotExist) {
      fsMock.expects("stat").yields(new Error("Socket does not exist"));
    } else {
      fsMock.expects("stat").yields(undefined);
      if (options && options.unlinkFails) {
        fsMock.expects("unlink").yields(new Error("Socket is locked !"));
        return;
      } else {
        fsMock.expects("unlink").yields(undefined);
      }
    }
    netMock
      .expects("createServer")
      .yields((socketMock as any).object)
      .returns((serverMock as any).object);
    if (options && options.socketInUse) {
      serverMock
        .expects("listen")
        .withExactArgs("/extbin/basctlSocket")
        .throws(new Error("Socket already serving a server"));
      windowMock
        .expects("showErrorMessage")
        .withArgs(match("Socket already serving a server"));
      return;
    } else {
      serverMock.expects("listen").withExactArgs("/extbin/basctlSocket");
    }
    let dataObject: any;
    dataObject = {
      actionType: "COMMAND",
      commandName: "dummy-command",
    };

    const actionObject = {
      name: "myAction",
    };
    const result = {
      status: "success",
    };
    if (options && options.invalidJsonInBuffer) {
      socketMock.expects("on").withArgs("data").yields("invalid json");
      windowMock
        .expects("showErrorMessage")
        .withArgs(
          match("SyntaxError: Unexpected token i in JSON at position 0")
        );
      dataObject = {};
    } else {
      socketMock
        .expects("on")
        .withArgs("data")
        .yields(JSON.stringify(dataObject));
    }

    actionsFactoryMock
      .expects("createAction")
      .withExactArgs(dataObject)
      .returns(actionObject);
    if (options && options.performFails) {
      performerMock
        .expects("_performAction")
        .withExactArgs(actionObject)
        .throws(new Error("Perform failed !"));
      windowMock
        .expects("showErrorMessage")
        .withArgs(match("Perform failed !"));
    } else {
      performerMock
        .expects("_performAction")
        .withExactArgs(actionObject)
        .returns(result);
      socketMock.expects("write").withExactArgs(JSON.stringify({ result }));
    }
  }
});
