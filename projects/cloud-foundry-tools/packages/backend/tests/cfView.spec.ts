import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";

mockVscode(nsVsMock.testVscode, "src/cfView.ts");

import * as cfView from "../src/cfView";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import type { TreeItem } from "vscode";

describe("cfView tests", () => {
  let sandbox: SinonSandbox;
  let cfLocalMock: SinonMock;
  let cfViewMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    cfViewMock = sandbox.mock(cfView.CFView);
    cfLocalMock = sandbox.mock(cfLocal);
  });

  afterEach(() => {
    cfLocalMock.verify();
    cfViewMock.verify();
  });

  describe("CFTargetTI", () => {
    const activePattern = "(Active Target)";
    const contextPattern = "cf-target";
    it("ok:: get description - active, not dirty", () => {
      const item = new cfView.CFTargetTI({ label: "test", isCurrent: true, isDirty: false });
      expect(item.description).to.be.equal(activePattern);
      expect(item.contextValue).to.be.equal(`${contextPattern}-active`);
      const parts = _.split(_.get(item, "iconPath.dark") as string, path.sep);
      expect(_.includes(parts, "target-a.svg")).to.be.true;
    });

    it("ok:: get description - not active, is dirty", () => {
      const item = new cfView.CFTargetTI({ label: "test", isCurrent: false, isDirty: true });
      expect(item.description).to.be.equal("*");
      expect(item.contextValue).to.be.equal(`${contextPattern}`);
      const parts = _.split(_.get(item, "iconPath.light") as string, path.sep);
      expect(_.includes(parts, "target.svg")).to.be.true;
    });

    it("ok:: get description - (no targets), is active, is dirty", () => {
      const item = new cfView.CFTargetTI({ label: "(no targets)", isCurrent: true, isDirty: true });
      expect(item.description).to.be.equal(`*`);
      expect(item.contextValue).to.be.equal(`${contextPattern}-notargets`);
      expect(item.tooltip).to.be.equal(item.label);
      const parts = _.split(_.get(item, "iconPath.dark") as string, path.sep);
      expect(_.includes(parts, "target-a.svg")).to.be.true;
    });
  });

  describe("Tree Nodes", () => {
    const root = new cfView.CFTargetTI({ label: "(no targets)", isCurrent: true, isDirty: true });
    const parent = new cfView.CFFolder("folder", root);

    it("ok:: CFLoginNode properties verifying", () => {
      const item = new cfView.CFLoginNode(parent);
      expect(item.contextValue).to.be.equal(`cf-login-required`);
      expect(item.label).to.be.equal(`Login required`);
      expect(item.tooltip).to.be.equal(`Log in to see details`);
      const parts = _.split(_.get(item, "iconPath.dark") as string, path.sep);
      expect(_.includes(parts, "info.svg")).to.be.true;
      expect(item.parent).to.be.equal(parent);
    });

    it("ok:: CFTargetNotCurrent properties verifying", () => {
      const target = "my-target";
      const item = new cfView.CFTargetNotCurrent(parent, target);
      expect(item.contextValue).to.be.equal(`cf-target-not-current`);
      expect(item.label).to.be.equal(`Target needs to be active`);
      expect(item.tooltip).to.be.equal(`Set the '${target}' as the active target to see details.`);
      const parts = _.split(_.get(item, "iconPath.light") as string, path.sep);
      expect(_.includes(parts, "info.svg")).to.be.true;
      expect(item.parent).to.be.equal(parent);
    });

    it("ok:: CFService properties verifying", () => {
      const name = "test-service";
      const type = "xsuaa";
      const item = new cfView.CFService(name, type, parent);
      expect(item.contextValue).to.be.equal(`cf-service`);
      expect(item.label).to.be.equal(name);
      expect(item.type).to.be.equal(type);
      expect(item.parent).to.be.equal(parent);
    });

    it("ok:: CFApplication properties verifying", () => {
      const name = "test-app";
      const state = "STOPPED";
      const item = new cfView.CFApplication(name, state, parent);
      expect(item.contextValue).to.be.equal(`cf-application`);
      expect(item.label).to.be.equal(name);
      expect(item.state).to.be.equal(state);
      expect(item.parent).to.be.equal(parent);
    });

    it("ok:: CFServicesFolder properties verifying", () => {
      const name = "services";
      const parent = new cfView.CFTargetTI({ label: "parent", isCurrent: false, isDirty: true });
      const item = new cfView.CFServicesFolder(name, parent);
      expect(item.contextValue).to.be.equal(`services`);
      expect(item.label).to.be.equal(name);
      expect(item.tooltip).to.be.equal(item.label);
    });

    it("ok:: CFAppsFolder properties verifying", () => {
      const name = "apps";
      const parent = new cfView.CFTargetTI({ label: "parent", isCurrent: false, isDirty: true });
      const item = new cfView.CFAppsFolder(name, parent);
      expect(item.contextValue).to.be.equal(`apps`);
      expect(item.label).to.be.equal(name);
      expect(item.tooltip).to.be.equal(item.label);
    });
  });

  describe("CFView ", () => {
    const root = new cfView.CFTargetTI({ label: "(no targets)", isCurrent: true, isDirty: true });
    const folder = new cfView.CFFolder("folder", root);

    let instance: cfView.CFView;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testContext: any = { subscriptions: [], logUri: { fsPath: path.resolve(__dirname) } };
    beforeEach(() => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      instance = new cfView.CFView(testContext, "");
    });

    it("ok:: verify getParent of CFAppsFolder", () => {
      const parent = new cfView.CFTargetTI({ label: "parent", isCurrent: false, isDirty: true });
      const item = new cfView.CFAppsFolder("name", parent);
      expect(instance.getParent(item)).to.be.equal(parent);
    });

    it("ok:: verify getParent of CFServicesFolder", () => {
      const parent = new cfView.CFTargetTI({ label: "parent", isCurrent: false, isDirty: true });
      const item = new cfView.CFServicesFolder("name", parent);
      expect(instance.getParent(item)).to.be.equal(parent);
    });

    it("ok:: verify getParent of CFApplication", () => {
      expect(instance.getParent(new cfView.CFApplication("name", "state", folder))).to.be.equal(folder);
    });

    it("ok:: verify getTreeItem of CFAppsFolder", async () => {
      const parent = new cfView.CFTargetTI({ label: "parent", isCurrent: false, isDirty: true });
      const item = new cfView.CFAppsFolder("name", parent);
      expect(await instance.getTreeItem(item)).to.be.equal(item);
    });

    it("ok:: verify getTreeItem of CFApplication", async () => {
      const name = "test-app";
      const state = "STOPPED";
      const item = new cfView.CFApplication(name, state, folder);
      const viewItem = await instance.getTreeItem(item);
      expect(viewItem.label).to.be.equal(`${name} (${state})`);
      expect(instance.getParent(item)).to.be.equal(folder);
    });

    it("ok:: verify getTreeItem of CFService", async () => {
      const name = "test-app";
      const type = "type";
      const item = new cfView.CFService(name, type, folder);
      const viewItem = await instance.getTreeItem(item);
      expect(viewItem.label).to.be.equal(`${name} (${type})`);
      expect(instance.getParent(item)).to.be.equal(folder);
    });

    it("ok:: verify CFFolder contextValue is not defined", async () => {
      const name = "test-app";
      const item = new cfView.CFFolder(name, root);
      const viewItem = await instance.getTreeItem(item);
      expect(viewItem.label).to.be.equal(`${name}`);
      expect(viewItem.tooltip).to.be.equal(`${name}`);
      expect(instance.getParent(item)).to.be.equal(root);
    });

    it("ok:: verify getChildren - root", async () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      cfLocalMock.expects("cfGetTargets").resolves(targets);
      expect(await instance.getChildren((undefined as unknown) as TreeItem)).to.deep.equal(
        _.map(targets, (target) => new cfView.CFTargetTI(target))
      );
    });

    it("ok:: verify getChildren - target, not active", async () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      const expected = [
        new cfView.CFServicesFolder("Services", instance.targets[0]),
        new cfView.CFAppsFolder("Applications", instance.targets[0]),
      ];
      expect(await instance.getChildren(instance.targets[0])).to.deep.equal(expected);
    });

    it("ok:: verify getChildren - target/services, not active", async () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      const parent = new cfView.CFServicesFolder("Services", instance.targets[0]);
      const expected = [new cfView.CFTargetNotCurrent(parent, _.get(parent, "parent.target.label") as string)];
      expect(await instance.getChildren(parent)).to.deep.equal(expected);
    });

    it("ok:: verify getChildren - target/services, is active", async () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      const parent = new cfView.CFServicesFolder("Services", instance.targets[1]);
      const services = [
        { label: "s-1", serviceName: "name-1" },
        { label: "s-2", serviceName: "name-2" },
      ];
      cfLocalMock.expects("cfGetServiceInstancesList").resolves(services);
      const expected = _.map(services, (service) => new cfView.CFService(service.label, service.serviceName, parent));
      expect(await instance.getChildren(parent)).to.deep.equal(expected);
    });

    it("ok:: verify getChildren - target/applications, is active", async () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      const parent = new cfView.CFAppsFolder("Apps", instance.targets[1]);
      const apps = [
        { name: "a-1", state: "STARTED" },
        { name: "a-2", state: "STOPPED" },
      ];
      cfLocalMock.expects("cfGetApps").resolves(apps);
      const expected = _.map(apps, (app) => new cfView.CFApplication(app.name, app.state, parent));
      expect(await instance.getChildren(parent)).to.deep.equal(expected);
    });

    it("ok:: verify getChildren - target/applications, log in required", async () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      const parent = new cfView.CFAppsFolder("Apps", instance.targets[1]);
      cfLocalMock.expects("cfGetApps").rejects(new Error("error"));
      expect(await instance.getChildren(parent)).to.deep.equal([new cfView.CFLoginNode(parent)]);
    });

    it("ok:: verify getChildren - target/applications, incorrect hierachy", async () => {
      expect(await instance.getChildren(new nsVsMock.testVscode.TreeItem("Apps"))).to.deep.equal([]);
    });

    it("ok:: verify getCurrentTarget, active is defined", () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      expect(instance.getCurrentTarget()).to.be.equal(instance.targets[1].target);
    });

    it("ok:: verify getCurrentTarget, active is not defined", () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: false, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      expect(instance.getCurrentTarget()).to.be.equal(undefined);
    });

    it("ok:: verify getTargets", () => {
      const targets = [
        { label: "t-1", isCurrent: false, isDirty: false },
        { label: "t-2", isCurrent: true, isDirty: false },
      ];
      instance.targets = _.map(targets, (target) => new cfView.CFTargetTI(target));
      expect(instance.getTargets()).to.deep.equal(instance.targets);
    });
  });
});
