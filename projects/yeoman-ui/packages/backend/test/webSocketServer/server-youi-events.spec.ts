import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import type { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common.js";
import { ServerYouiEvents } from "../../src/webSocketServer/server-youi-events.js";

describe("ServerYouiEvents unit test", () => {
  let events: ServerYouiEvents;
  let sandbox: SinonSandbox;
  let rpcMock: SinonMock;

  class TestRpc implements RpcCommon {
    public timeout: number;
    public promiseCallbacks: any;
    public methods: any;
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

  const rpc = new TestRpc();

  beforeEach(() => {
    sandbox = createSandbox();
    events = new ServerYouiEvents(rpc);
    rpcMock = sandbox.mock(rpc);
  });

  afterEach(() => {
    rpcMock.verify();
    sandbox.restore();
  });

  describe("doGeneratorProgress", () => {
    it("backward compatibility: showProgress=false on install phase calls doGeneratorInstall", () => {
      rpcMock.expects("invoke").withExactArgs("generatorInstall").once();

      events.doGeneratorProgress("testProject", "install", false);
    });

    it("backward compatibility: showProgress=false on writing phase does nothing", () => {
      rpcMock.expects("invoke").never();

      events.doGeneratorProgress("testProject", "writing", false);
    });

    it("backward compatibility: showProgress=false on end phase does nothing", () => {
      rpcMock.expects("invoke").never();

      events.doGeneratorProgress("testProject", "end", false);
    });

    it("enhanced mode: showProgress=true on install phase invokes generatorProgress", () => {
      rpcMock
        .expects("invoke")
        .withExactArgs("generatorProgress", ["testProject", "install"])
        .once();

      events.doGeneratorProgress("testProject", "install", true);
    });

    it("enhanced mode: showProgress=true on writing phase invokes generatorProgress", () => {
      rpcMock
        .expects("invoke")
        .withExactArgs("generatorProgress", ["testProject", "writing"])
        .once();

      events.doGeneratorProgress("testProject", "writing", true);
    });

    it("enhanced mode: showProgress=true on end phase invokes generatorProgress", () => {
      rpcMock
        .expects("invoke")
        .withExactArgs("generatorProgress", ["testProject", "end"])
        .once();

      events.doGeneratorProgress("testProject", "end", true);
    });

    it("enhanced mode: handles undefined projectName", () => {
      rpcMock
        .expects("invoke")
        .withExactArgs("generatorProgress", [undefined, "writing"])
        .once();

      events.doGeneratorProgress(undefined, "writing", true);
    });
  });

  it("setAppWizardHeaderTitle", () => {
    const title = "Test Title";
    const info = "Test Info";
    rpcMock.expects("invoke").withExactArgs("setHeaderTitle", [title, info]);

    events.setAppWizardHeaderTitle(title, info);
  });

  it("doGeneratorInstall", () => {
    rpcMock.expects("invoke").withExactArgs("generatorInstall");

    events.doGeneratorInstall();
  });

  it("executeCommand", () => {
    const result = events.executeCommand();
    expect(result).to.be.a("promise");
  });

  it("getAppWizard", () => {
    const result = events.getAppWizard();
    expect(result).to.be.null;
  });

  it("selectFolder", () => {
    rpcMock.expects("invoke").withExactArgs("selectOutputFolder");

    events.selectFolder();
  });

  it("showProgress", () => {
    rpcMock.expects("invoke").withExactArgs("showProgress");

    events.showProgress();
  });

  it("doGeneratorDone", async () => {
    rpcMock
      .expects("invoke")
      .withExactArgs("generatorDone", [
        true,
        "Success message",
        "/workspace",
        "project",
        "/target",
      ])
      .resolves();

    const result = await events.doGeneratorDone(
      true,
      "Success message",
      "/workspace",
      "project",
      "/target"
    );

    expect(result).to.be.undefined;
  });
});
