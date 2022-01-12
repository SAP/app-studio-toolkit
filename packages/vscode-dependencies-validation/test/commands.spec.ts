import type { DiagnosticCollection, Uri } from "vscode";
import * as proxyquire from "proxyquire";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { internal } from "../src/commands";
import { outputChannelMock } from "./vscodeMocks";
import { utilProxy } from "./moduleProxies";

describe("commands unit test", () => {
  let sandbox: SinonSandbox;
  let outputChannelSinonMock: SinonMock;
  let utilProxySinonMock: SinonMock;

  beforeEach(() => {
    sandbox = createSandbox();
    outputChannelSinonMock = sandbox.mock(outputChannelMock);
    utilProxySinonMock = sandbox.mock(utilProxy);
  });

  afterEach(() => {
    outputChannelSinonMock.verify();
    utilProxySinonMock.verify();
    sandbox.restore();
  });

  context("fixProjectDepsIssues()", () => {
    let fixProjectDepsIssuesProxy: typeof internal.fixProjectDepsIssues;

    before(() => {
      const commandsModule = proxyquire("../src/commands", {
        "./util": utilProxy,
      });

      fixProjectDepsIssuesProxy = commandsModule.internal.fixProjectDepsIssues;
    });

    it("succeeded", async () => {
      const packageJsonPath = "root/folder/package.json";
      const uri = <Uri>{ fsPath: packageJsonPath };
      const diagnosticCollection = <DiagnosticCollection>{};

      outputChannelSinonMock.expects("show").withExactArgs(true);

      utilProxySinonMock
        .expects("clearDiagnostics")
        .withExactArgs(diagnosticCollection, uri);

      await fixProjectDepsIssuesProxy(
        outputChannelMock,
        diagnosticCollection,
        uri
      );
    });
  });
});
