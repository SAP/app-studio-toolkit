import { expect } from "chai";
import { SinonMock, mock } from "sinon";
import { mockVscode } from "./mockUtil";

const proxyProgress = {
  report: () => {
    throw new Error("not implemented");
  },
};

const testVscode = {
  window: {
    showErrorMessage: (m: string) => {
      throw new Error(`not implemented`);
    },
    withProgress: (
      opt: any,
      listener: (p: typeof proxyProgress, c?: any) => Promise<string>
    ) => {
      expect(opt.location).to.be.equal(
        testVscode.ProgressLocation.Notification
      );
      expect(opt.cancellable).to.be.true;
      expect((<string>opt.title).startsWith(`Connecting to `)).to.be.true;
      return listener(proxyProgress);
    },
  },
  commands: {
    executeCommand: () => {
      throw new Error(`not implemented`);
    },
  },
  ProgressLocation: {
    SourceControl: 1,
    Window: 10,
    Notification: 15,
  },
  Uri: { parse: () => "" },
};

mockVscode(testVscode, "dist/src/commands.js");

import proxyquire from "proxyquire";
import * as commands from "../src/commands";
import { URL } from "node:url";
import { DevSpaceNode, SSHD_SOCKET_PORT } from "../src/tunnel/ssh-utils";
import { messages } from "../src/messages";

describe("devspace connect unit test", () => {
  let commandsProxy: typeof commands;

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
    updateRemotePlatformSetting: () => {
      throw new Error("not implemented");
    },
    updateSSHConfig: () => {
      throw new Error("not implemented");
    },
    cleanRemotePlatformSetting: () => {
      throw new Error("not implemented");
    },
    deletePK: () => {
      throw new Error("not implemented");
    },
    removeSSHConfig: () => {
      throw new Error("not implemented");
    },
  };

  const dummyLogger = {
    info: () => "",
    error: () => "",
  };

  before(() => {
    commandsProxy = proxyquire("../src/commands", {
      vscode: {
        ProgressLocation: testVscode.ProgressLocation,
        window: testVscode.window,
        commands: testVscode.commands,
        Uri: testVscode.Uri,
        "@noCallThru": true,
      },
      "./tunnel/ssh-utils": proxySshUtils,
      "./logger/logger": {
        getLogger: () => dummyLogger,
      },
    });
  });

  let mockCommands: SinonMock;
  let mockWindow: SinonMock;
  let mockSshUtils: SinonMock;
  beforeEach(() => {
    mockCommands = mock(testVscode.commands);
    mockWindow = mock(testVscode.window);
    mockSshUtils = mock(proxySshUtils);
  });

  afterEach(() => {
    mockCommands.verify();
    mockWindow.verify();
    mockSshUtils.verify();
  });

  const node: DevSpaceNode = <DevSpaceNode>{
    landscapeUrl: `https://my.landscape-1.com`,
    wsUrl: `https://my.devspace.com`,
    id: `wd-id`,
  };

  it("closeTunnel", () => {
    expect(commandsProxy.closeTunnel()).to.be.false;
  });

  describe(`cmdDevSpaceConnectNewWindow scope unit tests set`, () => {
    let mockProgress: SinonMock;

    beforeEach(() => {
      mockProgress = mock(proxyProgress);
    });

    afterEach(() => {
      mockProgress.verify();
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

    it("cmdDevSpaceConnectNewWindow, succedded - opens empty window", async () => {
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
      await commandsProxy.cmdDevSpaceConnectNewWindow(node, "");
    });

    it("cmdDevSpaceConnectNewWindow, succedded - opens new window with specific folder", async () => {
      // const uri = testVscode.Uri(
      //   `vscode-remote://ssh-remote+${hostName}${folderPath}`
      // );

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
      mockCommands.expects(`executeCommand`).withArgs(`vscode.openFolder`);
      await commandsProxy.cmdDevSpaceConnectNewWindow(
        node,
        "/home/user/projects/project1"
      );
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
          messages.err_devspace_connect_new_window(node.wsUrl, err.toString())
        )
        .resolves();
      await commandsProxy.cmdDevSpaceConnectNewWindow(node, "");
    });
  });

  describe(`cleanDevspaceConfig scope unit tests`, () => {
    let mockLogger: SinonMock;

    beforeEach(() => {
      mockLogger = mock(dummyLogger);
    });

    afterEach(() => {
      mockLogger.verify();
    });

    it("cleanDevspaceConfig, ok", async () => {
      mockSshUtils.expects("deletePK").withExactArgs(node.wsUrl).returns(true);
      mockSshUtils.expects("removeSSHConfig").withExactArgs(node).returns(true);
      mockSshUtils
        .expects("cleanRemotePlatformSetting")
        .withExactArgs(node)
        .resolves();
      mockLogger
        .expects("info")
        .withExactArgs(`Devspace ssh config info cleaned`)
        .returns("");
      await commandsProxy.cleanDevspaceConfig(node);
    });

    it("cleanDevspaceConfig, failed", async () => {
      const err = new Error("deletePK - failed");
      mockSshUtils.expects("deletePK").withExactArgs(node.wsUrl).throws(err);
      mockLogger
        .expects("error")
        .withExactArgs(
          `Can't complete the devspace ssh config cleaning: ${err.toString()}`
        )
        .returns("");
      await commandsProxy.cleanDevspaceConfig(node);
    });
  });
});
