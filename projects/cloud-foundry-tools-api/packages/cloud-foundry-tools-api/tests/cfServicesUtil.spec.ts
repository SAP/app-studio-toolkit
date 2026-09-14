import * as _ from "lodash";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import * as cfLocal from "../src/cf-local";
import { ITarget, ServiceInstanceInfo, eFilters, PlanInfo } from "../src/types";
import * as cli from "../src/cli";
import {
  getInstanceMetadata,
  isTargetSet,
  getInstanceCredentials,
  createServiceInstance,
  getServicesInstancesFilteredByType,
} from "../src/cfServicesUtil";
import { expect, assert } from "chai";
import { fail } from "assert";

describe("services unit package tests", () => {
  let sandbox: SinonSandbox;
  let mockCfLocal: SinonMock;
  let mockCli: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    mockCfLocal = sandbox.mock(cfLocal);
    mockCli = sandbox.mock(cli.Cli);
  });

  afterEach(() => {
    mockCfLocal.verify();
    mockCli.verify();
  });

  describe("getServicesInstancesFilteredByType", () => {
    const types = ["saas-registry", "audolog"];
    const plans: PlanInfo[] = [
      {
        description: "description1",
        guid: "one-e1a8-15f7-828a-24be6173db7b",
        label: "plan-1",
        service_offering: {
          description: "service description",
          guid: "service-guid-1",
          name: types[0],
        },
      },
      {
        description: "description2",
        guid: "other-e1a8-15f7-828a-24be6173db7b",
        label: "plan-2",
        service_offering: {
          description: "service description",
          guid: "service-guid-2",
          name: types[1],
        },
      },
    ];
    const instances: ServiceInstanceInfo[] = [
      { guid: "guid1", label: "label1", serviceName: types[1] },
      { guid: "guid3", label: "label3", serviceName: types[0] },
    ];
    const query = {
      filters: [{ key: eFilters.service_offering_names, value: _.join(_.map(types, encodeURIComponent)) }],
    };

    it("ok:: verify query parameters", async () => {
      mockCfLocal.expects("cfGetServicePlansList").withExactArgs(query).resolves(plans);
      const servicesQuery = {
        filters: [
          {
            key: eFilters.service_plan_guids,
            value: _.join(_.map(plans, "guid")),
          },
        ],
      };
      mockCfLocal.expects("cfGetManagedServiceInstances").withExactArgs(servicesQuery).resolves(instances);
      const filteredServicesInstances = await getServicesInstancesFilteredByType(types);
      assert.deepEqual(_.map(filteredServicesInstances, "label"), [instances[0].label, instances[1].label]);
      assert.deepEqual(_.map(filteredServicesInstances, "guid"), [instances[0].guid, instances[1].guid]);
    });

    it("ok:: nothing match requested services", async () => {
      const query = { filters: [{ key: eFilters.service_offering_names, value: encodeURIComponent("my type") }] };
      mockCfLocal.expects("cfGetServicePlansList").withExactArgs(query).resolves(undefined);
      expect(_.size(await getServicesInstancesFilteredByType(["my type"]))).to.be.equal(0);
    });

    it("ok:: undefined services requested", async () => {
      const query = {
        filters: [{ key: eFilters.service_offering_names, value: _.join(_.map(null, encodeURIComponent)) }],
      };
      mockCfLocal.expects("cfGetServicePlansList").withExactArgs(query).resolves([]);
      expect(_.size(await getServicesInstancesFilteredByType(null))).to.be.equal(0);
    });

    it("exception:: cfGetManagedServiceInstances throws error", async () => {
      mockCfLocal.expects("cfGetServicePlansList").withExactArgs(query).resolves(plans);
      const error = new Error("cfGetManagedServiceInstances failed");
      mockCfLocal.expects("cfGetManagedServiceInstances").throws(error);
      try {
        await getServicesInstancesFilteredByType(types);
        fail("should fail");
      } catch (e) {
        expect(e.message).to.be.equal(error.message);
      }
    });
  });

  describe("getInstanceMetadata", () => {
    it("ok", async () => {
      const name = "someInstance";
      mockCfLocal.expects("cfGetInstanceMetadata").withExactArgs(name).resolves();
      await getInstanceMetadata(name);
    });

    it("undefined requested name", async () => {
      const name: string = null;
      mockCfLocal.expects("cfGetInstanceMetadata").withExactArgs(name).resolves();
      await getInstanceMetadata(name);
    });

    it("thrown exception", async () => {
      const error = new Error("cfGetInstanceMetadata failed");
      mockCfLocal.expects("cfGetInstanceMetadata").throws(error);
      try {
        await getInstanceMetadata("filter");
        fail("should fail");
      } catch (e) {
        expect(e.message).to.be.equal(error.message);
      }
    });
  });

  describe("isTargetSet", () => {
    const result: ITarget = {
      "api endpoint": "endPoint",
      "api version": "v. 2.01",
      user: "bag023",
    };

    it("setted up target", async () => {
      result.org = "org";
      result.space = "space";
      mockCfLocal.expects("cfGetTarget").resolves(result);
      expect(await isTargetSet()).to.be.equal(true);
    });

    it("space set, org - not", async () => {
      result.org = "";
      result.space = "space";
      mockCfLocal.expects("cfGetTarget").resolves(result);
      expect(await isTargetSet()).to.be.equal(false);
    });

    it("space - not set, org - set", async () => {
      result.org = "org";
      result.space = undefined;
      mockCfLocal.expects("cfGetTarget").resolves(result);
      expect(await isTargetSet()).to.be.equal(false);
    });

    it("thrown exception", async () => {
      const error = new Error("cfGetTarget failed");
      mockCfLocal.expects("cfGetTarget").throws(error);
      try {
        await isTargetSet();
        fail("should fail");
      } catch (e) {
        expect(e.message).to.be.equal(error.message);
      }
    });
  });

  describe("getInstanceCredentials", () => {
    it("ok:: verify call cfGetInstanceKeyParameters", async () => {
      const requestedName = "cf-my-instance";
      mockCfLocal.expects("cfGetInstanceKeyParameters").withExactArgs(requestedName).resolves();
      await getInstanceCredentials(requestedName);
    });
  });

  describe("createServiceInstance", () => {
    const type = "serviceType";
    const instanceName = "instanceName";
    const plan = "servicePlan";
    const config = { data: "some" };

    it("ok", async () => {
      mockCli
        .expects("execute")
        .withExactArgs(["create-service", type, plan, instanceName, "-c", config, "--wait"])
        .resolves();
      await createServiceInstance(type, plan, instanceName, config);
    });

    it("ok, no '--wait'", async () => {
      mockCli.expects("execute").withExactArgs(["create-service", type, plan, instanceName, "-c", config]).resolves();
      await createServiceInstance(type, plan, instanceName, config, true);
    });

    it("ok - without config", async () => {
      mockCli.expects("execute").withExactArgs(["create-service", type, plan, instanceName, "--wait"]).resolves();
      await createServiceInstance(type, plan, instanceName);
    });
  });
});
