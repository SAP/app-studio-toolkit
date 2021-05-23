import { Uri } from "vscode";
import { ActionType } from "./interfaces";
import { IAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction,
    CommandActionParams, ExecuteActionParams, SnippetActionParams } from "@sap-devx/app-studio-toolkit-types";

abstract class Action implements IAction {
    id?: string;
    actionType: ActionType | undefined;
}

/** Specific action classes */
export class ExecuteAction extends Action implements IExecuteAction {
    executeAction: (params?: ExecuteActionParams) => Thenable<any>;
    params?: ExecuteActionParams;

    constructor() {
        super();
        this.actionType = ActionType.Execute;
        this.executeAction = () => Promise.resolve();
        this.params = [];
    }
}

export class CommandAction extends Action implements ICommandAction {
    name: string;
    params?: CommandActionParams;

    constructor() {
        super();
        this.actionType = ActionType.Command;
        this.name = "";
        this.params = [];
    }
}

export class SnippetAction extends Action implements ISnippetAction {
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;

    constructor() {
        super();
        this.actionType = ActionType.Snippet;
        this.contributorId = "";
        this.snippetName = "";
        this.context = "";
    }
}

export class FileAction extends Action implements IFileAction {
    uri: IFileAction["uri"];

    constructor() {
        super();
        this.actionType = ActionType.File;
        this.uri = Uri.parse("");
    }
}
