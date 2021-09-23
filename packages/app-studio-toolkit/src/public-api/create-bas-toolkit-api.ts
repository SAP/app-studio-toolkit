import { WorkspaceApi } from "@sap/artifact-management";
import {
  BasToolkit,
  BasWorkspaceApi,
} from "@sap-devx/app-studio-toolkit-types";
import { createWorkspaceProxy } from "./create-workspace-proxy";

export function createBasToolkitAPI(
  workspaceImpl: WorkspaceApi,
  baseBasToolkitAPI: Omit<BasToolkit, "workspaceAPI">
): BasToolkit {
  const workspaceAPI: BasWorkspaceApi = createWorkspaceProxy(workspaceImpl);
  const exportedBasToolkitAPI = {
    // note `...` here effectively does a "shallow" clone
    ...baseBasToolkitAPI,
    workspaceAPI,
  };

  // "Immutability Changes Everything"
  // note we are not "deep" freezing because the usage of namespaces on the API
  // is expected to be removed.
  Object.freeze(exportedBasToolkitAPI);
  return exportedBasToolkitAPI;
}
