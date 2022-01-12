import type { Uri } from "vscode";
import { SinonMock, createSandbox, SinonSandbox } from "sinon";
import * as proxyquire from "proxyquire";
import { VscodeFileEventConfig } from "../../src/vscodeTypes";
import {
  configurationProxy,
  loggerProxy,
  utilProxy,
  loggerProxyObject,
} from "../moduleProxies";
import type { internal } from "../../src/autofix/eventUtil";

describe("eventUtil unit tests", () => {
  let sandbox: SinonSandbox;
  let configurationProxySinonMock: SinonMock;
  let utilProxySinonMock: SinonMock;
  let loggerProxySinonMock: SinonMock;
  let handlePkgJsonAutoFixProxy: typeof internal.handlePkgJsonAutoFix;

  const vscodeConfig = <VscodeFileEventConfig>{};

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    const eventUtilProxyModule = proxyquire("../../src/autofix/eventUtil", {
      "../logger/logger": loggerProxy,
      "./configuration": configurationProxy,
      "../util": utilProxy,
    });

    utilProxySinonMock = sandbox.mock(utilProxy);
    configurationProxySinonMock = sandbox.mock(configurationProxy);
    handlePkgJsonAutoFixProxy =
      eventUtilProxyModule.internal.handlePkgJsonAutoFix;
    loggerProxySinonMock = sandbox.mock(loggerProxyObject);
  });

  afterEach(() => {
    utilProxySinonMock.verify();
    configurationProxySinonMock.verify();
    loggerProxySinonMock.verify();
    sandbox.restore();
  });

  context("internal.handleProjectChange()", () => {
    it("autofix is disabled", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/package.json" };
      configurationProxySinonMock.expects("isAutoFixEnabled").returns(false);
      utilProxySinonMock.expects("findAndFixDepsIssues").never();

      await handlePkgJsonAutoFixProxy(uri, vscodeConfig);
    });

    it("path is in node_modules", async () => {
      const uri = <Uri>{
        fsPath: "root/folder/project/node_modules/packagefolder/package.json",
      };

      configurationProxySinonMock.expects("isAutoFixEnabled").returns(true);
      utilProxySinonMock.expects("findAndFixDepsIssues").never();
      loggerProxySinonMock.expects("trace");

      await handlePkgJsonAutoFixProxy(uri, vscodeConfig);
    });

    it("dependency issues can be fixed", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/package.json" };
      configurationProxySinonMock.expects("isAutoFixEnabled").returns(true);

      const { outputChannel, diagnosticCollection } = vscodeConfig;
      utilProxySinonMock
        .expects("findAndFixDepsIssues")
        .withExactArgs(uri, outputChannel)
        .resolves();
      utilProxySinonMock
        .expects("clearDiagnostics")
        .withExactArgs(diagnosticCollection, uri);
      loggerProxySinonMock.expects("trace").thrice();

      await handlePkgJsonAutoFixProxy(uri, vscodeConfig);
    });
  });
});
