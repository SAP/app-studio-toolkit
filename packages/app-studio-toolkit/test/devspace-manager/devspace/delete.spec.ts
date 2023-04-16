import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as devspaceModule from "../../../src/devspace-manager/devspace/delete";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";
import { messages } from "../../../src/devspace-manager/common/messages";

describe("cmdDevSpaceDelete unit test", () => {
  let devspaceDeleteProxy: typeof devspaceModule.cmdDevSpaceDelete;

  const proxyWindow = {
    showErrorMessage: () => {
      throw new Error("not implemented");
    },
    showInformationMessage: () => {
      throw new Error("not implemented");
    },
  };

  const proxyCommands = {
    executeCommand: () => {
      throw new Error("not implemented");
    },
  };

  const proxyDevSpace = {
    devspace: {
      deleteDevSpace: () => {
        throw new Error("not implemented");
      },
    },
  };

  const proxyAuthUtils = {
    getJwt: () => {
      throw new Error(`not implemented`);
    },
  };

  const proxySshUtils = {
    deletePK: () => {
      throw new Error("not implemented");
    },
    cleanRemotePlatformSetting: () => {
      throw new Error("not implemented");
    },
    removeSSHConfig: () => {
      throw new Error("not implemented");
    },
  };

  before(() => {
    devspaceDeleteProxy = proxyquire(
      "../../../src/devspace-manager/devspace/delete",
      {
        vscode: {
          commands: proxyCommands,
          window: proxyWindow,
          "@noCallThru": true,
        },
        "@sap/bas-sdk": proxyDevSpace,
        "../../authentication/auth-utils": proxyAuthUtils,
        "../tunnel/ssh-utils": proxySshUtils,
      }
    ).cmdDevSpaceDelete;
  });

  let mockSshUtils: SinonMock;
  let mockAuthUtils: SinonMock;
  let mockDevspace: SinonMock;
  let mockCommands: SinonMock;
  let mockWindow: SinonMock;

  beforeEach(() => {
    mockSshUtils = mock(proxySshUtils);
    mockAuthUtils = mock(proxyAuthUtils);
    mockDevspace = mock(proxyDevSpace.devspace);
    mockCommands = mock(proxyCommands);
    mockWindow = mock(proxyWindow);
  });

  afterEach(() => {
    mockSshUtils.verify();
    mockAuthUtils.verify();
    mockDevspace.verify();
    mockCommands.verify();
    mockWindow.verify();
  });

  const node: DevSpaceNode = <DevSpaceNode>{
    label: `devspace.lable`,
    landscapeUrl: `https://my.landscape-1.com`,
    wsUrl: `https://my.devspace.url.test`,
    id: `ws-id`,
  };
  const jwt = `devscape-jwt`;

  it("cmdDevSpaceDelete, confirmed, succedded", async () => {
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(
        messages.lbl_delete_devspace(node.label, node.id),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_yes);
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .resolves(jwt);
    mockDevspace
      .expects(`deleteDevSpace`)
      .withExactArgs(node.landscapeUrl, jwt, node.id)
      .resolves();
    mockSshUtils.expects(`deletePK`).withExactArgs(node.wsUrl).returns(true);
    mockSshUtils.expects(`removeSSHConfig`).withExactArgs(node).returns(true);
    mockSshUtils
      .expects(`cleanRemotePlatformSetting`)
      .withExactArgs(node)
      .resolves();
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(messages.info_devspace_deleted(node.id))
      .resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    await devspaceDeleteProxy(node);
  });

  it("cmdDevSpaceDelete, canceled", async () => {
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(
        messages.lbl_delete_devspace(node.label, node.id),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_no);
    await devspaceDeleteProxy(node);
  });

  it("cmdDevSpaceDelete, confirmed, exception thrown via cleaning stage", async () => {
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(
        messages.lbl_delete_devspace(node.label, node.id),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_yes);
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .resolves(jwt);
    mockDevspace
      .expects(`deleteDevSpace`)
      .withExactArgs(node.landscapeUrl, jwt, node.id)
      .resolves();
    mockSshUtils.expects(`deletePK`).withExactArgs(node.wsUrl).returns(true);
    mockSshUtils
      .expects(`removeSSHConfig`)
      .withExactArgs(node)
      .throws(new Error(`cleaning stage error`));
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(messages.info_devspace_deleted(node.id))
      .resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    await devspaceDeleteProxy(node);
  });

  it("cmdDevSpaceDelete, confirmed, exception thrown", async () => {
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(
        messages.lbl_delete_devspace(node.label, node.id),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_yes);
    const err = new Error(`getting jwt error`);
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .rejects(err);
    mockWindow
      .expects(`showErrorMessage`)
      .withExactArgs(messages.err_devspace_delete(node.id, err.toString()))
      .resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    await devspaceDeleteProxy(node);
  });
});
