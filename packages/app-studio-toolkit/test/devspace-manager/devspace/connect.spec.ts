import { expect } from "chai";
import { SinonMock, mock, createSandbox, SinonSandbox } from "sinon";
import proxyquire from "proxyquire";
import * as connect from "../../../src/devspace-manager/devspace/connect";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";
import urljoin from "url-join";
import { messages } from "../../../src/devspace-manager/common/messages";
import { fail } from "assert";

describe("devspace connect unit test", () => {
  let sandbox: SinonSandbox;
  let connectProxy: typeof connect;

  const proxyWindow = {
    showErrorMessage: () => {
      throw new Error("not implemented");
    },
  };
  const proxyCommands = {
    executeCommand: () => {
      throw new Error("not implemented");
    },
  };

  const proxyUri = {
    parse: (urlStr: string): any => {},
  };

  const proxyEnv = {
    openExternal: () => {
      throw new Error("not implemented");
    },
  };

  before(() => {
    sandbox = createSandbox();
    connectProxy = proxyquire(
      "../../../src/devspace-manager/devspace/connect",
      {
        vscode: {
          window: proxyWindow,
          commands: proxyCommands,
          env: proxyEnv,
          Uri: proxyUri,
          "@noCallThru": true,
        },
      }
    );
  });

  let mockCommands: SinonMock;
  let mockWindow: SinonMock;
  beforeEach(() => {
    sandbox.restore();
    mockCommands = mock(proxyCommands);
    mockWindow = mock(proxyWindow);
  });

  afterEach(() => {
    mockCommands.verify();
    mockWindow.verify();
  });

  const node: DevSpaceNode = <DevSpaceNode>{
    landscapeUrl: `https://my.landscape-1.com`,
    wsUrl: `https://my.devspace.com`,
    id: `wd-id`,
  };

  it("closeTunnel", async () => {
    mockCommands
      .expects("executeCommand")
      .withExactArgs("remote-access.close-tunnel")
      .resolves();
    await connectProxy.closeTunnels();
  });

  describe(`cmdDevSpaceOpenInBAS scope unit tests set`, () => {
    let mockEnv: SinonMock;
    beforeEach(() => {
      mockEnv = mock(proxyEnv);
    });

    afterEach(() => {
      mockEnv.verify();
    });

    it("cmdDevSpaceOpenInBAS, succedded", async () => {
      const urlStr = urljoin(node.landscapeUrl, `index.html`, `#${node.id}`);
      const url = { fsPath: urlStr };
      mockEnv.expects(`openExternal`).withExactArgs(url).resolves(true);
      sandbox.stub(proxyUri, `parse`).withArgs(urlStr).returns(url);
      expect(await connectProxy.cmdDevSpaceOpenInBAS(node)).to.be.true;
    });

    it("cmdDevSpaceOpenInBAS, rejected", async () => {
      const err = new Error(`parse error`);
      sandbox.stub(proxyUri, `parse`).throws(err);
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_bas(node.landscapeUrl, err.message)
        )
        .resolves();
      expect(await connectProxy.cmdDevSpaceOpenInBAS(node)).to.be.false;
    });
  });

  describe(`cmdDevSpaceConnectNewWindow scope unit tests set`, () => {
    it("cmdDevSpaceConnectNewWindow, succedded", async () => {
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`remote-access.dev-space.connect-new-window`, node, "")
        .resolves();
      await connectProxy.cmdDevSpaceConnectNewWindow(node, "");
    });

    it("cmdDevSpaceConnectNewWindow, failed", async () => {
      const err = new Error(`command execution error`);
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`remote-access.dev-space.connect-new-window`, node, "")
        .rejects(err);
      try {
        await connectProxy.cmdDevSpaceConnectNewWindow(node, "");
        fail("should fail");
      } catch (e) {
        expect(e).to.be.deep.equal(err);
      }
    });
  });
});
