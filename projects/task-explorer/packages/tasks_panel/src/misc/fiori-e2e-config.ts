import { RelativePattern, TaskDefinition, Uri, commands, workspace } from "vscode";
import * as Yaml from "yaml";
import { concat, find, includes, last, map } from "lodash";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import {
  FIORI_DEPLOYMENT_CONFIG,
  ProjectInfo,
  addTaskDefinition,
  areResourcesReady,
  generateMtaDeployTasks,
  doesFileExist,
  waitForFileResource,
} from "./e2e-config";
import { exceptionToString, getUniqueTaskLabel } from "../../src/utils/task-serializer";
import * as path from "path";

enum FE_DEPLOY_TRG {
  ABAP = "abap",
  CF = "cf",
}

const cmd_launch_deploy_config = "sap.ux.appGenerator.launchDeployConfig";

const trg_files_common = ["ui5-deploy.yaml"];
const trg_files_abap = concat(trg_files_common, []);
const trg_files_cf = concat(trg_files_common, ["mta.yaml", "xs-app.json"]);

export interface FioriProjectConfigInfo extends ProjectInfo {
  type: string;
}

async function readTextFile(uri: Uri): Promise<string> {
  const buffer = await workspace.fs.readFile(uri);
  return Buffer.from(buffer).toString("utf8");
}

async function detectDeployTarget(ui5DeployYaml: Uri): Promise<FE_DEPLOY_TRG | undefined> {
  try {
    const yamlContext = Yaml.parse(await readTextFile(ui5DeployYaml));
    if (!yamlContext?.builder?.customTasks) {
      throw new Error("Unsupported target configuration found");
    }
    return find(yamlContext.builder.customTasks, ["name", "deploy-to-abap"]) ? FE_DEPLOY_TRG.ABAP : FE_DEPLOY_TRG.CF;
  } catch (e: any) {
    getLogger().error(exceptionToString(e));
  }
}

export async function getFioriE2ePickItems(info: ProjectInfo): Promise<FioriProjectConfigInfo | undefined> {
  async function isConfigured(target: FE_DEPLOY_TRG | undefined, projectPath: Uri): Promise<boolean> {
    if (!target) {
      // error [reading|parsing|unexpected structure] yaml file
      return false;
    }
    const resources: Promise<boolean>[] = [Promise.resolve(true)];
    resources.push(
      ...map(target === FE_DEPLOY_TRG.ABAP ? trg_files_abap : trg_files_cf, (file) =>
        doesFileExist(Uri.joinPath(projectPath, file)),
      ),
    );
    return Promise.all(resources).then((values) => !includes(values, false));
  }

  async function isConfigRequired(wsFolder: Uri, project: string): Promise<boolean> {
    let result = true;
    const projectPath = Uri.joinPath(wsFolder, project);
    const path = Uri.joinPath(projectPath, "ui5-deploy.yaml");
    if (await doesFileExist(path)) {
      result = !(await isConfigured(await detectDeployTarget(path), projectPath));
    }
    return result;
  }

  async function isCommandRegistered(command: string): Promise<boolean> {
    return commands.getCommands().then((allCommands) => {
      return allCommands.includes(command);
    });
  }

  // start analyzing when the corresponding generator command exists and is registered in devspace, otherwise the config e2e deployment option should not be displayed
  if (
    (await isCommandRegistered(cmd_launch_deploy_config)) &&
    (await isConfigRequired(Uri.file(info.wsFolder), info.project))
  ) {
    return { ...info, ...{ type: FIORI_DEPLOYMENT_CONFIG } };
  }
}

export async function fioriE2eConfig(data: { wsFolder: string; project: string }): Promise<void> {
  async function completeTasksDefinition(target: FE_DEPLOY_TRG | undefined): Promise<any> {
    if (!target) {
      throw new Error(messages.err_task_definition_unsupported_target);
    }
    const targetTasks: TaskDefinition[] = [];
    if (target === FE_DEPLOY_TRG.ABAP) {
      targetTasks.push({
        type: "npm",
        label: getUniqueTaskLabel(`Deploy to ABAP ${data.project}`),
        script: "deploy",
        options: { cwd: `${Uri.joinPath(Uri.file(data.wsFolder), data.project).fsPath}` },
      });
    } else {
      targetTasks.push(...(await generateMtaDeployTasks(data.wsFolder, data.project)));
    }
    await addTaskDefinition(data.wsFolder, targetTasks);
    await commands.executeCommand("tasks-explorer.editTask", last(targetTasks));
    void commands.executeCommand("tasks-explorer.tree.select", last(targetTasks));
  }

  const ui5DeployYaml = waitForFileResource(
    new RelativePattern(data.wsFolder, path.join(`${data.project ? `${data.project}` : ``}`, `ui5-deploy.yaml`)),
    false,
    false,
    true,
  );

  await commands.executeCommand(cmd_launch_deploy_config, {
    fsPath: Uri.joinPath(Uri.file(data.wsFolder), data.project).fsPath,
  });

  if (await areResourcesReady([ui5DeployYaml])) {
    return completeTasksDefinition(
      await detectDeployTarget(Uri.joinPath(Uri.file(data.wsFolder), data.project, "ui5-deploy.yaml")),
    );
  }
}
