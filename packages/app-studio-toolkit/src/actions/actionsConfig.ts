import { workspace, WorkspaceConfiguration } from "vscode";
import { uniqWith, isEqual } from "lodash";

export const key = "actions";

const addActions = (actions: any[], config: WorkspaceConfiguration): void => {
  const configActions = config.get<any[]>(key, []);
  actions.push(...configActions);
};

const clearConfiguration = (
  config: WorkspaceConfiguration,
  onlyImmediateActions: boolean
): void => {
  const currentActions = config.get<any[]>(key, []);
  if (currentActions.length === 0) return;

  if (onlyImmediateActions) {
    const updatedActions = currentActions.filter(
      (action) => action.execute !== "immediate"
    );
    void config.update(key, updatedActions);
  } else {
    void config.update(key, undefined);
  }
};

export const clear = (onlyImmediateActions = false): void => {
  workspace.workspaceFolders?.forEach((wsFolder) => {
    const config = workspace.getConfiguration(undefined, wsFolder.uri);
    clearConfiguration(config, onlyImmediateActions);
  });

  clearConfiguration(workspace.getConfiguration(), onlyImmediateActions);
};

export const get = (): any[] => {
  const actions: any[] = [];

  workspace.workspaceFolders?.forEach((wsFolder) => {
    addActions(actions, workspace.getConfiguration(undefined, wsFolder.uri));
  });

  addActions(actions, workspace.getConfiguration());

  return uniqWith(actions, isEqual);
};
