import type { Uri } from "vscode";
import { SinonMock, createSandbox, SinonSandbox } from "sinon";
import * as proxyquire from "proxyquire";
import { VscodeFileEventConfig } from "../../src/vscodeTypes";
import { internal } from "../../src/autofix/eventUtil";
import { configurationProxy, utilProxy } from "../moduleProxies";

describe("eventUtil unit tests", () => {
  let sandbox: SinonSandbox;
  let configurationProxySinonMock: SinonMock;
  let utilProxySinonMock: SinonMock;
  let handleProjectChangeProxy: typeof internal.handleProjectChange;

  const vscodeConfig = <VscodeFileEventConfig>{};

  beforeEach(() => {
    sandbox = createSandbox();

    const eventUtilProxyModule = proxyquire("../../src/autofix/eventUtil", {
      "./configuration": configurationProxy,
      "../util": utilProxy,
    });

    utilProxySinonMock = sandbox.mock(utilProxy);
    configurationProxySinonMock = sandbox.mock(configurationProxy);
    handleProjectChangeProxy =
      eventUtilProxyModule.internal.handleProjectChange;
  });

  afterEach(() => {
    utilProxySinonMock.verify();
    configurationProxySinonMock.verify();
  });

  context("internal.handleProjectChange()", () => {
    it("autofix is disabled", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/package.json" };
      configurationProxySinonMock.expects("isAutoFixEnabled").returns(false);
      utilProxySinonMock.expects("findAndFixDepsIssues").never();

      await handleProjectChangeProxy(uri, vscodeConfig);
    });

    it("path is in node_modules", async () => {
      const uri = <Uri>{
        fsPath: "root/folder/project/node_modules/packagefolder/package.json",
      };

      utilProxySinonMock.expects("findAndFixDepsIssues").never();

      await handleProjectChangeProxy(uri, vscodeConfig);
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

      await handleProjectChangeProxy(uri, vscodeConfig);
    });
  });
});
