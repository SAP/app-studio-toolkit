import { expect } from "chai";
import { SinonMock, mock } from "sinon";
import { mockVscode } from "../../../test/mockUtil";

enum localConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}
let lands: string[] | undefined = [];
const wsConfig = {
  get: (key: string) =>
    key === "sap-remote.landscape-name" ? lands?.join(",") : undefined,
  update: (key: string, value: string, target: localConfigurationTarget) => {
    if (
      key === "sap-remote.landscape-name" &&
      target === localConfigurationTarget.Global
    ) {
      lands = value.split(",");
    }
    return Promise.resolve();
  },
};
const testVscode = {
  workspace: {
    getConfiguration: () => wsConfig,
  },
  commands: {
    executeCommand: () => {
      throw new Error(`not implemented`);
    },
  },
  ConfigurationTarget: localConfigurationTarget,
  authentication: {
    getSession: () => {
      throw new Error(`not implemented`);
    },
  },
};

mockVscode(testVscode, "dist/src/devspace-manager/landscape/landscape.js");

import * as land from "../../../src/devspace-manager/landscape/landscape";
import { BasRemoteAuthenticationProvider } from "../../../src/authentication/authProvider";
import { LandscapeNode } from "../../../src/devspace-manager/tree/treeItems";
import { fail } from "assert";
import { URL } from "node:url";

describe("landscapes unit test", () => {
  let mockCommands: SinonMock;
  let mockAuthentication: SinonMock;

  beforeEach(() => {
    mockCommands = mock(testVscode.commands);
    mockAuthentication = mock(testVscode.authentication);
    lands = [];
  });

  afterEach(() => {
    mockCommands.verify();
    mockAuthentication.verify();
  });

  const landscapeUrl1 = "https://my.landscape-1.com";
  const landscapeUrl2 = "https://my.landscape-2.com";

  it("getLandscapes, config not exists", async () => {
    lands = undefined;
    expect(await land.getLandscapes()).be.deep.equal([]);
  });

  it("getLandscapes, no items defined", async () => {
    expect(await land.getLandscapes()).be.deep.equal([]);
  });

  it("getLandscapes, few items defined", async () => {
    lands?.push(landscapeUrl1);
    lands?.push(landscapeUrl2);
    const landscapes: land.LandscapeInfo[] = [
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
    expect(await land.getLandscapes()).be.deep.equal(landscapes);
  });

  it("removeLandscape, successful", async () => {
    lands?.push(landscapeUrl1);
    lands?.push(landscapeUrl2);
    await land.removeLandscape(landscapeUrl1);
    expect(lands?.length).be.equal(1);
  });

  it("removeLandscape, only one item exists", async () => {
    lands?.push(landscapeUrl1);
    await land.removeLandscape(landscapeUrl1);
    expect(lands).be.deep.equal([""]);
  });

  it("removeLandscape, the require item not exists, result not changed", async () => {
    lands?.push(landscapeUrl1);
    await land.removeLandscape(landscapeUrl2);
    expect(lands).be.deep.equal([landscapeUrl1]);
  });

  it("removeLandscape, no config detected", async () => {
    lands = undefined;
    await land.removeLandscape(landscapeUrl1);
    expect(lands).be.undefined;
  });

  it("autoRefresh, landscapes empty", () => {
    lands = undefined;
    mockCommands.expects(`executeCommand`).never();
    land.autoRefresh();
  });

  it("autoRefresh, landscapes exist", (done) => {
    lands?.push(landscapeUrl2);
    mockCommands
      .expects(`executeCommand`)
      .atLeast(3)
      .withExactArgs("local-extension.tree.refresh");
    land.autoRefresh(100, 350);
    setTimeout(() => done(), 500);
  });

  it("autoRefresh, exception thrown", (done) => {
    lands?.push(`ttt:\\wrong..pattern`);
    land.autoRefresh(100, 200);
    setTimeout(() => done(), 500);
  });

  describe("cmdLoginToLandscape scope", () => {
    const landscape = `http://my.landscape.test`;
    const node = {
      url: landscape,
    };

    it("cmdLoginToLandscape - session not exists", async () => {
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`local-extension.tree.refresh`)
        .resolves();
      mockAuthentication
        .expects(`getSession`)
        .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape], {
          forceNewSession: true,
        })
        .resolves();
      await land.cmdLoginToLandscape(node as LandscapeNode);
    });

    it("cmdLoginToLandscape - token not exists", async () => {
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`local-extension.tree.refresh`)
        .resolves();
      mockAuthentication
        .expects(`getSession`)
        .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape], {
          forceNewSession: true,
        })
        .resolves({});
      await land.cmdLoginToLandscape(node as LandscapeNode);
    });

    it("cmdLoginToLandscape - wrong token specified", async () => {
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`local-extension.tree.refresh`)
        .resolves();
      mockAuthentication
        .expects(`getSession`)
        .resolves({ accessToken: `token` });
      try {
        await land.cmdLoginToLandscape(node as LandscapeNode);
        fail("should fail due to fake token parsing");
      } catch (e) {
        // nothing to do
      }
    });
  });
});
