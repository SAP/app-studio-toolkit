import { workspace, WorkspaceConfiguration } from "vscode";
import { uniqWith, isEqual } from "lodash";

const key = "actions";

const addActions = (actions: any[], config: WorkspaceConfiguration): void => {
  const configActions = config.get<any[]>(key, []);
  actions.splice(actions.length, 0, ...configActions);
};

export const get = (): any[] => {
  const actions: any[] = [];

  workspace.workspaceFolders?.forEach((wsFolder) => {
    addActions(actions, workspace.getConfiguration(undefined, wsFolder.uri));
  });

  addActions(actions, workspace.getConfiguration());

  return uniqWith(actions, isEqual);
};

export const clear = (): void => {
  workspace.workspaceFolders?.forEach((wsFolder) => {
    void workspace
      .getConfiguration(undefined, wsFolder.uri)
      .update(key, undefined); // removes actions key
  });

  void workspace.getConfiguration().update(key, undefined);
};
