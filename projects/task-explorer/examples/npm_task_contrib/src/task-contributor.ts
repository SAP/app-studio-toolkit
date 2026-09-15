import { join } from "path";
import {
  FormProperty,
  SimpleFormProperty,
  TaskEditorContributionAPI,
  TaskUserInput,
} from "@sap_oss/task_contrib_types";
import { NpmDefinitionType } from "./definitions";
import { getImage } from "./utils";

export class TaskExplorerContributor implements TaskEditorContributionAPI<NpmDefinitionType> {
  private readonly image: string;
  private readonly labelProperty: SimpleFormProperty = {
    type: "label",
  };
  private readonly pathProperty: SimpleFormProperty = {
    type: "input",
    taskProperty: "path",
    readonly: true,
  };
  private readonly scriptProperty: SimpleFormProperty = {
    type: "input",
    taskProperty: "script",
    readonly: true,
  };

  constructor(private readonly extensionPath: string) {
    // TODO: correct the image path when will be provided
    this.image = getImage(join(this.extensionPath, "resources", "npm_48px.svg"));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- future use
  async init(wsFolder: string, task: NpmDefinitionType): Promise<void> {
    if (!task.path) {
      this.pathProperty.value = ".";
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- future use
  convertTaskToFormProperties(task: NpmDefinitionType): FormProperty[] {
    return [this.scriptProperty, this.pathProperty, this.labelProperty];
  }

  getTaskImage(): string {
    return this.image;
  }

  // syncs task with user's input
  async updateTask(task: NpmDefinitionType, inputs: TaskUserInput): Promise<NpmDefinitionType> {
    // set updated task properties
    task.label = inputs.label;
    return task;
  }

  onSave(task: NpmDefinitionType): void {
    // implementation hack: remove internal `task Type` property before serializing to file
    delete task.taskType;
  }
}
