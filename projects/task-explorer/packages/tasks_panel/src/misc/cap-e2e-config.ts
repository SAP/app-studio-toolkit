import { RelativePattern, Uri, commands } from "vscode";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { getLogger } from "../../src/logger/logger-wrapper";
import {
  CAP_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjTypes,
  addTaskDefinition,
  areResourcesReady,
  generateMtaDeployTasks,
  doesFileExist,
  isTasksSettled,
  waitForFileResource,
} from "./e2e-config";
import { last, map } from "lodash";

export interface CapProjectConfigInfo extends ProjectInfo {
  type: string;
}

function invokeCommand(config: { cmd: string; args: string[]; cwd: string }, additionalArgs: string[]): Promise<void> {
  function executeSpawn(
    config: { cmd: string; args: string[]; cwd: string },
    additionalArgs: string[],
  ): ChildProcessWithoutNullStreams {
    const { args, cmd, cwd } = config;
    return spawn(cmd, [...args, ...additionalArgs], { cwd });
  }

  return new Promise((resolve, reject) => {
    const command = executeSpawn(config, additionalArgs);

    command.stdout.on("data", (data) => {
      getLogger().debug(`${data}`);
    });

    command.stderr.on("data", (data) => {
      getLogger().debug(`${data}`);
    });

    command.on("error", (error) => {
      getLogger().error(error.toString());
      reject(error);
    });

    command.on("exit", (exitCode) => {
      // in case of an error exit code is not 0
      exitCode === 0 ? resolve() : reject();
    });
  });
}

export async function getCapE2ePickItems(info: ProjectInfo): Promise<CapProjectConfigInfo | undefined> {
  async function isCdsEnabled(): Promise<boolean> {
    return invokeCommand({ cmd: "cds", args: ["help"], cwd: info.wsFolder }, [])
      .then(() => true)
      .catch(() => false);
  }

  async function isConfigured(): Promise<boolean> {
    if (await doesFileExist(Uri.joinPath(Uri.file(info.wsFolder), info.project, "mta.yaml"))) {
      const tasksPattern = map(await generateMtaDeployTasks(info.wsFolder, info.project, "sequence"), (task) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- object destructuring is used to exclude the specified properties
        const { ["label"]: excludedLabel, ["dependsOn"]: excludedDependsOn, ...copyTask } = task;
        return copyTask;
      });
      // attempt to find a match for the generated tasks (without 'label' and 'dependsOn' properties) in the tasks configuration
      return isTasksSettled(info.wsFolder, tasksPattern);
    }
    return false;
  }

  if (info.style === ProjTypes.CAP && (await isCdsEnabled()) && !(await isConfigured())) {
    return { ...info, ...{ type: CAP_DEPLOYMENT_CONFIG } };
  }
}

export async function capE2eConfig(data: { wsFolder: string; project: string }): Promise<void> {
  const resourcesPromises: Promise<boolean>[] = [];
  if (!(await doesFileExist(Uri.joinPath(Uri.file(data.wsFolder), data.project, "mta.yaml")))) {
    resourcesPromises.push(
      waitForFileResource(
        new RelativePattern(data.wsFolder, `${data.project ? `${data.project}/` : ``}mta.yaml`),
        false,
        false,
        true,
      ),
    );
    await invokeCommand(
      { cwd: Uri.joinPath(Uri.file(data.wsFolder), data.project).fsPath, cmd: "cds", args: ["add", "mta"] },
      [],
    );
  }
  if (await areResourcesReady(resourcesPromises)) {
    const mtaDeployTasks = await generateMtaDeployTasks(data.wsFolder, data.project);
    await addTaskDefinition(data.wsFolder, mtaDeployTasks);
    await commands.executeCommand("tasks-explorer.editTask", last(mtaDeployTasks));
    await commands.executeCommand("tasks-explorer.tree.select", last(mtaDeployTasks));
  } else {
    getLogger().error("capE2eConfig: failed to configure deployment tasks", {
      wsFolder: data.wsFolder,
      project: data.project,
      file: "mta.yaml",
    });
  }
}
