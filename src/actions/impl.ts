import { Uri } from "vscode";
import { bas, ICommandAction, IExecuteAction, IFileAction, ISnippetAction,
    CommandActionParams, ExecuteActionParams, SnippetActionParams } from '@sap-devx/app-studio-toolkit-types';
import { COMMAND, SNIPPET, FILE, EXECUTE } from '../constants';

/** Specific action classes */
export class ExecuteAction implements IExecuteAction {
    id?: string;
    actionType: "EXECUTE";
    executeAction: (params?: ExecuteActionParams) => Thenable<any>;
    params?: ExecuteActionParams;

    constructor() {
        this.actionType = EXECUTE;
        this.executeAction = () => Promise.resolve();
        this.params = [];
    }
}

export class CommandAction implements ICommandAction {
    id?: string;
    actionType: "COMMAND";
    name: string;
    params?: CommandActionParams;

    constructor() {
        this.actionType = COMMAND;
        this.name = "";
        this.params = [];
    }
}

export class SnippetAction implements ISnippetAction {
    id?: string;
    actionType: "SNIPPET";
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;
    isNonInteractive?: boolean;

    constructor() {
        this.actionType = SNIPPET;
        this.contributorId = "";
        this.snippetName = "";
        this.context = {};
        this.isNonInteractive = false;
    }
}

export class FileAction implements IFileAction {
    id?: string;
    actionType: "FILE";
    uri: IFileAction["uri"];

    constructor() {
        this.actionType = FILE;
        this.uri = Uri.parse("");
    }
}
