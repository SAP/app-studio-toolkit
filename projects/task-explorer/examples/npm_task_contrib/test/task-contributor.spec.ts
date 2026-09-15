import { expect } from "chai";
import { join } from "path";
import { NpmDefinitionType } from "../src/definitions";
import { TaskExplorerContributor } from "../src/task-contributor";
import { TaskUserInput } from "@sap_oss/task_contrib_types";
import { clone } from "lodash";

describe("TaskExplorerContributor unit test scope", () => {
  let instance: TaskExplorerContributor;
  const extensionPath = join(__dirname, "..", "..");
  const task: NpmDefinitionType = {
    script: "script",
    path: "path",
    label: "",
    type: "",
  };

  before(() => {
    instance = new TaskExplorerContributor(extensionPath);
  });

  it("init", async () => {
    await instance.init("", task);
    expect(instance["pathProperty"].value).to.be.undefined;
  });

  it("init, task definition path property is missing", async () => {
    const cloned = clone(task);
    delete cloned.path;
    const other = new TaskExplorerContributor(extensionPath);
    await other.init("", cloned);
    expect(other["pathProperty"].value).to.be.equal(".");
  });

  it("convertTaskToFormProperties", async () => {
    expect(await instance.convertTaskToFormProperties(task)).to.be.deep.equal([
      {
        type: "input",
        taskProperty: "script",
        readonly: true,
      },
      {
        type: "input",
        taskProperty: "path",
        readonly: true,
      },
      {
        type: "label",
      },
    ]);
  });

  it("getTaskImage", async () => {
    const image = instance.getTaskImage();
    expect(image).to.be.undefined;
    // TODO: uncomment the next lines when image will be provided
    // expect(isString(image)).to.be.true;
    // expect(image).to.be.equal(datauri(join(extensionPath, "resources", "npm_48px.svg")).content);
  });

  it("updateTask", async () => {
    const inputs: TaskUserInput = { label: "test-label" };
    const copyTask = clone(task);
    const expectedTask = clone(task);
    expectedTask.label = inputs.label;
    expect(await instance.updateTask(copyTask, inputs)).to.be.deep.equal(expectedTask);
  });

  it("onSave", async () => {
    const copyTask = clone(task);
    copyTask.taskType = "testType";
    instance.onSave(copyTask);
    expect(copyTask.taskType).to.be.undefined;
  });
});
