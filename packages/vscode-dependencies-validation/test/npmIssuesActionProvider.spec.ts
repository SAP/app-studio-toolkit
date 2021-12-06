import { expect } from "chai";
import * as proxyquire from "proxyquire";
import type {
  CodeAction,
  Range,
  TextDocument,
  CodeActionKind,
  CancellationToken,
} from "vscode";
import { FIX_ALL_ISSUES_COMMAND } from "../src/constants";
import { NPMIssuesActionProvider } from "../src/npmIssuesActionProvider";
import { codeActionContextMock } from "./vscodeMocks";

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

  context("provideCodeActions()", () => {
    before(() => {
      const npmIssuesActionProviderModule = proxyquire(
        "../src/npmIssuesActionProvider",
        {
          "./diagnostics": diagnosticsProxy,
          "./commands": commandsProxy,
        }
      );

      provider = new npmIssuesActionProviderModule.NPMIssuesActionProvider(
        <CodeActionKind>{}
      );
    });

    it("provideCodeActions", () => {
      const actions: CodeAction[] = provider.provideCodeActions(
        <TextDocument>{},
        <Range>{},
        codeActionContextMock,
        <CancellationToken>{}
      );
      expect(actions).to.have.lengthOf(1);
      const { command } = actions[0];
      expect(command?.title).to.equal("Fix all dependency issues");
      expect(command?.command).to.equal(FIX_ALL_ISSUES_COMMAND);
    });
  });
});
