import { expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

let updateCallCount = 0;
let lastUpdateValue: any = undefined;
let configActions: any[] = [];

const wsConfig = {
  get: (key: string, defaultValue?: any) => {
    if (key === "actions") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- configActions is any[]
      return configActions;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- defaultValue is any[]
    return defaultValue;
  },
  update: (key: string, value: any) => {
    updateCallCount++;
    lastUpdateValue = value;
  },
  actions: [
    {
      id: "openSettingsAction",
      actionType: "COMMAND",
      name: "workbench.action.openGlobalSettings",
    },
  ],
};

const wsFolderConfig = {
  get: (key: string, defaultValue?: any) => {
    if (key === "actions") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- configActions is any[]
      return configActions;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- defaultValue is any[]
    return defaultValue;
  },
  update: (key: string, value: any) => {
    updateCallCount++;
    lastUpdateValue = value;
  },
};

const testVscode: any = {
  workspace: {
    workspaceFolders: [{ uri: "folder1" }, { uri: "folder2" }],
    getConfiguration: (section?: string, resource?: any) => {
      return resource ? wsFolderConfig : wsConfig;
    },
    onDidChangeWorkspaceFolders: () => {},
  },
};

mockVscode(testVscode, "dist/src/actions/actionsConfig.js");
import { clear, get } from "../src/actions/actionsConfig";
import { SinonMock } from "sinon";

describe("actionsConfig test", () => {
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
    updateCallCount = 0;
    lastUpdateValue = undefined;
    configActions = [
      {
        id: "create",
        actionType: "CREATE",
        name: "create",
      },
      "create",
    ];
  });

  describe("clear", () => {
    it("should clear all actions when called without parameter", () => {
      clear();
      // Called for 2 workspace folders + 1 global config
      expect(updateCallCount).to.equal(3);
      expect(lastUpdateValue).to.be.undefined;
    });

    it("should not call update when actions array is empty", () => {
      configActions = [];
      clear();
      expect(updateCallCount).to.equal(0);
    });

    it("should clear only immediate actions when onlyImmediateActions=true", () => {
      configActions = [
        { id: "action1", execute: "immediate" },
        { id: "action2", execute: "scheduled" },
        { id: "action3" },
      ];
      clear(true);
      // Called for 2 workspace folders + 1 global config
      expect(updateCallCount).to.equal(3);
      expect(lastUpdateValue).to.deep.equal([
        { id: "action2", execute: "scheduled" },
        { id: "action3" },
      ]);
    });

    it("should keep non-immediate actions when clearing immediate ones", () => {
      configActions = [
        { id: "action1", actionType: "COMMAND", name: "test" },
        { id: "action2", execute: "immediate" },
      ];
      clear(true);
      expect(lastUpdateValue).to.deep.equal([
        { id: "action1", actionType: "COMMAND", name: "test" },
      ]);
    });

    it("should update with undefined when all actions should be cleared", () => {
      configActions = [{ id: "action1" }];
      clear(false);
      expect(lastUpdateValue).to.be.undefined;
    });

    it("should handle workspace without folders", () => {
      testVscode.workspace.workspaceFolders = undefined;
      configActions = [{ id: "action1" }];
      clear();
      // Only global config should be cleared
      expect(updateCallCount).to.equal(1);
      expect(lastUpdateValue).to.be.undefined;
      // Restore for other tests
      testVscode.workspace.workspaceFolders = [
        { uri: "folder1" },
        { uri: "folder2" },
      ];
    });
  });

  describe("get", () => {
    it("should return all actions from workspace and global config", () => {
      // Each config returns the same reference, so uniqWith deduplicates them
      configActions = [
        {
          id: "create",
          actionType: "CREATE",
          name: "create",
        },
      ];
      const actions = get();
      // Due to uniqWith deduplication, same object instance appears only once
      expect(actions).to.have.lengthOf(1);
      expect(actions[0]).to.deep.equal(configActions[0]);
    });

    it("should return unique actions when duplicates exist", () => {
      configActions = [
        {
          id: "action1",
          actionType: "COMMAND",
          name: "test",
        },
      ];
      const actions = get();
      // All 3 configs have the same action, should be deduplicated to 1
      expect(actions).to.have.lengthOf(1);
      expect(actions[0]).to.deep.equal(configActions[0]);
    });

    it("should return empty array when no actions configured", () => {
      configActions = [];
      const actions = get();
      expect(actions).to.be.an("array").that.is.empty;
    });

    it("should handle mixed action types (objects and strings)", () => {
      configActions = [
        {
          id: "action1",
          actionType: "COMMAND",
          name: "test",
        },
        "action2",
      ];
      const actions = get();
      // Due to uniqWith deduplication, same object instances appear only once
      expect(actions).to.have.lengthOf(2);
    });

    it("should handle workspace without folders", () => {
      testVscode.workspace.workspaceFolders = undefined;
      configActions = [{ id: "action1" }];
      const actions = get();
      // Only global config should be retrieved
      expect(actions).to.have.lengthOf(1);
      // Restore for other tests
      testVscode.workspace.workspaceFolders = [
        { uri: "folder1" },
        { uri: "folder2" },
      ];
    });

    it("should preserve action order while removing duplicates", () => {
      configActions = [
        { id: "action1", order: 1 },
        { id: "action2", order: 2 },
      ];
      const actions = get();
      expect(actions[0]).to.deep.equal({ id: "action1", order: 1 });
      expect(actions[1]).to.deep.equal({ id: "action2", order: 2 });
    });
  });
});
