import type { Uri } from "vscode";
import * as proxyquire from "proxyquire";
import { VscodeFileEventConfig } from "../../src/vscodeTypes";
import { handlePackageJsonEvent } from "../../src/autofix/eventUtil";
import { configurationProxy, utilProxy } from "../moduleProxies";
import { SinonMock, createSandbox, SinonSandbox } from "sinon";

describe("eventUtil unit tests", () => {
  let sandbox: SinonSandbox;
  const vscodeConfig = <VscodeFileEventConfig>{};
  let configurationProxySinonMock: SinonMock;
  let utilProxySinonMock: SinonMock;
  let handlePackageJsonEventProxy: typeof handlePackageJsonEvent;

  beforeEach(() => {
    sandbox = createSandbox();

    const eventUtilProxyModule = proxyquire("../../src/autofix/eventUtil", {
      "../util": utilProxy,
      "./configuration": configurationProxy,
    });

    utilProxySinonMock = sandbox.mock(utilProxy);
    configurationProxySinonMock = sandbox.mock(configurationProxy);
    handlePackageJsonEventProxy = eventUtilProxyModule.handlePackageJsonEvent;
  });

  afterEach(() => {
    utilProxySinonMock.verify();
    configurationProxySinonMock.verify();
  });

  context("handlePackageJsonEvent()", () => {
    it("autofix is disabled", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/package.json" };
      configurationProxySinonMock.expects("isAutoFixEnabled").returns(false);
      utilProxySinonMock.expects("findAndFixDepsIssues").never();

      await handlePackageJsonEventProxy(uri, vscodeConfig);
    });

    it("path is in node_modules", async () => {
      const uri = <Uri>{
        fsPath: "root/folder/project/node_modules/packagefolder/package.json",
      };
      configurationProxySinonMock.expects("isAutoFixEnabled").returns(true);
      utilProxySinonMock.expects("isNotInNodeModules").returns(false);
      utilProxySinonMock.expects("findAndFixDepsIssues").never();

      await handlePackageJsonEventProxy(uri, vscodeConfig);
    });

    it("dependency issues can be fixed", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/package.json" };
      configurationProxySinonMock.expects("isAutoFixEnabled").returns(true);
      utilProxySinonMock.expects("isNotInNodeModules").returns(true);
      const { outputChannel, diagnosticCollection } = vscodeConfig;
      utilProxySinonMock
        .expects("findAndFixDepsIssues")
        .withExactArgs(uri, outputChannel)
        .resolves();
      utilProxySinonMock
        .expects("clearDiagnostics")
        .withExactArgs(diagnosticCollection, uri);

      await handlePackageJsonEventProxy(uri, vscodeConfig);
    });
  });
});
