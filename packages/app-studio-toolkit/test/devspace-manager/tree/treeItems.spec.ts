import { fail } from "assert";
import { expect } from "chai";
import * as path from "path";
import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as treeItemsModule from "../../../src/devspace-manager/tree/treeItems";
import {
  DevSpaceStatus,
  PackName,
} from "../../../src/devspace-manager/devspace/devspace";
import { messages } from "../../../src/devspace-manager/common/messages";
import { cloneDeep } from "lodash";
import { devspace } from "@sap/bas-sdk";

describe("devSpacesExplorer unit test", () => {
  let treeItemsProxy: typeof treeItemsModule;

  class proxyTreeItem {
    constructor(private readonly label: string) {}
  }

  enum proxyTreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2,
  }

  const proxyDevspace = {
    DevSpaceStatus,
    getDevSpaces: () => {
      throw new Error(`not implemented`);
    },
    PackName,
  };

  before(() => {
    treeItemsProxy = proxyquire(
      "../../../src/devspace-manager/tree/treeItems",
      {
        vscode: {
          TreeItem: proxyTreeItem,
          TreeItemCollapsibleState: proxyTreeItemCollapsibleState,
          "@noCallThru": true,
        },
        "../devspace/devspace": proxyDevspace,
      }
    );
  });

  const extPath = `my/extension/path`;
  const testLabel = `test-label`;
  const testName = `test-name`;
  const testParentName = `test-parent-name`;
  const testLandscapeName = `landscapeName`;
  const testLandscapeUrl = `landscapeUrl/`;
  const testWsUrl = `devspace/url/`;
  const testWsId = `ws-id`;
  const testContextValue = `context-value`;
  const testTooltip = `tooltip`;
  const testDescription = `description`;
  let node: any;

  it("getSvgIconPath - supported icon", () => {
    const iconPath = treeItemsProxy.getSvgIconPath(extPath, `basic_error`);
    expect(iconPath.hasOwnProperty(`light`)).to.be.true;
    expect(
      (iconPath as { light: string; dark: string }).light.includes(extPath)
    ).to.be.true;
    expect(iconPath.hasOwnProperty(`dark`)).to.be.true;
    expect((iconPath as { light: string; dark: string }).dark.includes(extPath))
      .to.be.true;
  });

  it("getSvgIconPath - missed icon", () => {
    expect(treeItemsProxy.getSvgIconPath(extPath, `unsupported`)).to.be.empty;
  });

  describe(`EmptyNode scope`, () => {
    beforeEach(() => {
      node = new treeItemsProxy.EmptyNode(testLabel);
    });

    it("EmptyNode", () => {
      expect(node.label).to.be.equal(testLabel);
      expect(node.collapsibleState).to.be.equal(
        proxyTreeItemCollapsibleState.None
      );
      expect(node.iconPath).to.be.empty;
      expect(node.parentName).to.be.empty;
    });

    it("getChildren", async () => {
      expect(await node.getChildren()).to.be.deep.equal([]);
    });
  });

  describe(`LoadingNode scope`, () => {
    beforeEach(() => {
      node = new treeItemsProxy.LoadingNode();
    });

    it("LoadingNode", () => {
      expect(node.label).to.be.equal(messages.DEV_SPACE_EXPLORER_LOADING);
      expect(node.collapsibleState).to.be.equal(
        proxyTreeItemCollapsibleState.None
      );
      expect(node.iconPath).to.be.empty;
      expect(node.parentName).to.be.empty;
    });

    it("getChildren", async () => {
      expect(await node.getChildren()).to.be.deep.equal([]);
    });
  });

  describe(`DevSpaceNode scope`, () => {
    let iconPath: any;
    beforeEach(() => {
      iconPath = treeItemsProxy.getSvgIconPath(extPath, `basic_not_running`);
      node = new treeItemsProxy.DevSpaceNode(
        testLabel,
        proxyTreeItemCollapsibleState.Collapsed as any,
        iconPath,
        testParentName,
        testLandscapeName,
        testLandscapeUrl,
        testWsUrl,
        testWsId,
        DevSpaceStatus.RUNNING,
        testContextValue,
        testTooltip,
        testDescription
      );
    });

    it("DevSpaceNode", () => {
      expect(node.label).to.be.equal(testLabel);
      expect(node.collapsibleState).to.be.equal(
        proxyTreeItemCollapsibleState.Collapsed
      );
      expect(node.iconPath).to.be.deep.equal(iconPath);
      expect(node.parentName).to.be.equal(testParentName);
      expect(node.landscapeName).to.be.equal(testLandscapeName);
      expect(node.landscapeUrl).to.be.equal(testLandscapeUrl);
      expect(node.wsUrl).to.be.equal(testWsUrl);
      expect(node.id).to.be.equal(testWsId);
      expect(node.status).to.be.equal(DevSpaceStatus.RUNNING);
      expect(node.contextValue).to.be.equal(testContextValue);
      expect(node.tooltip).to.be.equal(testTooltip);
      expect(node.description).to.be.equal(testDescription);
    });

    it("getChildren", async () => {
      expect(await node.getChildren()).to.be.deep.equal([]);
    });
  });

  describe(`LandscapeNode scope`, () => {
    let iconPath: any;
    let mockDevspace: SinonMock;
    beforeEach(() => {
      mockDevspace = mock(proxyDevspace);
      iconPath = treeItemsProxy.getSvgIconPath(extPath, `sme_not_running`);
      node = new treeItemsProxy.LandscapeNode(
        extPath,
        testLabel,
        proxyTreeItemCollapsibleState.Collapsed as any,
        iconPath,
        testParentName,
        testTooltip,
        testName,
        testLandscapeUrl,
        testContextValue
      );
    });

    afterEach(() => {
      mockDevspace.verify();
    });

    const devspaces: devspace.DevspaceInfo[] = [
      {
        devspaceDisplayName: `devspaceDisplayName-1`,
        devspaceOrigin: `devspaceOrigin`,
        pack: `SAP Hana`,
        packDisplayName: `packDisplayName-1`,
        url: `url`,
        id: `id`,
        optionalExtensions: `optionalExtensions`,
        technicalExtensions: `technicalExtensions`,
        status: `SAFE_MODE`,
      },
      {
        devspaceDisplayName: `devspaceDisplayName-2`,
        devspaceOrigin: `devspaceOrigin`,
        pack: `SAP SME Business Application`,
        packDisplayName: `packDisplayName-2`,
        url: `url-2`,
        id: `id-2`,
        optionalExtensions: `optionalExtensions`,
        technicalExtensions: `technicalExtensions`,
        status: `STARTING`,
      },
    ];

    it("LandscapeNode", () => {
      expect(node.label).to.be.equal(testLabel);
      expect(node.collapsibleState).to.be.equal(
        proxyTreeItemCollapsibleState.Collapsed
      );
      expect(node.iconPath).to.be.deep.equal(iconPath);
      expect(node.parentName).to.be.equal(testParentName);
      expect(node.tooltip).to.be.equal(testTooltip);
      expect(node.name).to.be.equal(testName);
      expect(node.url).to.be.equal(testLandscapeUrl);
      expect(node.contextValue).to.be.equal(testContextValue);
    });

    it("getChildren, log out", async () => {
      const item = cloneDeep(node);
      delete item.contextValue;
      const children = await node.getChildren(item);
      expect(children.length).to.be.equal(1);
      expect(children[0].label).to.be.equal(
        messages.DEV_SPACE_EXPLORER_AUTHENTICATION_FAILURE
      );
    });

    it("getChildren, log in, no children", async () => {
      mockDevspace.expects(`getDevSpaces`).withExactArgs(node.url).resolves([]);
      const item = cloneDeep(node);
      item.contextValue = `log-in`;
      const children = await node.getChildren(item);
      expect(children.length).to.be.equal(1);
      expect(children[0].label).to.be.equal(
        messages.DEV_SPACE_EXPLORER_NO_DEV_SPACES
      );
    });

    it("getChildren, log in, there are children", async () => {
      mockDevspace
        .expects(`getDevSpaces`)
        .withExactArgs(node.url)
        .resolves(devspaces);
      const item = cloneDeep(node);
      item.contextValue = `log-in`;
      expect((await node.getChildren(item)).length).to.be.equal(2);
    });

    it("getChildren, log in, there are children, node's attributes partly defined", async () => {
      mockDevspace
        .expects(`getDevSpaces`)
        .withExactArgs(node.url)
        .resolves(devspaces);
      const item = cloneDeep(node);
      item.contextValue = `log-in`;
      delete item.label;
      delete item.name;
      expect((await node.getChildren(item)).length).to.be.equal(2);
    });

    it("getLabel, STOPPED", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.STOPPED;
      expect(node.getLabel(devspace)).to.be.equal(devspace.devspaceDisplayName);
    });

    it("getLabel, RUNNING", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.RUNNING;
      expect(node.getLabel(devspace)).to.be.equal(devspace.devspaceDisplayName);
    });

    it("getLabel, transition", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.SAFE_MODE;
      expect(node.getLabel(devspace)).to.be.equal(
        `${devspace.devspaceDisplayName} (${devspace.status.toLowerCase()})`
      );
    });

    it("getLabel, unreachable", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = `NOT DEFINED`;
      try {
        node.getLabel(devspace);
        fail(`should fail`);
      } catch (e) {
        expect(e.message).to.be.equal(`Didn't expect to get here`);
      }
    });

    it("getIconPath, 'Basic', Running", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.pack = `Basic`;
      devspace.status = DevSpaceStatus.RUNNING;
      const iconPath = node.getIconPath(devspace);
      expect(iconPath.hasOwnProperty(`dark`)).to.be.true;
      expect(iconPath.hasOwnProperty(`light`)).to.be.true;
      expect(path.parse(iconPath.dark).name.endsWith(`_running`)).to.be.true;
    });

    it("getIconPath, 'SAP Mobile Services', Stopped", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.pack = `SAP Mobile Services`;
      devspace.status = DevSpaceStatus.STOPPED;
      const iconPath = node.getIconPath(devspace);
      expect(iconPath.hasOwnProperty(`dark`)).to.be.true;
      expect(iconPath.hasOwnProperty(`light`)).to.be.true;
      expect(path.parse(iconPath.dark).name.endsWith(`_not_running`)).to.be
        .true;
    });

    it("getIconPath, 'LCAP', Starting", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.pack = `LCAP`;
      devspace.status = DevSpaceStatus.STARTING;
      const iconPath = node.getIconPath(devspace);
      expect(iconPath.hasOwnProperty(`dark`)).to.be.true;
      expect(iconPath.hasOwnProperty(`light`)).to.be.true;
      expect(path.parse(iconPath.dark).name.endsWith(`_transitioning`)).to.be
        .true;
    });

    it("getIconPath, 'SME', Starting", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.pack = `SAP SME Business Application`;
      devspace.status = DevSpaceStatus.ERROR;
      const iconPath = node.getIconPath(devspace);
      expect(iconPath.hasOwnProperty(`dark`)).to.be.true;
      expect(iconPath.hasOwnProperty(`light`)).to.be.true;
      expect(path.parse(iconPath.dark).name.endsWith(`_error`)).to.be.true;
    });

    it("getIconPath, 'CAP', unreachable", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.pack = `SAP Cloud Business Application`;
      devspace.status = `Unreachable`;
      try {
        node.getIconPath(devspace);
      } catch (e) {
        expect(e.message).to.be.equal(`Didn't expect to get here`);
      }
    });

    it("getContextView, unreachable", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = `Unreachable`;
      try {
        node.getContextView(devspace);
      } catch (e) {
        expect(e.message).to.be.equal(`Didn't expect to get here`);
      }
    });

    it("getContextView, Running", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.RUNNING;
      expect(node.getContextView(devspace)).to.be.equal(`dev-space-running`);
    });

    it("getContextView, Stopped", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.STOPPED;
      expect(node.getContextView(devspace)).to.be.equal(`dev-space-stopped`);
    });

    it("getContextView, Starting/Stopping", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.STOPPING;
      expect(node.getContextView(devspace)).to.be.equal(
        `dev-space-transitioning`
      );
    });

    it("getContextView, Safe/Error", () => {
      const devspace = cloneDeep(devspaces[0]);
      devspace.status = DevSpaceStatus.ERROR;
      expect(node.getContextView(devspace)).to.be.equal(`dev-space-error`);
    });
  });
});
