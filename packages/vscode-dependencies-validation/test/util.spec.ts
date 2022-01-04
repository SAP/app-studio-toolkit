import type { DiagnosticCollection, Uri } from "vscode";
import { expect } from "chai";
import { createSandbox, SinonSandbox } from "sinon";
import { isInsideNodeModules, clearDiagnostics } from "../src/util";

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
      diagnosticCollection.delete = () => "";
      const spy = sandbox.spy(diagnosticCollection, "delete");
      const uri = <Uri>{};
      clearDiagnostics(diagnosticCollection, uri);
      expect(spy.calledOnceWithExactly(uri)).to.be.true;
    });
  });
});
