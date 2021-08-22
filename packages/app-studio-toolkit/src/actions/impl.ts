import { Uri } from "vscode";
import {
  ICommandAction,
  IExecuteAction,
  IFileAction,
  ISnippetAction,
} from "@sap-devx/app-studio-toolkit-types";
import { COMMAND, SNIPPET, FILE, EXECUTE } from "../constants";

/** Specific action classes */
export class ExecuteAction implements IExecuteAction {
  id?: string;
  actionType: "EXECUTE";
  executeAction: (params?: any[]) => Thenable<any>;
  params?: any[];

  constructor() {
    this.actionType = EXECUTE;
    /* istanbul ignore next - ignoring "legacy" missing coverage to enforce all new code to be 100% */
    this.executeAction = () => Promise.resolve();
    this.params = [];
  }
}

export class CommandAction implements ICommandAction {
  id?: string;
  actionType: "COMMAND";
  name: string;
  params?: any[];

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
  context: any;
  isNonInteractive?: boolean;

  constructor() {
    this.actionType = SNIPPET;
    this.contributorId = "";
    this.snippetName = "";
    this.context = {};
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
