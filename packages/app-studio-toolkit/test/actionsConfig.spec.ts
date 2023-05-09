import { expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

let wasUpdateCalled = false;
const wsConfig = {
  get: () => [
    {
      id: "create",
      actionType: "CREATE",
      name: "create",
    },
    "create",
  ],
  update: () => {
    wasUpdateCalled = true;
  },
  actions: [
    {
      id: "openSettingsAction",
      actionType: "COMMAND",
      name: "workbench.action.openGlobalSettings",
    },
  ],
};
const testVscode = {
  workspace: {
    workspaceFolders: [{}, {}],
    getConfiguration: () => wsConfig,
    onDidChangeWorkspaceFolders: () => {},
  },
};

mockVscode(testVscode, "dist/src/actions/actionsFactory.js");
mockVscode(testVscode, "dist/src/actions/impl.js");
import { clear } from "../src/actions/actionsConfig";
import { SinonMock } from "sinon";

describe("actionsFactory test", () => {
  let sandbox: any;
  let workspaceMock: SinonMock;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    workspaceMock = sandbox.mock(testVscode.workspace);
    wasUpdateCalled = false;
  });

  it("test clear actions", () => {
    clear();
    expect(wasUpdateCalled).to.be.true;
  });

  it("test clear empty actions", () => {
    wsConfig.actions = [];
    clear();
    expect(wasUpdateCalled).to.be.false;
  });
});
