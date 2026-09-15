/* eslint-disable eslint-comments/disable-enable-pair -- disable the next rules */
/* eslint-disable @typescript-eslint/no-unused-vars -- suppress no-unused-vars for test scope */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- suppress no-non-null-assertion for test scope */
import { expect } from "chai";
import {
  ConfiguredTask,
  FormProperty,
  isFormPropertyValid,
  TaskEditorContributionAPI,
  TaskUserInput,
} from "@sap_oss/task_contrib_types";
import { convertContributedPropertiesToQuestions } from "../../src/services/questions";
import { AppEvents } from "../../src/app-events";
import { TaskQuestion } from "../../src/services/definitions";
import { messages } from "../../src/i18n/messages";

describe("convertContributedPropertiesToQuestions function", () => {
  const task = {
    type: "testType",
    label: "task 1",
    folderName: "folder1",
    fileName: "file1",
    request: "request1",
  };

  it("converts label to input field and sets all missing properties", async () => {
    const properties: FormProperty[] = [
      {
        type: "label",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(
      questions[0],
      {
        type: "input",
        name: "label",
        message: "label",
        default: "task 1",
        guiOptions: {
          mandatory: true,
        },
      },
      true,
    );
    await checkDefaultMandatoryValidation(questions[0]);
  });

  it("converts label to input field and uses all relevant properties", async () => {
    const properties: FormProperty[] = [
      {
        type: "label",
        name: "taskLabel",
        message: "Task Label",
        value: "new task",
        optional: true,
        hint: "Enter unique task label",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "input",
      name: "taskLabel",
      message: "Task Label",
      default: "new task",
      guiOptions: {
        hint: "Enter unique task label",
      },
    });
  });

  it("converts checkbox to the gui form property", () => {
    const properties: FormProperty[] = [
      {
        type: "checkbox",
        list: ["option 1", "option 2", "option 3"],
        name: "selection",
        message: "Select",
        value: ["option 2"],
        optional: true,
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "checkbox",
      name: "selection",
      message: "Select",
      choices: ["option 1", "option 2", "option 3"],
      default: ["option 2"],
    });
  });

  it("converts confirm to the gui form property", () => {
    const properties: FormProperty[] = [
      {
        type: "confirm",
        name: "confirm",
        message: "Confirm action",
        value: true,
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "confirm",
      name: "confirm",
      message: "Confirm action",
      default: true,
      guiOptions: {
        mandatory: true,
      },
    });
  });

  it("converts combobox to the gui form property", () => {
    const properties: FormProperty[] = [
      {
        type: "combobox",
        name: "modules",
        message: "Select module",
        list: ["module1", "module2", "module3"],
        value: "module2",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "list",
      name: "modules",
      message: "Select module",
      choices: ["module1", "module2", "module3"],
      default: "module2",
      guiOptions: {
        mandatory: true,
      },
    });
  });

  it("converts table to the gui form property", () => {
    const properties: FormProperty[] = [
      {
        type: "table",
        name: "modules",
        message: "Modules",
        list: ["module1", "module2", "module3"],
        value: "module2",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "expand",
      name: "modules",
      message: "Modules",
      choices: ["module1", "module2", "module3"],
      default: "module2",
      guiOptions: {
        mandatory: true,
      },
    });
  });

  it("converts editor to the gui form property", () => {
    const properties: FormProperty[] = [
      {
        type: "editor",
        name: "modules",
        message: "Modules",
        value: "some text",
        optional: true,
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "editor",
      name: "modules",
      message: "Modules",
      default: "some text",
    });
  });

  it("does not define guiOptions field if not relevant", () => {
    const properties: FormProperty[] = [
      {
        type: "input",
        taskProperty: "request",
        optional: true,
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(questions[0], {
      type: "input",
      name: "request",
      message: "request",
      default: "request1",
    });
  });

  it("passes validate functions to the questions", async () => {
    const properties: FormProperty[] = [
      {
        type: "input",
        taskProperty: "request",
        optional: true,
        isValid: async function (param: string | string[]): Promise<string> {
          return param === "invalid" ? "not valid" : "";
        },
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    expect(questions[0].validate).to.exist;
    expect(await questions[0].validate!("value")).to.eq(true);
    expect(await questions[0].validate!("invalid")).to.eq("not valid");
  });

  it("passes empty validation to the questions if not defined as function", () => {
    const properties: FormProperty[] = [
      {
        type: "input",
        taskProperty: "request",
        optional: true,
        isValid: "not a function" as any as isFormPropertyValid,
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    expect(questions[0].validate).to.be.undefined;
  });

  it("provides auto calculated name when name and taskProperty are undefined", () => {
    const properties: FormProperty[] = [
      {
        type: "input",
        value: "value",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    expect(questions[0].name).to.eq("prop0");
  });

  it("provides empty default value when value and taskProperty are undefined", () => {
    const properties: FormProperty[] = [
      {
        type: "input",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    expect(questions[0].default).to.eq("");
  });

  it("provides property name as message's value when message and taskProperty are undefined", () => {
    const properties: FormProperty[] = [
      {
        type: "input",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    expect(questions[0].message).to.eq("prop0");
  });

  it("provides `label` type in gui options when field is read-only", () => {
    const properties: FormProperty[] = [
      {
        type: "input",
        readonly: true,
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    expect(questions[0].guiOptions).to.exist;
    expect(questions[0].guiOptions!.type).to.eq("label");
    expect(questions[0].guiOptions!.mandatory).to.be.undefined;
  });

  it("converts folder parameter to the input question with additional folder specific properties", () => {
    const properties: FormProperty[] = [
      {
        type: "folder",
        taskProperty: "folderName",
      },
    ];
    const questions = convertContributedPropertiesToQuestions(task, properties, new MockAppEvents());
    expect(questions.length).to.eq(1);
    checkResult(
      questions[0],
      {
        type: "input",
        name: "folderName",
        message: "folderName",
        default: "folder1",
        guiOptions: {
          type: "folder-browser",
          mandatory: true,
        },
      },
      true,
    );
    expect(questions[0].getPath).exist;
    checkDefaultMandatoryValidation(questions[0]);
  });
});

class MockAppEvents implements AppEvents {
  async addTaskToConfiguration(path: string, task: ConfiguredTask): Promise<number> {
    return 0;
  }

  async executeTask(task: any): Promise<void> {
    return;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return property;
  }

  getTasksEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> | undefined {
    return new (class implements TaskEditorContributionAPI<ConfiguredTask> {
      async init(wsFolder: string, task: ConfiguredTask): Promise<void> {
        return;
      }

      updateTask(task: ConfiguredTask, changes: TaskUserInput): ConfiguredTask {
        return { type: "taskType", label: "task 1", taskType: "test" };
      }

      convertTaskToFormProperties(task: ConfiguredTask): FormProperty[] {
        return [];
      }

      getTaskImage(): string {
        return "";
      }
    })();
  }

  async updateTaskInConfiguration(path: string, task: ConfiguredTask, index: number): Promise<void> {
    return;
  }
}

function checkResult(actual: TaskQuestion, expected: TaskQuestion, skipFunctions?: boolean): void {
  expect(actual.name).to.eq(expected.name);
  expect(actual.type).to.eq(expected.type);
  expect(actual.default).to.deep.equal(expected.default);
  expect(actual.message).to.eq(expected.message);
  if (!skipFunctions) {
    expect(actual.validate).to.eq(expected.validate);
    expect(actual.when).to.eq(expected.when);
  }
  if (actual.guiOptions) {
    expect(expected.guiOptions).to.exist;
    expect(actual.guiOptions.hint).to.eq(expected.guiOptions!.hint);
    expect(actual.guiOptions.type).to.eq(expected.guiOptions!.type);
    expect(actual.guiOptions.mandatory).to.eq(expected.guiOptions!.mandatory);
  } else {
    expect(expected.guiOptions).to.be.undefined;
  }
}

async function checkDefaultMandatoryValidation(question: TaskQuestion): Promise<void> {
  expect(question.validate).to.exist;
  expect(await question.validate!("")).to.eq(messages.MANDATORY_FIELD());
  expect(await question.validate!("value")).to.be.true;
}
