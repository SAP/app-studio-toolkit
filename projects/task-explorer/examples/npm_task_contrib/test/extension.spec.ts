import { expect } from "chai";
import { MockVSCodeInfo, mockVscode, resetTestVSCode, testVscode } from "./utils/mockVSCode";

mockVscode("src/extension");
import { activate } from "../src/extension";
import { keys } from "lodash";
import { NPM_TYPE } from "../src/definitions";

describe("extension", () => {
  describe("activate method", () => {
    afterEach(() => {
      resetTestVSCode();
    });

    it("registers relevant commands and tasks tree", async () => {
      const taskEditorContribExtApi = await activate(testVscode.ExtensionContext);
      const contirbutors = taskEditorContribExtApi.getTaskEditorContributors();
      expect(contirbutors.size).to.be.eq(1);
      const npmContributer = contirbutors.get(NPM_TYPE);
      expect(npmContributer).to.be.ok;
      expect(MockVSCodeInfo.taskProvider.get(NPM_TYPE)).to.be.exist;
    });
  });

  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        taskDefinitions: {
          type: string;
          required: string[];
          properties: any;
        }[];
      };
      BASContributes: {
        tasksExplorer: {
          type: string;
          intent: string;
        }[];
      };
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("extension pack contributes taskDefinitions", () => {
      const tasksDefinition = packageJson.contributes.taskDefinitions[0];
      expect(tasksDefinition.type).to.be.equal("npm");
      expect(tasksDefinition.required).to.be.deep.equal(["label", "script"]);
      expect(keys(tasksDefinition.properties)).to.be.deep.equal(["label", "path", "script"]);
      expect(tasksDefinition.properties.label).to.be.deep.equal({
        type: "string",
        description: "Label",
      });
      expect(tasksDefinition.properties.path).to.be.deep.equal({
        type: "string",
        description: "Path to package.json",
      });
      expect(tasksDefinition.properties.script).to.be.deep.equal({
        type: "string",
        description: "Selected script",
      });
    });

    it("extension pack contributes BASContributes", () => {
      const tasksExplorer = packageJson.BASContributes.tasksExplorer;
      expect(tasksExplorer.length).to.be.eq(1);
      expect(tasksExplorer[0]).to.be.deep.equal({
        type: "npm",
        intent: "npm",
      });
    });
  });
});
