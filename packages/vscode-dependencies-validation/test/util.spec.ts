import type { DiagnosticCollection, Uri } from "vscode";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import proxyquire = require("proxyquire");
import {
  isInsideNodeModules,
  clearDiagnostics,
  findAndFixDepsIssues,
} from "../src/util";
import { VscodeOutputChannel } from "../src/vscodeTypes";
import { npmDepsValidationProxy } from "./moduleProxies";

describe("util unit tests", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  context("isInsideNodeModules()", () => {
    it("inside node_modules", () => {
      expect(isInsideNodeModules("/root/project/node_modules/package.json")).to
        .be.true;
    });

    it("not inside node_modules", () => {
      expect(isInsideNodeModules("/root/project/folder/package.json")).to.be
        .false;
    });
  });

  context("clearDiagnostics()", () => {
    it("delete is called", () => {
      const diagnosticCollection = <DiagnosticCollection>{};
      diagnosticCollection.delete = (uri: Uri) => "";
      const spy = sandbox.spy(diagnosticCollection, "delete");
      const uri = <Uri>{};
      clearDiagnostics(diagnosticCollection, uri);
      expect(spy.calledOnceWithExactly(uri)).to.be.true;
    });
  });

  context("findAndFixDepsIssues()", () => {
    const outputChannel = <VscodeOutputChannel>{};
    outputChannel.appendLine = (message: string) => "";

    let outchannelSinonMock: SinonMock;
    let findAndFixDepsIssuesProxy: typeof findAndFixDepsIssues;
    let npmDepsValidationSinonMock: SinonMock;

    beforeEach(() => {
      const utilProxyModule = proxyquire("../src/util", {
        "@sap-devx/npm-dependencies-validation": npmDepsValidationProxy,
      });

      outchannelSinonMock = sandbox.mock(outputChannel);
      npmDepsValidationSinonMock = sandbox.mock(npmDepsValidationProxy);

      findAndFixDepsIssuesProxy = utilProxyModule.findAndFixDepsIssues;
    });

    afterEach(() => {
      outchannelSinonMock.verify();
    });

    it("no npm problems were found", async () => {
      const uri = <Uri>{ fsPath: "/root/project/package.json" };
      npmDepsValidationSinonMock.expects("fixDependencyIssues").never();

      npmDepsValidationSinonMock
        .expects("findDependencyIssues")
        .withExactArgs(uri.fsPath)
        .resolves([]);
      await findAndFixDepsIssuesProxy(uri, outputChannel);
    });

    it("npm problems were found", async () => {
      const uri = <Uri>{ fsPath: "/root/project/package.json" };
      npmDepsValidationSinonMock.expects("fixDependencyIssues").resolves();

      npmDepsValidationSinonMock
        .expects("findDependencyIssues")
        .withExactArgs(uri.fsPath)
        .resolves([{ type: "missing", name: "lodash", isDev: false }]);
      await findAndFixDepsIssuesProxy(uri, outputChannel);
    });
  });
});
