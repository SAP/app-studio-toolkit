import { ExtensionKind, commands, env, extensions } from "vscode";
import { join, split, tail, countBy, compact } from "lodash";
import { devspace } from "@sap/bas-sdk";
import { URL } from "node:url";
import { ProjectData } from "@sap/artifact-management";
import { BasToolkit, sam } from "@sap-devx/app-studio-toolkit-types";
import { AnalyticsWrapper } from "../usage-report/usage-analytics-wrapper";
import { getLogger } from "../logger/logger";

export enum ExtensionRunMode {
  desktop = `desktop`,
  basRemote = `bas-remote`,
  basWorkspace = `bas-workspace`,
  basUi = `bas-ui`,
  wsl = `wsl`,
  unexpected = `unexpected`,
}

type ProjectTypeMap = { [type: string]: number } | undefined;

export function isRunOnBAS(): boolean {
  const platform = getExtensionRunPlatform();
  return (
    platform === ExtensionRunMode.basWorkspace || // BAS
    platform === ExtensionRunMode.basRemote || // hybrid (through ssh-remote)
    devspace.getBasMode() === "personal-edition" // personal edition
  );
}

function getExtensionRunPlatform(): ExtensionRunMode {
  let runPlatform: ExtensionRunMode = ExtensionRunMode.unexpected;
  const serverUri = process.env.WS_BASE_URL;
  // see example: https://github.com/microsoft/vscode/issues/74188
  // expected values of env.remoteName: `undefined` (locally), `ssh-remote` (bas-remote) or `landscape.url` (BAS)
  if (serverUri && typeof env.remoteName === "string") {
    const remote = join(tail(split(env.remoteName, ".")), ".");
    const host = join(tail(split(new URL(serverUri).hostname, ".")), ".");
    if (host === remote) {
      // see for reference: https://code.visualstudio.com/api/references/vscode-api#Extension
      const ext = extensions.getExtension("SAPOSS.app-studio-toolkit");
      if (ext) {
        switch (ext.extensionKind) {
          case ExtensionKind.Workspace:
            runPlatform = ExtensionRunMode.basWorkspace;
            break;
          case ExtensionKind.UI:
            runPlatform = ExtensionRunMode.basUi;
            break;
        }
      }
    } else {
      runPlatform = ExtensionRunMode.basRemote;
    }
  } else if (typeof env.remoteName === "string") {
    if (env.remoteName.toLowerCase().includes("wsl")) {
      runPlatform = ExtensionRunMode.wsl;
    }
  } else {
    runPlatform = ExtensionRunMode.desktop;
  }

  // view panel visibility expects that value is available
  void commands.executeCommand("setContext", `ext.runPlatform`, runPlatform);

  return runPlatform;
}

export async function reportProjectTypesToUsageAnalytics(
  basToolkitAPI: BasToolkit
): Promise<void> {
  const [devspaceInfo, projects] = await Promise.all([
    devspace.getDevspaceInfo(),
    getProjectsInfo(basToolkitAPI),
  ]);
  if (devspaceInfo?.packDisplayName && projects) {
    void AnalyticsWrapper.traceProjectTypesStatus(
      devspaceInfo.packDisplayName,
      projects
    );
  }
}

/*
There are 2 issues that should be fixes before merging this PR:
1. getProjectInfo API should return all projects under all structure. including deep nested projects.
2. the projects found are not cached in the WorksapceApi object. The new ProjectApi objects will be re-calculated out every time the WorkspaceApi.getProjects method is called.
*/
async function getProjectsInfo(basToolkitAPI: BasToolkit): Promise<ProjectTypeMap> {
  try {
    const workspaceAPI = basToolkitAPI.workspaceAPI;
    const projects: sam.ProjectApi[] = await workspaceAPI.getProjects();
    const folderProjectInfoList: ProjectData[] = compact(await Promise.all(
      projects.map(
        async (project: sam.ProjectApi) => project.getProjectInfo()
      )
    ));
    return countBy(folderProjectInfoList, "typeName");
  } catch (error) {
    getLogger().error(`Failed to get project list`);
  }
}
