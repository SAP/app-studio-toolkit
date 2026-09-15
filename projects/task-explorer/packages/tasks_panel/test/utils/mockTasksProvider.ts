import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { ITasksEventHandler, ITasksProvider } from "../../src/services/definitions";

export class MockTasksProvider implements ITasksProvider {
  constructor(private tasks: ConfiguredTask[]) {}

  async getConfiguredTasks(): Promise<ConfiguredTask[]> {
    return this.tasks;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- leave unused args as a reference in test
  registerEventHandler(eventHandler: ITasksEventHandler): void {
    return;
  }

  async getAutoDectedTasks(): Promise<ConfiguredTask[]> {
    return this.tasks;
  }
}
