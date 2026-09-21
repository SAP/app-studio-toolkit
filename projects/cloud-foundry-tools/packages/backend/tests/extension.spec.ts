import * as _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode, recognisePackageJsonPath } from "./ext/mockUtil";

const statusBarItem = { show: () => "", hide: () => "" };

mockVscode(nsVsMock.testVscode, "src/extension.ts");
mockVscode(nsVsMock.testVscode, "src/commands.ts");
mockVscode(nsVsMock.testVscode, "src/cfViewCommands.ts");
mockVscode(nsVsMock.testVscode, "src/run-configuration.ts");
import * as extension from "../src/extension";
import * as commands from "../src/commands";
import * as cfViewCommands from "../src/cfViewCommands";
import * as cflocal from "@sap/cf-tools/out/src/cf-local";
import * as cflocalUnits from "@sap/cf-tools/out/src/utils";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { cfGetConfigFilePath, ITarget, OK } from "@sap/cf-tools";
import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { CFTargetTI, CFView } from "../src/cfView";
import type { ExtensionContext } from "vscode";

describe("extension unit test", () => {
  const runConfigExtName = "sap.vscode-wing-run-config";
  let sandbox: SinonSandbox;
  let windowMock: SinonMock;
  let workspaceMock: SinonMock;
  let viewCommandsMock: SinonMock;
  let fsMock: SinonMock;
  let mockCfLocal: SinonMock;
  let mockCfLocalUnits: SinonMock;
  let mockStatusBarItem: SinonMock;
  let extensionsMock: SinonMock;
  let loggerWrapperMock: SinonMock;
  let isShowTarget: boolean;
  const config = {
    get: (key: string) => {
      return key === "CloudFoundryTools.showTargetInformation" ? isShowTarget : undefined;
    },
  };

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    windowMock = sandbox.mock(nsVsMock.testVscode.window);
    workspaceMock = sandbox.mock(nsVsMock.testVscode.workspace);
    viewCommandsMock = sandbox.mock(cfViewCommands);
    fsMock = sandbox.mock(fs);
    mockCfLocal = sandbox.mock(cflocal);
    mockCfLocalUnits = sandbox.mock(cflocalUnits);
    mockStatusBarItem = sandbox.mock(statusBarItem);
    extensionsMock = sandbox.mock(nsVsMock.testVscode.extensions);
    loggerWrapperMock = sandbox.mock(loggerWrapper);
  });

  afterEach(() => {
    windowMock.verify();
    workspaceMock.verify();
    viewCommandsMock.verify();
    fsMock.verify();
    mockCfLocal.verify();
    mockCfLocalUnits.verify();
    mockStatusBarItem.verify();
    extensionsMock.verify();
    loggerWrapperMock.verify();
    sandbox.restore();
  });

  describe("deactivate", () => {
    it("unwatchFile called", () => {
      fsMock.expects("unwatchFile").withArgs(cfGetConfigFilePath());
      extension.deactivate();
    });

    it("unwatchFile not called", () => {
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("");
      fsMock.expects("unwatchFile").never();
      extension.deactivate();
    });
  });

  describe("activate- fake createTreeView", () => {
    let testContext: any;
    const runConfigExtName = "sap.vscode-wing-run-config";

    beforeEach(() => {
      isShowTarget = true;
      windowMock.expects("createTreeView").withArgs("cfView");
      testContext = { subscriptions: [], logUri: { fsPath: path.resolve(__dirname) } };
      loggerWrapperMock.expects("initLogger").withExactArgs(testContext).resolves();
      mockStatusBarItem.expects("show");
      windowMock
        .expects("createStatusBarItem")
        .withExactArgs(nsVsMock.testVscode.StatusBarAlignment.Left, 100)
        .returns(statusBarItem);
      workspaceMock.expects("getConfiguration").returns(config);
    });

    it("ok:: cfConfigFilePath does not exist", async () => {
      extensionsMock.expects("getExtension").withExactArgs(runConfigExtName).returns(undefined);
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("");
      fsMock.expects("watchFile").never();
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
    });

    it("ok:: cfConfigFilePath exists", async () => {
      extensionsMock.expects("getExtension").withExactArgs(runConfigExtName).returns(undefined);
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("testCFConfigFilePath");
      fsMock.expects("watchFile").withArgs("testCFConfigFilePath");
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
    });

    it("ok:: depended platform extension is defined but not activated", async () => {
      const extRun = {
        isActive: false,
        activate: () => Promise.resolve(),
        exports: {
          registerDependency: () => "",
        },
      };
      const mockExt = sandbox.mock(extRun);
      mockCfLocalUnits
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields")
        .atLeast(1)
        .resolves({ Name: "testName1" });
      mockCfLocalUnits
        .expects("cfGetConfigFileField")
        .withExactArgs("SpaceFields")
        .atLeast(1)
        .resolves({ Name: "testName2" });
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("");
      mockExt.expects("activate").resolves();
      extensionsMock.expects("getExtension").withExactArgs(runConfigExtName).returns(extRun);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
      mockExt.verify();
    });

    it("ok:: depended platform extension is defined but can not be not activated", async () => {
      const extRun = {
        isActive: false,
        activate: () => Promise.resolve(),
        exports: {
          registerDependency: () => "",
        },
      };
      const mockExt = sandbox.mock(extRun);
      mockCfLocalUnits
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields")
        .atLeast(1)
        .resolves({ Name: "testName1" });
      mockCfLocalUnits
        .expects("cfGetConfigFileField")
        .withExactArgs("SpaceFields")
        .atLeast(1)
        .resolves({ Name: "testName2" });
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("");
      mockExt.expects("activate").rejects(new Error("my error"));
      extensionsMock.expects("getExtension").withExactArgs(runConfigExtName).returns(extRun);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
      mockExt.verify();
    });
  });

  describe("activate - depended platform extension is defined and activated", () => {
    let testContext: any;
    let mockCommands: SinonMock;

    beforeEach(async () => {
      isShowTarget = false;
      workspaceMock.expects("getConfiguration").returns(config);
      mockCommands = sandbox.mock(commands);
      testContext = { subscriptions: [], logUri: { fsPath: path.resolve(__dirname) } };
      loggerWrapperMock.expects("initLogger").withExactArgs(testContext).resolves();
      windowMock
        .expects("createStatusBarItem")
        .withExactArgs(nsVsMock.testVscode.StatusBarAlignment.Left, 100)
        .returns(statusBarItem);
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("testCFConfigFilePath");
      fsMock.expects("watchFile").withArgs("testCFConfigFilePath");
      mockStatusBarItem.expects("hide");
      extensionsMock
        .expects("getExtension")
        .withExactArgs(runConfigExtName)
        .returns({
          isActive: true,
          exports: {
            registerDependency: () => "",
          },
        });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for rest of initialization asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
    });

    afterEach(() => {
      mockCommands.verify();
    });

    it("ok:: depended platform extension is defined and activated, verify commands", () => {
      _.each(
        [
          "cf.login",
          "cf.login.weak",
          "cf.target.set",
          "cf.services.create",
          "cf.services.bind.local",
          "cf.services.unbind",
          "cf.services.bind",
          "cf.services.binding.state",
          "cf.set.orgspace",
          "cf.targets.create",
          "cf.target.delete",
          "cf.targets.reload",
          "cf.select.space",
          "cf.deploy-service.api",
          "cf.services.get-space-services",
          "cf.services.get-ups-services",
          "cf.services.get-services",
          "cf.ups.create",
        ],
        (cmd) => {
          expect(_.get(nsVsMock.getTestRegisteredCommands(), cmd)).to.be.ok;
        }
      );
    });

    it("ok:: cmdLogin command triggered", async () => {
      const targets = [new CFTargetTI({ label: "test-target", isCurrent: true, isDirty: false })];
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getTargets").returns(targets);
      mockCommands.expects("cmdLogin").resolves(OK);
      viewCommandsMock
        .expects("cmdDeleteTarget")
        .withExactArgs(targets[0], { silent: true, "skip-reload": true })
        .resolves();
      viewCommandsMock
        .expects("execSaveTarget")
        .withExactArgs(targets[0], { silent: true, "skip-reload": true })
        .resolves();
      viewCommandsMock.expects("execSetTarget").withExactArgs(targets[0], { silent: true }).resolves();
      await _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "login"])();
    });

    it("ok:: cmdLogin command triggered and failed", async () => {
      const targets = [new CFTargetTI({ label: "test-target", isCurrent: true, isDirty: false })];
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getTargets").returns(targets);
      mockCommands.expects("cmdLogin").resolves("failed");
      viewCommandsMock.expects("cmdDeleteTarget").never();
      await _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "login"])();
    });

    it("ok:: CFView created", () => {
      expect(CFView.get()).to.be.ok;
    });

    it("ok:: cmdLogin command triggered, canceled", async () => {
      mockCommands.expects("cmdLogin").resolves();
      await _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "login"])();
    });

    it("ok:: cmdLogin command triggered, no active target", async () => {
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getCurrentTarget").returns(undefined);
      mockCommands.expects("cmdLogin").resolves(OK);
      await _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "login"])();
    });

    it("ok:: 'cf.target.set' command triggered", (done) => {
      const targets = [
        new CFTargetTI({ label: "test-target", isCurrent: false, isDirty: false }),
        new CFTargetTI({ label: "test-target-active", isCurrent: true, isDirty: false }),
      ];
      const cfViewMock = sandbox.mock(nsVsMock.getTestTreeView());
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getTargets").returns(targets);
      cfViewMock.expects("reveal").withExactArgs(targets[1], { select: true, focus: true, expand: true }).resolves();
      viewCommandsMock.expects("cmdSetCurrentTarget").withExactArgs(targets[0]).resolves();
      _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "target", "set"])(targets[0]);
      setTimeout(() => {
        cfViewMock.verify();
        done();
      }, 600);
    });

    it("ok:: 'cf.target.set' command triggered, reveal item not found", (done) => {
      const targets = [
        new CFTargetTI({ label: "test-target", isCurrent: false, isDirty: false }),
        new CFTargetTI({ label: "test-target-active", isCurrent: false, isDirty: false }),
      ];
      const cfViewMock = sandbox.mock(nsVsMock.getTestTreeView());
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getTargets").returns(targets);
      cfViewMock.expects("reveal").never();
      viewCommandsMock.expects("cmdSetCurrentTarget").withExactArgs(targets[0]).resolves();
      _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "target", "set"])(targets[0]);
      setTimeout(() => {
        cfViewMock.verify();
        done();
      }, 600);
    });

    it("ok:: 'cf.targets.create' command triggered", (done) => {
      const targets = [
        new CFTargetTI({ label: "test-target", isCurrent: false, isDirty: false }),
        new CFTargetTI({ label: "test-target-active", isCurrent: true, isDirty: false }),
      ];
      const cfViewMock = sandbox.mock(nsVsMock.getTestTreeView());
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getTargets").returns(targets);
      cfViewMock.expects("reveal").withExactArgs(targets[1], { select: true, focus: true, expand: true }).resolves();
      mockCommands.expects("cmdSelectAndSaveTarget").resolves(targets[1].label);
      _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "targets", "create"])();
      setTimeout(() => {
        cfViewMock.verify();
        done();
      }, 600);
    });

    it("ok:: 'cf.targets.create' command triggered, creation canceled", (done) => {
      const targets = [
        new CFTargetTI({ label: "test-target", isCurrent: false, isDirty: false }),
        new CFTargetTI({ label: "test-target-active", isCurrent: true, isDirty: false }),
      ];
      const cfViewMock = sandbox.mock(nsVsMock.getTestTreeView());
      sandbox.stub(nsVsMock.getTestTreeProvider(), "getTargets").returns(targets);
      cfViewMock.expects("reveal").never();
      mockCommands.expects("cmdSelectAndSaveTarget").resolves();
      _.get(nsVsMock.getTestRegisteredCommands(), ["cf", "targets", "create"])();
      setTimeout(() => {
        cfViewMock.verify();
        done();
      }, 600);
    });
  });

  describe("onCFConfigFileChange", () => {
    let testContext: any;
    const target: ITarget = {
      "api endpoint": "endpoint",
      "api version": "3.2.1",
      user: "test",
      org: "org",
      space: "space",
    };

    beforeEach(() => {
      isShowTarget = false;
      mockStatusBarItem.expects("hide");
      workspaceMock.expects("getConfiguration").returns(config);
      windowMock.expects("createTreeView").withArgs("cfView");
      testContext = { subscriptions: [], logUri: { fsPath: path.resolve(__dirname) } };
      loggerWrapperMock.expects("initLogger").withExactArgs(testContext).resolves();
      extensionsMock.expects("getExtension").withExactArgs(runConfigExtName).returns(undefined);
      mockCfLocalUnits.expects("cfGetConfigFilePath").returns("testCFConfigFilePath");
      fsMock.expects("watchFile").withArgs("testCFConfigFilePath");
      windowMock
        .expects("createStatusBarItem")
        .withExactArgs(nsVsMock.testVscode.StatusBarAlignment.Left, 100)
        .returns(statusBarItem);
    });

    it("ok:: verify callback trigger, target updated", async () => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
      mockCfLocalUnits
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields")
        .resolves({ Name: "testName1" });
      mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("SpaceFields").resolves({ Name: "testName2" });
      mockCfLocal.expects("cfGetTarget").resolves(target);
      setTimeout(() => {
        extension.onCFConfigFileChange();
      }, 100);
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    it("ok:: nothing updated", async () => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      setTimeout(() => {
        mockCfLocalUnits
          .expects("cfGetConfigFileField")
          .withExactArgs("OrganizationFields")
          .resolves({ Name: "testName1" });
        mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("SpaceFields").resolves({ Name: "testName2" });
        mockCfLocal.expects("cfGetTarget").resolves(target);
        extension.onCFConfigFileChange();
      }, 100);

      setTimeout(() => {
        mockCfLocalUnits
          .expects("cfGetConfigFileField")
          .withExactArgs("OrganizationFields")
          .resolves({ Name: "testName1" });
        mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("SpaceFields").resolves({ Name: "testName2" });
        extension.onCFConfigFileChange();
      }, 300);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    it("ok:: not targeted", async () => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      setTimeout(() => {
        mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("OrganizationFields").resolves({ Name: "" });
        mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("SpaceFields").resolves({ Name: "" });
        mockCfLocal.expects("cfGetTarget").never();
        extension.onCFConfigFileChange();
      }, 100);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    it("ok:: not logged in", async () => {
      mockCfLocalUnits
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields")
        .resolves({ Name: "testName1" });
      mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("SpaceFields").resolves({ Name: "testName3" });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      await extension.activate(testContext).then(() => {
        // wait for the tree view to be created asynchonously
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      setTimeout(() => {
        mockCfLocalUnits
          .expects("cfGetConfigFileField")
          .withExactArgs("OrganizationFields")
          .resolves({ Name: "testName1" });
        mockCfLocalUnits.expects("cfGetConfigFileField").withExactArgs("SpaceFields").resolves({ Name: "" });
        mockCfLocal.expects("cfGetTarget").rejects(undefined);
        extension.onCFConfigFileChange();
      }, 100);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
  });

  describe("callbackOnDidChangeConfiguration event", () => {
    it("ok:: callbackOnDidChangeConfiguration - other section", () => {
      const event = {
        affectsConfiguration: (section: string) => {
          return section === "RunConfigurations.loggingLevel";
        },
      };
      workspaceMock.expects("getConfiguration").never();
      extension.callbackOnDidChangeConfiguration(event, (undefined as unknown) as ExtensionContext);
    });

    it("ok:: callbackOnDidChangeConfiguration - triggered, hide", () => {
      const event = {
        affectsConfiguration: (section: string) => {
          return section === "CloudFoundryTools.showTargetInformation";
        },
      };
      workspaceMock.expects("getConfiguration").returns(config);
      mockStatusBarItem.expects("hide");
      extension.callbackOnDidChangeConfiguration(event, (undefined as unknown) as ExtensionContext);
    });

    it("ok:: callbackOnDidChangeConfiguration - triggered, show", () => {
      const event = {
        affectsConfiguration: (section: string) => {
          return section === "CloudFoundryTools.showTargetInformation";
        },
      };
      isShowTarget = true;
      workspaceMock.expects("getConfiguration").returns(config);
      mockStatusBarItem.expects("show");
      extension.callbackOnDidChangeConfiguration(event, (undefined as unknown) as ExtensionContext);
    });
  });

  describe("Common extension package definition", () => {
    const jsonPath = recognisePackageJsonPath(__dirname);
    const jsonPackage = JSON.parse(
      fs.readFileSync(path.resolve(path.join(jsonPath ? jsonPath : "", "package.json")), { encoding: "utf8" })
    );

    it("ok:: configuration title", () => {
      expect(_.get(jsonPackage, ["contributes", "configuration", "title"])).to.be.equal("CloudFoundryTools");
    });

    it("ok:: logging.loggingLevel desciption", () => {
      expect(
        _.get(jsonPackage, [
          "contributes",
          "configuration",
          "properties",
          "CloudFoundryTools.logging.loggingLevel",
          "description",
        ])
      ).to.be.equal("The verbosity of logging. The Order is None < fatal < error < warn < info < debug < trace.");
    });

    it("ok:: logging.sourceLocationTracking desciption", () => {
      expect(
        _.get(jsonPackage, [
          "contributes",
          "configuration",
          "properties",
          "CloudFoundryTools.logging.sourceLocationTracking",
          "description",
        ])
      ).to.be.equal(
        "Should Source Code Location Info be added to log entries, DANGER - May be very slow, only use in debugging scenarios"
      );
    });

    it("ok:: showTargetInformation desciption", () => {
      expect(
        _.get(jsonPackage, [
          "contributes",
          "configuration",
          "properties",
          "CloudFoundryTools.showTargetInformation",
          "description",
        ])
      ).to.be.equal("Display the current Cloud Foundry target information in the status bar");
    });

    it("ok:: commandPalette content", () => {
      const menus: any[] = _.get(jsonPackage, ["contributes", "menus", "commandPalette"]);
      for (const menu of menus) {
        expect(
          [
            "cf.login.weak",
            "cf.target.delete",
            "cf.targets.create",
            "cf.deploy-service.api",
            "cf.target.set",
            "cf.services.unbind",
            "cf.services.bind",
            "cf.services.binding.state",
            "cf.services.get-space-services",
            "cf.services.get-ups-services",
            "cf.services.get-services",
          ].includes(menu.command as string)
        ).to.be.true;
        expect(menu.when).to.be.equal("false");
      }
    });

    it("ok:: view/title content", () => {
      const commands = _.get(jsonPackage, ["contributes", "menus", "view/title"]);
      expect(_.find(commands, ["command", "cf.targets.create"])).to.be.deep.equal({
        command: "cf.targets.create",
        when: "view == cfView",
        group: "navigation@1",
      });
      expect(_.find(commands, ["command", "cf.targets.reload"])).to.be.deep.equal({
        command: "cf.targets.reload",
        when: "view == cfView",
        group: "navigation@2",
      });
    });

    it("ok:: view/item/context content", () => {
      const commands = _.get(jsonPackage, ["contributes", "menus", "view/item/context"]);
      expect(_.find(commands, ["command", "cf.services.create"])).to.be.deep.equal({
        command: "cf.services.create",
        when: "view == cfView && viewItem =~ /^services-active$/",
        group: "inline",
      });
      expect(_.find(commands, ["command", "cf.login"])).to.be.deep.equal({
        command: "cf.login",
        when: "view == cfView && viewItem == cf-login-required",
        group: "inline",
      });
      expect(_.find(commands, ["command", "cf.services.bind.local"])).to.be.deep.equal({
        command: "cf.services.bind.local",
        when: "view == cfView && viewItem == cf-service",
      });
      let command = _.find(commands, (com) => {
        return com.command === "cf.target.set" && com.group === "inline";
      });
      expect(command).to.be.deep.equal({
        command: "cf.target.set",
        when: "view == cfView && viewItem =~ /^cf-target$|^cf-target-not-current$/",
        group: "inline",
      });
      command = _.find(commands, (com) => {
        return com.command === "cf.target.set" && com.group === "appearance@1";
      });
      expect(command).to.be.deep.equal({
        command: "cf.target.set",
        when: "view == cfView && viewItem =~ /^cf-target$/",
        group: "appearance@1",
      });
      expect(_.find(commands, ["command", "cf.target.delete"])).to.be.deep.equal({
        command: "cf.target.delete",
        when: "view == cfView && viewItem =~ /^cf-target(-active)?$/",
        group: "appearance@2",
      });
    });
  });
});
