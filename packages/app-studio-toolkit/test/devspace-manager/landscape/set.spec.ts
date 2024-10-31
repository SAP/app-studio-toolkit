import { expect } from "chai";
import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";
import * as land from "../../../src/devspace-manager/landscape/set";
import { URL } from "node:url";
import { LandscapeConfig } from "src/devspace-manager/landscape/landscape";

describe("landscapes set unit test", () => {
  let lands: LandscapeConfig[] = [];
  let cmdLandscapeSetProxy: typeof land.cmdLandscapeSet;
  const proxyWindow = {
    showInputBox: () => {
      throw new Error("not implemented");
    },
  };
  const proxyCommands = {
    executeCommand: () => {
      throw new Error("not implemented");
    },
  };
  const landscapeProxy = {
    getLanscapesConfig: (): LandscapeConfig[] => {
      return lands;
    },
    updateLandscapesConfig: (other: LandscapeConfig[]) => {
      lands = other;
    },
  };

  before(() => {
    cmdLandscapeSetProxy = proxyquire(
      "../../../src/devspace-manager/landscape/set",
      {
        "./landscape": landscapeProxy,
        vscode: {
          window: proxyWindow,
          commands: proxyCommands,
          "@noCallThru": true,
        },
      }
    ).cmdLandscapeSet;
  });

  let mockCommands: SinonMock;
  let mockWindow: SinonMock;
  beforeEach(() => {
    mockCommands = mock(proxyCommands);
    mockWindow = mock(proxyWindow);
  });

  afterEach(() => {
    mockCommands.verify();
    mockWindow.verify();
    lands = [];
  });

  const landscape = { url: new URL(`https://my.landscape-1.com`).toString() };

  it("cmdLandscapeSet, confirmed added", async () => {
    mockWindow.expects("showInputBox").returns(landscape.url);
    mockCommands
      .expects("executeCommand")
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    await cmdLandscapeSetProxy();
    expect(lands.find((l) => l.url === landscape.url)).be.deep.equal(landscape);
  });

  it("cmdLandscapeSet, confirmed, existed", async () => {
    lands.push(landscape);
    mockWindow.expects("showInputBox").returns(landscape.url);
    mockCommands
      .expects("executeCommand")
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    await cmdLandscapeSetProxy();
    expect(lands.find((l) => l.url === landscape.url)).be.deep.equal(landscape);
    expect(lands.length).to.be.equal(1);
  });

  it("cmdLandscapeSet, canceled", async () => {
    mockWindow.expects("showInputBox").returns(undefined);
    mockCommands.expects("executeCommand").never();
    await cmdLandscapeSetProxy();
    expect(lands.find((l) => l.url === landscape.url)).be.undefined;
  });
});
