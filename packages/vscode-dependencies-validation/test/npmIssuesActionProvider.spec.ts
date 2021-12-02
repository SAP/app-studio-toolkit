import { expect } from "chai";
import * as proxyquire from "proxyquire";
import type { CodeAction, CodeActionKind } from "vscode";
import { NPMIssuesActionProvider } from "../src/npmIssuesActionProvider";
import { range, textDocument, context, token, kind } from "./vscodeMocks";

const diagnosticsProxy = {
  refreshDiagnostics() {
    return Promise.reject("refreshDiagnostics method is not implemented");
  },
  "@noCallThru": true,
};

const commandsProxy = {
  invokeNPMCommand() {
    return Promise.reject("invokeNPMCommand method is not implemented");
  },
  "@noCallThru": true,
};

describe("npmIssuesActionProvider unit test", () => {
  let provider: NPMIssuesActionProvider;

  before(() => {
    const npmIssuesActionProviderModule = proxyquire(
      "../src/npmIssuesActionProvider",
      {
        "./diagnostics": diagnosticsProxy,
        "./commands": commandsProxy,
      }
    );

    provider = new npmIssuesActionProviderModule.NPMIssuesActionProvider(kind);
  });

  it("provideCodeActions", () => {
    const actions: CodeAction[] = provider.provideCodeActions(
      textDocument,
      range,
      context,
      token
    );
    expect(actions).to.have.lengthOf(1);
  });
});
