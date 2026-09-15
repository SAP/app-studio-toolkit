import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "./utils/mockVSCode";

mockVscode("src/extension");
import { activate } from "../src/extension";
import { find, map, size, split, trim } from "lodash";
import { mock } from "sinon";

describe("extension", () => {
  describe("activate method", () => {
    afterEach(() => {
      resetTestVSCode();
    });

    it("registers relevant commands and tasks tree", async () => {
      await activate(testVscode.ExtensionContext);
      expect(MockVSCodeInfo.registeredCommand.has("tasks-explorer.editTask")).to.be.true;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.deleteTask")).to.exist;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.executeTask")).to.exist;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.tree.refresh")).to.exist;
      expect(MockVSCodeInfo.treeDataProvider.get("tasksPanel")).to.exist;
    });

    it("verify 'refresh' callback configured", async () => {
      await activate(testVscode.ExtensionContext);
      const mockTreeProvider = mock(MockVSCodeInfo.treeDataProvider.get("tasksPanel"));
      mockTreeProvider.expects("onChange").resolves();
      MockVSCodeInfo.registeredCommand.get("tasks-explorer.tree.refresh")();
    });
  });

  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        viewsWelcome: {
          when: string;
          contents: string;
          view: string;
        }[];
        menus: {
          "view/title": {
            command: string;
            when: string;
            group: string;
          }[];
          "view/item/context": {
            command: string;
            when: string;
            group: string;
          }[];
        };
        views: {
          "tasks-explorer": {
            id: string;
            name: string;
            when: string;
          }[];
        };
      };
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("extension pack contributes viewsWelcome verifing", () => {
      const tasksWelcome = packageJson.contributes.viewsWelcome[0];
      expect(tasksWelcome.when).to.be.equal("ext.isNoTasksFound");
      expect(tasksWelcome.view).to.be.equal("tasksPanel");
      const contents = tasksWelcome.contents.split("\n");
      expect(size(contents)).to.be.gte(3);
      expect(
        find(contents, (line) =>
          /\[.*\]\(https:\/\/help.sap.com\/docs\/bas\/sap-business-application-studio\/task-explorer\?version=Cloud\)/.test(
            line,
          ),
        ),
      ).to.be.ok;
      expect(find(contents, (line) => /\[.*\]\(command:tasks-explorer.createTask\)/.test(line))).to.be.ok;
    });

    it("extension pack contributes views task-explorer", () => {
      const view = packageJson.contributes.views["tasks-explorer"][0];
      expect(view.when).to.be.equal("ext.isViewVisible");
      expect(view.id).to.be.equal("tasksPanel");
      expect(view.name).to.be.empty;
    });

    it("extension pack contributes menus->view/item/context", () => {
      const item = find(packageJson.contributes.menus["view/item/context"], ["command", "tasks-explorer.createTask"]);
      expect(item?.group).to.be.equal("inline");
      const statements = split(item?.when, "&&");
      expect(map(split(statements[0], "=="), trim).includes("view")).to.be.true;
      expect(map(split(statements[0], "=="), trim).includes("tasksPanel")).to.be.true;
      expect(map(split(statements[1], "=~"), trim).includes("viewItem")).to.be.true;
      expect(map(split(statements[1], "=~"), trim).includes("/^(root|project|intent)$/")).to.be.true;
    });

    it("extension pack contributes menus->view/title createTask command", () => {
      const item = find(packageJson.contributes.menus["view/title"], ["command", "tasks-explorer.createTask"]);
      expect(item?.group).to.be.equal("navigation");
      expect(map(split(item?.when, "=="), trim).includes("view")).to.be.true;
      expect(map(split(item?.when, "=="), trim).includes("tasksPanel")).to.be.true;
    });

    it("extension pack contributes menus->view/title refresh command", () => {
      const item = find(packageJson.contributes.menus["view/title"], ["command", "tasks-explorer.tree.refresh"]);
      expect(item?.group).to.be.equal("navigation");
      expect(map(split(item?.when, "=="), trim).includes("view")).to.be.true;
      expect(map(split(item?.when, "=="), trim).includes("tasksPanel")).to.be.true;
    });
  });
});
