import { expect } from "chai";
import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as devSpacesExplorerModule from "../../../src/devspace-manager/tree/devSpacesExplorer";

describe("devSpacesExplorer unit test", () => {
  let devSpacesExplorerProxy: typeof devSpacesExplorerModule.DevSpacesExplorer;

  const proxyWindow = {
    createTreeView: () => {
      throw new Error("not implemented");
    },
  };

  class proxyTreeItem {
    constructor(private readonly label: string) {}
  }

  class proxyDevSpaceDataProvider {
    constructor(private extensionPath: string) {}
    refresh() {
      throw new Error("not implemented");
    }
    setLoading() {
      throw new Error("not implemented");
    }
  }

  before(() => {
    devSpacesExplorerProxy = proxyquire(
      "../../../src/devspace-manager/tree/devSpacesExplorer",
      {
        vscode: {
          TreeItem: proxyTreeItem,
          window: proxyWindow,
          "@noCallThru": true,
        },
        "./devSpacesProvider": {
          DevSpaceDataProvider: proxyDevSpaceDataProvider,
        },
      }
    ).DevSpacesExplorer;
  });

  let mockWindow: SinonMock;

  beforeEach(() => {
    mockWindow = mock(proxyWindow);
  });

  afterEach(() => {
    mockWindow.verify();
  });

  const proxyDevSpacesExplorerView = {
    data: {
      description: `dummy explorer view`,
    },
  };

  it("getDevSpacesExplorerProvider", () => {
    const path = `my/extension/path`;
    mockWindow
      .expects(`createTreeView`)
      .withArgs(`dev-spaces`)
      .returns(proxyDevSpacesExplorerView);
    const instance = new devSpacesExplorerProxy(path);
    expect(
      instance.getDevSpacesExplorerProvider()[`extensionPath`]
    ).to.be.equal(path);
  });

  it("getDevSpacesExplorerView", () => {
    mockWindow
      .expects(`createTreeView`)
      .withArgs(`dev-spaces`)
      .returns(proxyDevSpacesExplorerView);
    const instance = new devSpacesExplorerProxy(`my/extension/path`);
    expect(instance.getDevSpacesExplorerView()).to.be.deep.equal(
      proxyDevSpacesExplorerView
    );
  });

  it("refreshTree", () => {
    mockWindow
      .expects(`createTreeView`)
      .withArgs(`dev-spaces`)
      .returns(proxyDevSpacesExplorerView);
    const instance = new devSpacesExplorerProxy(``);
    const provider = instance.getDevSpacesExplorerProvider();
    const mockProvider = mock(provider);
    mockProvider.expects(`refresh`).returns(true);
    instance.refreshTree();
    mockProvider.verify();
  });

  it("changeTreeToLoading", () => {
    mockWindow
      .expects(`createTreeView`)
      .withArgs(`dev-spaces`)
      .returns(proxyDevSpacesExplorerView);
    const instance = new devSpacesExplorerProxy(``);
    const provider = instance.getDevSpacesExplorerProvider();
    const mockProvider = mock(provider);
    mockProvider.expects(`setLoading`).withExactArgs(true).returns(true);
    mockProvider.expects(`refresh`).returns(true);
    instance.changeTreeToLoading();
    mockProvider.verify();
  });

  it("changeTreeToLoaded", () => {
    mockWindow
      .expects(`createTreeView`)
      .withArgs(`dev-spaces`)
      .returns(proxyDevSpacesExplorerView);
    const instance = new devSpacesExplorerProxy(``);
    const provider = instance.getDevSpacesExplorerProvider();
    const mockProvider = mock(provider);
    mockProvider.expects(`setLoading`).withExactArgs(false).returns(true);
    mockProvider.expects(`refresh`).returns(true);
    instance.changeTreeToLoaded();
    mockProvider.verify();
  });
});
