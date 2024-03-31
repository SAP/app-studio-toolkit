import { expect } from "chai";
import { fail } from "assert";
import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";
import { URL } from "node:url";
import type { UriHandler } from "vscode";
import { cloneDeep, concat, slice } from "lodash";

import * as basHandler from "../../../src/devspace-manager/handler/basHandler";
import { messages } from "../../../src/devspace-manager/common/messages";
import { LandscapeInfo } from "../../../src/devspace-manager/landscape/landscape";
import { devspace } from "@sap/bas-sdk";

describe("basHandler scope", () => {
  const vscodeProxy = {
    Uri: {
      parse: () => {
        throw new Error(`not implemented`);
      },
    },
    window: {
      showErrorMessage: (m: string) => {
        throw new Error(`not implemented`);
      },
    },
    commands: {
      executeCommand: () => {
        throw new Error(`not implemented`);
      },
    },
    EventEmitter: class ProxyEventEmitter<T> {
      constructor() {}
      fire() {
        throw new Error("not implemented");
      }
    },
  };
  let basHandlerProxy: typeof basHandler;

  const proxyLandscape = {
    cmdLoginToLandscape: () => {
      throw new Error(`not implemented`);
    },
    getLandscapes: () => {
      throw new Error(`not implemented`);
    },
  };

  const proxyLandscapeSet = {
    addLandscape: () => {
      throw new Error("not implemented");
    },
  };

  const proxyDevspaceConnect = {
    cmdDevSpaceConnectNewWindow: () => {
      throw new Error("not implemented");
    },
  };

  const proxyDevspaceUpdate = {
    cmdDevSpaceStart: () => {
      return;
    },
  };
  const proxyDevSpacesProvider: any = {
    getChildren: () => Promise.resolve([]),
  };

  const proxyNode = {
    getChildren: () => {
      throw new Error(`not implemented`);
    },
  };

  let handler: UriHandler;

  before(() => {
    basHandlerProxy = proxyquire(
      "../../../src/devspace-manager/handler/basHandler",
      {
        vscode: {
          Uri: vscodeProxy.Uri,
          window: vscodeProxy.window,
          commands: vscodeProxy.commands,
          EventEmitter: vscodeProxy.EventEmitter,
          "@noCallThru": true,
        },
        "../landscape/landscape": proxyLandscape,
        "../landscape/set": proxyLandscapeSet,
        "../devspace/connect": proxyDevspaceConnect,
        "../devspace/update": proxyDevspaceUpdate,
      }
    );

    handler = basHandlerProxy.getBasUriHandler(proxyDevSpacesProvider);
  });

  let mockLandscape: SinonMock;
  let mockDevSpaceProvider: SinonMock;
  let mockDevSpaceConnect: SinonMock;
  let mockDevSpaceUpdate: SinonMock;
  let mockLandscapeSet: SinonMock;
  let mockWindow: SinonMock;
  let mockCommands: SinonMock;

  beforeEach(() => {
    mockLandscape = mock(proxyLandscape);
    mockDevSpaceProvider = mock(proxyDevSpacesProvider);
    mockDevSpaceConnect = mock(proxyDevspaceConnect);
    mockDevSpaceUpdate = mock(proxyDevspaceUpdate);
    mockLandscapeSet = mock(proxyLandscapeSet);
    mockWindow = mock(vscodeProxy.window);
    mockCommands = mock(vscodeProxy.commands);
  });

  afterEach(() => {
    mockLandscape.verify();
    mockDevSpaceProvider.verify();
    mockDevSpaceConnect.verify();
    mockDevSpaceUpdate.verify();
    mockLandscapeSet.verify();
    mockWindow.verify();
    mockCommands.verify();
  });

  const landscapeUrl1 = `https://my.landscape-1.com`;
  const landscapeUrl2 = `https://my.landscape-2.com`;
  const workspaceid = `workspace-my-id1`;

  describe("handle open", () => {
    const uri: any = {
      path: `/open`,
      query: `landscape=${
        new URL(landscapeUrl1).hostname
      }&devspaceid=${workspaceid.split(`-`).slice(1).join(`-`)}`,
      toString: () => `uri:toString`,
    };

    const landscapes: LandscapeInfo[] = [
      {
        name: new URL(landscapeUrl1).hostname,
        url: new URL(landscapeUrl1).toString(),
        isLoggedIn: false,
      },
      {
        name: new URL(landscapeUrl2).hostname,
        url: new URL(landscapeUrl2).toString(),
        isLoggedIn: false,
      },
    ];

    const nodes: any[] = [
      Object.assign(
        {
          contextValue: `log-in-node`,
          name: landscapes[0].name,
          uri: landscapes[0].url,
        },
        proxyNode
      ),
      Object.assign(
        {
          name: landscapes[1].name,
          uri: landscapes[1].url,
        },
        proxyNode
      ),
    ];

    const devspaces: any[] = [
      {
        landscapeUrl: landscapeUrl1,
        id: `my-id1`,
        status: devspace.DevSpaceStatus.RUNNING,
      },
      {
        landscapeUrl: landscapeUrl2,
        id: `my-id2`,
        status: devspace.DevSpaceStatus.RUNNING,
      },
    ];

    it("handleUri, ok - no specific folder", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).resolves(nodes);
      const mockLandscapeNode = mock(nodes[0]);
      mockLandscapeNode.expects(`getChildren`).resolves(devspaces);
      mockDevSpaceConnect
        .expects(`cmdDevSpaceConnectNewWindow`)
        .withExactArgs(devspaces[0], undefined)
        .resolves();
      await handler.handleUri(uri);
      mockLandscapeNode.verify();
    });

    it("handleUri, uri path is unexpected", async () => {
      const wrongUri = cloneDeep(uri);
      wrongUri.path = `/run`;
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_url_has_incorrect_format(wrongUri.toString())
          )
        );
      await handler.handleUri(wrongUri);
    });

    it("handleUri, url has wromg 'landscape' param", async () => {
      const wrongParamUri = cloneDeep(uri);
      wrongParamUri.query = `landcape=some-landscape.com&devspaceid=someid`;
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_url_param_missing(wrongParamUri.query, `landscape`)
          )
        );
      await handler.handleUri(wrongParamUri);
    });

    it("handleUri, url has wromg 'landscape' param format", async () => {
      const wrongParamUri = cloneDeep(uri);
      wrongParamUri.query = `landscape:some-landscape.com&devspaceid=someid`;
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_url_param_missing(wrongParamUri.query, `landscape`)
          )
        );
      await handler.handleUri(wrongParamUri);
    });

    it("handleUri, url has wromg 'devspaceid' param", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).resolves(nodes);
      const wrongParamUri = cloneDeep(uri);
      wrongParamUri.query = `landscape=${
        new URL(landscapeUrl1).hostname
      }&devspace=${workspaceid.split(`-`).slice(1).join(`-`)}`;
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_url_param_missing(wrongParamUri.query, `devspaceid`)
          )
        );
      await handler.handleUri(wrongParamUri);
    });

    it("handleUri, landscape not exist, added", async () => {
      const landscapeUrl = `https://my.landscape-other.com`;
      const landscapeParam = new URL(landscapeUrl).hostname;
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      const fullLandscapes = concat(landscapes, {
        name: new URL(landscapeUrl).hostname,
        url: new URL(landscapeUrl).toString(),
        isLoggedIn: false,
      });
      mockLandscapeSet
        .expects(`addLandscape`)
        .withExactArgs(`https://${landscapeParam}`)
        .resolves(fullLandscapes);
      const fullNodes = concat(
        nodes,
        Object.assign(
          {
            label: `label`,
            contextValue: `log-in-node`,
            name: fullLandscapes[2].name,
            uri: fullLandscapes[2].url,
          },
          proxyNode
        )
      );
      mockDevSpaceProvider.expects(`getChildren`).resolves(fullNodes);
      const mockLandscapeNode = mock(fullNodes[2]);
      mockLandscapeNode.expects(`getChildren`).resolves(devspaces);
      mockDevSpaceConnect
        .expects(`cmdDevSpaceConnectNewWindow`)
        .withExactArgs(devspaces[0], undefined)
        .resolves();
      const otherUri = cloneDeep(uri);
      otherUri.query = `landscape=${landscapeParam}&devspaceid=${workspaceid
        .split(`-`)
        .slice(1)
        .join(`-`)}`;
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.tree.refresh");
      await handler.handleUri(otherUri);
      mockLandscapeNode.verify();
    });

    it("handleUri, landscape node not found", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      const missedNodes = slice(nodes, 1);
      mockDevSpaceProvider.expects(`getChildren`).resolves(missedNodes);
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_landscape_not_added(new URL(landscapeUrl1).hostname)
          )
        );
      await handler.handleUri(uri);
    });

    it("handleUri, landscape is not log in", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      const copyNodes = cloneDeep(nodes);
      copyNodes[0].contextValue = `log-out-node`;
      mockLandscape
        .expects(`cmdLoginToLandscape`)
        .withExactArgs(copyNodes[0])
        .resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).twice().resolves(copyNodes);
      const mockLandscapeNode = mock(copyNodes[0]);
      mockLandscapeNode.expects(`getChildren`).resolves(devspaces);
      mockDevSpaceConnect
        .expects(`cmdDevSpaceConnectNewWindow`)
        .withExactArgs(devspaces[0], undefined)
        .resolves();
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.tree.refresh");
      await handler.handleUri(uri);
      mockLandscapeNode.verify();
    });

    it("handleUri, landscape is not log in (contex value empty)", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      const copyNodes = cloneDeep(nodes);
      delete copyNodes[0].contextValue;
      mockLandscape
        .expects(`cmdLoginToLandscape`)
        .withExactArgs(copyNodes[0])
        .resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).twice().resolves(copyNodes);
      const mockLandscapeNode = mock(copyNodes[0]);
      mockLandscapeNode.expects(`getChildren`).resolves(devspaces);
      mockDevSpaceConnect
        .expects(`cmdDevSpaceConnectNewWindow`)
        .withExactArgs(devspaces[0], undefined)
        .resolves();
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.tree.refresh");
      await handler.handleUri(uri);
      mockLandscapeNode.verify();
    });

    it("handleUri, landscape is empty (there are no devscapes)", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).resolves(nodes);
      const mockLandscapeNode = mock(nodes[0]);
      mockLandscapeNode.expects(`getChildren`).resolves([]);
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_no_devspaces_in_landscape(nodes[0].name)
          )
        );
      await handler.handleUri(uri);
      mockLandscapeNode.verify();
    });

    it("handleUri, devspace not found", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).resolves(nodes);
      const mockLandscapeNode = mock(nodes[0]);
      mockLandscapeNode.expects(`getChildren`).resolves(slice(devspaces, 1));
      mockWindow
        .expects(`showErrorMessage`)
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_devspace_missing(
              workspaceid.split(`-`).slice(1).join(`-`)
            )
          )
        );
      await handler.handleUri(uri);
      mockLandscapeNode.verify();
    });

    it("handleUri, devspace stopped", async () => {
      mockLandscape.expects(`getLandscapes`).resolves(landscapes);
      mockDevSpaceProvider.expects(`getChildren`).resolves(nodes);
      const cloned = cloneDeep(devspaces);
      cloned[0].status = devspace.DevSpaceStatus.STOPPED;
      const mockLandscapeNode = mock(nodes[0]);
      mockLandscapeNode.expects(`getChildren`).resolves(cloned);
      mockWindow.expects(`showErrorMessage`).resolves();
      mockDevSpaceUpdate
        .expects(`cmdDevSpaceStart`)
        .withExactArgs(cloned[0])
        .resolves();
      await handler.handleUri(uri);
      mockLandscapeNode.verify();
    });
  });

  describe("handle login", () => {
    const token = "jwt";
    const uri: any = {
      path: `/login`,
      query: `jwt=${token}`,
      toString: () => `uri: login path`,
    };
    let mockEmitter: SinonMock;

    beforeEach(() => {
      mockEmitter = mock(basHandlerProxy.eventEmitter);
    });

    afterEach(() => {
      mockEmitter.verify();
    });

    it("login, ok", async () => {
      mockEmitter
        .expects("fire")
        .withExactArgs({ jwt: `${token}` })
        .returns("");
      await handler.handleUri(uri);
    });

    it("login, wrong query param received", async () => {
      const url = cloneDeep(uri);
      url.query = `notjwt=${token}`;
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(
          messages.err_open_devspace_in_code(
            messages.err_url_param_missing(url.query, "jwt")
          )
        )
        .resolves();
      await handler.handleUri(url);
    });
  });

  it("handle unsupported path", async () => {
    const uri: any = {
      path: `/support`,
      toString: () => `uri:unsupported path`,
    };
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(
        messages.err_open_devspace_in_code(
          messages.err_url_has_incorrect_format(uri.toString())
        )
      )
      .resolves();
    expect(await handler.handleUri(uri)).to.be.undefined;
  });
});
