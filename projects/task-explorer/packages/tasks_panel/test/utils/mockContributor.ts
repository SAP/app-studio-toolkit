// eslint-disable-next-line eslint-comments/disable-enable-pair -- suppress next line
/* eslint-disable @typescript-eslint/no-unused-vars -- disable no-unused-vars rule for test scope */
import { ConfiguredTask, TaskEditorContributionAPI, FormProperty } from "@sap_oss/task_contrib_types";

export class MockContributor implements TaskEditorContributionAPI<ConfiguredTask> {
  static failOnValidate: boolean | undefined = false;

  updateTask(task: ConfiguredTask, changes: any): ConfiguredTask {
    const updatedTask = { ...task };
    if (changes.prop1 !== undefined) {
      updatedTask.prop1 = "value3";
    }
    return updatedTask;
  }

  convertTaskToFormProperties(task: ConfiguredTask): FormProperty[] {
    return [
      {
        taskProperty: "prop1",
        type: "input",
        isValid: async function (value: string | string[]): Promise<string> {
          if (MockContributor.failOnValidate) {
            throw Error("`validate` failed");
          }

          return value.length > 2 ? "" : "Enter at least 2 characters";
        },
      },
      {
        taskProperty: "prop2",
        type: "file",
        optional: true,
      },
    ];
  }

  getTaskImage(): string {
    return "image";
  }

  async init(wsFolder: string, task: ConfiguredTask): Promise<void> {
    return;
  }
}

export class MockContributorWithOnSave extends MockContributor {
  public static onSaveCalled = false;
  constructor() {
    super();
    MockContributorWithOnSave.onSaveCalled = false;
  }

  async onSave(task: ConfiguredTask): Promise<void> {
    MockContributorWithOnSave.onSaveCalled = true;
  }
}
