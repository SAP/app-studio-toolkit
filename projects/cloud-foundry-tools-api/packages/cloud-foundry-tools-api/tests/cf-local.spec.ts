import { expect, assert } from "chai";
import * as _ from "lodash";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import * as fs from "fs";
import * as cfLocal from "../src/cf-local";
import * as cli from "../src/cli";
import { messages } from "../src/messages";
import { stringify } from "comment-json";
import { fail } from "assert";
import { CliResult, ProgressHandler, CF_PAGE_SIZE, PlanInfo, eFilters, eServiceTypes } from "../src/types";
import { cfGetConfigFilePath } from "../src/utils";

describe("cf-local unit tests", () => {
  let sandbox: SinonSandbox;
  let cliMock: SinonMock;
  let fsMock: SinonMock;
  class Disposable {
    public isDisposed = false;
    public dispose() {
      this.isDisposed = true;
    }
  }
  const token = { isCancellationRequested: false, onCancellationRequested: () => new Disposable() };

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

  describe("bindLocalServices", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const filePath = "testFilePath";
    const instanceNames: string[] = ["name1", "name2"];

    it("ok:: tags are not provided", async () => {
      cliMock
        .expects("execute")
        .withExactArgs(["bind-local", "-path", filePath, "-service-names", ...instanceNames], undefined, undefined)
        .resolves(cliResult);
      await cfLocal.cfBindLocalServices(filePath, instanceNames);
    });

    it("ok:: tags are provided", async () => {
      const tags = ["tag1", "tag2"];
      const expectedTags = ["-tags", "tag1", "tag2"];
      cliMock
        .expects("execute")
        .withExactArgs(
          ["bind-local", "-path", filePath, "-service-names", ...instanceNames, ...expectedTags],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfBindLocalServices(filePath, instanceNames, tags);
    });

    it("exception:: tags are not provided, exit code is 1, stderr has output", async () => {
      cliResult.error = "testError";
      cliResult.exitCode = 1;
      cliMock
        .expects("execute")
        .withExactArgs(["bind-local", "-path", filePath, "-service-names", ...instanceNames], undefined, undefined)
        .resolves(cliResult);
      try {
        await cfLocal.cfBindLocalServices(filePath, instanceNames);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("exception:: tags are not provided, exit code is 1, stdout has output", async () => {
      cliResult.error = "";
      cliResult.stdout = "some error occured";
      cliResult.exitCode = 1;
      cliMock
        .expects("execute")
        .withExactArgs(["bind-local", "-path", filePath, "-service-names", ...instanceNames], undefined, undefined)
        .resolves(cliResult);
      try {
        await cfLocal.cfBindLocalServices(filePath, instanceNames);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.stdout);
      }
    });

    it("ok:: serviceKeyNames are specified", async () => {
      cliResult.error = "";
      cliResult.stdout = "";
      cliResult.exitCode = 0;
      const tags = ["tag1", "tag2"];
      const expectedTags = ["-tags", "tag1", "tag2"];
      const keyNames = ["keyName1", "keyName2"];
      const expectedKeyNames = ["-service-keys", `${keyNames[0]}`, `${keyNames[1]}`];
      cliMock
        .expects("execute")
        .withExactArgs(
          ["bind-local", "-path", filePath, "-service-names", ...instanceNames, ...expectedTags, ...expectedKeyNames],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfBindLocalServices(filePath, instanceNames, tags, keyNames);
    });

    it("exception:: tags are not provided, execution exit code <> 0", async () => {
      cliResult.error = "";
      cliResult.stdout = "testError";
      cliResult.exitCode = 2;
      cliMock
        .expects("execute")
        .withExactArgs(["bind-local", "-path", filePath, "-service-names", ...instanceNames], undefined, undefined)
        .resolves(cliResult);
      try {
        await cfLocal.cfBindLocalServices(filePath, instanceNames);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.stdout);
      }
    });

    it("ok:: tags are not provided, params are provided", async () => {
      cliResult.error = "";
      cliResult.stdout = "";
      cliResult.exitCode = 0;
      const params = [{ permissions: ["development"] }, { metadata: { data: "value" } }];
      const expectedParams = [stringify(params[0]), stringify(params[1])];
      cliMock
        .expects("execute")
        .withExactArgs(
          ["bind-local", "-path", filePath, "-service-names", ...instanceNames, "-params", ...expectedParams],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfBindLocalServices(filePath, instanceNames, [], [], params);
    });

    it("ok:: quote-vcap is provided", async () => {
      cliResult.error = "";
      cliResult.stdout = "";
      cliResult.exitCode = 0;

      cliMock
        .expects("execute")
        .withExactArgs(
          ["bind-local", "-path", filePath, "-service-names", ...instanceNames, "-quote-vcap"],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfBindLocalServices(filePath, instanceNames, [], [], [], true);
    });
  });

  describe("cfCreateService scope", () => {
    const configFilePath = cfGetConfigFilePath();
    const progressHandler: ProgressHandler = { progress: undefined, cancelToken: token };
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const spaceGuid = "testSpaceGUID";
    const baseInstanceName = "testInstanceName";
    let instanceName = baseInstanceName;
    const planGuid = "testPlanGuid";
    const request = {
      name: instanceName,
      space_guid: spaceGuid,
      service_plan_guid: planGuid,
      parameters: {},
    };
    const output = {
      resources: [
        {
          name: instanceName,
          last_operation: {
            state: "succeess",
          },
        },
      ],
    };
    _.set(request, "tags", []);

    beforeEach(() => {
      fsMock.expects("readFile").withExactArgs(configFilePath, { encoding: "utf8" }).resolves(`{"SpaceFields": {
                "GUID": "${spaceGuid}"
            }}`);
    });

    it("exception:: cf space GUID not specified and default is undefined", async () => {
      instanceName = `${baseInstanceName}161`;
      sandbox.restore();
      fsMock = sandbox.mock(fs.promises);
      fsMock.expects("readFile").withExactArgs(configFilePath, { encoding: "utf8" }).resolves(`{}`);
      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], null);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(messages.cf_setting_not_set);
      }
      fsMock.verify();
    });

    it("exception:: cf space GUID default is defined, run exitCode is 1", async () => {
      instanceName = `${baseInstanceName}174`;
      cliResult.error = "testError";
      cliResult.exitCode = 1;
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          token,
        )
        .resolves(cliResult);

      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("ok:: stdout has no error", async () => {
      instanceName = `${baseInstanceName}190`;
      cliResult.stdout = `\n`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          token,
        )
        .resolves(cliResult);

      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_instances?names=${instanceName}&space_guids=${spaceGuid}&type=managed&per_page=297`],
          undefined,
          token,
        )
        .resolves({ exitCode: 0, stdout: JSON.stringify(output) });
      let progressReported = false;
      const progressHandler: ProgressHandler = {
        progress: {
          report: () => {
            progressReported = true;
          },
        },
        cancelToken: token,
      };
      await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler);
      expect(progressReported).to.be.true;
    });

    it("ok:: stdout has empty data", async () => {
      instanceName = `${baseInstanceName}190`;
      cliResult.stdout = ``;
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          token,
        )
        .resolves(cliResult);

      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_instances?names=${instanceName}&space_guids=${spaceGuid}&type=managed&per_page=297`],
          undefined,
          token,
        )
        .resolves({ exitCode: 0, stdout: JSON.stringify(output) });
      let progressReported = false;
      const progressHandler: ProgressHandler = {
        progress: {
          report: () => {
            progressReported = true;
          },
        },
        cancelToken: token,
      };
      await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler);
      expect(progressReported).to.be.true;
    });

    it("ok:: progress handler not provided", async () => {
      instanceName = `${baseInstanceName}209`;
      cliResult.stdout = `{}`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          "/v3/service_instances",
          "-d",
          `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
          "-X",
          "POST",
        ])
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          `/v3/service_instances?names=${instanceName}&space_guids=${spaceGuid}&type=managed&per_page=297`,
        ])
        .resolves({ exitCode: 0, stdout: JSON.stringify(output) });
      await cfLocal.cfCreateService(planGuid, instanceName, {}, []);
    });

    it("ok:: empty progress handler", async () => {
      instanceName = `${baseInstanceName}221`;
      cliResult.stdout = `{}`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          "/v3/service_instances",
          "-d",
          `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
          "-X",
          "POST",
        ])
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          `/v3/service_instances?names=${instanceName}&space_guids=${spaceGuid}&type=managed&per_page=297`,
        ])
        .resolves({ exitCode: 0, stdout: JSON.stringify(output) });
      await cfLocal.cfCreateService(planGuid, instanceName, {}, [], { progress: undefined, cancelToken: undefined });
    });

    it("exception:: retryFunction throws exception", async () => {
      instanceName = `${baseInstanceName}233`;
      cliResult.stdout = `{}`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      const error = new Error("retry function exception");
      let progressReported = false;
      const progressHandler: ProgressHandler = {
        progress: {
          report: () => {
            progressReported = true;
          },
        },
        cancelToken: token,
      };
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          "/v3/service_instances",
          "-d",
          `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
          "-X",
          "POST",
        ])
        .resolves(cliResult);

      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_instances?names=${instanceName}&space_guids=${spaceGuid}&type=managed&per_page=297`],
          undefined,
          token,
        )
        .rejects(error);

      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler);
        fail("test should fail");
      } catch (e) {
        expect(progressReported).to.be.true;
        expect(e.message).to.be.equal(error.message);
      }
    });

    it("exception:: retryFunction returns incorrect result, verify the specified instance name is encoded", async () => {
      cliResult.stdout = `{"metadata": {}, "last_operation": {"state": "in progress"}}`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      const cliRetry: CliResult = {
        stderr: "",
        stdout: `{ "resources": [ ]}`,
        exitCode: 0,
      };
      const requestedName = "testInstance+Name";
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          "/v3/service_instances",
          "-d",
          `{"type":"managed","name":"${requestedName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
          "-X",
          "POST",
        ])
        .resolves(cliResult);

      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_instances?names=${encodeURIComponent(
              requestedName,
            )}&space_guids=${spaceGuid}&type=managed&per_page=297`,
          ],
          undefined,
          token,
        )
        .resolves(cliRetry);
      try {
        await cfLocal.cfCreateService(planGuid, requestedName, {}, [], progressHandler);
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.service_not_found(requestedName));
      }
    });

    it("exeption:: retryFunction returns incorrect result - instanceName not provided", async () => {
      cliResult.stdout = `{"metadata": {}, "last_operation": {"state": "in progress"}}`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      const cliRetry: CliResult = {
        stderr: "",
        stdout: `{ "resources": [ ]}`,
        exitCode: 0,
      };
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          "/v3/service_instances",
          "-d",
          `{"type":"managed","name":"","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
          "-X",
          "POST",
        ])
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_instances?space_guids=${spaceGuid}&type=managed&per_page=297`],
          undefined,
          token,
        )
        .resolves(cliRetry);
      try {
        await cfLocal.cfCreateService(planGuid, "", {}, [], progressHandler);
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.service_not_found("unknown"));
      }
    });

    it("exception:: cancellation requested during execution", async () => {
      instanceName = `${baseInstanceName}303`;
      cliResult.stdout = `{}`;
      cliResult.error = "";
      cliResult.exitCode = 0;

      let progressReported = false;
      const cancelEvent = {
        test: () => {
          return new Disposable();
        },
      };
      const localProgressHandler: ProgressHandler = {
        progress: {
          report: () => {
            progressReported = true;
          },
        },
        cancelToken: {
          isCancellationRequested: true,
          onCancellationRequested: cancelEvent.test,
        },
      };
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          localProgressHandler.cancelToken,
        )
        .resolves(cliResult);
      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], localProgressHandler);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(messages.create_service_canceled_by_requester);
        expect(progressReported).to.be.true;
      }
    });

    it("exception:: exceeded number of retry attempts", async () => {
      instanceName = `${baseInstanceName}334`;
      cliResult.stdout = `{ "name": "${instanceName}" }`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      let progressReported = false;
      const progressHandler: ProgressHandler = {
        progress: {
          report: () => {
            progressReported = true;
          },
        },
        cancelToken: token,
      };
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          progressHandler.cancelToken,
        )
        .resolves(cliResult);

      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler, 0);
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.exceed_number_of_attempts(instanceName));
        expect(progressReported).to.be.true;
      }
    });

    it("exception:: operation state failed", async () => {
      instanceName = `${baseInstanceName}357`;
      const description = "failure description";
      cliResult.stdout = `{
                "name": "${instanceName}",
                "last_operation": {
                    "state": "failed",
                    "description": "${description}"
                }
            }`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          progressHandler.cancelToken,
        )
        .resolves(cliResult);
      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(messages.failed_creating_entity(description, instanceName));
      }
    });

    it("exception:: entity state in progress, max number retries reached", async () => {
      instanceName = `${baseInstanceName}380`;
      cliResult.stdout = `{
                "name": "${instanceName}"
            }`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      const cliRetry: CliResult = {
        stderr: "",
        stdout: `{ 
                    "resources": [{
                        "name": "${instanceName}",
                        "last_operation": {
                            "state": "in progress"
                        }
                    }]
                }`,
        exitCode: 0,
      };
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          progressHandler.cancelToken,
        )
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_instances?names=${instanceName}&space_guids=${spaceGuid}&type=managed&per_page=297`],
          undefined,
          token,
        )
        .resolves(cliRetry);

      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler, 1);
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.exceed_number_of_attempts(instanceName));
      }
    });

    it("exception:: creation service failed, have errors in output", async () => {
      instanceName = `${baseInstanceName}413`;
      const errorDetail = `Service ${instanceName} creation failed`;
      cliResult.stdout = `{
                "errors": [{
                    "code": "100092",
                    "error": "failed",
                    "detail": "${errorDetail}" 
                }]
            }`;
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"type":"managed","name":"${instanceName}","relationships":{"space":{"data":{"guid":"${spaceGuid}"}},"service_plan":{"data":{"guid":"${planGuid}"}}},"parameters":{},"tags":[]}`,
            "-X",
            "POST",
          ],
          undefined,
          progressHandler.cancelToken,
        )
        .resolves(cliResult);

      try {
        await cfLocal.cfCreateService(planGuid, instanceName, {}, [], progressHandler);
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.service_creation_failed(errorDetail));
      }
    });
  });

  describe("cfGetServicePlansList scope", () => {
    const configFilePath = cfGetConfigFilePath();
    const spaceGuid = "planSpaceGUID";
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 1,
      error: "testError",
    };
    const args = [
      "curl",
      `/v3/service_plans?include=service_offering&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`,
    ];

    it("ok:: cf space is not provided", async () => {
      const result = {
        included: {
          service_offerings: [
            {
              guid: "service-offering-guid-0",
              name: "service-0",
              description: "service-description-0",
            },
            {
              guid: "service-offering-guid-1",
              name: "service-1",
              description: "service-description-1",
            },
            {
              guid: "service-offering-guid-2",
              name: "service-2",
              description: "service-description-2",
            },
            {
              guid: "service-offering-guid-3",
              name: "service-3",
              description: "service-description-3",
            },
          ],
        },
        resources: [
          {
            name: "name_1",
            guid: "plan-guid-1",
            description: "description_1",
            relationships: {
              service_offering: {
                data: {
                  guid: "service-offering-guid-1",
                },
              },
            },
          },
          {
            name: "name_2",
            guid: "plan-guid-2",
            description: "description_2",
            relationships: {
              service_offering: {
                data: {
                  guid: "service-offering-guid-2",
                },
              },
            },
          },
        ],
      };
      cliResult.stdout = stringify(result);
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliResult.error = "";
      fsMock.expects("readFile").withExactArgs(configFilePath, { encoding: "utf8" }).resolves(`{"SpaceFields": {
                "GUID": "${spaceGuid}"
            }}`);
      cliMock.expects("execute").withExactArgs(args, undefined, undefined).resolves(cliResult);
      const plans: PlanInfo[] = await cfLocal.cfGetServicePlansList();
      expect(_.size(plans)).to.be.equal(2);
      assert.deepEqual(plans[0], {
        label: result.resources[0].name,
        guid: result.resources[0].guid,
        description: result.resources[0].description,
        service_offering: {
          guid: result.included.service_offerings[1].guid,
          description: result.included.service_offerings[1].description,
          name: result.included.service_offerings[1].name,
        },
      });
      assert.deepEqual(plans[1], {
        label: result.resources[1].name,
        guid: result.resources[1].guid,
        description: result.resources[1].description,
        service_offering: {
          guid: result.included.service_offerings[2].guid,
          description: result.included.service_offerings[2].description,
          name: result.included.service_offerings[2].name,
        },
      });
    });

    it("exception:: rejected error", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "";
      cliResult.exitCode = 1;
      cliResult.error = "some error occured";
      fsMock.expects("readFile").withExactArgs(configFilePath, { encoding: "utf8" }).resolves(`{"SpaceFields": {
                "GUID": "${spaceGuid}"
            }}`);
      cliMock.expects("execute").withExactArgs(args, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetServicePlansList();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("exception:: rejected failed", async () => {
      cliResult.stdout = "FAILED. some error occured";
      cliResult.stderr = "";
      cliResult.exitCode = 1;
      cliResult.error = "";
      fsMock.expects("readFile").withExactArgs(configFilePath, { encoding: "utf8" }).resolves(`{"SpaceFields": {
                "GUID": "${spaceGuid}"
            }}`);
      cliMock.expects("execute").withExactArgs(args, undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetServicePlansList();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.stdout);
      }
    });

    it("ok:: call where cf space is specified", async () => {
      sandbox.restore();
      cliMock = sandbox.mock(cli.Cli);
      const result = {
        included: {
          service_offerings: [{}],
        },
        resources: [{}],
      };
      cliResult.stdout = stringify(result);
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliResult.error = "";

      const guid = "space-guid";
      const per_page = 12;
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_plans?space_guids=${guid}&include=service_offering&per_page=${per_page}`],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfGetServicePlansList({
        filters: [{ key: eFilters.space_guids, value: guid }],
        per_page: per_page,
      });
    });
  });

  describe("cfSetOrgSpace", () => {
    const testOrg = "testOrg";
    const testArgs = ["target", "-o", testOrg];

    it("exception:: space is not provided", async () => {
      cliMock.expects("execute").withArgs(testArgs).resolves({ exitCode: -1 });
      try {
        await cfLocal.cfSetOrgSpace(testOrg);
        fail("should fail");
      } catch (e) {
        // continue test
      }
    });

    it("ok:: space is provided", async () => {
      const cliResult: CliResult = {
        exitCode: 1,
        error: "testError",
        stdout: "",
        stderr: "",
      };
      const spaceGuid = "space-guid-test";
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
      const param = `/v3/service_instances?fields[service_plan]=guid,name&type=managed&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      const testSpace = "testSpace";
      cliMock
        .expects("execute")
        .withArgs(testArgs.concat(["-s", testSpace]))
        .resolves({ exitCode: 0 });
      await cfLocal.cfSetOrgSpace(testOrg, testSpace);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe("cfGetServiceKeys", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const result = {
      pagination: {
        total_results: 1,
        total_pages: 1,
        first: {
          href: "https://api.example.org/v3/service_credential_bindings?page=1&per_page=2",
        },
        last: {
          href: "https://api.example.org/v3/service_credential_bindings?page=2&per_page=2",
        },
        next: {},
        previous: {},
      },
      resources: [
        {
          guid: "dde5ad2a-d8f4-44dc-a56f-0452d744f1c3",
          created_at: "2015-11-13T17:02:56Z",
          updated_at: "2016-06-08T16:41:26Z",
          name: "some-binding-name",
          type: "app",
          last_operation: {
            type: "create",
            state: "succeeded",
            created_at: "2015-11-13T17:02:56Z",
            updated_at: "2016-06-08T16:41:26Z",
          },
          metadata: {
            annotations: {
              foo: "bar",
            },
            labels: {
              baz: "qux",
            },
          },
          relationships: {
            app: {
              data: {
                guid: "74f7c078-0934-470f-9883-4fddss5b8f13",
              },
            },
            service_instance: {
              data: {
                guid: "8bfe4c1b-9e18-45b1-83be-124163f31f9e",
              },
            },
          },
          links: {
            self: {
              href: "https://api.example.org/v3/service_credential_bindings/dde5ad2a-d8f4-44dc-a56f-0452d744f1c3",
            },
            details: {
              href: "https://api.example.org/v3/service_credential_bindings/dde5ad2a-d8f4-44dc-a56f-0452d744f1c3/details",
            },
            service_instance: {
              href: "https://api.example.org/v3/service_instances/8bfe4c1b-9e18-45b1-83be-124163f31f9e",
            },
            app: {
              href: "https://api.example.org/v3/apps/74f7c078-0934-470f-9883-4fddss5b8f13",
            },
          },
        },
        {
          guid: "7aa37bad-6ccb-4ef9-ba48-9ce3a91b2b62",
          created_at: "2015-11-13T17:02:56Z",
          updated_at: "2016-06-08T16:41:26Z",
          name: "some-key-name",
          type: "key",
          last_operation: {
            type: "create",
            state: "succeeded",
            created_at: "2015-11-13T17:02:56Z",
            updated_at: "2016-06-08T16:41:26Z",
          },
          metadata: {
            annotations: {
              foo: "bar",
            },
            labels: {},
          },
          relationships: {
            service_instance: {
              data: {
                guid: "8bfe4c1b-9e18-45b1-83be-124163f31f9e",
              },
            },
          },
          links: {
            self: {
              href: "https://api.example.org/v3/service_credential_bindings/7aa37bad-6ccb-4ef9-ba48-9ce3a91b2b62",
            },
            details: {
              href: "https://api.example.org/v3/service_credential_bindings/7aa37bad-6ccb-4ef9-ba48-9ce3a91b2b62/details",
            },
            service_instance: {
              href: "https://api.example.org/v3/service_instances/8bf356j3-9e18-45b1-3333-124163f31f9e",
            },
          },
        },
      ],
    };

    it("exception:: no valid filters provided", async () => {
      try {
        await cfLocal.cfGetServiceKeys({ filters: [{ key: eFilters.service_broker_names, value: "broker-name" }] });
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(
          messages.not_allowed_filter(eFilters.service_broker_names, "service_credential_bindings"),
        );
      }
    });

    it("ok:: filters names and service_instance_guid provided", async () => {
      cliResult.exitCode = 0;
      cliResult.stdout = stringify(result);
      const value = "instance";
      const guid = "instance_guid";
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_credential_bindings?names=${value}&service_instance_guids=${guid}&type=key&per_page=${CF_PAGE_SIZE}`,
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      const answer = await cfLocal.cfGetServiceKeys({
        filters: [
          { key: eFilters.names, value },
          { key: eFilters.service_instance_guids, value: guid },
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.deepEqual(answer as any, result.resources);
    });

    it("exception:: rejected error", async () => {
      cliResult.exitCode = 1;
      cliResult.error = "some error";
      cliResult.stdout = "JSON.stringify(result);";
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings?type=key&per_page=${CF_PAGE_SIZE}`],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      try {
        await cfLocal.cfGetServiceKeys();
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(cliResult.error);
      }
    });
  });

  describe("cfGetInstanceMetadata", () => {
    const cliResult: CliResult = {
      exitCode: 0,
      error: "",
      stderr: "",
      stdout: "",
    };

    const spaceGuid = "spaceGuid";
    const planGuids = ["service_plan-guid-1", "service_plan-guid-3", "service_plan-guid-2", "service_plan-guid-4"];
    const serviceNames = ["test_service_name1", "test_service_name2", "test_service_name3", "test_service_name4"];
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

    beforeEach(() => {
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{"SpaceFields": { "GUID": "${spaceGuid}" } }`);
    });

    it("ok:: verify expecting data", async () => {
      const param = `/v3/service_instances?names=${serviceNames[0]}&type=managed&space_guids=${spaceGuid}&fields[service_plan]=guid,name&per_page=${CF_PAGE_SIZE}`;
      const plansResult = {
        resources: [
          {
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
        ],
      };
      cliResult.stdout = stringify(plansResult);
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(["curl", "/v3/service_plans/service_plan-guid-1?include=service_offering"], undefined, undefined)
        .resolves({ exitCode: 0, stdout: JSON.stringify(resultPlan) });
      const result = await cfLocal.cfGetInstanceMetadata(serviceNames[0]);
      assert.deepEqual(result, {
        plan_guid: planGuids[0],
        service: servicesNames[0],
        serviceName: serviceNames[0],
        plan: planName,
      });
    });

    it("exception:: service not found", async () => {
      cliResult.stdout = "{}";
      const param = `/v3/service_instances?names=${serviceNames[0]}&type=managed&space_guids=${spaceGuid}&fields[service_plan]=guid,name&per_page=${CF_PAGE_SIZE}`;
      cliMock.expects("execute").withArgs(["curl", param]).resolves(cliResult);
      try {
        await cfLocal.cfGetInstanceMetadata(serviceNames[0]);
      } catch (e) {
        expect(e.message).to.equal(messages.service_not_found(serviceNames[0]));
      }
    });
  });
});
