import { WorkspaceAPI } from "./types";
// This import does not work (in 0.0.42) due to cyclic dep issue in project-type.
// import { WorkspaceImpl } from "@ext-lcapvsc-npm-dev/lcap-project-api";

import WorkspaceImpl from "@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/WorkspaceImpl";


let workspaceAPI: WorkspaceAPI;

export function initWorkspaceAPI() {
  workspaceAPI = new WorkspaceImpl();
}

export function getWorkspaceAPI(): WorkspaceAPI {
  return workspaceAPI;
}
