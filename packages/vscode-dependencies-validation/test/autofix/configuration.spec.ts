import { expect } from "chai";
import { SinonMock, createSandbox, SinonSandbox } from "sinon";
import type { WorkspaceConfiguration } from "vscode";
import {
  ENABLE_AUTOFIX,
  getAutoFixDelay,
  isAutoFixEnabled,
  internal,
} from "../../src/autofix/configuration";
import { VscodeWorkspace } from "../../src/vscodeTypes";

describe("eventUtil unit tests", () => {
  let sandbox: SinonSandbox;
  let workspaceConfigurationSinonMock: SinonMock;

  const workspaceConfigurationMock = <WorkspaceConfiguration>{};
  workspaceConfigurationMock.get = () => "";
  const workspaceMock = <VscodeWorkspace>{};
  workspaceMock.getConfiguration = () => workspaceConfigurationMock;

  beforeEach(() => {
    sandbox = createSandbox();
    workspaceConfigurationSinonMock = sandbox.mock(workspaceConfigurationMock);
  });

  afterEach(() => {
    workspaceConfigurationSinonMock.verify();
    sandbox.restore();
  });

  context("isAutoFixEnabled()", () => {
    it("autofix is disabled", () => {
      workspaceConfigurationSinonMock
        .expects("get")
        .withExactArgs(ENABLE_AUTOFIX, false)
        .returns(false);
      const res = isAutoFixEnabled(workspaceMock);
      expect(res).to.be.false;
    });

    it("autofix is enabled", () => {
      workspaceConfigurationSinonMock
        .expects("get")
        .withExactArgs(ENABLE_AUTOFIX, false)
        .returns(true);
      const res = isAutoFixEnabled(workspaceMock);
      expect(res).to.be.true;
    });
  });

  context("getAutoFixDelay()", () => {
    it("delay is 30 seconds", () => {
      const delay = 30;
      workspaceConfigurationSinonMock
        .expects("get")
        .withExactArgs(internal.DELAY_AUTOFIX, 0)
        .returns(delay);
      const res = getAutoFixDelay(workspaceMock);
      expect(res).to.equal(delay);
    });
  });
});
