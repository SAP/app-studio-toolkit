// eslint-disable-next-line eslint-comments/disable-enable-pair -- suppresed: test scope
/* eslint-disable @typescript-eslint/no-unused-vars -- suppresed: test scope */
import { ConfiguredTask, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";
import { IContributors, ITaskTypeEventHandler } from "../../src/services/definitions";
import { MockContributor } from "./mockContributor";

export class MockTaskTypeProvider implements IContributors {
  getIntentByType(type: string): string {
    return "abc";
  }

  getExtensionNameByType(type: string): string {
    return "testextension";
  }

  getSupportedIntents(): string[] {
    return ["testIntent"];
  }

  getSupportedTypes(): string[] {
    return ["testType"];
  }

  getTaskEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> {
    return new MockContributor();
  }

  async init(): Promise<void> {
    return;
  }

  registerEventHandler(eventHandler: ITaskTypeEventHandler): void {
    return;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return property;
  }
}
