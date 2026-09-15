import { Question } from "inquirer";
import { ConfiguredTask, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";

export interface IContributors {
  init(): Promise<void>;
  getSupportedTypes(): string[];
  getSupportedIntents(): string[];
  getIntentByType(type: string): string;
  registerEventHandler(eventHandler: ITaskTypeEventHandler): void;
  getTaskEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask>;
  getTaskPropertyDescription(type: string, property: string): string;
  getExtensionNameByType(type: string): string;
}

export interface ITaskTypeEventHandler {
  onChange(): void;
}

export interface ITasksProvider {
  getConfiguredTasks(): Promise<ConfiguredTask[]>;

  getAutoDectedTasks(): Promise<ConfiguredTask[]>;

  registerEventHandler(eventHandler: ITasksEventHandler): void;
}

export interface ITasksEventHandler {
  onChange(): Promise<void>;
}

export interface GuiOptions {
  hint?: string;
  type?: "file-browser" | "folder-browser" | "label";
  mandatory?: boolean;
}

export interface TaskChoice {
  key: string;
  name: string;
  value: string;
}

export type NamedQuestion = Question & { name: string };

export interface TaskQuestion extends NamedQuestion {
  guiOptions?: GuiOptions;
  getFilePath?: string;
  getPath?: string;
  choices?: string[] | TaskChoice[];
}

export type validationFunction = ((value: string) => Promise<string | boolean> | string | boolean) | undefined;
