/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { expect, assert } from "chai";
import * as _ from "lodash";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import * as fs from "fs";
import * as cfLocal from "../src/cf-local";
import * as cli from "../src/cli";
import { fail } from "assert";
import { messages } from "../src/messages";
import {
  CliResult,
  CF_PAGE_SIZE,
  OK,
  eFilters,
  eOperation,
  eServiceTypes,
  CredentialsLoginOptions,
  SSOLoginOptions,
} from "../src/types";
import { cfGetConfigFilePath } from "../src/utils";

describe("cf-local-a unit tests", () => {
  let sandbox: SinonSandbox;
  let cliMock: SinonMock;
  let fsMock: SinonMock;
  const testEndpoint = `https://api.cf.sap.hana.ondemand.com`;
  const testUserEmail = "user@test.com";
  const testUserPassword = "userPassword";
  const testSSOPasscode = "ssoPasscode";

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    cliMock = sandbox.mock(cli.Cli);
    fsMock = sandbox.mock(fs.promises);
  });

  afterEach(() => {
    cliMock.verify();
    fsMock.verify();
    cfLocal.clearCacheServiceInstances();
  });

  describe("cfLogin scope", () => {
    const testOrigin = "test.ids";
    const testArgsCredentials = [
      "login",
      "-a",
      testEndpoint,
      "-u",
      testUserEmail,
      "-p",
      testUserPassword,
      "-o",
      "no-org-for-now",
      "-s",
      "no-space-for-now",
    ];
    const testArgsSSO = [
      "login",
      "-a",
      testEndpoint,
      "--sso-passcode",
      testSSOPasscode,
      "-o",
      "no-org-for-now",
      "-s",
      "no-space-for-now",
    ];
    const testArgsWithOriginCredentials = [
      "login",
      "-a",
      testEndpoint,
      "-u",
      testUserEmail,
      "-p",
      testUserPassword,
      "-o",
      "no-org-for-now",
      "-s",
      "no-space-for-now",
      "--origin",
      testOrigin,
    ];
    const testArgsWithOriginSSO = [
      "login",
      "-a",
      testEndpoint,
      "--sso-passcode",
      testSSOPasscode,
      "-o",
      "no-org-for-now",
      "-s",
      "no-space-for-now",
      "--origin",
      testOrigin,
    ];
    const testOptions = { env: { CF_COLOR: "false" } };
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 1,
    };

    it("success:: stdout is not empty, authentication is OK with credentials", async () => {
      cliResult.stdout = `some text Authenticating...\n${OK} some text`;
      cliMock.expects("execute").withExactArgs(testArgsCredentials, testOptions, undefined).resolves(cliResult);
      const options: CredentialsLoginOptions = {
        endpoint: testEndpoint,
        user: testUserEmail,
        password: testUserPassword,
      };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(OK);
    });

    it("success:: stdout is not empty, authentication is OK with SSO", async () => {
      cliResult.stdout = `some text Authenticating...\n${OK} some text`;
      cliMock.expects("execute").withExactArgs(testArgsSSO, testOptions, undefined).resolves(cliResult);
      const options: SSOLoginOptions = { endpoint: testEndpoint, ssoPasscode: testSSOPasscode };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(OK);
    });

    it("fail:: stdout is not empty, authentication is not OK with credentials", async () => {
      cliResult.stdout = "some text";
      cliMock.expects("execute").withExactArgs(testArgsCredentials, testOptions, undefined).resolves(cliResult);
      const options: CredentialsLoginOptions = {
        endpoint: testEndpoint,
        user: testUserEmail,
        password: testUserPassword,
      };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stdout);
    });

    it("fail:: stdout is not empty, authentication is not OK with SSO", async () => {
      cliResult.stdout = "some text";
      cliMock.expects("execute").withExactArgs(testArgsSSO, testOptions, undefined).resolves(cliResult);
      const options: SSOLoginOptions = { endpoint: testEndpoint, ssoPasscode: testSSOPasscode };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stdout);
    });

    it("fail:: stdout is empty, stderr is not empty with credentials", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "some error";
      cliMock.expects("execute").withExactArgs(testArgsCredentials, testOptions, undefined).resolves(cliResult);
      const options: CredentialsLoginOptions = {
        endpoint: testEndpoint,
        user: testUserEmail,
        password: testUserPassword,
      };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stderr);
    });

    it("fail:: stdout is empty, stderr is not empty with SSO", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "some error";
      cliMock.expects("execute").withExactArgs(testArgsSSO, testOptions, undefined).resolves(cliResult);
      const options: SSOLoginOptions = { endpoint: testEndpoint, ssoPasscode: testSSOPasscode };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stderr);
    });

    it("fail:: stdout is empty, stderr is empty with credentials", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "";
      cliMock.expects("execute").withExactArgs(testArgsCredentials, testOptions, undefined).resolves(cliResult);
      const options: CredentialsLoginOptions = {
        endpoint: testEndpoint,
        user: testUserEmail,
        password: testUserPassword,
      };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stderr);
    });

    it("fail:: stdout is empty, stderr is empty with SSO", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "";
      cliMock.expects("execute").withExactArgs(testArgsSSO, testOptions, undefined).resolves(cliResult);
      const options: SSOLoginOptions = { endpoint: testEndpoint, ssoPasscode: testSSOPasscode };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stderr);
    });

    it("success:: origin is provided, stdout is not empty, authentication is OK with credentials", async () => {
      cliResult.stdout = `some text Authenticating...\n${OK} some text`;
      cliMock
        .expects("execute")
        .withExactArgs(testArgsWithOriginCredentials, testOptions, undefined)
        .resolves(cliResult);
      const options: CredentialsLoginOptions = {
        endpoint: testEndpoint,
        user: testUserEmail,
        password: testUserPassword,
        origin: testOrigin,
      };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(OK);
    });

    it("success:: origin is provided, stdout is not empty, authentication is OK with SSO", async () => {
      cliResult.stdout = `some text Authenticating...\n${OK} some text`;
      cliMock.expects("execute").withExactArgs(testArgsWithOriginSSO, testOptions, undefined).resolves(cliResult);
      const options: SSOLoginOptions = { endpoint: testEndpoint, ssoPasscode: testSSOPasscode, origin: testOrigin };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(OK);
    });

    it("fail:: origin is provided, stdout is not empty, origin is invalid with credentials", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "some text\nAuthenticating...\nThe origin provided is invalid.\nmore text";
      cliMock
        .expects("execute")
        .withExactArgs(testArgsWithOriginCredentials, testOptions, undefined)
        .resolves(cliResult);
      const options: CredentialsLoginOptions = {
        endpoint: testEndpoint,
        user: testUserEmail,
        password: testUserPassword,
        origin: testOrigin,
      };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stderr);
    });

    it("fail:: origin is provided, stdout is not empty, origin is invalid with SSO", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "some text\nAuthenticating...\nThe origin provided is invalid.\nmore text";
      cliMock.expects("execute").withExactArgs(testArgsWithOriginSSO, testOptions, undefined).resolves(cliResult);
      const options: SSOLoginOptions = { endpoint: testEndpoint, ssoPasscode: testSSOPasscode, origin: testOrigin };
      const result = await cfLocal.cfLogin(options);
      expect(result).to.be.equal(cliResult.stderr);
    });
  });

  describe("cfGetAvailableOrgs", () => {
    const testArgs = ["curl", `/v3/organizations?per_page=${CF_PAGE_SIZE}`];
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };

    it("fail:: stderr is not empty", async () => {
      cliResult.stderr = "some error";
      cliResult.exitCode = 1;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetAvailableOrgs();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.stderr);
      }
    });

    it("success:: but stdout is an empty object", async () => {
      cliResult.stdout = "{}";
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetAvailableOrgs();
      expect(result).to.be.empty;
    });

    it("success:: stdout has not an empty object", async () => {
      cliResult.stdout = `{
                "resources": [{
                    "name": "testName",
                    "guid": "testGuid",
                    "metadata": {}
                }]
            }`;
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetAvailableOrgs();
      expect(result).to.have.lengthOf(1);
      expect(result[0].label).to.be.equal("testName");
      expect(result[0].guid).to.be.equal("testGuid");
    });

    it("fail:: not allowed filter received", async () => {
      try {
        await cfLocal.cfGetAvailableOrgs({ filters: [{ key: eFilters.service_offering_guids, value: "value" }] });
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(
          messages.not_allowed_filter(eFilters.service_offering_guids, "organizations"),
        );
      }
    });
  });

  describe("cfGetAvailableSpaces", () => {
    const testArgs = ["curl", "/v3/spaces?per_page=297"];
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };

    it("fail:: stderr is not empty, no org guid provided", async () => {
      cliResult.stderr = "some error";
      cliResult.exitCode = 1;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetAvailableSpaces();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.stderr);
      }
    });

    it("fail:: stderr is not empty, org guid is provided", async () => {
      cliResult.stderr = "some error";
      cliResult.exitCode = 1;
      const spaceGuid = "testOrgGuid";
      testArgs[1] = `/v3/spaces?organization_guids=${spaceGuid}&per_page=297`;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetAvailableSpaces(spaceGuid);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.stderr);
      }
    });

    it("success:: stdout has an empty object result", async () => {
      cliResult.stdout = "{}";
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetAvailableSpaces("testOrgGuid");
      expect(result).to.be.empty;
    });

    it("success:: stdout has structured result", async () => {
      cliResult.stdout = `{
                "resources": [{
                    "name": "testName",
                    "guid": "testGuid"
                }]
            }`;
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetAvailableSpaces("testOrgGuid");
      expect(result).to.have.lengthOf(1);
      expect(result[0].label).to.be.equal("testName");
      expect(result[0].guid).to.be.equal("testGuid");
    });
  });

  describe("cfGetSpaceServices", () => {
    const configFilePath = cfGetConfigFilePath();
    const spaceGUID = "testSpaceGUID";
    const testArgs = ["curl", `/v3/service_offerings?space_guids=${spaceGUID}&per_page=${CF_PAGE_SIZE}`];
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const stdOutOneService = `{
            "resources": [{
                "links": {
                    "service_plans": {
                        "href": "service_plans_url_1"
                    }
                },
                "name": "label_1",
                "description": "description_1",
                "guid": 1
            }]
        }`;

    it("fail:: exitCode is not 0", async () => {
      cliResult.error = "some error";
      cliResult.exitCode = 1;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields":{"GUID": "${spaceGUID}"}}`);
      try {
        await cfLocal.cfGetSpaceServices();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("success:: exitCode is 0, but there are no services found", async () => {
      cliResult.stdout = "{}";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields":{"GUID": "${spaceGUID}"}}`);
      const services = await cfLocal.cfGetSpaceServices();
      expect(services).to.be.empty;
    });

    it("ok:: exitCode is 0, there are services found", async () => {
      cliResult.stdout = stdOutOneService;
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields":{"GUID": "${spaceGUID}"}}`);
      const services = await cfLocal.cfGetSpaceServices();
      expect(services).to.have.lengthOf(1);
    });

    it("ok:: request services from specified space, there are services found", async () => {
      cliResult.stdout = stdOutOneService;
      const spaceGUID = "specifiedSpaceGUID";
      const CF_PAGE_SIZE = 13;
      const serviceLabel = "serviceLabel";
      const localTestArgs = [
        "curl",
        `/v3/service_offerings?names=${serviceLabel}&space_guids=${spaceGUID}&per_page=${CF_PAGE_SIZE}`,
      ];
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(localTestArgs, undefined, undefined).resolves(cliResult);
      const services = await cfLocal.cfGetSpaceServices(
        { filters: [{ key: eFilters.names, value: serviceLabel }], per_page: CF_PAGE_SIZE },
        spaceGUID,
      );
      expect(services).to.have.lengthOf(1);
    });

    it("exception:: not allowed filter received", async () => {
      try {
        await cfLocal.cfGetSpaceServices(
          { filters: [{ key: eFilters.service_offering_guids, value: "value" }] },
          "space-guid-test",
        );
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(
          messages.not_allowed_filter(eFilters.service_offering_guids, "service_offerings"),
        );
      }
    });
  });

  describe("cfGetServices - service_offering calls", () => {
    const spaceGUID = "testSpaceGUID";
    const testArgs = ["curl", `/v3/service_offerings?space_guids=${spaceGUID}&per_page=${CF_PAGE_SIZE}`];
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };

    it("fail:: specific space guid required, run exitCode is not 0", async () => {
      cliResult.error = "some error";
      cliResult.exitCode = 1;
      const spaceGuids = "space-guid-1,space-guid-2";
      const testArgs = ["curl", `/v3/service_offerings?space_guids=${spaceGuids}&per_page=${CF_PAGE_SIZE}`];
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetServices({ filters: [{ key: eFilters.space_guids, value: spaceGuids }] });
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("fail:: run exitCode is not 0", async () => {
      cliResult.error = "some error";
      cliResult.exitCode = 1;
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{"SpaceFields":{"GUID": "${spaceGUID}"}}`);
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetServices();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("ok:: exitCode is 0, but there are no services found", async () => {
      cliResult.stdout = "{}";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{"SpaceFields":{"GUID": "${spaceGUID}"}}`);
      const services = await cfLocal.cfGetServices();
      expect(services).to.be.empty;
    });

    it("ok:: exitCode is 0, there are services found", async () => {
      cliResult.stdout = `{
                "resources": [{
                    "links": {
                        "service_plans": {
                            "href": "service_plans_url_1"
                        }
                    },
                    "name": "label_1",
                    "description": "description_1",
                    "guid": 1
                }, {
                    "links": {
                        "service_plans": {
                            "href": "service_plans_url_2"
                        }
                    },
                    "name": "label_2",
                    "description": "description_2",
                    "guid": 2
                }]
            }`;
      cliResult.exitCode = 0;
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{"SpaceFields":{"GUID": "${spaceGUID}"}}`);
      cliMock.expects("execute").withExactArgs(testArgs, undefined, undefined).resolves(cliResult);
      const services = await cfLocal.cfGetServices();
      expect(services).to.have.lengthOf(2);
    });
  });

  describe("cfGetServicePlans scope", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const targetResult = {
      stdout: `"Api endpoint:   https://api.example.org"
            "Api version:    2.146.0"
            "user:           bag023"
            `,
      stderr: "",
      exitCode: 0,
    };
    const servicePlanUrl = "https://api.example.org/v3/service_plans/5358d122-638e-11ea-afca-bf6e756684ac";

    it("fail:: exitCode is not 0", async () => {
      cliResult.error = "some error";
      cliResult.exitCode = 1;
      cliMock
        .expects("execute")
        .withExactArgs(["target"], { env: { CF_COLOR: "false" } }, undefined)
        .resolves(targetResult);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/5358d122-638e-11ea-afca-bf6e756684ac"], undefined, undefined)
        .resolves(cliResult);
      try {
        await cfLocal.cfGetServicePlans(servicePlanUrl);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("ok:: exitCode is 0, but there are no services found by requested plan url", async () => {
      cliResult.stdout = "{}";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/5358d122-638e-11ea-afca-bf6e756684ac"], undefined, undefined)
        .resolves(cliResult);
      const servicePlan = await cfLocal.cfGetServicePlans("/v3/service_plans/5358d122-638e-11ea-afca-bf6e756684ac");
      expect(_.size(servicePlan)).to.be.equal(0);
    });

    it("ok:: exitCode is 0, there are services found by requested plan url", async () => {
      cliResult.stdout = `{
                "resources": [{
                    "name": "name_1",
                    "description": "description_1",
                    "guid": "1"
                }]
            }`;
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withExactArgs(["target"], { env: { CF_COLOR: "false" } }, undefined)
        .resolves(targetResult);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/5358d122-638e-11ea-afca-bf6e756684ac"], undefined, undefined)
        .resolves(cliResult);
      const servicePlan = await cfLocal.cfGetServicePlans(servicePlanUrl);
      assert.deepEqual(_.first(servicePlan), { label: "name_1", description: "description_1", guid: "1" });
    });

    it("ok:: requested plan url is not in https(s) format", async () => {
      cliResult.stdout = "{}";
      cliResult.exitCode = 0;
      const servicePlanUrl = "file:////server/folder/v3/service_plans/5358d122-638e-11ea-afca-bf6e756684ac";
      cliMock.expects("execute").withExactArgs(["curl", servicePlanUrl], undefined, undefined).resolves(cliResult);
      const servicePlan = await cfLocal.cfGetServicePlans(servicePlanUrl);
      expect(_.size(servicePlan)).to.be.equal(0);
    });
  });

  describe("cfGetServiceInstances calls", () => {
    const configFilePath = cfGetConfigFilePath();
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const spaceGuid = "testSpaceGUID";
    const planName = "test_service_label1";
    const servicesGuids = ["service-guid-1", "service-guid-2", "service-guid-3"];
    const servicesNames = ["service-1", "service-2", "service-3"];
    const resultPlan = {
      name: planName,
      included: {
        service_offerings: [
          {
            guid: servicesGuids[1],
            name: servicesNames[1],
          },
          {
            guid: servicesGuids[0],
            name: servicesNames[0],
          },
        ],
      },
      relationships: {
        service_offering: {
          data: {
            guid: servicesGuids[0],
          },
        },
      },
    };
    const planGuids = ["service_plan-guid-1", "service_plan-guid-3", "service_plan-guid-2", "service_plan-guid-4"];
    const serviceNames = ["test_service_name1", "test_service_name2", "test_service_name3", "test_service_name4"];
    const serviceGuids = ["test_guid1", "test_guid2", "test_guid3", "test_guid4"];

    it("exception:: cf space not defined, default space value is unavailable", async () => {
      fsMock.expects("readFile").withExactArgs(configFilePath, { encoding: "utf8" }).resolves(`{}`);
      try {
        await cfLocal.cfGetServiceInstances();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(messages.cf_setting_not_set);
      }
    });

    it("exception:: cf space defined, no page number provided, exitCode is 1, cliResult.error is defined", async () => {
      cliResult.exitCode = 1;
      cliResult.error = "testError";
      cliResult.stdout = "";
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const param = `/v3/service_instances?fields[service_plan]=guid,name&type=managed&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      try {
        await cfLocal.cfGetServiceInstances();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal("testError");
      }
    });

    it("exception:: cf space defined, no page number provided, exitCode is 1, query operation filter usied", async () => {
      cliResult.exitCode = 1;
      cliResult.error = "";
      cliResult.stdout = "testStdout";
      const timestamp = "2020-06-30T23:49:04Z";
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const param = `/v3/service_instances?created_ats[gte]=${timestamp}&fields[service_plan]=guid,name&type=managed&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      try {
        await cfLocal.cfGetServiceInstances({
          filters: [{ key: eFilters.created_ats, value: timestamp, op: eOperation.gte }],
        });
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal("testStdout");
      }
    });

    it("exception:: cf space set, page number provided, exitCode is 1, cliResult.error is defined", async () => {
      cliResult.exitCode = 1;
      cliResult.error = "testError";
      cliResult.stdout = "";
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const param = `/v3/service_instances?fields[service_plan]=guid,name&type=managed&space_guids=${spaceGuid}&page=5&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      try {
        await cfLocal.cfGetServiceInstances({ page: 5 });
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal("testError");
      }
    });

    it("ok:: several service plan calls fails -> checking error in service_plan response", async () => {
      const tags = ["hana", "accounting", "mongodb"];
      cliResult.exitCode = 0;
      cliResult.error = "";

      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const param = `/v3/service_instances?fields[service_plan]=guid,name&type=managed&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`;
      const plansResult = {
        resources: [
          {
            guid: serviceGuids[0],
            name: serviceNames[0],
            type: eServiceTypes.managed,
            tags: ["hana", "accounting", "mongodb"],
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[0],
                },
              },
            },
          },
          {
            guid: serviceGuids[1],
            name: serviceNames[1],
            tags: [],
            type: eServiceTypes.managed,
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[0],
                },
              },
            },
          },
          {
            guid: serviceGuids[2],
            name: serviceNames[2],
            type: eServiceTypes.managed,
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[1],
                },
              },
            },
          },
        ],
      };
      cliResult.stdout = JSON.stringify(plansResult);
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-1?include=service_offering"], undefined, undefined)
        .resolves({ exitCode: 0, stdout: JSON.stringify(resultPlan) });
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-3?include=service_offering"], undefined, undefined)
        .resolves({ exitCode: 0, stdout: `{"errors": [{"error": "some error"}]}` });
      const result = await cfLocal.cfGetServiceInstances({
        filters: [
          { key: eFilters.space_guids, value: "" },
          { key: eFilters.service_plan_guids, value: "" },
        ],
        per_page: CF_PAGE_SIZE,
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0].guid).to.be.equal(serviceGuids[0]);
      expect(result[0].serviceName).to.be.equal(servicesNames[0]);
      expect(result[0].plan).to.be.equal(planName);
      expect(result[0].plan_guid).to.be.equal(planGuids[0]);
      expect(result[0].label).to.be.equal(serviceNames[0]);
      assert.deepEqual(result[0].tags, tags);
      expect(result[1].guid).to.be.equal(serviceGuids[1]);
      expect(result[1].serviceName).to.be.equal(servicesNames[0]);
      expect(result[1].plan).to.be.equal(planName);
      expect(result[1].plan_guid).to.be.equal(planGuids[0]);
      expect(result[1].label).to.be.equal(serviceNames[1]);
      assert.deepEqual(result[1].tags, []);
      expect(result[2].guid).to.be.equal(serviceGuids[2]);
      expect(result[2].serviceName).to.be.equal("unknown");
      expect(result[2].plan).to.be.equal("unknown");
      expect(result[2].plan_guid).to.be.equal(planGuids[1]);
      expect(result[2].label).to.be.equal(serviceNames[2]);
    });

    it("ok:: few calls for service plan fails or have errord -> checking wrong output and rejection in service_plan response", async () => {
      cliResult.exitCode = 0;
      cliResult.error = "";
      const plansResult = {
        resources: [
          {
            guid: serviceGuids[0],
            name: serviceNames[0],
            type: eServiceTypes.managed,
            tags: ["hana", "accounting", "mongodb"],
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[0],
                },
              },
            },
          },
          {
            guid: serviceGuids[1],
            name: serviceNames[1],
            type: eServiceTypes.managed,
            tags: [],
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[1],
                },
              },
            },
          },
          {
            guid: serviceGuids[2],
            name: serviceNames[2],
            type: eServiceTypes.managed,
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[2],
                },
              },
            },
          },
          {
            guid: serviceGuids[3],
            name: serviceNames[3],
            type: eServiceTypes.managed,
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[3],
                },
              },
            },
          },
        ],
      };
      cliResult.stdout = JSON.stringify(plansResult);
      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const param = `/v3/service_instances?fields[service_plan]=guid,name&type=managed&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-1?include=service_offering"], undefined, undefined)
        .resolves({ stdout: JSON.stringify(resultPlan), exitCode: 0 });
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-2?include=service_offering"], undefined, undefined)
        .resolves({ stdout: JSON.stringify(resultPlan), exitCode: 1 });
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-3?include=service_offering"], undefined, undefined)
        .resolves({ stdout: `{"entity": {"label"}}`, exitCode: 0 });
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-4?include=service_offering"], undefined, undefined)
        .rejects(new Error("some error"));
      const result = await cfLocal.cfGetServiceInstances();
      expect(result).to.have.lengthOf(4);
      expect(result[0].guid).to.be.equal(serviceGuids[0]);
      expect(result[0].serviceName).to.be.equal(servicesNames[0]);
      expect(result[0].plan).to.be.equal(planName);
      expect(result[0].plan_guid).to.be.equal(planGuids[0]);
      expect(result[0].label).to.be.equal(serviceNames[0]);
      expect(result[1].guid).to.be.equal(serviceGuids[1]);
      expect(result[1].serviceName).to.be.equal("unknown");
      expect(result[1].plan).to.be.equal("unknown");
      expect(result[1].plan_guid).to.be.equal(planGuids[1]);
      expect(result[1].label).to.be.equal(serviceNames[1]);
      expect(result[2].guid).to.be.equal(serviceGuids[2]);
      expect(result[2].serviceName).to.be.equal("unknown");
      expect(result[2].plan).to.be.equal("unknown");
      expect(result[2].plan_guid).to.be.equal(planGuids[2]);
      expect(result[2].label).to.be.equal(serviceNames[2]);
      expect(result[3].guid).to.be.equal(serviceGuids[3]);
      expect(result[3].serviceName).to.be.equal("unknown");
      expect(result[3].plan).to.be.equal("unknown");
      expect(result[3].plan_guid).to.be.equal(planGuids[3]);
      expect(result[3].label).to.be.equal(serviceNames[3]);
    });

    it("ok:: no service instances found", async () => {
      cliResult.exitCode = 0;
      cliResult.error = "";
      cliResult.stdout = `{
                "resources": []
            }`;
      const param = `/v3/service_instances?space_guids=${spaceGuid}&fields[service_plan]=guid,name&type=managed&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      const result = await cfLocal.cfGetServiceInstances({
        filters: [{ key: eFilters.space_guids, value: spaceGuid }],
      });
      expect(result).to.have.lengthOf(0);
    });
  });

  describe("cfGetManagedServiceInstances", () => {
    const spaceGuid = "testSpaceGUID";

    it("ok:: no service instances found", async () => {
      const query = { filters: [{ key: eFilters.space_guids, value: spaceGuid }], per_page: 11 };
      const cliResult = {
        exitCode: 0,
        error: "",
        stdout: `{
                    "resources": []
                }`,
      };
      const param = `/v3/service_instances?space_guids=${spaceGuid}&fields[service_plan]=guid,name&type=managed&per_page=11`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      await cfLocal.cfGetManagedServiceInstances(query);
    });
  });

  describe("cfGetServiceInstancesList", () => {
    const configFilePath = cfGetConfigFilePath();
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const spaceGuid = "testSpaceGUID";
    const planName = "test_service_label1";
    const servicesGuids = ["service-guid-1", "service-guid-2", "service-guid-3"];
    const servicesNames = ["service-1", "service-2", "service-3"];
    const resultPlan = {
      name: planName,
      included: {
        service_offerings: [
          {
            guid: servicesGuids[1],
            name: servicesNames[1],
          },
          {
            guid: servicesGuids[0],
            name: servicesNames[0],
          },
        ],
      },
      relationships: {
        service_offering: {
          data: {
            guid: servicesGuids[0],
          },
        },
      },
    };
    const planGuids = ["service_plan-guid-1", "service_plan-guid-3", "service_plan-guid-2", "service_plan-guid-4"];
    const serviceNames = ["test_service_name1", "test_service_name2", "test_service_name3", "test_service_name4"];
    const serviceGuids = ["test_guid1", "test_guid2", "test_guid3", "test_guid4"];

    it("ok:: several service plan calls fails -> checking error in service_plan response", async () => {
      const tags = ["hana", "accounting", "mongodb"];
      cliResult.exitCode = 0;
      cliResult.error = "";

      fsMock
        .expects("readFile")
        .withExactArgs(configFilePath, { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const upsGuid = "ups-guids-0";
      const cred = { data: { u: "u", v: "v" } };
      const param = `/v3/service_instances?fields[service_plan]=guid,name&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`;
      const serviceResult = {
        resources: [
          {
            guid: serviceGuids[0],
            name: serviceNames[0],
            type: eServiceTypes.managed,
            tags: ["hana", "accounting", "mongodb"],
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[0],
                },
              },
            },
          },
          {
            name: serviceNames[1],
            tags: ["test"],
            guid: upsGuid,
            type: eServiceTypes.user_provided,
            relationships: {},
          },
          {
            guid: serviceGuids[2],
            name: serviceNames[2],
            type: eServiceTypes.managed,
            relationships: {
              service_plan: {
                data: {
                  guid: planGuids[1],
                },
              },
            },
          },
        ],
      };
      cliResult.stdout = JSON.stringify(serviceResult);
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", `/v3/service_instances/${upsGuid}/credentials`], undefined, undefined)
        .resolves(cred);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", `/v3/service_plans/${planGuids[0]}?include=service_offering`], undefined, undefined)
        .resolves({ exitCode: 0, stdout: JSON.stringify(resultPlan) });
      cliMock
        .expects("execute")
        .withExactArgs(["curl", `/v3/service_plans/${planGuids[1]}?include=service_offering`], undefined, undefined)
        .resolves({ exitCode: 0, stdout: `{"errors": [{"error": "some error"}]}` });
      const result = await cfLocal.cfGetServiceInstancesList({
        filters: [
          { key: eFilters.space_guids, value: "" },
          { key: eFilters.service_plan_guids, value: "" },
        ],
        per_page: CF_PAGE_SIZE,
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0].guid).to.be.equal(serviceGuids[0]);
      expect(result[0].serviceName).to.be.equal(servicesNames[0]);
      expect(result[0].plan).to.be.equal(planName);
      expect(result[0].plan_guid).to.be.equal(planGuids[0]);
      expect(result[0].label).to.be.equal(serviceNames[0]);
      assert.deepEqual(result[0].tags, tags);
      expect(result[1].guid).to.be.equal(upsGuid);
      expect(result[1].serviceName).to.be.equal(eServiceTypes.user_provided);
      expect(result[1].plan).to.be.equal("");
      expect(result[1].plan_guid).to.be.undefined;
      expect(result[1].label).to.be.equal(serviceNames[1]);
      assert.deepEqual(result[1].tags, ["test"]);
      expect(result[2].guid).to.be.equal(serviceGuids[2]);
      expect(result[2].serviceName).to.be.equal("unknown");
      expect(result[2].plan).to.be.equal("unknown");
      expect(result[2].plan_guid).to.be.equal(planGuids[1]);
      expect(result[2].label).to.be.equal(serviceNames[2]);
    });
  });

  describe("cfApi", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };

    const endpoint = "https://api.cf.test.ondemand.com";
    const apiVer = "3.100.0";

    it("ok:: api", async () => {
      cliResult.stdout = `"Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"
            `;
      cliMock.expects("execute").withExactArgs(["api"], undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfApi();
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
    });

    it("ok:: api - warning, not logged in", async () => {
      cliResult.stdout = `OK

            "Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"

            Not logged in. Use 'cf login' or 'cf login --sso' to log in.
            `;
      cliResult.exitCode = 0;
      const url = "https://api.cf.other.ondemand.com";
      cliMock
        .expects("execute")
        .withExactArgs([`api`, `${url}`], undefined, undefined)
        .resolves(cliResult);
      const result = await cfLocal.cfApi({ url });
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
    });

    it("ok:: api, skip-validation=true, unset=false", async () => {
      cliResult.stdout = `"Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"
            `;
      cliMock
        .expects("execute")
        .withExactArgs(["api", "--skip-ssl-validation"], undefined, undefined)
        .resolves(cliResult);
      const result = await cfLocal.cfApi({ skip_ssl_validation: true, unset: false });
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
    });

    it("ok:: api, skip-validation=true, unset=true", async () => {
      cliResult.stdout = `"Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"
            `;
      cliMock
        .expects("execute")
        .withExactArgs(["api", "--skip-ssl-validation", "--unset"], undefined, undefined)
        .resolves(cliResult);
      const result = await cfLocal.cfApi({ skip_ssl_validation: true, unset: true });
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
    });
  });
});
