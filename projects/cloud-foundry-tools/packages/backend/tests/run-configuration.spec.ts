import { expect, assert } from "chai";
import * as _ from "lodash";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";

mockVscode(nsVsMock.testVscode, "src/run-configuration.ts");
import * as cfViewCommands from "../src/cfViewCommands";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import * as chisel from "../src/chisel";
import { DependencyHandler } from "../src/run-configuration";
import * as utils from "../src/utils";
import { IBindContext, ConfigurationTarget, ConfigMetadata, BindState } from "@sap/wing-run-config-types";
import { messages } from "../src/messages";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";

describe("run-configuration tests package", () => {
  let sandbox: SinonSandbox;
  let vscodeWindowMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
  });

  afterEach(() => {
    vscodeWindowMock.verify();
    sandbox.restore();
  });

  describe("DependencyHandler scope", () => {
    const instances = ["testInstance"];
    const bindContext: IBindContext = {
      runnableId: "",
      configData: {
        config: {
          data: ConfigMetadata.get(ConfigurationTarget.launch),
        },
      },
      envPath: nsVsMock.testVscode.Uri.file("envPath"),
      depContext: {
        type: "hdi_type",
        displayName: "",
        bindable: true,
        displayType: "dysplayType",
        dependencyHandlerId: "dependencyHandlerId",
        data: {
          resourceTag: "res-tag",
          resourceName: "res-name",
        },
      },
    };

    it("ok:: constructor", () => {
      const id = "test.Handler.id";
      expect(new DependencyHandler(id).getId()).to.be.equal(id);
    });

    it("ok:: 'getBindState' - cloud type", async () => {
      const getEnvResourcesResult = {
        vcapObject: {
          hdi_type: BindState.cloud,
        },
        isQuotedVcap: false,
      };
      sandbox.stub(utils, "getEnvResources").withArgs(bindContext.envPath.fsPath).resolves(getEnvResourcesResult);
      expect(await new DependencyHandler("test.Handler.id").getBindState(bindContext)).to.be.equal(BindState.cloud);
    });

    it("ok:: 'getBindState' - not defined", async () => {
      const getEnvResourcesResult = {
        vcapObject: {
          type: BindState.cloud,
        },
        isQuotedVcap: false,
      };
      sandbox.stub(utils, "getEnvResources").withArgs(bindContext.envPath.fsPath).resolves(getEnvResourcesResult);
      expect(await new DependencyHandler("test.Handler.id").getBindState(bindContext)).to.be.equal(BindState.notbound);
    });

    it("ok:: 'getBindState' - exception error, resolved to not bound", async () => {
      const error = new Error("some error");
      sandbox.stub(utils, "getEnvResources").withArgs(bindContext.envPath.fsPath).throws(error);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message).resolves();
      expect(await new DependencyHandler("test.Handler.id").getBindState(bindContext)).to.be.equal(BindState.notbound);
    });

    it("ok:: 'bind' - no instance", async () => {
      sandbox.stub(cfViewCommands, "bindLocalService").resolves([]);
      expect(await new DependencyHandler("test.Handler.id").bind(bindContext)).to.be.equal(undefined);
    });

    it("ok:: 'bind' - exception", async () => {
      const error = new Error("my error");
      sandbox.stub(cfViewCommands, "bindLocalService").rejects(error);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message).resolves();
      expect(await new DependencyHandler("test.Handler.id").bind(bindContext)).to.be.equal(undefined);
    });

    it("ok:: 'bind' succeedded", async () => {
      sandbox.stub(cfViewCommands, "bindLocalService").resolves(["testInstance"]);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "resourceType" });

      expect(await new DependencyHandler("test.Handler.id").bind(bindContext)).to.be.deep.equal({
        configData: bindContext.configData,
        resource: { name: "testInstance", type: "resourceType" },
      });
    });

    it("ok:: 'bind' - with tag", async () => {
      const resourceTag: string = _.get(bindContext, "depContext.data.resourceTag");
      const resourceName: string = _.get(bindContext, "depContext.data.resourceName");
      const serviceType = [
        {
          name: bindContext.depContext.type,
          plan: _.get(bindContext.depContext, ["data", "plan"], ""),
          tag: resourceTag ? resourceTag + resourceName : "",
          prompt: "",
        },
      ];
      sandbox
        .stub(cfViewCommands, "bindLocalService")
        .withArgs(serviceType, bindContext.envPath)
        .resolves(["testInstance"]);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "resourceType" });

      expect(await new DependencyHandler("test.Handler.id").bind(bindContext)).to.be.deep.equal({
        configData: bindContext.configData,
        resource: { name: "testInstance", type: "resourceType" },
      });
    });

    it("ok:: 'bind' - no tag", async () => {
      const serviceType = [
        {
          name: bindContext.depContext.type,
          plan: _.get(bindContext.depContext, ["data", "plan"], ""),
          tag: "",
          prompt: "",
        },
      ];
      const copyContext = _.cloneDeep(bindContext);
      copyContext.depContext.data = {};
      sandbox
        .stub(cfViewCommands, "bindLocalService")
        .withArgs(serviceType, bindContext.envPath)
        .resolves(["testInstance"]);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "resourceType" });

      expect(await new DependencyHandler("test.Handler.id").bind(copyContext)).to.be.deep.equal({
        configData: copyContext.configData,
        resource: { name: "testInstance", type: "resourceType" },
      });
    });

    it("ok:: 'bind' - create chisel task - return undefined", async () => {
      sandbox
        .stub(chisel, "checkAndCreateChiselTask")
        .withArgs(bindContext.envPath.fsPath, instances.join("&"))
        .resolves(undefined);
      sandbox.stub(cfViewCommands, "bindLocalService").resolves(instances);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "resourceType" });

      const copyContext = _.cloneDeep(bindContext);
      copyContext.depContext.data = { isCreateChiselTask: true };
      expect(await new DependencyHandler("test.Handler.id").bind(copyContext)).to.be.deep.equal({
        configData: copyContext.configData,
        resource: { name: "testInstance", type: "resourceType" },
      });
    });

    it("ok:: 'bind' - create chisel task - no depended tasks", async () => {
      const chiselTask = { label: "chiselLabel", data: { context: "some" } };
      sandbox
        .stub(chisel, "checkAndCreateChiselTask")
        .withArgs(_.get(bindContext, "envPath.fsPath") as string, instances.join("&"))
        .resolves(chiselTask);
      sandbox.stub(cfViewCommands, "bindLocalService").resolves(instances);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "ahana" });
      const copyContext = _.cloneDeep(bindContext);
      copyContext.depContext.data = { isCreateChiselTask: true };

      copyContext.configData.dependentTasks = undefined;
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(
          `A task for opening the VPN tunnel to the Cloud Foundry space has been created. Name: '${chiselTask.label}'`
        )
        .resolves();
      expect(
        await new DependencyHandler("test.Handler.id").bind(copyContext, { "skip-reload": false })
      ).to.be.deep.equal({
        configData: copyContext.configData,
        resource: {
          name: "testInstance",
          type: "ahana",
          data: { chiselTask },
        },
      });
    });

    it("ok:: 'bind' - create chisel task - no depended tasks, create chisel task is not required explicitly", async () => {
      const chiselTask = { label: "chiselLabel", data: { context: "some" } };
      sandbox
        .stub(chisel, "checkAndCreateChiselTask")
        .withArgs(_.get(bindContext, "envPath.fsPath") as string, instances.join("&"))
        .resolves(chiselTask);
      sandbox.stub(cfViewCommands, "bindLocalService").resolves(instances);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "hanatrial" });
      const copyContext = _.cloneDeep(bindContext);

      copyContext.configData.dependentTasks = undefined;
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(
          `A task for opening the VPN tunnel to the Cloud Foundry space has been created. Name: '${chiselTask.label}'`
        )
        .resolves();
      expect(await new DependencyHandler("test.Handler.id").bind(copyContext)).to.be.deep.equal({
        configData: copyContext.configData,
        resource: {
          name: "testInstance",
          type: "hanatrial",
          data: { chiselTask },
        },
      });
    });

    it("ok:: 'bind' - create chisel task - no depended tasks, silent mode required", async () => {
      const chiselTask = { label: "chiselLabel", data: { context: "some" } };
      sandbox
        .stub(chisel, "checkAndCreateChiselTask")
        .withArgs(_.get(bindContext, "envPath.fsPath") as string, instances.join("&"))
        .resolves(chiselTask);
      sandbox.stub(cfViewCommands, "bindLocalService").resolves(instances);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "resourceType" });
      const copyContext = _.cloneDeep(bindContext);
      copyContext.depContext.data = { isCreateChiselTask: true };

      copyContext.configData.dependentTasks = undefined;
      vscodeWindowMock.expects("showInformationMessage").never();
      expect(await new DependencyHandler("test.Handler.id").bind(copyContext, { silent: true })).to.be.deep.equal({
        configData: copyContext.configData,
        resource: {
          name: "testInstance",
          type: "resourceType",
          data: { chiselTask },
        },
      });
    });

    it("ok:: 'bind' - create chisel task - depended tasks", async () => {
      const chiselLabel = "chiselLabel";
      const tsk = { name: "task" };
      const chiselJson = { label: chiselLabel, data: { context: "some" } };
      sandbox
        .stub(chisel, "checkAndCreateChiselTask")
        .withArgs(bindContext.envPath.fsPath, instances.join("&"))
        .resolves(chiselJson);
      sandbox.stub(cfViewCommands, "bindLocalService").resolves(instances);
      sandbox.stub(cfLocal, "cfGetInstanceMetadata").resolves({ serviceName: "testInstance", service: "resourceType" });
      const copyContext = _.cloneDeep(bindContext);
      copyContext.configData.config.data.envFile = undefined;
      copyContext.configData.dependentTasks = [tsk];
      copyContext.depContext.data = { isCreateChiselTask: true };

      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(
          `A task for opening the VPN tunnel to the Cloud Foundry space has been created. Name: '${chiselLabel}'`
        )
        .resolves();
      expect(await new DependencyHandler("test.Handler.id").bind(copyContext)).to.be.deep.equal({
        configData: copyContext.configData,
        resource: { name: "testInstance", type: "resourceType", data: { chiselTask: chiselJson } },
      });
      assert.deepEqual(copyContext.configData.dependentTasks, [tsk, chiselJson]);
    });

    it("ok:: 'unbind' succeddeed", async () => {
      const configurationData = { config: { data: {}, type: ConfigurationTarget.launch }, dependentTasks: [{}] };
      configurationData.dependentTasks = [];
      const property = { resourceName: "propName", envPath: "env Path", resourceData: { label: "resource-type" } };
      sandbox.stub(utils, "removeResourceFromEnv").resolves(property);
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_unbound_successful(property.resourceName))
        .resolves();
      assert.deepEqual(await new DependencyHandler("test.Handler.id").unbind(bindContext), {
        configData: configurationData,
        resource: { name: "propName", type: "resource-type", data: { label: "resource-type" } },
      });
    });

    it("ok:: 'unbind' - empty property", async () => {
      const configurationData = { config: { data: {}, type: ConfigurationTarget.launch }, dependentTasks: [{}] };
      configurationData.dependentTasks = [];
      const property = { resourceName: "", envPath: "", resourceData: {} };
      sandbox.stub(utils, "removeResourceFromEnv").resolves(property);
      vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.service_unbound_successful(_.get(property, "resourceName")))
        .resolves();
      assert.deepEqual(await new DependencyHandler("test.Handler.id").unbind(bindContext), {
        configData: configurationData,
        resource: { name: "", type: "", data: {} },
      });
    });

    it("ok:: 'unbind' - exception", async () => {
      const error = new Error("my error");
      sandbox.stub(utils, "removeResourceFromEnv").rejects(error);
      vscodeWindowMock.expects("showErrorMessage").withExactArgs(error.message).resolves();
      expect(await new DependencyHandler("test.Handler.id").unbind(bindContext)).to.be.equal(undefined);
    });
  });
});
