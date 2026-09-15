import { commands } from "vscode";
import {
  HANA_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjTypes,
  addTaskDefinition,
  generateMtaDeployTasks,
  isTasksSettled,
} from "./e2e-config";
import { last, map } from "lodash";

export interface HanaProjectConfigInfo extends ProjectInfo {
  type: string;
}

export async function getHanaE2ePickItems(info: ProjectInfo): Promise<HanaProjectConfigInfo | undefined> {
  if (info.style === ProjTypes.HANA) {
    const tasksPattern = map(await generateMtaDeployTasks(info.wsFolder, info.project, "sequence"), (task) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- object destructuring is used to exclude the specified properties
      const { ["label"]: excludedLabel, ["dependsOn"]: excludedDependsOn, ...copyTask } = task;
      return copyTask;
    });
    // attempt to find a match for the generated tasks (without 'label' and 'dependsOn' properties) in the tasks configuration
    if (!isTasksSettled(info.wsFolder, tasksPattern)) {
      return { ...info, ...{ type: HANA_DEPLOYMENT_CONFIG } };
    }
  }
}

export async function hanaE2eConfig(data: { wsFolder: string; project: string }): Promise<void> {
  const targetTasks = await generateMtaDeployTasks(data.wsFolder, data.project);
  await addTaskDefinition(data.wsFolder, targetTasks);
  await commands.executeCommand("tasks-explorer.editTask", last(targetTasks));
  void commands.executeCommand("tasks-explorer.tree.select", last(targetTasks));
}
