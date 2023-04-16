import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as devspaceModule from "../../../src/devspace-manager/devspace/update";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";
import { messages } from "../../../src/devspace-manager/common/messages";
import { RefreshRate } from "../../../src/devspace-manager/landscape/landscape";

describe("devspace start/stop unit test", () => {
  let devspaceProxy: typeof devspaceModule;

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
      updateDevSpace: () => {
        throw new Error("not implemented");
      },
    },
  };

  const proxyAuthUtils = {
    getJwt: () => {
      throw new Error(`not implemented`);
    },
  };

  const landscapeProxy = {
    RefreshRate,
    autoRefresh: (): void => {
      throw new Error(`not implemented`);
    },
  };

  before(() => {
    devspaceProxy = proxyquire(
      "../../../src/devspace-manager/devspace/update",
      {
        vscode: {
          commands: proxyCommands,
          window: proxyWindow,
          "@noCallThru": true,
        },
        "@sap/bas-sdk": proxyDevSpace,
        "../../authentication/auth-utils": proxyAuthUtils,
        "../landscape/landscape": landscapeProxy,
      }
    );
  });

  let mockAuthUtils: SinonMock;
  let mockDevspace: SinonMock;
  let mockCommands: SinonMock;
  let mockWindow: SinonMock;
  let mockLandscape: SinonMock;

  beforeEach(() => {
    mockAuthUtils = mock(proxyAuthUtils);
    mockDevspace = mock(proxyDevSpace.devspace);
    mockCommands = mock(proxyCommands);
    mockWindow = mock(proxyWindow);
    mockLandscape = mock(landscapeProxy);
  });

  afterEach(() => {
    mockAuthUtils.verify();
    mockDevspace.verify();
    mockCommands.verify();
    mockWindow.verify();
    mockLandscape.verify();
  });

  const node: DevSpaceNode = <DevSpaceNode>{
    label: `devspace.lable`,
    landscapeUrl: `https://my.landscape-1.com`,
    id: `ws-id`,
  };
  const jwt = `devscape-jwt`;

  it("cmdDevSpaceStart, succedded", async () => {
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .resolves(jwt);
    mockDevspace
      .expects(`updateDevSpace`)
      .withExactArgs(node.landscapeUrl, jwt, node.id, {
        Suspended: false,
        WorkspaceDisplayName: node.label,
      })
      .resolves();
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(`Devspace ${node.label} (${node.id}) was started`)
      .resolves();
    mockLandscape
      .expects(`autoRefresh`)
      .withExactArgs(RefreshRate.SEC_10, RefreshRate.MIN_2)
      .resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .returns(true);
    await devspaceProxy.cmdDevSpaceStart(node);
  });

  it("cmdDevSpaceStart, failed", async () => {
    const err = new Error(`error`);
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .rejects(err);
    mockWindow
      .expects(`showErrorMessage`)
      .withExactArgs(messages.err_ws_update(node.id, err.toString()))
      .resolves();
    mockLandscape.expects(`autoRefresh`).never();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .returns(true);
    await devspaceProxy.cmdDevSpaceStart(node);
  });

  it("cmdDevSpaceStop, succedded", async () => {
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .resolves(jwt);
    mockDevspace
      .expects(`updateDevSpace`)
      .withExactArgs(node.landscapeUrl, jwt, node.id, {
        Suspended: true,
        WorkspaceDisplayName: node.label,
      })
      .resolves();
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(`Devspace ${node.label} (${node.id}) was stoped`)
      .resolves();
    mockLandscape
      .expects(`autoRefresh`)
      .withExactArgs(RefreshRate.SEC_10, RefreshRate.MIN_2)
      .resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .returns(true);
    await devspaceProxy.cmdDevSpaceStop(node);
  });

  it("cmdDevSpaceStop, failed", async () => {
    const err = new Error(`error`);
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .rejects(err);
    mockWindow
      .expects(`showErrorMessage`)
      .withExactArgs(messages.err_ws_update(node.id, err.toString()))
      .resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .returns(true);
    await devspaceProxy.cmdDevSpaceStop(node);
  });
});
