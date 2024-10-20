import { expect } from "chai";
import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";
import * as devSpacesProviderModule from "../../../src/devspace-manager/tree/devSpacesProvider";
import {
  DevSpaceNode,
  LandscapeNode,
  getSvgIconPath,
} from "../../../src/devspace-manager/tree/treeItems";
import { messages } from "../../../src/devspace-manager/common/messages";
import * as sdk from "@sap/bas-sdk";

describe("devSpacesProvider unit test", () => {
  let devSpacesProviderProxy: typeof devSpacesProviderModule.DevSpaceDataProvider;

  class proxyTreeItem {
    constructor(private readonly label: string) {}
  }

  class proxyEventEmitter {
    public event = {};
    constructor() {}
    fire() {
      throw new Error(`not implemented`);
    }
  }

  enum proxyTreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2,
  }

  const proxyLandscape = {
    getLandscapes: () => {
      throw new Error(`not implemented`);
    },
  };

  before(() => {
    devSpacesProviderProxy = proxyquire(
      "../../../src/devspace-manager/tree/devSpacesProvider",
      {
        vscode: {
          TreeItem: proxyTreeItem,
          EventEmitter: proxyEventEmitter,
          TreeItemCollapsibleState: proxyTreeItemCollapsibleState,
          "@noCallThru": true,
        },
        "../landscape/landscape": proxyLandscape,
      }
    ).DevSpaceDataProvider;
  });

  const path = `my/extension/path`;
  let instance: devSpacesProviderModule.DevSpaceDataProvider;
  let mockLandscape: SinonMock;

  beforeEach(() => {
    instance = new devSpacesProviderProxy(path);
    mockLandscape = mock(proxyLandscape);
  });

  afterEach(() => {
    mockLandscape.verify();
  });

  const landscapes = [
    {
      name: `http://test-domain.landscape-1.com`,
      url: `http://test-domain.landscape-1.com/`,
      isLoggedIn: false,
    },
    {
      name: `http://test-domain.landscape-2.com`,
      url: `http://test-domain.landscape-2.com/`,
      isLoggedIn: true,
      default: true,
    },
  ];

  it("constructed structure", () => {
    expect(instance[`loading`]).to.be.false;
    expect(instance[`extensionPath`]).to.be.equal(path);
  });

  it("setLoading -> true", () => {
    instance.setLoading(true);
    expect(instance[`loading`]).to.be.true;
  });

  it("setLoading -> false", () => {
    instance.setLoading(false);
    expect(instance[`loading`]).to.be.false;
  });

  it("refresh", () => {
    const mockOnDidChangeTreeData = mock(instance.privateOnDidChangeTreeData);
    mockOnDidChangeTreeData
      .expects(`fire`)
      .withExactArgs(undefined)
      .returns(false);
    instance.refresh();
    mockOnDidChangeTreeData.verify();
  });

  it("getTreeItem", () => {
    const iconPath = getSvgIconPath(instance[`extensionPath`], "landscape");
    const node: LandscapeNode = new LandscapeNode(
      instance[`extensionPath`],
      `label`,
      proxyTreeItemCollapsibleState.None as any,
      iconPath,
      `parentName`,
      `tooltip`,
      `name`,
      `url`
    );
    expect(instance.getTreeItem(node)).to.be.deep.equal(node);
  });

  it("getChildren, node not specified", async () => {
    mockLandscape.expects(`getLandscapes`).resolves(landscapes);
    const childrens = await instance.getChildren();
    expect(childrens.length).to.be.equal(2);
    let item = <LandscapeNode>childrens[0];
    expect(item.label).to.be.equal(landscapes[0].name);
    expect(item.collapsibleState).to.be.equal(
      proxyTreeItemCollapsibleState.Expanded
    );
    expect(item.tooltip).to.be.equal(`Not logged in.`);
    expect(item.name).to.be.equal(landscapes[0].name);
    expect(item.url).to.be.equal(landscapes[0].url);
    expect(item.contextValue).to.be.equal(`landscape-log-out-default-off`);
    item = <LandscapeNode>childrens[1];
    expect(item.label).to.be.equal(landscapes[1].name);
    expect(item.collapsibleState).to.be.equal(
      proxyTreeItemCollapsibleState.Expanded
    );
    expect(item.tooltip).to.contain(`Logged in.`);
    expect(item.tooltip).to.contain(`Default landscape is enabled.`);
    expect(item.name).to.be.equal(landscapes[1].name);
    expect(item.url).to.be.equal(landscapes[1].url);
    expect(item.contextValue).to.be.equal(`landscape-log-in-default-on`);
  });

  it("getChildren, element not specified, loading mode is turned on", async () => {
    instance.setLoading(true);
    const children = await instance.getChildren();
    expect(children.length).to.be.equal(1);
    expect(children[0].collapsibleState).to.be.equal(
      proxyTreeItemCollapsibleState.None
    );
    expect(children[0].label).to.be.equal(
      messages.lbl_dev_space_explorer_loading
    );
  });

  it("getChildren, with specified element", async () => {
    instance.setLoading(false);
    const iconPath = getSvgIconPath(instance[`extensionPath`], "devspace");
    const node = new DevSpaceNode(
      `label`,
      proxyTreeItemCollapsibleState.Expanded as any,
      iconPath,
      `parentName`,
      `landscapeName`,
      `landscapeUrl`,
      `wsUrl`,
      `ws-id`,
      sdk.devspace.DevSpaceStatus.STOPPED
    );
    expect(await instance.getChildren(node)).to.be.deep.equal([]);
  });
});
