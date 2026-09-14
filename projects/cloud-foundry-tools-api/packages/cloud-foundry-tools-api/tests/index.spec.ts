import { expect, assert } from "chai";
import * as index from "../src/index";
import * as serviceUtils from "../src/cfServicesUtil";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";

describe("index package test", () => {
  let sandbox: SinonSandbox;
  let mockServiceUtils: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    mockServiceUtils = sandbox.mock(serviceUtils);
  });

  afterEach(() => {
    mockServiceUtils.verify();
  });

  it("types", () => {
    expect(index.OK).to.be.equal("OK");
  });

  it("apiGetServicesInstancesFilteredByType:: verify calling the 'getServicesInstancesFilteredByType'", async () => {
    const serviceTypes = ["type1", "type2"];
    const services = [
      { guid: "g1", label: "s1", serviceName: `${serviceTypes[0]}` },
      { guid: "g2", label: "s2", serviceName: `${serviceTypes[1]}` },
    ];
    mockServiceUtils.expects("getServicesInstancesFilteredByType").withExactArgs(serviceTypes).resolves(services);
    assert.deepEqual(await index.apiGetServicesInstancesFilteredByType(serviceTypes), services);
  });

  it("apiGetInstanceCredentials:: verify calling the 'getInstanceCredentials'", async () => {
    const name = "myInstance";
    const serviceKey = {
      binding: {
        env: "env",
        id: "id",
        type: "type",
        version: "v0.0.1",
      },
      catalogs: { data: "some data" },
      endpoints: {},
      preserve_host_header: false,
      "sap.cloud.service": "service",
      systemid: "systemid",
      uaa: {
        apiurl: "",
        clientid: "",
        clientsecret: "",
        identityzone: "",
        identityzoneid: "",
        sburl: "",
        tenantid: "",
        tenantmode: "",
        uaadomain: "",
        url: "",
        verificationkey: "",
        xsappname: "",
      },
      url: "url",
    };
    mockServiceUtils.expects("getInstanceCredentials").withExactArgs(name).resolves(serviceKey);
    assert.deepEqual(await index.apiGetInstanceCredentials(name), serviceKey);
  });

  it("apiCreateServiceInstance:: verify calling the 'createServiceInstance'", async () => {
    const serviceType = "type1";
    const servicePlan = "plan";
    const instanceName = "name";
    const config = { some: {} };
    const result = { data: {} };
    mockServiceUtils
      .expects("createServiceInstance")
      .withExactArgs(serviceType, servicePlan, instanceName, config)
      .resolves(result);
    assert.deepEqual(await index.apiCreateServiceInstance(serviceType, servicePlan, instanceName, config), result);
  });

  it("apiCreateServiceInstance:: verify calling the 'getInstanceMetadata'", async () => {
    const instanceName = "name";
    const result = { data: {} };
    mockServiceUtils.expects("getInstanceMetadata").withExactArgs(instanceName).resolves(result);
    assert.deepEqual(await index.apiGetInstanceMetadata(instanceName), result);
  });
});
