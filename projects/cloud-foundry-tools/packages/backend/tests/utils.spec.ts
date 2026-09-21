import { expect, assert } from "chai";
import * as sinon from "sinon";
import * as path from "path";
import * as fs from "fs";
import * as fsSync from "fs";
import _ = require("lodash");
import { stringify } from "comment-json";
import { fail } from "assert";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";

mockVscode(nsVsMock.testVscode, "src/utils.ts");
import * as utils from "../src/utils";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import { ServiceInstanceInfo, eFilters, ITarget } from "@sap/cf-tools";
import * as PropertiesReader from "properties-reader";
import * as messages from "../src/messages";

describe("utils unit tests", () => {
  let sandbox: sinon.SinonSandbox;
  let vscodeWorkspaceMock: sinon.SinonMock;
  let fsMock: sinon.SinonMock;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    vscodeWorkspaceMock = sandbox.mock(nsVsMock.testVscode.workspace);
    fsMock = sandbox.mock(fs.promises);
  });

  afterEach(() => {
    vscodeWorkspaceMock.verify();
    fsMock.verify();
    sandbox.restore();
  });

  describe("toText", () => {
    it("ok:: 'name' attribute defined", () => {
      const name = "test name";
      const e = new Error();
      e.name = name;
      expect(utils.toText(e)).to.be.equal(name);
    });

    it("ok:: 'message' attribute defined", () => {
      const message = "test description";
      const e = new Error(message);
      expect(utils.toText(e)).to.be.equal(message);
    });

    it("ok:: neither 'message' and 'name' attribute is defined", () => {
      const e = new Error();
      e.stack = "stack trace";
      expect(utils.toText(e)).to.be.equal(_.toString(e));
    });
  });

  describe("getEnvResources", () => {
    it("ok:: sanity with valid VCAP_SERVICES value", async () => {
      sandbox.stub(fsSync, "existsSync").returns(true);
      const envFilePath: string = path.join(__dirname, "resources", ".testValidEnv");
      const envResources = await utils.getEnvResources(envFilePath);
      const vcapServicesObj = envResources.vcapObject;
      expect(vcapServicesObj).to.not.be.empty;
      expect(vcapServicesObj.hana).to.exist;
    });

    it("ok:: sanity with valid VCAP_SERVICES value surrounded with single quotes", async () => {
      sandbox.stub(fsSync, "existsSync").returns(true);
      const envFilePath: string = path.join(__dirname, "resources", ".testValidEnvVCAPWithQuotes");
      const envResources = await utils.getEnvResources(envFilePath);
      const vcapServicesObj = envResources.vcapObject;
      expect(vcapServicesObj).to.not.be.empty;
      expect(vcapServicesObj.hana).to.exist;
    });

    it("ok:: sanity with valid VCAP_SERVICES value surrounded with single quotes and spaces", async () => {
      sandbox.stub(fsSync, "existsSync").returns(true);
      const envFilePath: string = path.join(__dirname, "resources", ".testValidEnvVCAPWithQuotesAndSpaces");
      const envResources = await utils.getEnvResources(envFilePath);
      const vcapServicesObj = envResources.vcapObject;
      expect(vcapServicesObj).to.not.be.empty;
      expect(vcapServicesObj.hana).to.exist;
    });

    it("fail:: invalid VCAP_SERVICES value in env file", async () => {
      sandbox.stub(fsSync, "existsSync").returns(true);
      const envFilePath: string = path.join(__dirname, "resources", ".testInValidVCAP");
      let vcapServicesObj;
      try {
        const envResources = await utils.getEnvResources(envFilePath);
        vcapServicesObj = envResources.vcapObject;
        fail("test should fail here");
      } catch (e) {
        expect(vcapServicesObj).to.be.undefined;
      }
    });

    it("ok:: '.env' file does not exist", async () => {
      sandbox.stub(fsSync, "existsSync").returns(false);
      const envFilePath: string = path.join(__dirname, "resources", ".notExists");
      expect((await utils.getEnvResources(envFilePath)).vcapObject).to.be.null;
    });

    it("ok:: '.env' file without VCAP_SERVICES key", async () => {
      sandbox.stub(fsSync, "existsSync").returns(true);
      const envFilePath: string = path.join(__dirname, "resources", ".envNoVCAP");
      expect((await utils.getEnvResources(envFilePath)).vcapObject).to.be.null;
    });
  });

  describe("Tests for removeResourceFromEnv when VCAP_SERVICES surrounded with quotes", () => {
    const envFilePath: string = path.join(__dirname, "resources", ".testValidEnvVCAPWithQuotes");
    const propReader = PropertiesReader(envFilePath);
    let vcapServicesObjBeforeChange: any;
    before(() => {
      sandbox = sinon.createSandbox();
      vcapServicesObjBeforeChange = propReader.get(utils.ENV_VCAP_RESOURCES);
    });

    afterEach(async () => {
      sandbox.restore();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      propReader.set(utils.ENV_VCAP_RESOURCES, vcapServicesObjBeforeChange);
      await propReader.save(envFilePath);
    });

    it("ok:: remove resource when VCAP is surrounded with single quotes and leave single quotes after removal", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "hana",
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext);
      const vcapServicesObjAfterChange: string | null = PropertiesReader(envFilePath).getRaw(utils.ENV_VCAP_RESOURCES);

      if (vcapServicesObjAfterChange) {
        expect(vcapServicesObjAfterChange).to.not.include("hana");
        expect(_.startsWith(vcapServicesObjAfterChange, "'")).to.be.true;
        expect(_.endsWith(vcapServicesObjAfterChange, "'")).to.be.true;
      } else {
        expect(fail("VCAP_SERVICES must exists and be empty after removing the last dependency"));
      }
    });
  });

  describe("Tests for removeResourceFromEnv", () => {
    const envFilePath: string = path.join(__dirname, "resources", ".envtest");
    const propReader = PropertiesReader(envFilePath);
    let vcapServicesObjBeforeChange: any;
    before(() => {
      sandbox = sinon.createSandbox();
      vcapServicesObjBeforeChange = propReader.get(utils.ENV_VCAP_RESOURCES);
    });

    afterEach(async () => {
      sandbox.restore();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      propReader.set(utils.ENV_VCAP_RESOURCES, vcapServicesObjBeforeChange);
      await propReader.save(envFilePath);
    });

    // does not work on linux ?! - clarification needed
    it("Test removeResourceFromEnv - exception thrown", async () => {
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath + "_readonly",
        },
        depContext: {
          type: "hana",
          data: {
            resourceTag: "tag-not-found:",
          },
          displayName: "bookshop-hdi-container",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      fsSync.chmodSync(bindContext.envPath.fsPath, 0o444);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await utils.removeResourceFromEnv(bindContext);
        fail("test should fail here");
      } catch (e) {
        // ...
      }
    });

    it("ok:: remove resource when it is not tagged & verify it is left unquoted as it was.", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "xsuaa",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext);
      const envPropertiesAfterChange = PropertiesReader(envFilePath);
      const vcapProperty: string = envPropertiesAfterChange.getRaw(utils.ENV_VCAP_RESOURCES) ?? "";
      expect(vcapProperty).to.not.include("xsuaa");
      expect(vcapProperty).to.include('"instance_name":"hdi-test-instance"');
      expect(vcapProperty).to.not.include("xsuaa");

      expect(_.startsWith(vcapProperty, "'")).to.be.false;
      expect(_.endsWith(vcapProperty, "'")).to.be.false;
    });

    it("ok:: remove resource when it is not tagged by wrong type", async () => {
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "_xsuaa",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext);
      assert.deepEqual(PropertiesReader(envFilePath).get(utils.ENV_VCAP_RESOURCES), vcapServicesObjBeforeChange);
    });

    it("ok:: remove resource when it has a tag", async () => {
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "hana",
          data: {
            resourceTag: "mta-resource-name:",
            resourceName: "bookshop-hdi-container",
          },
          displayName: "bookshop-hdi-container",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext);
      const envPropertiesAfterChange = PropertiesReader(envFilePath);
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.not.include(
        '"instance_name":"hdi-test-instance"'
      );
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.include("xsuaa");
    });

    it("ok:: remove resource when it has a tag, resource type has more then 1 instance (e.g. two dependencies bound to different instances)", async () => {
      let envPropertiesAfterChange;
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "hanatest",
          data: {
            resourceTag: "mta-resource-name:",
            resourceName: "hana1-mta",
          },
          displayName: "hana1-mta",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext);
      envPropertiesAfterChange = PropertiesReader(envFilePath);
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.include("hanatest");
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.include('"instance_name":"hana-2"');
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.not.include('"instance_name":"hana-1"');

      // Another remove should remove this key completely and not leave an empty array
      const bindContext2: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "hanatest",
          data: {
            resourceTag: "mta-resource-name:",
            resourceName: "hana2-mta",
          },
          displayName: "hana2-mta",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext2);
      envPropertiesAfterChange = PropertiesReader(envFilePath);
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.not.include("hanatest");
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.not.include('"instance_name":"hana-2"');
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.not.include('"instance_name":"hana-1"');
    });

    it("ok:: remove resource when it has a tag but it has not been found", async () => {
      const bindContext: any = {
        envPath: {
          fsPath: envFilePath,
        },
        depContext: {
          type: "hana",
          data: {
            resourceTag: "tag-not-found:",
          },
          displayName: "bookshop-hdi-container",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await utils.removeResourceFromEnv(bindContext);
      const envPropertiesAfterChange = PropertiesReader(envFilePath);
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.include('"instance_name":"hdi-test-instance"');
      expect(envPropertiesAfterChange.get(utils.ENV_VCAP_RESOURCES)).to.include("xsuaa");
    });
  });

  describe("API for creation service", () => {
    const plan = "application";
    it("generateParams4Service - xsuaa, plan - application", () => {
      const data = utils.generateParams4Service("xsuaa", plan);
      expect(_.startsWith(data.xsappname as string, "xsuaa_")).to.be.true;
      expect(data["tenant-mode"]).to.be.equal("dedicated");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(_.size(data["oauth2-configuration"]["redirect-uris"])).to.be.equal(1);
    });

    it("generateParams4Service - xsuaa, plan - other", () => {
      assert.deepEqual(utils.generateParams4Service("xsauu", "other"), {});
    });

    it("validateParams - other : valid", () => {
      expect(utils.validateParams("other")('{ "key" : "value" }')).to.be.undefined;
    });

    it("validateParams - other : incorrect", () => {
      expect(_.size(utils.validateParams("other")('{ "key" :: "value" }'))).to.be.gt(1);
    });

    it("validateParams - xsuaa : valid", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      expect(utils.validateParams("xsuaa", plan)(stringify(xsuaaData))).to.be.undefined;
    });

    it("validateParams - xsuaa : invalid xsappname", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      xsuaaData.xsappname = "xs.ass_345";
      expect(_.size(utils.validateParams("xsuaa", plan)(stringify(xsuaaData)))).to.be.gt(1);
    });

    it("validateParams - xsuaa : padded xsappname", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      xsuaaData.xsappname = "   ";
      expect(_.size(utils.validateParams("xsuaa", plan)(stringify(xsuaaData)))).to.be.gt(1);
    });

    it("validateParams - xsuaa : missing xsappname", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      delete xsuaaData.xsappname;
      expect(_.size(utils.validateParams("xsuaa", plan)(stringify(xsuaaData)))).to.be.gt(1);
    });

    it("validateParams - xsuaa : long xsappname", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      xsuaaData.xsappname = _.repeat("x", 103);
      expect(_.size(utils.validateParams("xsuaa", plan)(stringify(xsuaaData)))).to.be.gt(1);
    });

    it("validateParams - xsuaa : invalid tenant-mode", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      xsuaaData["tenant-mode"] = "lite";
      expect(_.size(utils.validateParams("xsuaa", plan)(stringify(xsuaaData)))).to.be.gt(1);
    });

    it("validateParams - xsuaa : invalid redirect-uris", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      xsuaaData["oauth2-configuration"]["redirect-uris"] = ["localhost://*", "localhos://*"];
      expect(_.size(utils.validateParams("xsuaa", plan)(stringify(xsuaaData)))).to.be.gt(1);
    });

    it("validateParams - xsuaa : missing redirect-uris", () => {
      const xsuaaData = utils.generateParams4Service("xsuaa", plan);
      delete xsuaaData["oauth2-configuration"]["redirect-uris"];
      expect(utils.validateParams("xsuaa", plan)(stringify(xsuaaData))).to.be.undefined;
    });
  });

  describe("suite for getAllServiceInstances", () => {
    const services: ServiceInstanceInfo[] = [
      { label: "s1", serviceName: "hana", plan: "s-plan-1", plan_guid: "s-plan-guid-1" },
      { label: "s1", serviceName: "hana", plan: "s-plan-2", plan_guid: "s-plan-guid-2" },
    ];
    const ups = [
      { label: "ups1", serviceName: "user-provided-service", credentials: { tags: ["monodb", "hana"] } },
      { label: "ups2", serviceName: "user-provided-service", credentials: { tags: ["david"] } },
    ];

    it("ok:: there are both kind of services", async () => {
      sandbox.stub(cfLocal, "cfGetManagedServiceInstances").resolves(services);
      sandbox.stub(cfLocal, "cfGetUpsInstances").resolves(ups);
      assert.deepEqual(await utils.getAllServiceInstances({ ups: { isShow: true } }), _.concat(services, ups));
    });

    it("ok:: contain 'managed' and 'ups' filtered services", async () => {
      sandbox.stub(cfLocal, "cfGetManagedServiceInstances").resolves(services);
      sandbox.stub(cfLocal, "cfGetUpsInstances").resolves(ups);
      assert.deepEqual(await utils.getAllServiceInstances({ ups: { tag: "/.*dav.*/" } }), _.concat(services, ups[1]));
    });

    it("ok:: ups services are not required", async () => {
      sandbox.stub(cfLocal, "cfGetManagedServiceInstances").resolves(services);
      sandbox.stub(cfLocal, "cfGetUpsInstances").resolves(ups);
      assert.deepEqual(await utils.getAllServiceInstances(), services);
    });

    it("ok:: there are ups filtered services", async () => {
      const opts = {
        query: {
          filters: [
            { key: eFilters.broker_catalog_ids, value: "test" },
            { key: eFilters.space_guids, value: "testSpace" },
          ],
        },
        ups: { tag: "monodb" },
      };
      const expectedQuery = _.cloneDeep(opts.query);
      expectedQuery.filters = [{ key: eFilters.space_guids, value: "testSpace" }];
      sandbox.stub(cfLocal, "cfGetManagedServiceInstances").resolves(services);
      sandbox.stub(cfLocal, "cfGetUpsInstances").withArgs(expectedQuery).resolves(ups);
      assert.deepEqual(await utils.getAllServiceInstances(opts), _.concat(services, ups[0]));
    });
  });

  describe("getUpsServiceInstances", () => {
    const ups = [
      { label: "ups1", serviceName: "user-provided-service", credentials: { tags: ["monodb", "hana"] } },
      { label: "ups2", serviceName: "user-provided-service", credentials: { tags: ["david"] } },
      { label: "ups3", serviceName: "user-provided-service", credentials: { tags: "hana" } },
      { label: "wrong-credential-tags", serviceName: "user-provided-service", credentials: { tags: 2 } },
      {
        label: "wrong-credential-tags2",
        serviceName: "user-provided-service",
        credentials: { tags: [2, { data: "hana" }] },
      },
      { label: "wrong-credential", serviceName: "user-provided-service" },
    ];

    it("ok:: get all user provides services, tags not specified", async () => {
      sandbox.stub(cfLocal, "cfGetUpsInstances").resolves(ups);
      assert.deepEqual(await utils.getUpsServiceInstances(), ups);
    });

    it("ok:: get all user provides services filtered by credential tag", async () => {
      const options = { credentials: { tag: "hana" } };
      sandbox.stub(cfLocal, "cfGetUpsInstances").resolves(ups);
      assert.deepEqual(await utils.getUpsServiceInstances(options), [ups[0], ups[2]]);
    });

    it("ok:: get all user provides services filtered by credential tag as regex expression", async () => {
      const options = { credentials: { tag: "/.*mono|vid.*/" } };
      sandbox.stub(cfLocal, "cfGetUpsInstances").resolves(ups);
      assert.deepEqual(await utils.getUpsServiceInstances(options), [ups[0], ups[1]]);
    });
  });

  const UTF8 = "utf8";
  const EOL = require("os").EOL;
  const GITIGNORE = ".gitignore";

  describe("updateGitIgnoreList suite", () => {
    const project = { uri: nsVsMock.testVscode.Uri.file(path.resolve("myProject")) };
    const ignorePattern = new nsVsMock.testVscode.RelativePattern(project, GITIGNORE);
    const gitIgnoreFile = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/${GITIGNORE}`));

    it("ok:: '.env' pattern added", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const gitIgnoreContent = _.join(["     # empty line"], EOL);
      const testEnv = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/subFolder/.env`));
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(project);
      vscodeWorkspaceMock.expects("findFiles").withExactArgs(ignorePattern).returns([gitIgnoreFile]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      fsMock.expects("readFile").withExactArgs(gitIgnoreFile.fsPath, { encoding: UTF8 }).resolves(gitIgnoreContent);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const patterns = _.split(gitIgnoreContent, EOL);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const expectedPatterns = _.join(_.concat(patterns, [`# auto generated wildcard`, "subFolder/.env"]), EOL);
      fsMock
        .expects("writeFile")
        .withExactArgs(gitIgnoreFile.fsPath, expectedPatterns, { encoding: UTF8 })
        .resolves(undefined);
      await utils.updateGitIgnoreList(testEnv.fsPath);
    });

    it("ok:: '.env' pattern not added - already exists", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const gitIgnoreContent = _.join(["     # empty line", "subFolder/.env"], EOL);
      const testEnv = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/subFolder/.env`));
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(project);
      vscodeWorkspaceMock.expects("findFiles").exactly(2).returns([testEnv]);
      fsMock.expects("readFile").resolves(gitIgnoreContent);
      fsMock.expects("writeFile").never();
      await utils.updateGitIgnoreList(testEnv.fsPath);
    });

    it("ok:: empty project", async () => {
      const testEnv = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/subFolder/.env`));
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(undefined);
      await utils.updateGitIgnoreList(testEnv.fsPath);
    });

    it("ok:: '.env' pattern added, .gitIgnore file not exist", async () => {
      const gitIgnoreContent = "";
      const testEnv = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/subFolder/.env`));
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(project);
      vscodeWorkspaceMock.expects("findFiles").withExactArgs(ignorePattern).returns([]);
      fsMock.expects("open").withExactArgs(path.resolve(gitIgnoreFile.fsPath), "w").resolves(undefined);
      fsMock.expects("readFile").withExactArgs(gitIgnoreFile.fsPath, { encoding: UTF8 }).resolves(gitIgnoreContent);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const patterns = _.split(gitIgnoreContent, EOL);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const expectedPatterns = _.join(_.concat(patterns, [`# auto generated wildcard`, "subFolder/.env"]), EOL);
      fsMock
        .expects("writeFile")
        .withExactArgs(gitIgnoreFile.fsPath, expectedPatterns, { encoding: UTF8 })
        .resolves(undefined);
      await utils.updateGitIgnoreList(testEnv.fsPath);
    });

    it("fail:: '.env' pattern NOT added, .gitIgnore file not exist, creation failed", async () => {
      const testEnv = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/subFolder/.env`));
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(project);
      vscodeWorkspaceMock.expects("findFiles").withExactArgs(ignorePattern).returns([]);
      fsMock.expects("open").withExactArgs(path.resolve(gitIgnoreFile.fsPath), "w").throws(new Error("access denied"));
      await utils.updateGitIgnoreList(testEnv.fsPath);
    });

    it("fail:: '.env' pattern NOT added, writeFile failed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const gitIgnoreContent = _.join(["     # empty line"], EOL);
      const testEnv = nsVsMock.testVscode.Uri.file(path.resolve(`${project.uri.fsPath}/subFolder/.env`));
      vscodeWorkspaceMock.expects("getWorkspaceFolder").returns(project);
      vscodeWorkspaceMock.expects("findFiles").withExactArgs(ignorePattern).returns([gitIgnoreFile]);
      fsMock.expects("readFile").withExactArgs(gitIgnoreFile.fsPath, { encoding: UTF8 }).resolves(gitIgnoreContent);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const patterns = _.split(gitIgnoreContent, EOL);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const expectedPatterns = _.join(_.concat(patterns, [`# auto generated wildcard`, "subFolder/.env"]), EOL);
      fsMock
        .expects("writeFile")
        .withExactArgs(gitIgnoreFile.fsPath, expectedPatterns, { encoding: UTF8 })
        .throws(new Error("access denied"));
      await utils.updateGitIgnoreList(testEnv.fsPath);
    });

    describe("notifyWhenServicesInfoResultIncomplete method", () => {
      let vscodeWindowMock: sinon.SinonMock;

      beforeEach(() => {
        vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
      });

      afterEach(() => {
        vscodeWindowMock.verify();
      });

      it("ok:: serviceInstanceInfo list is fullfilled", async () => {
        const infos: ServiceInstanceInfo[] = [
          {
            label: "instance-1",
            serviceName: "type-1",
            plan: "plan-1",
          },
          {
            label: "instance-2",
            serviceName: "type-2",
            plan: "plan-2",
          },
        ];
        expect(await utils.notifyWhenServicesInfoResultIncomplete(Promise.resolve(infos))).to.be.deep.equal(infos);
      });

      it("ok:: serviceInstanceInfo list is empty", async () => {
        const list = Promise.resolve([]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect(await utils.notifyWhenServicesInfoResultIncomplete(list)).to.be.deep.equal([]);
      });

      it("ok:: serviceInstanceInfo list is incomplete", async () => {
        const infos: ServiceInstanceInfo[] = [
          {
            label: "instance-1",
            serviceName: "unknown",
            plan: "plan-1",
          },
        ];
        vscodeWindowMock
          .expects("showWarningMessage")
          .withExactArgs(messages.messages.service_instances_list_incomplete(_.map(infos, "label")))
          .resolves();
        expect(await utils.notifyWhenServicesInfoResultIncomplete(Promise.resolve(infos))).to.be.deep.equal(infos);
      });

      it("ok:: serviceInstanceInfo list is incomplete more than 3 instances", async () => {
        const infos: ServiceInstanceInfo[] = [
          {
            label: "instance-1",
            serviceName: "unknown",
            plan: "plan-1",
          },
          {
            label: "instance-2",
            serviceName: "type-2",
            plan: "unknown",
          },
          {
            label: "instance-3",
            serviceName: "type-3",
            plan: "unknown",
          },
          {
            label: "instance-4",
            serviceName: "type-4",
            plan: "unknown",
          },
        ];
        vscodeWindowMock
          .expects("showWarningMessage")
          .withExactArgs(messages.messages.service_instances_list_incomplete(_.map(infos, "label")))
          .resolves();
        expect(await utils.notifyWhenServicesInfoResultIncomplete(Promise.resolve(infos))).to.be.deep.equal(infos);
      });
    });

    describe("verifyCFTarget", () => {
      const target: ITarget = {
        "api endpoint": "endPoint",
        org: "test-org",
        space: "test-space",
        user: "user",
        "api version": "3.100.0",
      };

      it("ok:: validate", async () => {
        sandbox.stub(cfLocal, "cfGetTarget").resolves(target);
        expect(await utils.examCFTarget("", ["user"], false)).to.be.deep.equal(target);
      });

      it("error:: invalid key requested", async () => {
        sandbox.stub(cfLocal, "cfGetTarget").resolves(target);
        const error = "invalid key";
        try {
          await utils.examCFTarget(error, ["user", "wrong"], false);
          fail("should fail");
        } catch (e) {
          expect(e.message).to.be.equal(error);
        }
      });

      it("ok:: weak mode", async () => {
        const t: ITarget = { "api endpoint": "endPoint", user: "user", "api version": "3.100.0" };
        sandbox.stub(cfLocal, "cfGetTarget").resolves(t);
        expect(await utils.examCFTarget("", ["api endpoint"], true)).to.be.deep.equal(t);
      });

      it("exception:: throws error", async () => {
        const text = "error text";
        sandbox.stub(cfLocal, "cfGetTarget").throws(new Error(text));
        try {
          await utils.examCFTarget("", [], false);
          fail("should fail");
        } catch (e) {
          expect(e.message).to.be.equal(text);
        }
      });
    });
  });
});
