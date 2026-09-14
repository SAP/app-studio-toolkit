import { expect, assert } from "chai";
import * as _ from "lodash";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import * as fs from "fs";
import * as cfLocal from "../src/cf-local";
import * as cli from "../src/cli";
import { fail } from "assert";
import { CliResult, CF_PAGE_SIZE, eFilters, eServiceTypes, DEFAULT_TARGET } from "../src/types";
import { stringify, parse } from "comment-json";
import { messages } from "../src/messages";
import { cfGetConfigFilePath } from "../src/utils";

describe("cf-local-b unit tests", () => {
  let sandbox: SinonSandbox;
  let cliMock: SinonMock;
  let fsMock: SinonMock;

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

  describe("cfGetTarget", () => {
    const testArgs = ["target"];
    const testOptions = { env: { CF_COLOR: "false" } };
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };

    const endpoint = "https://api.cf.sap.hana.ondemand.com";
    const org = "devx2";
    const space = "platform2";
    const user = "testUser";
    const apiVer = "2.146.0";
    const noSpace = "No space targeted, use 'cf target -s SPACE'";
    const noOrgNoSpace = "No org or space targeted, use 'cf target -o ORG -s SPACE'";

    it("ok:: target - no space targeted", async () => {
      cliResult.stdout = `"Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"
            "user:           ${user}"
            "org:            ${org}"
            ${noSpace}`;
      cliMock.expects("execute").withExactArgs(testArgs, testOptions, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetTarget(true);
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
      expect(result.user).to.be.equal(user);
      expect(result.org).to.be.equal(org);
      expect(result.space).to.be.equal(undefined);
    });

    it("ok:: target - no space no org targeted", async () => {
      cliResult.stdout = `"Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"
            "user:           ${user}"
            ${noOrgNoSpace}`;
      cliMock.expects("execute").withExactArgs(testArgs, testOptions, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetTarget(true);
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
      expect(result.user).to.be.equal(user);
      expect(result.org).to.be.equal(undefined);
      expect(result.space).to.be.equal(undefined);
    });

    it("ok:: full tagret set", async () => {
      cliResult.stdout = `"Api endpoint:   ${endpoint}"
            "Api version:    ${apiVer}"
            "user:           ${user}"
            "org:            ${org}"
            "space:          ${space}"
            `;
      cliMock.expects("execute").withExactArgs(testArgs, testOptions, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetTarget(true);
      expect(result["api endpoint"]).to.be.equal(endpoint);
      expect(result["api version"]).to.be.equal(apiVer);
      expect(result.user).to.be.equal(user);
      expect(result.org).to.be.equal(org);
      expect(result.space).to.be.equal(space);
    });

    it("exception:: target - error, not logged in", async () => {
      cliResult.stdout = `FAILED
            `;
      cliResult.stderr = `Not logged in. Use 'cf login' or 'cf login --sso' to log in.
            `;
      cliResult.exitCode = 1;
      cliMock.expects("execute").withExactArgs(testArgs, testOptions, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetTarget(true);
        fail("test should fail");
      } catch (e) {
        expect(_.get(e, "message")).to.be.equal(cliResult.stderr);
      }
    });

    it("exception:: target - error", async () => {
      cliResult.stdout = `FAILED
            `;
      cliResult.stderr = "";
      cliResult.exitCode = 1;
      cliMock.expects("execute").withExactArgs(testArgs, testOptions, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetTarget(true);
        fail("test should fail");
      } catch (e) {
        expect(_.get(e, "message")).to.be.equal(cliResult.stdout);
      }
    });

    it("exception:: target - no space targeted - auth-token expired", async () => {
      cliResult.stdout = ``;
      cliResult.stderr = `authentication error`;
      cliResult.exitCode = 1;
      cliMock.expects("execute").withExactArgs(["oauth-token"], undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetTarget();
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(cliResult.stderr);
      }
    });

    it("exception:: targets error", async () => {
      cliResult.stdout = "";
      cliResult.stderr = "testError";
      cliResult.exitCode = 1;
      cliResult.error = "target error";
      cliMock.expects("execute").withExactArgs(["targets"], undefined, undefined).resolves(cliResult);
      try {
        await cfLocal.cfGetTargets();
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(cliResult.error);
      }
    });

    it("ok:: no targets have been saved yet", async () => {
      cliResult.stdout = "test - No targets have been saved yet";
      cliResult.error = "";
      cliResult.stderr = "";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(["targets"], undefined, undefined).resolves(cliResult);
      const expectedResult = [{ label: DEFAULT_TARGET, isCurrent: true, isDirty: false }];
      const result = await cfLocal.cfGetTargets();
      expect(result).to.be.deep.equal(expectedResult);
    });

    it("ok:: is not a registered command", async () => {
      cliResult.stdout = "test - is not a registered command";
      cliResult.error = "";
      cliMock.expects("execute").withExactArgs(["targets"], undefined, undefined).resolves(cliResult);
      const expectedResult = [{ label: DEFAULT_TARGET, isCurrent: true, isDirty: false }];
      const result = await cfLocal.cfGetTargets();
      expect(result).to.be.deep.equal(expectedResult);
    });

    it("ok:: cliResult.stdout is empty string", async () => {
      cliResult.stdout = "";
      cliResult.error = "";
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(["targets"], undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetTargets();
      expect(result).to.be.empty;
    });

    it("ok:: there is '(current' in parentthesisPos", async () => {
      cliResult.stdout = "test modified (current  test";
      cliResult.error = "";
      cliMock.expects("execute").withExactArgs(["targets"], undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetTargets();
      expect(result).to.be.deep.equal([{ label: "test modified", isCurrent: true, isDirty: true }]);
    });

    it("ok:: no '(current' in parentthesisPos", async () => {
      cliResult.stdout = "test substring";
      cliResult.error = "";
      cliMock.expects("execute").withExactArgs(["targets"], undefined, undefined).resolves(cliResult);
      const result = await cfLocal.cfGetTargets();
      expect(result).to.be.deep.equal([{ label: cliResult.stdout, isCurrent: false, isDirty: false }]);
    });
  });

  describe("cfGetUpsInstances", () => {
    const spaceGuid = "testSpaceGUID";
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };

    it("ok:: instances found, few calls for credentials are wrong", async () => {
      cliResult.exitCode = 0;
      cliResult.error = "";
      const guids = ["guid-1", "guid-2"];
      const expectedOutput = {
        resources: [
          {
            name: "test_service_name1",
            type: eServiceTypes.user_provided,
            guid: guids[0],
          },
          {
            name: "test_service_name2",
            type: eServiceTypes.user_provided,
            tags: ["hana", "mongodb"],
            guid: guids[1],
          },
        ],
      };
      const credentialsOutput = {
        user_name: "user",
        pswd: "pswd",
      };

      cliResult.stdout = stringify(expectedOutput);
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          `/v3/service_instances?space_guids=${spaceGuid}&type=user-provided&per_page=${CF_PAGE_SIZE}`,
        ])
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withArgs(["curl", `/v3/service_instances/${guids[0]}/credentials`])
        .resolves({ stdout: stringify(credentialsOutput), exitCode: 0 });
      cliMock
        .expects("execute")
        .withArgs(["curl", `/v3/service_instances/${guids[1]}/credentials`])
        .resolves({ stdout: stringify({ errors: [{ error: "error" }] }), exitCode: 0 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {
        page: null,
        wrongKey: "",
        filters: [{ key: eFilters.space_guids, value: spaceGuid }],
        per_page: CF_PAGE_SIZE,
      };
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      const result = await cfLocal.cfGetUpsInstances(query);
      expect(result).to.have.lengthOf(2);
      expect(result[0].guid).to.be.equal("guid-1");
      expect(result[0].label).to.be.equal("test_service_name1");
      expect(result[0].serviceName).to.be.equal("user-provided");
      assert.deepEqual(result[0].tags, []);
      assert.deepEqual(result[0].credentials, credentialsOutput);
      expect(result[1].guid).to.be.equal("guid-2");
      expect(result[1].label).to.be.equal("test_service_name2");
      expect(result[1].serviceName).to.be.equal("user-provided");
      assert.deepEqual(result[1].tags, ["hana", "mongodb"]);
      assert.deepEqual(result[1].credentials, {});
    });

    it("ok:: no instances found", async () => {
      cliResult.exitCode = 0;
      cliResult.error = "";
      const expectedOutput = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resources: [] as any[],
      };
      cliResult.stdout = stringify(expectedOutput);
      cliMock
        .expects("execute")
        .withArgs([
          "curl",
          `/v3/service_instances?space_guids=${spaceGuid}&type=user-provided&per_page=${CF_PAGE_SIZE}`,
        ])
        .resolves(cliResult);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {
        page: null,
        wrongKey: "",
        filters: [{ key: eFilters.space_guids, value: spaceGuid }],
        per_page: CF_PAGE_SIZE,
      };
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      expect(await cfLocal.cfGetUpsInstances(query)).to.be.empty;
    });
  });

  describe("bindLocalUps", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const filePath = "testFilePath";
    const instanceNames: string[] = ["name-test-i+!_@)#($*%&^&-(ups)", "name-NHY&*^%$+_*-1mznx"];
    const tags: string[] = ["tag1", "tag2"];

    it("ok:: instance names contains specials chars", async () => {
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "bind-local-ups",
            "-path",
            filePath,
            "-service-names",
            instanceNames[0],
            "-service-names",
            instanceNames[1],
            "-tags",
            tags[0],
            "-tags",
            tags[1],
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfBindLocalUps(filePath, instanceNames, tags);
    });

    it("ok:: cfBindLocalUps with quote-vcap", async () => {
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "bind-local-ups",
            "-path",
            filePath,
            "-service-names",
            instanceNames[0],
            "-service-names",
            instanceNames[1],
            "-tags",
            tags[0],
            "-tags",
            tags[1],
            "-quote-vcap",
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      await cfLocal.cfBindLocalUps(filePath, instanceNames, tags, true);
    });
  });

  describe("cfLogout", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };

    it("ok:: logout", async () => {
      cliResult.stdout = ``;
      cliResult.stderr = ``;
      cliResult.exitCode = 0;
      cliMock.expects("execute").withExactArgs(["logout"], undefined, undefined).resolves(cliResult);
      await cfLocal.cfLogout();
    });
  });

  describe("cfCreateUpsInstance:: creation user-provided-service-instances instances", () => {
    const cliResult: CliResult = {
      stdout: `{ "metadata": {}, "entity": { "name": "myInstance" }}`,
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const spaceGuid = "testSpaceGUID";
    const instanceName = "myInstance";
    const tags = ["foo", "bar", "baz"];
    const data = {
      name: instanceName,
      type: "user-provided",
      tags: tags,
      relationships: {
        space: {
          data: {
            guid: spaceGuid,
          },
        },
      },
    };

    it("ok:: space not provided - default value set", async () => {
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{ "SpaceFields": { "GUID": "${spaceGuid}" }}`);
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"name":"myInstance","type":"user-provided","relationships":{"space":{"data":{"guid":"testSpaceGUID"}}},"tags":["foo","bar","baz"]}`,
            "-X",
            "POST",
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      expect(await cfLocal.cfCreateUpsInstance({ instanceName, tags })).to.deep.equal(parse(cliResult.stdout));
    });

    it("ok:: space value specified", async () => {
      const mySpace = "mySpaceGUID";
      fsMock.expects("readFile").never();
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"name":"myInstance","type":"user-provided","relationships":{"space":{"data":{"guid":"${mySpace}"}}}}`,
            "-X",
            "POST",
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      expect(await cfLocal.cfCreateUpsInstance({ instanceName: instanceName, space_guid: mySpace })).to.deep.equal(
        parse(cliResult.stdout),
      );
    });

    it("exception:: space value not specified, default is unavailable", async () => {
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{ "SpaceFields": { "GUIDI": "${spaceGuid}" }}`);
      cliMock
        .expects("execute")
        .withArgs(["curl", "/v3/service_instances", "-d", "-X", "POST"], undefined, undefined)
        .never();
      try {
        await cfLocal.cfCreateUpsInstance({ instanceName: instanceName });
        fail("should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.cf_setting_not_set);
      }
    });

    it("ok:: more params are provided for instance creation", async () => {
      const cred = { user: "password" };
      const serviceUrl = "service://location.org";
      const drainUrl = "drain://location.org";
      const tags = ["tag1", "myTag", "mono"];
      const copyData = _.cloneDeep(data);
      _.merge(
        copyData,
        { credentials: cred },
        { route_service_url: serviceUrl },
        { syslog_drain_url: drainUrl },
        { tags: tags },
      );
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{ "SpaceFields": { "GUID": "${spaceGuid}" }}`);
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            "/v3/service_instances",
            "-d",
            `{"name":"myInstance","type":"user-provided","relationships":{"space":{"data":{"guid":"testSpaceGUID"}}},"credentials":{"user":"password"},"route_service_url":"service://location.org","syslog_drain_url":"drain://location.org","tags":["tag1","myTag","mono"]}`,
            "-X",
            "POST",
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      expect(
        await cfLocal.cfCreateUpsInstance({
          instanceName: instanceName,
          credentials: cred,
          route_service_url: serviceUrl,
          syslog_drain_url: drainUrl,
          tags,
        }),
      ).to.deep.equal(parse(cliResult.stdout));
    });
  });

  describe("cfGetInstanceCredentials", () => {
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
        {
          guid: "badbadbad-6ccb-4ef9-ba48-9ce3a91b2b62",
          created_at: "2015-11-13T17:02:56Z",
          updated_at: "2016-06-08T16:41:26Z",
          name: "other-key-name",
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
    const details = {
      credentials: {
        connection: "mydb://user@password:example.com",
      },
      syslog_drain_url: "http://syslog.example.com/drain",
      volume_mounts: ["/vcap/data", "store"],
    };

    it("ok:: verify result structure", async () => {
      const cliResult: CliResult = {
        exitCode: 0,
        stderr: "",
        stdout: stringify(result),
      };
      const instanceName = "instance";
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings?names=${instanceName}&type=key&per_page=${CF_PAGE_SIZE}`],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[0].guid}/details`],
          undefined,
          undefined,
        )
        .resolves({ exitCode: 0, stdout: stringify(details) });
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[1].guid}/details`],
          undefined,
          undefined,
        )
        .resolves({ exitCode: 0, stdout: stringify(details) });
      const output = await cfLocal.cfGetInstanceCredentials({
        filters: [{ key: eFilters.names, value: instanceName }],
      });
      expect(_.size(output)).be.equal(2);
      assert.deepEqual(output[0], details);
      assert.deepEqual(output[1], details);
    });

    it("ok:: any of details/parameters call fails", async () => {
      const cliResult: CliResult = {
        exitCode: 0,
        stderr: "",
        stdout: stringify(result),
      };
      const instanceName = "instance";
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings?names=${instanceName}&type=key&per_page=${CF_PAGE_SIZE}`],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[0].guid}/details`],
          undefined,
          undefined,
        )
        .resolves({ exitCode: 0, stdout: stringify(details) });
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[1].guid}/details`],
          undefined,
          undefined,
        )
        .rejects(new Error("error"));
      const output = await cfLocal.cfGetInstanceCredentials({
        filters: [{ key: eFilters.names, value: instanceName }],
      });
      expect(_.size(output)).be.equal(2);
      assert.deepEqual(output[0], details);
      assert.deepEqual(output[1], {});
    });

    it("ok:: not found", async () => {
      const cliResult: CliResult = {
        exitCode: 0,
        stderr: "",
        stdout: stringify({
          resources: [],
        }),
      };
      const instanceName = "instance";
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings?names=${instanceName}&type=key&per_page=${CF_PAGE_SIZE}`],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      const output = await cfLocal.cfGetInstanceCredentials({
        filters: [{ key: eFilters.names, value: instanceName }],
      });
      assert.deepEqual(output, []);
    });
  });

  describe("cfGetInstanceKeyParameters", () => {
    const instanceName = "test-Instance+%$#!Name";
    const instanceGuid = "test-guid-9876";
    const spaceGuid = "spaceGuid-10290-3948";
    const output = {
      resources: [
        {
          name: instanceName,
          guid: instanceGuid,
          last_operation: {
            state: "succeess",
          },
        },
      ],
    };

    const result = {
      pagination: {
        total_results: 1,
        total_pages: 1,
      },
      resources: [
        {
          guid: "7aa37bad-6ccb-4ef9-ba48-9ce3a91b2b62",
          created_at: "2015-11-13T17:02:56Z",
          updated_at: "2016-06-08T16:41:26Z",
          name: "some-key-name",
          type: "key",
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
        },
        {
          guid: "badbadbad-6ccb-4ef9-ba48-9ce3a91b2b62",
          created_at: "2015-11-13T17:02:56Z",
          updated_at: "2016-06-08T16:41:26Z",
          name: "other-key-name",
          type: "key",
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
        },
      ],
    };

    const details = {
      credentials: {
        connection: "mydb://user@password:example.com",
      },
      syslog_drain_url: "http://syslog.example.com/drain",
      volume_mounts: ["/vcap/data", "store"],
    };

    beforeEach(() => {
      fsMock.expects("readFile").withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" }).resolves(`{"SpaceFields": {
                "GUID": "${spaceGuid}"
            }}`);
    });

    it("ok:: verify result structure", async () => {
      const cliResult: CliResult = {
        exitCode: 0,
        stderr: "",
        stdout: stringify(result),
      };
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_instances?names=${encodeURIComponent(
              instanceName,
            )}&type=managed&space_guids=${spaceGuid}&per_page=297`,
          ],
          undefined,
          undefined,
        )
        .resolves({
          exitCode: 0,
          stdout: JSON.stringify(output),
        });
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_credential_bindings?service_instance_guids=${instanceGuid}&type=key&per_page=${CF_PAGE_SIZE}`,
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[0].guid}/details`],
          undefined,
          undefined,
        )
        .resolves({ exitCode: 0, stdout: stringify(details) });
      const params = await cfLocal.cfGetInstanceKeyParameters(instanceName);
      assert.deepEqual(params, details);
    });

    it("ok:: service key credentials fetching error", async () => {
      const cliResult: CliResult = {
        exitCode: 0,
        stderr: "",
        stdout: stringify(result),
      };
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_instances?names=${encodeURIComponent(
              instanceName,
            )}&type=managed&space_guids=${spaceGuid}&per_page=297`,
          ],
          undefined,
          undefined,
        )
        .resolves({
          exitCode: 0,
          stdout: JSON.stringify(output),
        });
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_credential_bindings?service_instance_guids=${instanceGuid}&type=key&per_page=${CF_PAGE_SIZE}`,
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[0].guid}/details`],
          undefined,
          undefined,
        )
        .rejects({ exitCode: 0, stdout: stringify({ errors: { error: { code: "111" } } }) });
      const params = await cfLocal.cfGetInstanceKeyParameters(instanceName);
      expect(params).be.empty;
    });

    it("exception:: service not found", async () => {
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_instances?names=${encodeURIComponent(
              instanceName,
            )}&type=managed&space_guids=${spaceGuid}&per_page=297`,
          ],
          undefined,
          undefined,
        )
        .resolves({
          exitCode: 0,
          stdout: JSON.stringify({ resources: [] }),
        });
      try {
        await cfLocal.cfGetInstanceKeyParameters(instanceName);
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.equal(messages.service_not_found(instanceName));
      }
    });

    it("ok:: there are not keys, create one", async () => {
      const keysResult = _.cloneDeep(result);
      keysResult.resources = [_.head(keysResult.resources)];
      const cliResult: CliResult = {
        exitCode: 0,
        stderr: "",
        stdout: stringify(keysResult),
      };
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_instances?names=${encodeURIComponent(
              instanceName,
            )}&type=managed&space_guids=${spaceGuid}&per_page=297`,
          ],
          undefined,
          undefined,
        )
        .resolves({
          exitCode: 0,
          stdout: JSON.stringify(output),
        });
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_credential_bindings?service_instance_guids=${instanceGuid}&type=key&per_page=${CF_PAGE_SIZE}`,
          ],
          undefined,
          undefined,
        )
        .resolves({ exitCode: 0, stdout: '{"resources": []}' });
      cliMock
        .expects("execute")
        .withExactArgs(
          [
            "curl",
            `/v3/service_credential_bindings?service_instance_guids=${instanceGuid}&type=key&names=key&per_page=${CF_PAGE_SIZE}`,
          ],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/service_credential_bindings/${result.resources[0].guid}/details`],
          undefined,
          undefined,
        )
        .resolves({ exitCode: 0, stdout: stringify(details) });
      cliMock
        .expects("execute")
        .withExactArgs(["create-service-key", encodeURIComponent(instanceName), "key", "--wait"])
        .resolves();
      const params = await cfLocal.cfGetInstanceKeyParameters(instanceName);
      assert.deepEqual(params, details);
    });
  });

  describe("cfGetApps", () => {
    const cliResult: CliResult = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      error: "",
    };
    const result = {
      pagination: {
        total_results: 3,
        total_pages: 1,
        first: {
          href: "https://api.example.org/v3/apps?page=1&per_page=2",
        },
        last: {
          href: "https://api.example.org/v3/apps?page=2&per_page=2",
        },
        next: {
          href: "",
        },
        previous: "",
      },
      resources: [
        {
          guid: "1cb006ee-fb05-47e1-b541-c34179ddc446",
          name: "my_app",
          state: "STARTED",
          created_at: "2016-03-17T21:41:30Z",
          updated_at: "2016-03-18T11:32:30Z",
          lifecycle: {
            type: "buildpack",
            data: {
              buildpacks: ["java_buildpack"],
              stack: "cflinuxfs3",
            },
          },
          relationships: {
            space: {
              data: {
                guid: "2f35885d-0c9d-4423-83ad-fd05066f8576",
              },
            },
          },
          links: {
            self: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446",
            },
            space: {
              href: "https://api.example.org/v3/spaces/2f35885d-0c9d-4423-83ad-fd05066f8576",
            },
            processes: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/processes",
            },
            packages: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/packages",
            },
            environment_variables: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/environment_variables",
            },
            current_droplet: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/droplets/current",
            },
            droplets: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/droplets",
            },
            tasks: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/tasks",
            },
            start: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/actions/start",
              method: "POST",
            },
            stop: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/actions/stop",
              method: "POST",
            },
            revisions: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/revisions",
            },
            deployed_revisions: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/revisions/deployed",
            },
            features: {
              href: "https://api.example.org/v3/apps/1cb006ee-fb05-47e1-b541-c34179ddc446/features",
            },
          },
          metadata: {
            labels: {},
            annotations: {},
          },
        },
        {
          guid: "02b4ec9b-94c7-4468-9c23-4e906191a0f8",
          name: "my_app2",
          state: "STOPPED",
          created_at: "1970-01-01T00:00:02Z",
          updated_at: "2016-06-08T16:41:26Z",
          lifecycle: {
            type: "buildpack",
            data: {
              buildpacks: ["ruby_buildpack"],
              stack: "cflinuxfs3",
            },
          },
          relationships: {
            space: {
              data: {
                guid: "2f35885d-0c9d-4423-83ad-fd05066f8576",
              },
            },
          },
          links: {
            self: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8",
            },
            space: {
              href: "https://api.example.org/v3/spaces/2f35885d-0c9d-4423-83ad-fd05066f8576",
            },
            processes: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/processes",
            },
            packages: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/packages",
            },
            environment_variables: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/environment_variables",
            },
            current_droplet: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/droplets/current",
            },
            droplets: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/droplets",
            },
            tasks: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/tasks",
            },
            start: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/actions/start",
              method: "POST",
            },
            stop: {
              href: "https://api.example.org/v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/actions/stop",
              method: "POST",
            },
            revisions: {
              href: "https://api.example.org//v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/revisions",
            },
            deployed_revisions: {
              href: "https://api.example.org//v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/revisions/deployed",
            },
            features: {
              href: "https://api.example.org//v3/apps/02b4ec9b-94c7-4468-9c23-4e906191a0f8/features",
            },
          },
          metadata: {
            labels: {},
            annotations: {},
          },
        },
      ],
    };

    it("exception:: no valid filters provided", async () => {
      try {
        await cfLocal.cfGetApps({ filters: [{ key: eFilters.service_broker_names, value: "broker-name" }] });
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(messages.not_allowed_filter(eFilters.service_broker_names, "apps"));
      }
    });

    it("ok:: filters names provided", async () => {
      const spaceGuid = "spaceGuid";
      cliResult.exitCode = 0;
      cliResult.stdout = stringify(result);
      const value = "app";
      fsMock
        .expects("readFile")
        .withExactArgs(cfGetConfigFilePath(), { encoding: "utf8" })
        .resolves(`{ "SpaceFields": { "GUID": "${spaceGuid}" }}`);
      cliMock
        .expects("execute")
        .withExactArgs(
          ["curl", `/v3/apps?names=${value}&space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`],
          undefined,
          undefined,
        )
        .resolves(cliResult);
      const answer = await cfLocal.cfGetApps({ filters: [{ key: eFilters.names, value }] });
      assert.deepEqual(answer, result.resources);
    });

    it("exception:: rejected error", async () => {
      const spaceGuid = "spaceGuid";
      cliResult.exitCode = 1;
      cliResult.error = "some error";
      cliResult.stdout = "JSON.stringify(result);";
      cliMock
        .expects("execute")
        .withExactArgs(["curl", `/v3/apps?space_guids=${spaceGuid}&per_page=${CF_PAGE_SIZE}`], undefined, undefined)
        .resolves(cliResult);
      try {
        await cfLocal.cfGetApps({ filters: [{ key: eFilters.space_guids, value: spaceGuid }] });
        fail("test should fail");
      } catch (e) {
        expect(e.message).to.be.equal(cliResult.error);
      }
    });
  });
});
