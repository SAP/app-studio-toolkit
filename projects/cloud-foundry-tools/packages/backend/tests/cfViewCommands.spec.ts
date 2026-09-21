import { expect, assert } from "chai";
import * as _ from "lodash";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";

nsVsMock.setTestRoots(["/", "/some_path"]);

mockVscode(nsVsMock.testVscode, "src/cfViewCommands.ts");
mockVscode(nsVsMock.testVscode, "src/logger/logger-wrapper.ts");

import * as cfViewCommands from "../src/cfViewCommands";
import * as commands from "../src/commands";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import * as cfLocalUtils from "@sap/cf-tools/out/src/utils";
import {
  ServiceTypeInfo,
  ServiceInstanceInfo,
  Cli,
  DEFAULT_TARGET,
  CFTarget,
  IServiceQuery,
  eFilters,
  PlanInfo,
  CF_PAGE_SIZE,
  eServiceTypes,
} from "@sap/cf-tools";
import * as cfView from "../src/cfView";
import * as https from "https";
import * as fspath from "path";
import { messages } from "../src/messages";
import { fail } from "assert";
import { DisplayServices, ServiceQueryOptions, UpsServiceQueryOprions } from "../src/utils";
import * as chisel from "../src/chisel";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";

describe("cfViewCommands tests", () => {
  let sandbox: SinonSandbox;
  let vscodeWindowMock: SinonMock;
  let vscodeWorkspaceMock: SinonMock;
  let cfViewCommandsMock: SinonMock;
  let commandsMock: SinonMock;
  let cliMock: SinonMock;
  let httpsMock: SinonMock;
  let cfLocalMock: SinonMock;
  let cfLocalUtilsMock: SinonMock;
  let cfViewMock: SinonMock;
  let chiselMock: SinonMock;
  const cliResult = { exitCode: 0, stdout: "", stderr: "" };

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    cfViewMock = sandbox.mock(cfView.CFView);
    vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
    vscodeWorkspaceMock = sandbox.mock(nsVsMock.testVscode.workspace);
    cfViewCommandsMock = sandbox.mock(cfViewCommands);
    cfLocalMock = sandbox.mock(cfLocal);
    cfLocalUtilsMock = sandbox.mock(cfLocalUtils);
    cliMock = sandbox.mock(Cli);
    commandsMock = sandbox.mock(commands);
    httpsMock = sandbox.mock(https);
    chiselMock = sandbox.mock(chisel);
  });

  afterEach(() => {
    sandbox.restore();
    cfLocalMock.verify();
    cfLocalUtilsMock.verify();
    vscodeWindowMock.verify();
    vscodeWorkspaceMock.verify();
    cfViewCommandsMock.verify();
    cliMock.verify();
    cfViewMock.verify();
    httpsMock.verify();
    commandsMock.verify();
    chiselMock.verify();
  });

  it("cmdReloadTargets", async () => {
    cfViewMock.expects("get").returns({
      refresh: () => {
        return;
      },
    });
    await cfViewCommands.cmdReloadTargets();
  });

  describe("cfDeployServiceAPI", () => {
    const testToken = " \ntestToken\n";
    const errorText = "my error";
    const result = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      on: (type: string, callback: any) => callback(new Error(errorText)),
    };
    const urlPath = "url/path";

    it("exception:: https get on - error", async () => {
      const ap = "https://api.cf.sap.hana.ondemand.com";
      const target = new URL(_.replace(ap, "api.cf", "deploy-service.cfapps"));
      const options = {
        protocol: target.protocol,
        host: target.host,
        port: 443,
        method: "get",
        path: target.pathname,
        headers: { Authorization: testToken.replace("\n", "").replace("\n", "") },
      };
      cfLocalUtilsMock.expects("cfGetConfigFileField").withExactArgs("Target").resolves(ap);
      httpsMock.expects("get").withArgs(options).returns(result);
      cfLocalMock.expects("cfGetAuthToken").resolves(testToken);
      try {
        await cfViewCommands.cfDeployServiceAPI("");
        fail("should not reach here");
      } catch (e) {
        expect(e).to.equal(errorText);
      }
    });

    it("exception:: https get on - error, url parse data", async () => {
      const ap = "https://api.cf.sap.hana.ondemand.com:8090";
      const target = new URL(_.replace(ap, "api.cf", "deploy-service.cfapps"));
      const options = {
        protocol: target.protocol,
        host: target.host,
        port: target.port,
        method: "get",
        path: urlPath,
        headers: { Authorization: testToken.replace("\n", "").replace("\n", "") },
      };
      cfLocalUtilsMock.expects("cfGetConfigFileField").withExactArgs("Target").resolves(ap);
      httpsMock.expects("get").withArgs(options).returns(result);
      cfLocalMock.expects("cfGetAuthToken").resolves(testToken);
      try {
        await cfViewCommands.cfDeployServiceAPI(urlPath);
        fail("should not reach here");
      } catch (e) {
        expect(e).to.equal(errorText);
      }
    });

    it("exception:: https get on - error, url parse data, default port", async () => {
      const ap = "http://api.cf.sap.hana.ondemand.com";
      const target = new URL(_.replace(ap, "api.cf", "deploy-service.cfapps"));
      const options = {
        protocol: target.protocol,
        host: target.host,
        port: 80,
        method: "get",
        path: urlPath,
        headers: { Authorization: testToken.replace("\n", "").replace("\n", "") },
      };
      cfLocalUtilsMock.expects("cfGetConfigFileField").withExactArgs("Target").resolves(ap);
      httpsMock.expects("get").withArgs(options).returns(result);
      cfLocalMock.expects("cfGetAuthToken").resolves(testToken);
      try {
        await cfViewCommands.cfDeployServiceAPI(urlPath);
        fail("should not reach here");
      } catch (e) {
        expect(e).to.equal(errorText);
      }
    });

    it("exception:: no target", async () => {
      cfLocalUtilsMock.expects("cfGetConfigFileField").withExactArgs("Target").resolves([]);
      try {
        await cfViewCommands.cfDeployServiceAPI("");
        fail("should not reach here");
      } catch (e) {
        expect(e.message).to.equal(messages.no_cf_api_endpoint);
      }
    });
  });

  describe("cmdDeployServiceAPI", () => {
    it("ok:: empty args", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.load_data_from_deploy,
          cancellable: false,
        })
        .resolves();
      await cfViewCommands.cmdDeployServiceAPI("", "");
    });

    it("ok:: empty args, connectivity canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.load_data_from_deploy,
          cancellable: false,
        })
        .never();
      await cfViewCommands.cmdDeployServiceAPI("", "");
    });

    it("ok:: with specified message", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
      const message = "myMessage";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Notification, title: message, cancellable: false })
        .resolves();
      await cfViewCommands.cmdDeployServiceAPI("", message);
    });
  });

  describe("cmdSetCurrentTarget scope", () => {
    const currentTarget: CFTarget = { label: "current Target", isDirty: false, isCurrent: true };
    const localView = {
      getCurrentTarget: () => currentTarget,
      refresh: () => "",
    };

    it("ok:: target is current already, nothing done", async () => {
      cliMock.expects("execute").never();
      cfViewMock.expects("get").never();
      await cfViewCommands.cmdSetCurrentTarget(
        new cfView.CFTargetTI({ label: "my Target", isDirty: false, isCurrent: true })
      );
    });

    it("ok:: target is set, reload called", async () => {
      const target = { label: "my Target", isDirty: false, isCurrent: false };
      cfViewMock.expects("get").twice().returns(localView);
      cliMock.expects("execute").withExactArgs(["set-target", "-f", target.label]).resolves(cliResult);
      await cfViewCommands.cmdSetCurrentTarget(new cfView.CFTargetTI(target));
    });

    it("ok:: target is current, is dirty, not save - No", async () => {
      const target = { label: "my Target", isDirty: false, isCurrent: false };
      currentTarget.isCurrent = true;
      currentTarget.isDirty = true;
      cfViewMock.expects("get").twice().returns(localView);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_dirty_save(currentTarget.label), "Yes", "No", "Cancel")
        .resolves("No");
      cliMock.expects("execute").withExactArgs(["set-target", "-f", target.label]).resolves(cliResult);
      await cfViewCommands.cmdSetCurrentTarget(new cfView.CFTargetTI(target));
    });

    it("ok:: target is current, is dirty, not save - Cancel", async () => {
      const target = { label: "my Target", isDirty: false, isCurrent: false };
      currentTarget.isCurrent = true;
      currentTarget.isDirty = true;
      cfViewMock.expects("get").returns(localView);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_dirty_save(currentTarget.label), "Yes", "No", "Cancel")
        .resolves(undefined);
      cliMock.expects("execute").withExactArgs(["set-target", "-f", target.label]).never();
      await cfViewCommands.cmdSetCurrentTarget(new cfView.CFTargetTI(target));
    });

    it("ok:: target is current, is dirty, save - Yes", async () => {
      const target = { label: "my Target", isDirty: false, isCurrent: false };
      currentTarget.isCurrent = true;
      currentTarget.isDirty = true;
      cfViewMock.expects("get").twice().returns(localView);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_dirty_save(currentTarget.label), "Yes", "No", "Cancel")
        .resolves("Yes");
      cliMock.expects("execute").withExactArgs(["set-target", "-f", target.label]).resolves(cliResult);
      cliMock.expects("execute").withExactArgs(["save-target"]).resolves(cliResult);
      await cfViewCommands.cmdSetCurrentTarget(new cfView.CFTargetTI(target));
    });

    it("exception:: target is current, exception thrown", async () => {
      currentTarget.isCurrent = true;
      currentTarget.isDirty = true;
      cfViewMock.expects("get").returns(localView);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_dirty_save(currentTarget.label), "Yes", "No", "Cancel")
        .resolves("Yes");
      const error = new Error("my error");
      cliMock.expects("execute").withExactArgs(["save-target"]).throws(error);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message).resolves();
      await cfViewCommands.cmdSetCurrentTarget(
        new cfView.CFTargetTI({ label: "my Target", isDirty: false, isCurrent: false })
      );
    });

    it("fail:: target is current, not dirty, execute failed", async () => {
      const target = { label: "my Target", isDirty: false, isCurrent: false };
      currentTarget.isCurrent = true;
      currentTarget.isDirty = false;
      cfViewMock.expects("get").returns(localView);
      cliResult.exitCode = 1;
      cliResult.stdout = "any error";
      cliMock.expects("execute").withExactArgs(["set-target", "-f", target.label]).resolves(cliResult);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(cliResult.stdout).resolves();
      await cfViewCommands.cmdSetCurrentTarget(new cfView.CFTargetTI(target));
    });

    it("ok:: 'CFTargetNotCurrent' item received", async () => {
      cliMock.expects("execute").never();
      await cfViewCommands.cmdSetCurrentTarget(
        new cfView.CFTargetNotCurrent(
          new cfView.CFAppsFolder(
            "apps",
            new cfView.CFTargetTI({ label: "my Target", isDirty: false, isCurrent: true })
          )
        )
      );
    });

    it("ok:: targets tree broken", async () => {
      await cfViewCommands.cmdSetCurrentTarget(new cfView.CFTargetNotCurrent({ label: "label" } as cfView.CFFolder));
    });

    it("ok:: null received, targets tree broken", async () => {
      await cfViewCommands.cmdSetCurrentTarget(undefined);
    });
  });

  describe("execSetTarget scope", () => {
    const item = new cfView.CFTargetTI({ label: "my Target", isCurrent: false, isDirty: true });

    it("ok:: silent mode required", async () => {
      const cliResult = { exitCode: -1, stdout: "", stderr: "" };
      cliMock.expects("execute").withExactArgs(["set-target", "-f", item.target.label]).resolves(cliResult);
      vscodeWindowMock.expects("showErrorMessage").never();
      await cfViewCommands.execSetTarget(item, { silent: true });
    });

    it("ok:: 'skip-reload' mode required", async () => {
      const cliResult = { exitCode: 0, stdout: "", stderr: "" };
      cliMock.expects("execute").withExactArgs(["set-target", "-f", item.target.label]).resolves(cliResult);
      cfViewMock.expects("get").never();
      await cfViewCommands.execSetTarget(item, { silent: true, "skip-reload": true });
    });
  });

  describe("execSaveTarget scope", () => {
    const item = new cfView.CFTargetTI({ label: "my Target", isCurrent: false, isDirty: true });

    it("ok:: error occured", async () => {
      const cliResult = { exitCode: -1, stdout: "", stderr: "" };
      cliMock.expects("execute").withExactArgs(["save-target", "-f", item.target.label]).resolves(cliResult);
      vscodeWindowMock.expects("showErrorMessage").resolves();
      await cfViewCommands.execSaveTarget(item);
    });

    it("ok:: silent mode required", async () => {
      const cliResult = { exitCode: -1, stdout: "", stderr: "" };
      cliMock.expects("execute").withExactArgs(["save-target", "-f", item.target.label]).resolves(cliResult);
      vscodeWindowMock.expects("showErrorMessage").never();
      await cfViewCommands.execSaveTarget(item, { silent: true });
    });

    it("ok:: without args", async () => {
      const cliResult = { exitCode: 0, stdout: "", stderr: "" };
      cliMock.expects("execute").withExactArgs(["save-target"]).resolves(cliResult);
      await cfViewCommands.execSaveTarget();
    });

    it("ok:: 'no-targets' node received", async () => {
      cliMock.expects("execute").never();
      await cfViewCommands.execSaveTarget(
        new cfView.CFTargetTI({ label: "my (no targets)", isCurrent: false, isDirty: true })
      );
    });
  });

  describe("cmdDeleteTarget scope", () => {
    const localView = {
      refresh: () => "",
    };
    const item = new cfView.CFTargetTI({ label: "other", isCurrent: true, isDirty: false });

    it("ok:: default-target", async () => {
      cliMock.expects("execute").withArgs(["delete-target"]).never();
      await cfViewCommands.cmdDeleteTarget(
        new cfView.CFTargetTI({ label: DEFAULT_TARGET, isCurrent: true, isDirty: false })
      );
    });

    it("ok:: other deleted", async () => {
      cliResult.exitCode = 0;
      cliResult.stdout = "";
      cliMock.expects("execute").withArgs(["delete-target", item.target.label]).resolves(cliResult);
      cfViewMock.expects("get").returns(localView);
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.target_deleted(item.target.label))
        .resolves();
      await cfViewCommands.cmdDeleteTarget(item);
    });

    it("ok:: other deleted, silent and 'skip-reload' mode", async () => {
      cliResult.exitCode = 0;
      cliResult.stdout = "";
      cliMock.expects("execute").withArgs(["delete-target", item.target.label]).resolves(cliResult);
      cfViewMock.expects("get").never();
      vscodeWindowMock.expects("showInformationMessage").never();
      await cfViewCommands.cmdDeleteTarget(item, { silent: true, "skip-reload": true });
    });

    it("ok:: other failure", async () => {
      cliResult.stdout = "some error during delete";
      cliResult.exitCode = -1;
      cliMock.expects("execute").withArgs(["delete-target", item.target.label]).resolves(cliResult);
      cfViewMock.expects("get").never();
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(cliResult.stdout).resolves();
      await cfViewCommands.cmdDeleteTarget(item);
    });
  });

  describe("cmdGetSpaceServices scope", () => {
    it("ok:: verify args", async () => {
      const title = "progress title";
      const query: IServiceQuery = {
        filters: [
          { key: eFilters.names, value: "@^%$_^%+-_jlkj" },
          { key: eFilters.service_broker_names, value: "+-QWERE_+%?>jlkj" },
        ],
      };
      const modified = _.cloneDeep(query);
      _.each(modified.filters, (filter) => {
        filter.value = encodeURIComponent(filter.value);
      });
      const arg = { query: modified, ups: { isShow: true } };
      commandsMock.expects("getAvailableServices").withExactArgs(arg, title).resolves();
      await cfViewCommands.cmdGetSpaceServices(query, title);
    });

    it("ok:: undefined query", async () => {
      const title = "progress title";
      const arg: unknown = { query: undefined, ups: { isShow: true } };
      commandsMock.expects("getAvailableServices").withExactArgs(arg, title).resolves();
      await cfViewCommands.cmdGetSpaceServices(undefined, title);
    });
  });

  describe("cmdGetServiceInstances scope", () => {
    const title = "progress title - retrieve hana services";

    it("ok:: retrieve all services", async () => {
      const expServices: ServiceInstanceInfo[] = [
        { label: "s1", serviceName: "hana" },
        { label: "s2", serviceName: "hana" },
        { label: "s2", serviceName: "hanatrial" },
      ];
      commandsMock.expects("getServiceInstances").withExactArgs(undefined, title).resolves(expServices);
      expect(await cfViewCommands.cmdGetServiceInstances(undefined, title)).to.deep.equal(expServices);
    });

    it("ok:: retrieve 'hana 'services types with 'hdi-shared' plan", async () => {
      const rspServices: ServiceInstanceInfo[] = [
        { label: "s1", serviceName: "hana", plan: "hdi-shared" },
        { label: "s2", serviceName: "hana", plan: "hdi-shared" },
      ];
      const serviceQueryOptions: ServiceQueryOptions = { name: "hana", plan: "hdi-shared" };
      const plans: PlanInfo[] = [
        { label: "hdi-shared", guid: "ABCD", description: "" },
        { label: "lite", guid: "EFGH", description: "" },
      ];
      const serviceInstanceQuery = {
        filters: [{ key: eFilters.service_plan_names, value: serviceQueryOptions.plan }],
        per_page: CF_PAGE_SIZE,
      };
      commandsMock
        .expects("fetchServicePlanList")
        .withExactArgs({ filters: [{ key: eFilters.service_offering_names, value: serviceQueryOptions.name }] })
        .resolves(plans);
      serviceInstanceQuery.filters = _.concat(serviceInstanceQuery.filters, [
        { key: eFilters.service_plan_guids, value: _.join(_.map(plans, "guid")) },
      ]);
      commandsMock.expects("getServiceInstances").withExactArgs(serviceInstanceQuery, title).resolves(rspServices);
      await cfViewCommands.cmdGetServiceInstances(serviceQueryOptions, title);
    });

    it("ok:: retrieve all services when service types and plan are missing", async () => {
      const expServices: ServiceInstanceInfo[] = [
        { label: "s1", serviceName: "hana" },
        { label: "s2", serviceName: "hana" },
        { label: "s2", serviceName: "hanatrial" },
      ];
      const serviceQueryOptions: ServiceQueryOptions = {};
      commandsMock.expects("getServiceInstances").withExactArgs(undefined, title).resolves(expServices);
      await cfViewCommands.cmdGetServiceInstances(serviceQueryOptions, title);
    });
  });

  describe("cmdGetUpsServiceInstances scope", () => {
    const title = "progress title - retrieve all services";

    it("ok:: verify calling 'getUserProvidedServiceInstances' happens with specified args", async () => {
      const options: UpsServiceQueryOprions = { tag: "tags", credentials: { tag: "hana" } };
      commandsMock.expects("getUserProvidedServiceInstances").withExactArgs(options, title).resolves();
      await cfViewCommands.cmdGetUpsServiceInstances(options, title);
    });
  });

  describe("cmdBindLocal scope", () => {
    const path = nsVsMock.testVscode.Uri.file("some/path");
    const service: ServiceTypeInfo[] = [{ name: "", plan: "hdi-shared", prompt: "", tag: "" }];
    let origin: unknown;
    const plans: PlanInfo[] = [
      { label: "hdi-shared", guid: "ABCD", description: "" },
      { label: "hana", guid: "EFGH", description: "" },
    ];
    const services: ServiceInstanceInfo[] = [
      { serviceName: "type1", label: "service1" },
      { serviceName: "type2", label: "service2" },
    ];
    const opts: DisplayServices = {
      query: { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE },
      ups: _.get(service, ["0", "ups"]),
    };

    before(() => {
      origin = commands.updateInstanceNameAndTags;
    });

    beforeEach(() => {
      _.set(
        commands,
        "updateInstanceNameAndTags",
        (availableServices: ServiceInstanceInfo[], serviceTypeInfo: ServiceTypeInfo[], instanceNames: string[]) => {
          instanceNames.push(services[0].label);
          return Promise.resolve(instanceNames[0]);
        }
      );
    });

    afterEach(() => {
      _.set(commands, "updateInstanceNameAndTags", origin);
    });

    it("ok:: select path canceled", async () => {
      const emptyPath = nsVsMock.testVscode.Uri.file("");
      vscodeWindowMock
        .expects("showOpenDialog")
        .withExactArgs({
          openLabel: "Select folder for .env file",
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          defaultUri: nsVsMock.testVscode.workspace.workspaceFolders[0].uri,
        })
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, emptyPath)).to.be.undefined;
    });

    it("ok:: path selected, service is CFService type, quote-vcap is false", async () => {
      const emptyPath = nsVsMock.testVscode.Uri.file("");
      sandbox.stub(nsVsMock.testVscode.workspace, "workspaceFolders").value(undefined);
      vscodeWindowMock
        .expects("showOpenDialog")
        .withExactArgs({
          openLabel: "Select folder for .env file",
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          defaultUri: nsVsMock.testVscode.workspace.workspaceFolders,
        })
        .resolves([{ fsPath: `other${fspath.sep}path` }]);
      const otherService = { contextValue: "cf-service", label: "my-service" };
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(otherService.label))
        .resolves();
      const stubWithProgress = sandbox.stub(nsVsMock.testVscode.window, "withProgress");
      expect(
        await cfViewCommands.cmdBindLocal(
          (otherService as unknown) as cfView.CFService,
          {
            path: emptyPath,
            ignore: true,
          },
          undefined,
          { "quote-vcap": false }
        )
      ).deep.equal({ instanceName: otherService.label });

      cfLocalMock
        .expects("cfBindLocalServices")
        .withExactArgs(
          `other${fspath.sep}path${fspath.sep}.env`,
          [otherService.label],
          undefined,
          undefined,
          undefined,
          false
        )
        .resolves();
      expect(stubWithProgress.calledOnce).to.be.true;
      expect(stubWithProgress.args[0].length).to.be.equal(2);
      expect(stubWithProgress.args[0][0]).to.be.deep.equal({
        location: nsVsMock.testVscode.ProgressLocation.Notification,
        title: messages.binding_service_to_file,
        cancellable: false,
      });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      expect(await stubWithProgress.args[0][1]({} as any, {} as any)).to.be.undefined;
    });

    it("ok:: path selected, service is CFService type", async () => {
      const emptyPath = nsVsMock.testVscode.Uri.file("");
      sandbox.stub(nsVsMock.testVscode.workspace, "workspaceFolders").value(undefined);
      vscodeWindowMock
        .expects("showOpenDialog")
        .withExactArgs({
          openLabel: "Select folder for .env file",
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          defaultUri: nsVsMock.testVscode.workspace.workspaceFolders,
        })
        .resolves([{ fsPath: `other${fspath.sep}path` }]);
      const otherService = { contextValue: "cf-service", label: "my-service" };
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(otherService.label))
        .resolves();
      const stubWithProgress = sandbox.stub(nsVsMock.testVscode.window, "withProgress");
      expect(
        await cfViewCommands.cmdBindLocal((otherService as unknown) as cfView.CFService, {
          path: emptyPath,
          ignore: true,
        })
      ).deep.equal({ instanceName: otherService.label });

      cfLocalMock
        .expects("cfBindLocalServices")
        .withExactArgs(
          `other${fspath.sep}path${fspath.sep}.env`,
          [otherService.label],
          undefined,
          undefined,
          undefined,
          undefined
        )
        .resolves();
      expect(stubWithProgress.calledOnce).to.be.true;
      expect(stubWithProgress.args[0].length).to.be.equal(2);
      expect(stubWithProgress.args[0][0]).to.be.deep.equal({
        location: nsVsMock.testVscode.ProgressLocation.Notification,
        title: messages.binding_service_to_file,
        cancellable: false,
      });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      expect(await stubWithProgress.args[0][1]({} as any, {} as any)).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, no services found", async () => {
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.no_services_instances_found).resolves();
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves([]);
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, no services found, creation allowed", async () => {
      const cloneService = _.merge(_.cloneDeep(service[0]), { allowCreate: { name: "create" } });
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves([]);
      commandsMock
        .expects("updateInstanceNameAndTags")
        .withExactArgs(
          [
            {
              label: commands.CMD_BIND_TO_DEFAULT_SERVICE + cloneService.allowCreate.name,
              plan: cloneService.allowCreate.plan,
              serviceName: cloneService.allowCreate.serviceName ?? "",
            },
            {
              label: commands.CMD_CREATE_SERVICE,
              serviceName: "",
            },
          ],
          cloneService,
          [],
          []
        )
        .resolves(undefined);
      expect(await cfViewCommands.cmdBindLocal([cloneService], { path, ignore: true })).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, services found, canceled", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      _.set(commands, "updateInstanceNameAndTags", () => {
        return Promise.resolve();
      });
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, services found, type selected", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).deep.equal({
        instanceName: services[0].label,
      });
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, services found, required specific service", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("updateInstanceNameAndTags").never();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true }, services[0].label)).deep.equal({
        instanceName: services[0].label,
      });
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, services found, required service not found", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("updateInstanceNameAndTags").never();
      cfLocalMock.expects("cfGetInstanceMetadata").withExactArgs("not-existed").rejects(new Error("not found"));
      vscodeWindowMock
        .expects("showErrorMessage")
        .withArgs(messages.no_services_instance_byname_found("not-existed"))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true }, "not-existed")).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, service not in list but found via direct lookup (CF eventual consistency)", async () => {
      // Simulate CF list API returning stale results: services[0] missing, only services[1] present
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves([services[1]]);
      commandsMock.expects("updateInstanceNameAndTags").never();
      cfLocalMock
        .expects("cfGetInstanceMetadata")
        .withExactArgs(services[0].label)
        .resolves({ serviceName: services[0].label, service: service[0].plan, plan_guid: "GUID" });
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true }, services[0].label)).deep.equal({
        instanceName: services[0].label,
      });
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no services, services found, ups selected, quote-vcap is true", async () => {
      service[0].plan = "";
      service[0].ups = { isShow: true };
      opts.query = undefined;
      opts.ups = service[0].ups;
      const services: ServiceInstanceInfo[] = [
        { serviceName: eServiceTypes.user_provided, label: "ups1" },
        { serviceName: eServiceTypes.user_provided, label: "ups2" },
      ];
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      _.set(
        commands,
        "updateInstanceNameAndTags",
        (availableServices: ServiceInstanceInfo[], serviceTypeInfo: ServiceTypeInfo[], instanceNames: string[]) => {
          instanceNames.push(services[0].label);
          return Promise.resolve(instanceNames[0]);
        }
      );
      const stubWithProgress = sandbox.stub(nsVsMock.testVscode.window, "withProgress");
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      expect(
        await cfViewCommands.cmdBindLocal(service, { path, ignore: true }, undefined, { "quote-vcap": true })
      ).deep.equal({
        instanceName: services[0].label,
      });

      cfLocalMock.expects("cfBindLocalUps").withExactArgs("some/path", [services[0].label], [], true).resolves();
      expect(stubWithProgress.calledOnce).to.be.true;
      expect(stubWithProgress.args[0].length).to.be.equal(2);
      expect(stubWithProgress.args[0][0]).to.be.deep.equal({
        location: nsVsMock.testVscode.ProgressLocation.Notification,
        title: messages.binding_service_to_file,
        cancellable: false,
      });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      expect(await stubWithProgress.args[0][1]({} as any, {} as any)).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no services, services found, ups selected", async () => {
      service[0].plan = "";
      service[0].ups = { isShow: true };
      opts.query = undefined;
      opts.ups = service[0].ups;
      const services: ServiceInstanceInfo[] = [
        { serviceName: eServiceTypes.user_provided, label: "ups1" },
        { serviceName: eServiceTypes.user_provided, label: "ups2" },
      ];
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      _.set(
        commands,
        "updateInstanceNameAndTags",
        (availableServices: ServiceInstanceInfo[], serviceTypeInfo: ServiceTypeInfo[], instanceNames: string[]) => {
          instanceNames.push(services[0].label);
          return Promise.resolve(instanceNames[0]);
        }
      );
      const stubWithProgress = sandbox.stub(nsVsMock.testVscode.window, "withProgress");
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).deep.equal({
        instanceName: services[0].label,
      });

      cfLocalMock.expects("cfBindLocalUps").withExactArgs("some/path", [services[0].label], [], undefined).resolves();
      expect(stubWithProgress.calledOnce).to.be.true;
      expect(stubWithProgress.args[0].length).to.be.equal(2);
      expect(stubWithProgress.args[0][0]).to.be.deep.equal({
        location: nsVsMock.testVscode.ProgressLocation.Notification,
        title: messages.binding_service_to_file,
        cancellable: false,
      });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      expect(await stubWithProgress.args[0][1]({} as any, {} as any)).to.be.undefined;
    });

    it("ok:: path selected, service is not ServiceTypeInfo type, no ups, services found, type selected", async () => {
      service[0].plan = plans[0].label;
      delete (service[0] as any).name;
      opts.query = { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE };
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("getInstanceName").withExactArgs(services).resolves(services[0].label);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).deep.equal({
        instanceName: services[0].label,
      });
    });

    it("ok:: path selected, service is not ServiceTypeInfo type, no ups, services found, type selection canceled", async () => {
      service[0].plan = plans[0].label;
      delete (service[0] as any).name;
      opts.query = { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE };
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("getInstanceName").withExactArgs(services).resolves();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .never();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).to.be.undefined;
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, services found, selected new", async () => {
      service[0].plan = plans[0].label;
      service[0].name = "";
      opts.query = { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE };
      const newService = "my-service";
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      _.set(
        commands,
        "updateInstanceNameAndTags",
        (availableServices: ServiceInstanceInfo[], serviceTypeInfo: ServiceTypeInfo[], instanceNames: string[]) => {
          instanceNames.push(newService);
          return Promise.resolve(instanceNames[0]);
        }
      );
      cfLocalMock
        .expects("cfGetInstanceMetadata")
        .withExactArgs(newService)
        .resolves({ serviceName: newService, service: service[0].plan, plan_guid: "GUID" });
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(newService))
        .resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).deep.equal({
        instanceName: newService,
      });
    });

    it("ok:: path selected, service is ServiceTypeInfo type, no ups, services found, create allowed", async () => {
      service[0].plan = plans[0].label;
      service[0].name = "";
      service[0].allowCreate = {};
      opts.query = { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE };
      let expectedServicesList;
      let servicePlans;
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      _.set(
        commands,
        "updateInstanceNameAndTags",
        (availableServices: ServiceInstanceInfo[], serviceTypeInfo: ServiceTypeInfo[]) => {
          expectedServicesList = availableServices;
          servicePlans = _.get(serviceTypeInfo, "plans");
          return Promise.resolve();
        }
      );
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).to.be.undefined;
      expect(_.has(_.find(expectedServicesList, ["label", commands.CMD_CREATE_SERVICE]), "serviceName")).to.be.true;
      expect(servicePlans).to.be.undefined;
    });

    it("ok:: return chisel task", async () => {
      opts.query = { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE };
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[0].label))
        .resolves();
      const chiselTask = {
        label: `openChiselTunnerFor-${services[0].label}`,
        type: "shell",
        command: "chisel",
        isBackground: true,
        problemMatcher: "$chisel-client",
        args: ["client", "--auth"],
      };
      chiselMock.expects("checkAndCreateChiselTask").withExactArgs(path.fsPath, services[0].label).resolves(chiselTask);
      chiselMock.expects("deleteChiselParamsFromFile").withExactArgs(path.fsPath).resolves();
      expect(await cfViewCommands.cmdBindLocal(service, { path, ignore: true })).deep.equal({
        instanceName: services[0].label,
        chiselTask: chiselTask,
      });
    });
  });

  describe("bindLocalService scope", () => {
    let origin: unknown;
    const services: ServiceInstanceInfo[] = [
      { serviceName: "hdi-shared", label: "label1" },
      { serviceName: "hdi-shared", label: "label2" },
    ];
    const plans: PlanInfo[] = [
      { label: "hdi-shared", guid: "ABCD", description: "" },
      { label: "hana", guid: "EFGH", description: "" },
    ];
    before(() => {
      origin = commands.updateInstanceNameAndTags;
    });

    beforeEach(() => {
      _.set(
        commands,
        "updateInstanceNameAndTags",
        (availableServices: ServiceInstanceInfo[], serviceTypeInfo: ServiceTypeInfo[], instanceNames: string[]) => {
          instanceNames.push(services[1].label);
          return Promise.resolve(instanceNames[0]);
        }
      );
    });

    afterEach(() => {
      _.set(commands, "updateInstanceNameAndTags", origin);
    });

    const service: ServiceTypeInfo[] = [{ name: "", plan: "hdi-shared", prompt: "", tag: "" }];
    const opts: DisplayServices = {
      query: { filters: [{ key: eFilters.service_plan_names, value: service[0].plan }], per_page: CF_PAGE_SIZE },
    };
    const envPath = nsVsMock.testVscode.Uri.file("root/folder");

    it("ok:: path is empty", async () => {
      const path = nsVsMock.testVscode.Uri.file("");
      expect(await cfViewCommands.bindLocalService(service, { path, ignore: true })).to.be.empty;
    });

    it("ok:: path defined, plan required, no service selected", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      _.set(commands, "updateInstanceNameAndTags", () => {
        return Promise.resolve([]);
      });
      expect(await cfViewCommands.bindLocalService(service, { path: envPath, ignore: true })).to.be.undefined;
    });

    it("ok:: path defined, plan required, service selected", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[1].label))
        .resolves();
      assert.deepEqual(await cfViewCommands.bindLocalService(service, { path: envPath, ignore: true }), [
        services[1].label,
      ]);
    });

    it("ok:: path defined, plan required, service selected, silent mode required", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[1].label))
        .never();
      assert.deepEqual(
        await cfViewCommands.bindLocalService(service, { path: envPath, ignore: true }, { silent: true }),
        [services[1].label]
      );
    });

    it("ok:: serviceInfo is not array, service selected", async () => {
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(undefined);
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("getInstanceName").withExactArgs(services).resolves(services[1].label);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .resolves();
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_bound_successful(services[1].label))
        .resolves();
      delete (service[0] as any).name;
      assert.deepEqual(await cfViewCommands.bindLocalService(service, envPath), [services[1].label]);
    });

    it("ok:: serviceInfo is not array, select service canceled", async () => {
      const service: ServiceTypeInfo[] = [{ name: "", plan: "hdi-shared", prompt: "", tag: "" }];
      delete (service[0] as any).name;
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("getInstanceName").withExactArgs(services).resolves();
      expect(await cfViewCommands.bindLocalService(service, envPath)).to.be.undefined;
    });

    it("ok:: serviceInfo is array, no services found", async () => {
      service[0].name = "";
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves([]);
      vscodeWindowMock.expects("withProgress").never();
      expect(await cfViewCommands.bindLocalService(service, { path: envPath, ignore: true })).to.be.empty;
    });

    it("ok:: serviceInfo is array, no services found, plan is not provided", async () => {
      const copyService: ServiceTypeInfo[] = [{ name: "", plan: "", prompt: "", tag: "" }];
      const opts: DisplayServices = { query: undefined };
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves([]);
      expect(await cfViewCommands.bindLocalService(copyService, { path: envPath, ignore: true })).to.be.empty;
    });

    it("show error:: serviceInfo is not array, service selected, doBind rejected", async () => {
      commandsMock.expects("getAvailableServices").withExactArgs(opts).resolves(services);
      commandsMock.expects("getInstanceName").withExactArgs(services).resolves(services[1].label);
      const error = new Error("error");
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.binding_service_to_file,
          cancellable: false,
        })
        .rejects(error);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message).resolves();
      delete (service[0] as any).name;
      await cfViewCommands.bindLocalService(service, envPath);
    });

    it("ok:: serviceInfo is array, service name required, no services found", async () => {
      service[0].plan = "";
      service[0].name = " hana , xsuaa ";
      commandsMock
        .expects("fetchServicePlanList")
        .withExactArgs(_.cloneDeep({ filters: [{ key: eFilters.service_offering_names, value: "hana,xsuaa" }] }))
        .resolves(plans);
      const query: IServiceQuery = {
        filters: [{ key: eFilters.service_plan_guids, value: _.join(_.map(plans, "guid")) }],
        per_page: CF_PAGE_SIZE,
      };
      commandsMock.expects("getAvailableServices").withExactArgs({ query }).resolves(services);
      assert.deepEqual(await cfViewCommands.bindLocalService(service, { path: envPath, ignore: true }), [
        services[1].label,
      ]);
    });

    it("ok:: serviceInfo is array, service name - ups only requested, no services found", async () => {
      service[0].plan = "";
      service[0].name = eServiceTypes.user_provided;
      const upsServices: ServiceInstanceInfo[] = [
        { serviceName: eServiceTypes.user_provided, label: "label1" },
        { serviceName: eServiceTypes.user_provided, label: "label2" },
      ];
      const query: IServiceQuery = {
        filters: [{ key: eFilters.service_plan_names, value: "nothing-to-show" }],
        per_page: CF_PAGE_SIZE,
      };
      commandsMock.expects("getAvailableServices").withExactArgs({ query }).resolves(upsServices);
      assert.deepEqual(await cfViewCommands.bindLocalService(service, { path: envPath, ignore: true }), [
        services[1].label,
      ]);
    });
  });
});
