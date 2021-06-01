import { Uri } from "vscode";
import { IAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction,
    CommandActionParams, ExecuteActionParams, SnippetActionParams, ActionType } from "../../types/api";

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
        this.actionType = "EXECUTE";
        this.executeAction = () => Promise.resolve();
        this.params = [];
    }
}

export class CommandAction extends Action implements ICommandAction {
    name: string;
    params?: CommandActionParams;

    constructor() {
        super();
        this.actionType = "COMMAND";
        this.name = "";
        this.params = [];
    }
}

export class SnippetAction extends Action implements ISnippetAction {
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;
    isNonInteractive?: boolean;

    constructor() {
        super();
        this.actionType = "SNIPPET";
        this.contributorId = "";
        this.snippetName = "";
        this.context = {};
        this.isNonInteractive = false;
    }
}

export class FileAction extends Action implements IFileAction {
    uri: IFileAction["uri"];

    constructor() {
        super();
        this.actionType = "FILE";
        this.uri = Uri.parse("");
    }
}
