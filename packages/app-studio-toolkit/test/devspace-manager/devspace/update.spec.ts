import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as devspaceModule from "../../../src/devspace-manager/devspace/update";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";
import { messages } from "../../../src/devspace-manager/common/messages";
import * as sdk from "@sap/bas-sdk";
import { DevSpaceInfo } from "../../../src/devspace-manager/devspace/devspace";
import { cloneDeep } from "lodash";

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

  const proxySdkDevSpace = {
    devspace: {
      updateDevSpace: () => {
        throw new Error("not implemented");
      },
      DevSpaceStatus: sdk.devspace.DevSpaceStatus,
      PackName: sdk.devspace.PackName,
    },
  };

  const proxyAuthUtils = {
    getJwt: () => {
      throw new Error(`not implemented`);
    },
  };

  const proxyLandscape = {
    autoRefresh: (): void => {
      throw new Error(`not implemented`);
    },
  };

  const proxyDevspace = {
    DevSpaceStatus: sdk.devspace.DevSpaceStatus,
    getDevSpaces: (): void => {
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
        "@sap/bas-sdk": proxySdkDevSpace,
        "../../authentication/auth-utils": proxyAuthUtils,
        "../landscape/landscape": proxyLandscape,
        "./devspace": proxyDevspace,
      }
    );
  });

  let mockAuthUtils: SinonMock;
  let mockSdkDevspace: SinonMock;
  let mockCommands: SinonMock;
  let mockWindow: SinonMock;
  let mockLandscape: SinonMock;
  let mockDevspace: SinonMock;

  beforeEach(() => {
    mockAuthUtils = mock(proxyAuthUtils);
    mockSdkDevspace = mock(proxySdkDevSpace.devspace);
    mockCommands = mock(proxyCommands);
    mockWindow = mock(proxyWindow);
    mockLandscape = mock(proxyLandscape);
    mockDevspace = mock(proxyDevspace);
  });

  afterEach(() => {
    mockAuthUtils.verify();
    mockSdkDevspace.verify();
    mockCommands.verify();
    mockWindow.verify();
    mockLandscape.verify();
    mockDevspace.verify();
  });

  const node: DevSpaceNode = <DevSpaceNode>{
    label: `devspace.lable`,
    landscapeUrl: `https://my.landscape-1.com`,
    id: `ws-id`,
  };
  const jwt = `devscape-jwt`;

  const devspaces: DevSpaceInfo[] = [
    {
      devspaceDisplayName: `devspaceDisplayName-1`,
      devspaceOrigin: `devspaceOrigin`,
      pack: `pack-1`,
      packDisplayName: `packDisplayName-1`,
      url: `url`,
      id: `id`,
      optionalExtensions: `optionalExtensions`,
      technicalExtensions: `technicalExtensions`,
      status: sdk.devspace.DevSpaceStatus.STOPPED,
    },
    {
      devspaceDisplayName: `devspaceDisplayName-2`,
      devspaceOrigin: `devspaceOrigin`,
      pack: `pack-2`,
      packDisplayName: `packDisplayName-2`,
      url: `url-2`,
      id: `id-2`,
      optionalExtensions: `optionalExtensions`,
      technicalExtensions: `technicalExtensions`,
      status: sdk.devspace.DevSpaceStatus.RUNNING,
    },
  ];

  it("cmdDevSpaceStart, succedded", async () => {
    mockDevspace
      .expects(`getDevSpaces`)
      .withExactArgs(node.landscapeUrl)
      .resolves(devspaces);
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .resolves(jwt);
    mockSdkDevspace
      .expects(`updateDevSpace`)
      .withExactArgs(node.landscapeUrl, jwt, node.id, {
        Suspended: false,
        WorkspaceDisplayName: node.label,
      })
      .resolves();
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(
        messages.info_devspace_state_updated(node.label, node.id, false)
      )
      .resolves();
    mockLandscape.expects(`autoRefresh`).resolves();
    mockCommands
      .expects(`executeCommand`)
      .withExactArgs("local-extension.tree.refresh")
      .returns(true);
    await devspaceProxy.cmdDevSpaceStart(node);
  });

  it("cmdDevSpaceStart, failed", async () => {
    const err = new Error(`error`);
    mockDevspace
      .expects(`getDevSpaces`)
      .withExactArgs(node.landscapeUrl)
      .resolves(devspaces);
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

  it("cmdDevSpaceStart, failure by 2 running devspaces restriction", async () => {
    const localDevspaces = cloneDeep(devspaces);
    localDevspaces[0].status = sdk.devspace.DevSpaceStatus.STARTING;
    mockDevspace
      .expects(`getDevSpaces`)
      .withExactArgs(node.landscapeUrl)
      .resolves(localDevspaces);
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(messages.info_can_run_only_2_devspaces)
      .resolves();
    await devspaceProxy.cmdDevSpaceStart(node);
  });

  it("cmdDevSpaceStart, failure by other reason", async () => {
    mockDevspace
      .expects(`getDevSpaces`)
      .withExactArgs(node.landscapeUrl)
      .resolves();
    await devspaceProxy.cmdDevSpaceStart(node);
  });

  it("cmdDevSpaceStop, succedded", async () => {
    mockAuthUtils
      .expects(`getJwt`)
      .withExactArgs(node.landscapeUrl)
      .resolves(jwt);
    mockSdkDevspace
      .expects(`updateDevSpace`)
      .withExactArgs(node.landscapeUrl, jwt, node.id, {
        Suspended: true,
        WorkspaceDisplayName: node.label,
      })
      .resolves();
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(
        messages.info_devspace_state_updated(node.label, node.id, true)
      )
      .resolves();
    mockLandscape.expects(`autoRefresh`).resolves();
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
