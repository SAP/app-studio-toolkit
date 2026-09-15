// eslint-disable-next-line eslint-comments/disable-enable-pair -- suppress the next rule
/* eslint-disable @typescript-eslint/no-unused-vars -- leave args in function signatures for reference */
import { ConfiguredTask, FormProperty, TaskEditorContributionAPI, TaskUserInput } from "@sap_oss/task_contrib_types";
import { AppEvents } from "../app-events";

export class ServerEvents implements AppEvents {
  async executeTask(task: any): Promise<void> {
    console.log("execute task");
  }

  getTasksEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> {
    return new MockTaskEditorContributer();
  }

  async updateTaskInConfiguration(path: string, task: ConfiguredTask, index: number): Promise<void> {
    console.log("save task");
  }

  async addTaskToConfiguration(path: string, task: ConfiguredTask): Promise<number> {
    console.log("create task");
    return 0;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return property;
  }
}

export class MockTaskEditorContributer implements TaskEditorContributionAPI<ConfiguredTask> {
  updateTask(task: ConfiguredTask, changes: TaskUserInput): ConfiguredTask {
    return { ...task, ...changes };
  }

  convertTaskToFormProperties(task: ConfiguredTask): FormProperty[] {
    return [
      {
        message: "Label",
        type: "label",
      },
      {
        taskProperty: "prop1",
        message: "Transport package",
        type: "input",
        isValid: async function (value: string | string[]): Promise<string> {
          return value.length > 2 ? "" : "Enter at least 2 characters";
        },
      },
      {
        taskProperty: "prop2",
        message: "Transport request",
        type: "input",
      },
      {
        name: "path",
        type: "file",
        taskProperty: "prop2",
      },
    ];
  }

  getTaskImage(): string {
    return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj4KICA8ZyBpZD0iYWJhcF9pY29uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNjk2IC0yMDEpIj4KICAgIDxyZWN0IGlkPSJSZWN0YW5nbGVfNjAzIiBkYXRhLW5hbWU9IlJlY3RhbmdsZSA2MDMiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNjk2IDIwMSkiIGZpbGw9InJnYmEoMzAsMzAsMzAsMCkiLz4KICAgIDxnIGlkPSJHcm91cF8zMzM5IiBkYXRhLW5hbWU9Ikdyb3VwIDMzMzkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDY5Ni41MjEgMjEwLjA5NSkiPgogICAgICA8cGF0aCBpZD0iUGF0aF8xNDA0IiBkYXRhLW5hbWU9IlBhdGggMTQwNCIgZD0iTTI2My4xNTQsMTU4LjgzNmExNi4xMzQsMTYuMTM0LDAsMCwwLTEwLjM2Miw0LjY1NmMtNS4wMjUtMi4xMzktMTEuMTctMS4xNTUtMTQuODYyLDIuMzhhOS41NTEsOS41NTEsMCwwLDAtMi42OCw0LjcwNmgtLjQzNWMtNS44MzEuMDUtMTAuNTEsMy45OTMtMTAuNDUsOC44MDlzNC44MzYsOC42NzksMTAuNjY4LDguNjI5bDEuMDg3LTIuMjE3aC0uMDUxYy00LjI4OS4xNzMtNy45NjUtMi41MDctOC4yODktNi4wNDNzMi44MjMtNi42NDEsNy4xLTdoMy4yMzZhNi45MzYsNi45MzYsMCwwLDEsMi4xOS01LjE0NCwxMC4wMzIsMTAuMDMyLDAsMCwxLDYuNC0yLjYzMSwxMC40ODksMTAuNDg5LDAsMCwxLDYuNzUyLDEuOTNsMS44NzEtMS44MjlhMTIuNywxMi43LDAsMCwxLDcuOTg1LTMuNjExLDEzLjY3LDEzLjY3LDAsMCwxLDguNzMzLDIuMTI1LDkuNzIxLDkuNzIxLDAsMCwxLDQuNDgsNi45ODZsMy4xMi0uMjQ2YTEyLjAxNiwxMi4wMTYsMCwwLDAtNS4zNDctOC41NzksMTcuNDMzLDE3LjQzMywwLDAsMC0xMS4xMzktMi45MTZaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjI0LjM2MyAtMTU4Ljc4OSkiIGZpbGw9IiNmZmYiLz4KICAgICAgPGcgaWQ9Ikdyb3VwXzMzMzgiIGRhdGEtbmFtZT0iR3JvdXAgMzMzOCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTIuOTIzIDE5LjA0NikiPgogICAgICAgIDx0ZXh0IGlkPSJBQiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAxNikiIGZpbGw9IiMwYTgxYmYiIHN0cm9rZT0iIzBhODFiZiIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjAuMDYiIGZvbnQtc2l6ZT0iMTciIGZvbnQtZmFtaWx5PSJCZW50b25TYW5zLVJlZ3VsYXIsIEJlbnRvblNhbnMiIHN0eWxlPSJpc29sYXRpb246IGlzb2xhdGUiPjx0c3BhbiB4PSIwIiB5PSIwIj5BQkFQPC90c3Bhbj48L3RleHQ+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=";
  }

  async init(wsFolder: string, task: ConfiguredTask): Promise<void> {
    return;
  }
}
