import { expect } from "chai";
import * as _ from "lodash";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";

mockVscode(nsVsMock.testVscode, "src/commands.ts");
import * as commands from "../src/commands";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import { ServiceTypeInfo, ServiceInstanceInfo, Cli, CF_PAGE_SIZE, OK } from "@sap/cf-tools";
import { messages } from "../src/messages";
import * as cfLocalUtils from "@sap/cf-tools/out/src/utils";
import * as loginTargetView from "../src/loginTargetView/loginTargetView";
import * as cfView from "../src/cfView";
import { fail } from "assert";
import { validateParams } from "../src/utils";
import { stringify } from "comment-json";
import type { CancellationToken, Progress } from "vscode";

describe("commands unit tests", () => {
  let sandbox: SinonSandbox;
  let vscodeWindowMock: SinonMock;
  let vscodeCommandsMock: SinonMock;
  let commandsMock: SinonMock;
  let cliMock: SinonMock;
  let cfLocalMock: SinonMock;
  let cfViewMock: SinonMock;
  let cfLocalUtilsMock: SinonMock;
  let cfLoginTargetMock: SinonMock;
  const testCFDefaultLandscape = `https://my.api.cf.sap.hana.ondemand.com`;
  let originalCFDefaultLandscape: string;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.restore();
    vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
    vscodeCommandsMock = sandbox.mock(nsVsMock.testVscode.commands);
    commandsMock = sandbox.mock(commands);
    cfViewMock = sandbox.mock(cfView.CFView);
    cfLocalMock = sandbox.mock(cfLocal);
    cliMock = sandbox.mock(Cli);
    cfLocalUtilsMock = sandbox.mock(cfLocalUtils);
    cfLoginTargetMock = sandbox.mock(loginTargetView);
    originalCFDefaultLandscape = _.get(process, "env.CF_API_ENDPOINT");
    _.set(process, "env.CF_API_ENDPOINT", testCFDefaultLandscape);
  });

  afterEach(() => {
    cfLocalMock.verify();
    vscodeWindowMock.verify();
    vscodeCommandsMock.verify();
    commandsMock.verify();
    cliMock.verify();
    cfLocalUtilsMock.verify();
    cfLoginTargetMock.verify();
    cfViewMock.verify();
    _.set(process, "env.CF_API_ENDPOINT", originalCFDefaultLandscape);
  });

  describe("cmdLogin", () => {
    const target = new cfView.CFTargetTI({ label: "target", isCurrent: true, isDirty: false });
    const parent = new cfView.CFFolder("parent", target);
    const node = new cfView.CFLoginNode(parent);

    it("ok:: triggered from targets tree", async () => {
      const json = {
        Target: "my-endPoint",
        SpaceFields: {
          Name: "space",
        },
        OrganizationFields: {
          Name: "org",
        },
      };
      cfLocalUtilsMock.expects("cfGetConfigFileJson").resolves(json);
      const ap = "https://api.sap.test.ondemand.com";
      cfLoginTargetMock.expects("openLoginView").resolves(ap);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      const result = await commands.cmdLogin(node as any);
      expect(result).to.exist;
      expect(result).to.be.equal(ap);
    });

    it("ok:: triggered from targets tree, config file not recognized", async () => {
      const json = {
        Target: "my-endPoint",
        SpaceFields: {
          Name: "space",
        },
        OrganizationFields: {
          Name: "org",
        },
      };
      cfLocalUtilsMock.expects("cfGetConfigFileJson").resolves(json);
      cfLoginTargetMock.expects("openLoginView").resolves("OK");
      cfLocalMock.expects("cfGetTarget").resolves({ user: "bag023" });

      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      const result = await commands.cmdLogin(node as any);
      expect(result).to.exist;
      expect(result).to.be.equal("OK");
    });

    it.skip("'ok:: return an empty string, we caught the error", async () => {
      cfLocalUtilsMock.expects("cfGetConfigFileJson").resolves();
      cfLoginTargetMock.expects("openLoginView").resolves("OK");

      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      const result = await commands.cmdLogin(node as any);
      expect(result).to.exist;
      expect(result).to.be.equal("");
    });

    it("'ok:: select space return ok", async () => {
      cfLoginTargetMock.expects("openLoginView").resolves("OK");
      cfLoginTargetMock
        .expects("openLoginView")
        .withArgs({ isLoginOnly: true, isSplit: true }, undefined, undefined)
        .resolves("OK");
      cfLocalMock.expects("cfGetTarget").resolves({ user: "bag023" });

      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      const result = await commands.cmdSelectSpace();
      expect(result).to.exist;
      expect(result).to.be.equal("OK");
    });
  });

  describe("updateServicesOnCFPageSize", () => {
    it("ok:: size not equal to cf page size", () => {
      const availableServices: ServiceInstanceInfo[] = [];
      commands.updateServicesOnCFPageSize(availableServices);
      expect(availableServices).to.be.empty;
    });

    it("ok:: size equal to cf page size", () => {
      const availableServices: ServiceInstanceInfo[] = new Array(CF_PAGE_SIZE);
      commands.updateServicesOnCFPageSize(availableServices);
      expect(availableServices).to.have.lengthOf(CF_PAGE_SIZE + 1);
    });
  });

  describe("cmdCreateService", () => {
    beforeEach(() => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
    });

    it("fail:: cf connectivity canceled", async () => {
      vscodeWindowMock.restore();
      vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves();
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: instanceName is not specified", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves();
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: withProgress is called, servicesInfo is empty", async () => {
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.no_services_instances_found);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([]);
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: withProgress is called, servicesInfo is not empty, planInfo is empty", async () => {
      const info = { service_plans_url: "test_service_plans_url", label: "testLabel", ignoreFocusOut: true };
      vscodeWindowMock.expects("showQuickPick").resolves(info);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "serviceName" }]);
      vscodeWindowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.no_service_plans_found(info.label))
        .resolves();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([]);
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: withProgress is called, servicesInfo is not empty, select service canceled", async () => {
      vscodeWindowMock.expects("showQuickPick").resolves(undefined);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "serviceName" }]);
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: withProgress is called, servicesInfo is not empty, planInfo several", async () => {
      vscodeWindowMock.expects("showQuickPick").never();
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "myService" }]);
      const plans = [{ label: "plan1" }, { label: "plan2" }];
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([plans[0]]);
      vscodeWindowMock
        .expects("showInputBox")
        .withArgs({
          ignoreFocusOut: true,
          prompt: messages.create_service_enter_params,
          value: "{}",
          valueSelection: undefined,
          validateInput: validateParams("testServiceInfoLabel"),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.creating_service("instanceName", "myService", "plan1"),
          cancellable: true,
        })
        .resolves();
      const service = { name: "myService", plan: "plan1", tag: "", prompt: "" };
      expect(await commands.cmdCreateService(service)).to.be.undefined;
    });

    it("fail:: withProgress filtered is called, servicesInfo is not empty, planInfo is empty", async () => {
      vscodeWindowMock.expects("showQuickPick").never();
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "myService" }]);
      // const plans = [{ label: 'plan1' }, { label: 'plan2' }];
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves();
      const service = { name: "myService", plan: "wrong", tag: "", prompt: "" };
      vscodeWindowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.no_service_plan_info_found(service.plan, "myService"))
        .resolves();
      expect(await commands.cmdCreateService(service)).to.be.undefined;
    });

    it("ok:: withProgress is called, servicesInfo is not empty, planInfo is not empty", async () => {
      vscodeWindowMock
        .expects("showQuickPick")
        .resolves({ service_plans_url: "test_service_plans_url", label: "testServiceInfoLabel", ignoreFocusOut: true });
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs([{}], { placeHolder: messages.select_service_plan, ignoreFocusOut: true })
        .resolves({ label: "testPlanInfoLabel", guid: "plan-guid" });
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("showInputBox")
        .withArgs({
          ignoreFocusOut: true,
          prompt: messages.create_service_enter_params,
          value: "{}",
          valueSelection: undefined,
          validateInput: validateParams("testServiceInfoLabel"),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([{}]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.creating_service("instanceName", "testServiceInfoLabel", "testPlanInfoLabel"),
          cancellable: true,
        })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "serviceName" }]);
      expect(await commands.cmdCreateService()).to.be.equal("instanceName");
    });

    it("fail:: withProgress is called, servicesInfo is not empty, planInfo is not empty, params canceled", async () => {
      vscodeWindowMock
        .expects("showQuickPick")
        .resolves({ service_plans_url: "test_service_plans_url", label: "testServiceInfoLabel", ignoreFocusOut: true });
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs([{}], { placeHolder: messages.select_service_plan, ignoreFocusOut: true })
        .resolves({ label: "testPlanInfoLabel" });
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("showInputBox")
        .withArgs({
          ignoreFocusOut: true,
          prompt: messages.create_service_enter_params,
          value: "{}",
          valueSelection: undefined,
          validateInput: validateParams("testServiceInfoLabel"),
        })
        .resolves(undefined);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([{}]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "serviceName" }]);
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: withProgress is called, servicesInfo is not empty, select plan canceled", async () => {
      vscodeWindowMock
        .expects("showQuickPick")
        .resolves({ service_plans_url: "test_service_plans_url", label: "testServiceInfoLabel", ignoreFocusOut: true });
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs([{}], { placeHolder: messages.select_service_plan, ignoreFocusOut: true })
        .resolves(undefined);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([{}]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "serviceName" }]);
      expect(await commands.cmdCreateService()).to.be.undefined;
    });

    it("fail:: with service metadata info", async () => {
      const info: ServiceTypeInfo = {
        name: "name",
        plan: "",
        prompt: "",
        tag: "",
        allowCreate: {
          name: "customizedName",
          namePrompt: "namePrompt",
        },
      };
      vscodeWindowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.no_services_instances_found_for_type(info.name));
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          value: info.allowCreate?.name,
          prompt: info.allowCreate?.namePrompt || messages.enter_service_name,
          ignoreFocusOut: true,
        })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([]);
      await commands.cmdCreateService(info);
    });

    it("fail:: with service metadata info - quiet params", async () => {
      vscodeWindowMock.expects("showQuickPick").never();
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: "myService" }]);
      const plans = [{ label: "plan1" }, { label: "plan2" }];
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([plans[0]]);
      vscodeWindowMock
        .expects("showInputBox")
        .withArgs({
          ignoreFocusOut: true,
          placeHolder: messages.create_service_enter_params,
          valueSelection: undefined,
          validateInput: validateParams("testServiceInfoLabel"),
        })
        .never();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.creating_service("instanceName", "myService", "plan1"),
          cancellable: true,
        })
        .resolves();
      const service = {
        name: "myService",
        plan: "plan1",
        tag: "",
        prompt: "",
        allowCreate: {
          getParams: () => Promise.resolve({ some: { data: "value" } }),
        },
      };
      await commands.cmdCreateService(service);
    });

    it("fail:: withProgress is called but thrown exception", async () => {
      const error = new Error("withProgress error");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceName");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(error);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message).resolves();
      const result = await commands.cmdCreateService();
      expect(result).to.be.undefined;
    });

    async function testAllowCreateParams(
      expectedInstanceName: string,
      expectedServiceName: string,
      expectedPlanName: string,
      info: ServiceTypeInfo,
      plans: { label: string }[]
    ) {
      vscodeWindowMock.expects("showQuickPick").never();
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves(expectedInstanceName);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: expectedServiceName }]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves(plans);
      vscodeWindowMock
        .expects("showInputBox")
        .withArgs({
          ignoreFocusOut: true,
          placeHolder: messages.create_service_enter_params,
          valueSelection: undefined,
          validateInput: validateParams("testServiceInfoLabel"),
        })
        .never();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.creating_service(expectedInstanceName, expectedServiceName, expectedPlanName),
          cancellable: true,
        })
        .resolves(expectedServiceName);
      const serviceName = await commands.cmdCreateService(info);
      expect(serviceName).to.equal(expectedServiceName);
    }

    it("ok:: use the info params because serviceName, plan and tag are not defined in allowCreate", async () => {
      const expectedServiceName = "nameA";
      const expectedPlanName = "planA";
      const expectedInstanceName = "instanceName";
      const info: ServiceTypeInfo = {
        name: expectedServiceName,
        plan: expectedPlanName,
        prompt: "promptA",
        tag: "tagA",
        allowCreate: {
          getParams: () => Promise.resolve({ some: { data: "value" } }),
        },
      };
      const plans = [{ label: expectedPlanName }];

      await testAllowCreateParams(expectedInstanceName, expectedServiceName, expectedPlanName, info, plans);
    });

    it("ok:: use allowCreate serviceName, plan and tag because they are defined in allowCreate ", async () => {
      const expectedServiceName = "nameB";
      const expectedPlanName = "planB";
      const expectedInstanceName = "instanceName";
      const info: ServiceTypeInfo = {
        name: "nameA",
        plan: "planA",
        prompt: "promptA",
        tag: "tagA",
        allowCreate: {
          serviceName: expectedServiceName,
          plan: expectedPlanName,
          tag: "tagB",
          getParams: () => Promise.resolve({ some: { data: "value" } }),
        },
      };
      const plans = [{ label: expectedPlanName }];

      await testAllowCreateParams(expectedInstanceName, expectedServiceName, expectedPlanName, info, plans);
    });
  });

  describe("onCreateService - continue", () => {
    it("createService throws an error", async () => {
      const error = new Error("testError");
      cfLocalMock.expects("cfCreateService").throws(error);
      try {
        await commands.onCreateService(
          { guid: "", label: "", description: "" },
          "testInstance",
          undefined,
          undefined,
          (undefined as unknown) as Progress<{ message?: string; increment?: number }>,
          (undefined as unknown) as CancellationToken
        );
        fail("test should not reach here");
      } catch (e) {
        expect(_.get(e, "message")).to.be.equal(error.message);
      }
    });

    it("ok:: createService suceeded and returns cf resource", async () => {
      const params = { params: { data: "value" } };
      const tags = ["tag1", "other"];
      cfLocalMock
        .expects("cfCreateService")
        .withArgs("guid", "testInstance", params, tags)
        .resolves({
          guid: "instance-guid",
          name: "testInstance",
          links: {},
          relationships: {
            service_plan: {
              data: {
                guid: "guid",
              },
            },
          },
          metadata: {},
        });
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_created("testInstance"))
        .resolves();
      await commands.onCreateService(
        { guid: "guid", label: "label", description: "" },
        "testInstance",
        params,
        tags,
        (undefined as unknown) as Progress<{ message?: string; increment?: number }>,
        (undefined as unknown) as CancellationToken
      );
    });
  });

  describe("isCFResource", () => {
    it("fail:: obj is undefined", () => {
      expect(commands.isCFResource(undefined)).to.be.false;
    });

    it("fail:: obj has no links property", () => {
      expect(
        commands.isCFResource({
          guid: "instance-guid",
          name: "testInstance",
          relationships: {
            service_plan: {
              data: {
                guid: "guid",
              },
            },
          },
          metadata: {},
        })
      ).to.be.false;
    });

    it("fail:: obj has no guid attribute", () => {
      expect(
        commands.isCFResource({
          name: "testInstance",
          links: {},
          relationships: {
            service_plan: {
              data: {
                guid: "guid",
              },
            },
          },
          metadata: {},
        })
      ).to.be.false;
    });

    it("fail:: obj has no relationships attribute", () => {
      expect(
        commands.isCFResource({
          guid: "instance-guid",
          links: {},
        })
      ).to.be.false;
    });

    it("ok:: obj is a cf resource", () => {
      expect(
        commands.isCFResource({
          guid: "instance-guid",
          links: {},
          relationships: {
            service_plan: {
              data: {
                guid: "guid",
              },
            },
          },
          metadata: {},
        })
      ).to.be.true;
    });
  });

  describe("isServiceTypeInfoInArray", () => {
    it("fail:: obj is undefined", () => {
      expect(commands.isServiceTypeInfoInArray(undefined)).to.be.false;
    });

    it("fail:: obj is not an array", () => {
      expect(commands.isServiceTypeInfoInArray({ metadata: {} })).to.be.false;
    });

    it("fail:: obj has no name property", () => {
      expect(commands.isServiceTypeInfoInArray([{ metadata: {} }])).to.be.false;
    });

    it("ok:: obj has name property", () => {
      expect(commands.isServiceTypeInfoInArray([{ name: "test" }])).to.be.true;
    });
  });

  describe("getAvailableServices", () => {
    let commandId = "cf.set.orgspace";

    it("fail:: loading services undefined", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves();
      expect(await commands.getAvailableServices()).to.be.undefined;
    });

    it("ok:: success", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{}]);
      const result = await commands.getAvailableServices();
      expect(result).to.have.lengthOf(1);
    });

    it("fail:: on any error", async () => {
      const errorMessage = "test error";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      try {
        await commands.getAvailableServices();
        fail("should fail");
      } catch (e) {
        expect(e.message).to.be.equal(errorMessage);
      }
    });

    it("ok:: logout, on any login ok", async () => {
      const errorMessage = messages.cf_setting_not_set;
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      vscodeCommandsMock.expects("executeCommand").withExactArgs(commandId).resolves(OK);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{}]);
      cfLocalMock.expects("cfGetTarget").resolves({ user: "bag023" });
      expect(await commands.getAvailableServices()).to.have.lengthOf(1);
    });

    it("fail:: on any login error", async () => {
      const errorMessage = messages.cf_setting_not_set;
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      cfLocalMock.expects("cfGetTarget").resolves({ user: "bag023" });
      vscodeCommandsMock.expects("executeCommand").withExactArgs(commandId).resolves(undefined); // canceled by user
      try {
        await commands.getAvailableServices();
        fail("should fail");
      } catch (e) {
        expect(e).to.be.equal(undefined);
      }
    });
    it.skip("ok:: on any login ok, org no space", async () => {
      commandId = "cf.select.space";
      const errorMessage = messages.cf_setting_not_set;
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      vscodeCommandsMock.expects("executeCommand").withExactArgs(commandId).resolves(OK);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{}]);
      cfLocalMock.expects("cfGetTarget").resolves({ user: "bag023", org: "org" });
      const result = await commands.getAvailableServices();
      expect(result).to.have.lengthOf(1);
    });

    it("fail:: not logged in, cfGetTarget unknown fail", async () => {
      commandId = "cf.select.space";
      const errorMessage = messages.cf_setting_not_set;
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      cfLocalMock.expects("cfGetTarget").resolves({ user: "bag023", org: "org", space: "space" });
      try {
        await commands.getAvailableServices();
        fail("should fail");
      } catch (e) {
        expect(e.message).to.be.equal(errorMessage);
      }
    });
  });

  describe("getServiceInstances", () => {
    it("ok:: on success", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{}]);
      const result = await commands.getServiceInstances();
      expect(result).to.have.lengthOf(1);
    });

    it("fail:: on any error", async () => {
      const errorMessage = "test error";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      try {
        await commands.getServiceInstances();
        fail("test should fail here");
      } catch (e) {
        expect(e.message).to.be.equal(errorMessage);
      }
    });
  });

  describe("getUserProvidedServiceInstances", () => {
    it("ok:: on success", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_ups_services,
          cancellable: true,
        })
        .resolves([{}]);
      const result = await commands.getUserProvidedServiceInstances();
      expect(result).to.have.lengthOf(1);
    });

    it("fail:: on any error", async () => {
      const errorMessage = "test error";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_ups_services,
          cancellable: true,
        })
        .rejects(new Error(errorMessage));
      try {
        await commands.getUserProvidedServiceInstances();
        fail("test should fail here");
      } catch (e) {
        expect(e.message).to.be.equal(errorMessage);
      }
    });
  });

  describe("updateInstanceNameAndTags", () => {
    it("ok:: availableServices is empty", async () => {
      vscodeWindowMock.expects("showQuickPick").never();
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.no_services_instances_found).resolves();
      const result = await commands.updateInstanceNameAndTags([], undefined, [], []);
      expect(result).to.be.undefined;
    });

    it("ok:: availableServices is empty for service type", async () => {
      vscodeWindowMock.expects("showQuickPick").never();
      const name = "absent_service";
      vscodeWindowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.no_services_instances_found_for_type(name))
        .resolves();
      const result = await commands.updateInstanceNameAndTags([], { name, plan: "", tag: "", prompt: "" }, [], []);
      expect(result).to.be.undefined;
    });

    it("ok:: availableServices is not empty", async () => {
      const plans = [{ guid: "plan_guid_1", label: "uuaa", description: "plan_description_1" }];
      const availableServices = [
        { serviceName: "testServiceName1", label: "testLabel1", plan_guid: "plan_guid_1", plan: plans[0].label },
        { serviceName: "testServiceName2", label: "More results..." },
      ];
      const pickItems = [
        { description: `testServiceName1 (${plans[0].label})`, label: "testLabel1" },
        { description: "testServiceName2", label: "More results..." },
      ];
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(pickItems, {
          placeHolder: "testPrompt",
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(pickItems[0]);
      const result = await commands.updateInstanceNameAndTags(
        availableServices,
        { tag: "testTag", name: "testServiceName1", plan: "testPlan", prompt: "testPrompt" },
        [],
        []
      );
      expect(result).to.be.equal("testLabel1");
    });

    it("ok:: availableServices have more services", async () => {
      const availableServices = [{ serviceName: "testServiceName1", label: "More results..." }];
      const pickItems = [{ description: "testServiceName1", label: "More results..." }];

      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs([pickItems[0]], {
          placeHolder: "testPrompt",
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(pickItems[0]);
      const result = await commands.updateInstanceNameAndTags(
        availableServices,
        { tag: "testTag", name: "testName", plan: "testPlan", prompt: "testPrompt" },
        [],
        []
      );
      expect(result).to.be.equal("More results...");
    });

    it("ok:: Bind to default service, when default service instance existed.", async () => {
      const expectedInstanceName = "defaultService";
      const info: ServiceTypeInfo = {
        name: "nameA",
        plan: "planA",
        prompt: "promptA",
        tag: "tagA",
        allowCreate: {
          serviceName: "name",
          plan: "planName",
          tag: "tagB",
          name: expectedInstanceName,
          getParams: () => Promise.resolve({ some: { data: "value" } }),
        },
      };

      const infoName = info?.allowCreate?.name || "";
      const infoServiceName = info?.allowCreate?.serviceName || "";
      const infoPlan = info?.allowCreate?.plan || "";

      const availableServices = [
        {
          label: commands.CMD_BIND_TO_DEFAULT_SERVICE + infoName,
          serviceName: infoServiceName,
          plan: infoPlan,
        },
        {
          label: commands.CMD_CREATE_SERVICE,
          serviceName: "",
        },
        {
          serviceName: infoServiceName,
          label: expectedInstanceName,
          plan: infoPlan,
        },
      ];
      const pickItems = [
        {
          description: `${infoServiceName} (${infoPlan})`,
          label: commands.CMD_BIND_TO_DEFAULT_SERVICE + infoName,
        },
        {
          description: "",
          label: commands.CMD_CREATE_SERVICE,
        },
        {
          description: `${infoServiceName} (${infoPlan})`,
          label: expectedInstanceName,
        },
      ];

      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(pickItems, {
          placeHolder: "promptA",
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(pickItems[0]);
      const result = await commands.updateInstanceNameAndTags(availableServices, info, [], []);
      expect(result).to.be.equal(infoName);
    });

    it("ok:: Bind to default service,when default service instance doesn't existed (createServiceInstance).", async () => {
      const expectedServiceName = "nameB";
      const expectedPlanName = "planB";
      const expectedInstanceName = "instanceName";
      const info: ServiceTypeInfo = {
        name: "nameA",
        plan: "planA",
        prompt: "promptA",
        tag: "tagA",
        allowCreate: {
          serviceName: expectedServiceName,
          plan: expectedPlanName,
          tag: "tagB",
          name: expectedInstanceName,
          getParams: () => Promise.resolve({ some: { data: "value" } }),
        },
      };
      const plans = [{ label: expectedPlanName }];

      const infoName = info?.allowCreate?.name || "";
      const availableServices = [
        { label: commands.CMD_BIND_TO_DEFAULT_SERVICE + infoName, serviceName: "" },
        { label: commands.CMD_CREATE_SERVICE, serviceName: "" },
      ];
      const pickItems = [
        { description: "", label: commands.CMD_BIND_TO_DEFAULT_SERVICE + infoName },
        { description: "", label: commands.CMD_CREATE_SERVICE },
      ];

      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(pickItems, {
          placeHolder: "promptA",
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(pickItems[0]);

      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves([{ label: expectedServiceName }]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves(plans);

      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.creating_service(expectedInstanceName, expectedServiceName, expectedPlanName),
          cancellable: true,
        })
        .resolves(expectedInstanceName);

      const result = await commands.updateInstanceNameAndTags(availableServices, info, [], []);
      expect(result).to.be.equal(infoName);
    });

    it("ok:: Bind to default service,when default service instance doesn't existed (createUpsInstance).", async () => {
      const info: ServiceTypeInfo = {
        name: "user-provided",
        plan: "",
        prompt: "",
        tag: "mono",
        allowCreate: {
          name: "silent",
        },
      };

      const infoName = info?.allowCreate?.name || "";
      const availableServices = [
        { label: commands.CMD_BIND_TO_DEFAULT_SERVICE + infoName, serviceName: "" },
        { label: commands.CMD_CREATE_SERVICE, serviceName: "" },
      ];
      const pickItems = [
        { description: "", label: commands.CMD_BIND_TO_DEFAULT_SERVICE + infoName },
        { description: "", label: commands.CMD_CREATE_SERVICE },
      ];

      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(pickItems, {
          placeHolder: "",
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(pickItems[0]);

      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.service_created(infoName)).resolves();
      cfLocalMock
        .expects("cfCreateUpsInstance")
        .withExactArgs({
          instanceName: infoName,
          credentials: {},
          route_service_url: "",
          syslog_drain_url: "",
          tags: [info.tag],
        })
        .resolves({
          name: infoName,
          guid: "instance-guid",
          type: "user-provided",
          relationships: {},
          links: {},
        });

      const result = await commands.updateInstanceNameAndTags(availableServices, info, [], []);
      expect(result).to.be.equal(infoName);
    });
  });

  describe("fetchServicePlanList", () => {
    const plan = {
      label: "test",
      guid: "plan-guid",
      description: "",
      service_offering: { guid: "service-guid", name: "service-name", description: "service-description" },
    };

    it("ok:: on success", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([plan]);
      vscodeWindowMock.expects("showWarningMessage").never();
      expect(await commands.fetchServicePlanList()).to.deep.equal([plan]);
    });

    it("ok:: not logged in, perform loggin", async () => {
      const errorMessage = messages.login;
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .rejects(new Error(errorMessage));
      cfLocalMock.expects("cfGetTarget").rejects();
      vscodeCommandsMock.expects("executeCommand").withExactArgs("cf.login", true).resolves(OK);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .resolves([plan]);
      expect(await commands.fetchServicePlanList()).to.deep.equal([plan]);
    });

    it("fail:: not logged in, login canceled by user", async () => {
      const errorMessage = messages.login;
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .rejects(new Error(errorMessage));
      cfLocalMock.expects("cfGetTarget").rejects();
      vscodeCommandsMock.expects("executeCommand").withExactArgs("cf.login", true).resolves(undefined);
      try {
        await commands.fetchServicePlanList();
        fail("should fail");
      } catch (e) {
        expect(e).to.be.equal(undefined);
      }
    });

    it("fail:: not logged in, other error", async () => {
      const errorMessage = "FAILED\nNo API endpoint set.";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_service_plan_list,
          cancellable: false,
        })
        .rejects(new Error(errorMessage));
      vscodeCommandsMock.expects("executeCommand").never();
      try {
        await commands.fetchServicePlanList();
        expect(true).to.be.equal(false);
      } catch (e) {
        expect(e.message).to.be.equal(errorMessage);
      }
    });
  });

  describe("getInstanceName", () => {
    const MORE_RESULTS = "More results...";
    const servicesPage2 = [{ serviceName: "serviceName2", label: "label2" }];
    const availableServices: ServiceInstanceInfo[] = [
      { serviceName: "serviceName1", label: "label1" },
      { label: MORE_RESULTS, serviceName: "more:2", alwaysShow: true },
    ];
    const items = [
      { label: availableServices[0].label, description: availableServices[0].serviceName },
      { label: availableServices[1].label, description: availableServices[1].serviceName },
    ];
    const allItems = [
      { label: availableServices[0].label, description: availableServices[0].serviceName },
      { label: servicesPage2[0].label, description: servicesPage2[0].serviceName },
    ];

    it("ok:: success", async () => {
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(items, {
          placeHolder: messages.select_service,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(items[1]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.loading_services,
          cancellable: true,
        })
        .resolves(servicesPage2);
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(allItems, {
          placeHolder: messages.select_service,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(items[0]);
      const result = await commands.getInstanceName(availableServices);
      expect(result).to.equal(items[0].label);
    });

    it("fail:: no avialable services", async () => {
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.no_services_instances_found).resolves();
      const result = await commands.getInstanceName((undefined as unknown) as ServiceInstanceInfo[]);
      expect(result).to.undefined;
    });
  });

  describe("cmdCreateUps", () => {
    beforeEach(() => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
    });

    it("fail:: cf connectivity canceled", async () => {
      vscodeWindowMock.restore();
      vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves();
      expect(await commands.cmdCreateUps()).to.be.undefined;
    });

    it("ok:: empty info data", async () => {
      const instanceUpsName = "myUps";
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves(instanceUpsName);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.service_created(instanceUpsName));
      cfLocalMock
        .expects("cfCreateUpsInstance")
        .withExactArgs({
          instanceName: instanceUpsName,
          credentials: {},
          route_service_url: "",
          syslog_drain_url: "",
          tags: [],
        })
        .resolves({
          name: instanceUpsName,
          guid: "instance-guid",
          type: "user-provided",
          relationships: {},
          links: {},
        });
      const info: ServiceTypeInfo = {
        name: "",
        plan: "",
        prompt: "",
        tag: "",
      };
      expect(await commands.cmdCreateUps(info)).to.be.equal(instanceUpsName);
    });

    it("fail:: no name provided", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves(undefined);
      cfLocalMock.expects("cfCreateUpsInstance").never();
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("fail:: enter credentials canceled", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("name");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves(undefined);
      cfLocalMock.expects("cfCreateUpsInstance").never();
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("fail:: enter tags canceled", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("name");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves('{"user": "paswrd"}');
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves(undefined);
      cfLocalMock.expects("cfCreateUpsInstance").never();
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("fail:: entering enter_sys_log_url canceled", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("name");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves('{"user": "paswrd"}');
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves(undefined);
      cfLocalMock.expects("cfCreateUpsInstance").never();
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("fail:: entering enter_route_service_url canceled", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("name");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves('{"user": "paswrd"}');
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves(undefined);
      cfLocalMock.expects("cfCreateUpsInstance").never();
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("fail:: no info data - unexpected response format", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceUpsName");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves("");
      const response = { label: "name", metadata: {} };
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(_.toString(response)).resolves();
      cfLocalMock.expects("cfCreateUpsInstance").resolves(response);
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("exception:: no info data, show error message", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceUpsName");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock.expects("showInformationMessage").never();
      const error = new Error("runtime error");
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message);
      cfLocalMock.expects("cfCreateUpsInstance").rejects(error);
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("exception:: no info data, exception no error thrown", async () => {
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves("instanceUpsName");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock.expects("showInformationMessage").never();
      vscodeWindowMock.expects("showErrorMessage").once().resolves();
      cfLocalMock.expects("cfCreateUpsInstance").throws();
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });

    it("ok:: silent creation", async () => {
      const info: ServiceTypeInfo = {
        name: "",
        plan: "",
        prompt: "",
        tag: "mono",
        allowCreate: {
          name: "silent",
        },
      };
      const infoName = info?.allowCreate?.name || "";
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true, value: infoName })
        .resolves(infoName);
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.service_created(infoName)).resolves();
      cfLocalMock
        .expects("cfCreateUpsInstance")
        .withExactArgs({
          instanceName: infoName,
          credentials: {},
          route_service_url: "",
          syslog_drain_url: "",
          tags: [info.tag],
        })
        .resolves({
          name: infoName,
          guid: "instance-guid",
          type: "user-provided",
          relationships: {},
          links: {},
        });
      expect(await commands.cmdCreateUps(info)).to.be.equal(infoName);
    });

    it("ok:: tags provided", async () => {
      const info: ServiceTypeInfo = {
        name: "",
        plan: "",
        prompt: "",
        tag: "mono",
      };
      const instanceUpsName = "myUps";
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves(instanceUpsName);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true, value: info.tag })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_created(instanceUpsName))
        .resolves();
      cfLocalMock
        .expects("cfCreateUpsInstance")
        .withExactArgs({
          instanceName: instanceUpsName,
          credentials: {},
          route_service_url: "",
          syslog_drain_url: "",
          tags: [],
        })
        .resolves({
          name: instanceUpsName,
          guid: "instance-guid",
          type: "user-provided",
          relationships: {},
          links: {},
        });
      expect(await commands.cmdCreateUps(info)).to.be.equal(instanceUpsName);
    });

    it("fail:: response isn't cf resource", async () => {
      const instanceUpsName = "myUps";
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_service_name, ignoreFocusOut: true })
        .resolves(instanceUpsName);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({
          prompt: messages.enter_credentials,
          ignoreFocusOut: true,
          value: stringify({}),
          validateInput: validateParams(""),
        })
        .resolves("{}");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_tags, ignoreFocusOut: true })
        .resolves([]);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_sys_log_url, ignoreFocusOut: true })
        .resolves("");
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_route_service_url, ignoreFocusOut: true })
        .resolves("");
      const response: any = null;
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(_.toString(response)).resolves();
      cfLocalMock
        .expects("cfCreateUpsInstance")
        .withExactArgs({
          instanceName: instanceUpsName,
          credentials: {},
          route_service_url: "",
          syslog_drain_url: "",
          tags: [],
        })
        .resolves(response);
      expect(await commands.cmdCreateUps()).to.be.equal(undefined);
    });
  });
});
