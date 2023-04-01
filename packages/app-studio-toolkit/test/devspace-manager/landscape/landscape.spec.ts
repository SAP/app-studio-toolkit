import { expect } from "chai";
import { URL } from "url";
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
  },
};
const testVscode = {
  workspace: {
    getConfiguration: () => wsConfig,
  },
  ConfigurationTarget: localConfigurationTarget,
};

mockVscode(testVscode, "dist/src/devspace-manager/landscape/landscape.js");

import * as land from "../../../src/devspace-manager/landscape/landscape";

describe("landscapes unit test", () => {
  beforeEach(() => {
    lands = [];
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
    expect(lands).be.deep.equal([landscapeUrl2]);
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

  it("getConnectedLandscapes, few items, nothing found", async () => {
    lands?.push(landscapeUrl1);
    lands?.push(landscapeUrl2);
    expect(await land.getConnectedLandscapes()).be.deep.equal([]);
  });

  it("getConnectedLandscapes, no items, nothing found", async () => {
    lands = undefined;
    expect(await land.getConnectedLandscapes()).be.deep.equal([]);
  });
});
