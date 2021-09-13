import { WorkspaceApi } from "@sap/artifact-management";
import {
  BasToolkit,
  BasWorkspaceApi,
} from "@sap-devx/app-studio-toolkit-types";
import { baseBasToolkitAPI } from "./base-bas-api";
import { createWorkspaceProxy } from "./create-workspace-proxy";

export function createBasToolkitAPI(workspaceImpl: WorkspaceApi): BasToolkit {
  const workspaceAPI: BasWorkspaceApi = createWorkspaceProxy(workspaceImpl);
  const exportedBasToolkitAPI = {
    // "shallow" clone
    ...baseBasToolkitAPI,
    ...{ workspaceAPI },
  };

  // "Immutability Changes Everything"
  // note we are not "deep" freezing because the usage of namespaces on the API
  // is expected to be removed.
  Object.freeze(exportedBasToolkitAPI);
  return exportedBasToolkitAPI;
}
