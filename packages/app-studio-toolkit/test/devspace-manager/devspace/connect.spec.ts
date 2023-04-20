import { expect } from "chai";
import { SinonMock, mock, createSandbox, SinonSandbox } from "sinon";
import proxyquire from "proxyquire";
import * as connect from "../../../src/devspace-manager/devspace/connect";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";
import { SSHD_SOCKET_PORT } from "../../../src/devspace-manager/tunnel/ssh-utils";
import { URL } from "node:url";
import urljoin from "url-join";
import { messages } from "../../../src/devspace-manager/common/messages";

describe("devspace connect unit test", () => {
  let sandbox: SinonSandbox;
  let connectProxy: typeof connect;

  const proxyProgressLocation = {
    SourceControl: 1,
    Window: 10,
    Notification: 15,
  };

  const proxyProgress = {
    report: () => {
      throw new Error("not implemented");
    },
  };

  const proxyWindow = {
    showErrorMessage: () => {
      throw new Error("not implemented");
    },
    withProgress: (
      opt: any,
      listener: (p: typeof proxyProgress, c?: any) => Promise<string>
    ) => {
      expect(opt.location).to.be.equal(proxyProgressLocation.Notification);
      expect(opt.cancellable).to.be.true;
      expect((<string>opt.title).startsWith(`Connecting to `)).to.be.true;
      return listener(proxyProgress);
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

  const proxySshUtils = {
    getPK: () => {
      throw new Error("not implemented");
    },
    runChannelClient: () => {
      throw new Error("not implemented");
    },
    savePK: () => {
      throw new Error("not implemented");
    },
    SSHD_SOCKET_PORT,
    updateRemotePlatformSetting: () => {
      throw new Error("not implemented");
    },
    updateSSHConfig: () => {
      throw new Error("not implemented");
    },
  };

  before(() => {
    sandbox = createSandbox();
    connectProxy = proxyquire(
      "../../../src/devspace-manager/devspace/connect",
      {
        vscode: {
          ProgressLocation: proxyProgressLocation,
          window: proxyWindow,
          commands: proxyCommands,
          env: proxyEnv,
          Uri: proxyUri,
          "@noCallThru": true,
        },
        "../tunnel/ssh-utils": proxySshUtils,
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

  it("closeTunnel", () => {
    expect(connectProxy.closeTunnel()).to.be.false;
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
    let mockProgress: SinonMock;
    let mockSshUtils: SinonMock;
    beforeEach(() => {
      mockProgress = mock(proxyProgress);
      mockSshUtils = mock(proxySshUtils);
    });

    afterEach(() => {
      mockProgress.verify();
      mockSshUtils.verify();
    });

    const key = `key`;
    const keyPath = `/home/user/location.${key}`;
    const config = {
      name: node.landscapeUrl,
      port: 12345,
    };
    const opts = {
      host: `port${SSHD_SOCKET_PORT}-${new URL(node.wsUrl).hostname}`,
      landscape: node.landscapeUrl,
      localPort: config.port,
    };

    it("cmdDevSpaceConnectNewWindow, succedded", async () => {
      mockProgress
        .expects(`report`)
        .withExactArgs({ message: `${messages.info_obtaining_key}` })
        .returns(true);
      mockProgress
        .expects(`report`)
        .withExactArgs({ message: `${messages.info_save_pk_to_file}` })
        .returns(true);
      mockProgress
        .expects(`report`)
        .withExactArgs({
          message: `${messages.info_update_config_file_with_ssh_connection}`,
        })
        .returns(true);
      mockSshUtils
        .expects("getPK")
        .withExactArgs(node.landscapeUrl, node.id)
        .resolves(key);
      mockSshUtils
        .expects("savePK")
        .withExactArgs(key, node.wsUrl)
        .returns(keyPath);
      mockSshUtils
        .expects("updateSSHConfig")
        .withExactArgs(keyPath, node)
        .resolves(config);
      mockProgress
        .expects(`report`)
        .withExactArgs({ message: `${messages.info_closing_old_tunnel}` })
        .returns(true);
      mockProgress
        .expects(`report`)
        .withExactArgs({ message: `${messages.info_staring_new_tunnel}` })
        .returns(true);
      mockSshUtils.expects("runChannelClient").withExactArgs(opts).resolves();
      mockSshUtils
        .expects("updateRemotePlatformSetting")
        .withExactArgs(config)
        .resolves();
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`opensshremotes.openEmptyWindow`, {
          host: config.name,
        });
      await connectProxy.cmdDevSpaceConnectNewWindow(node);
    });

    it("cmdDevSpaceConnectNewWindow, failed", async () => {
      const err = new Error(`error during getPK`);
      mockProgress
        .expects(`report`)
        .withExactArgs({ message: `${messages.info_obtaining_key}` })
        .returns(true);
      mockSshUtils
        .expects("getPK")
        .withExactArgs(node.landscapeUrl, node.id)
        .rejects(err);
      mockCommands.expects(`executeCommand`).never();
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          `Can't connect the devspace ${node.wsUrl}: ${err.toString()}`
        )
        .resolves();
      await connectProxy.cmdDevSpaceConnectNewWindow(node);
    });
  });
});
