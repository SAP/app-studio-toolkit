import * as _ from "lodash";
import { AppLog } from "./app-log";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { IChildLogger } from "@vscode-logging/logger";
import { AppEvents } from "./app-events";
import { IInternalItem, IInternalCollection } from "./Collection";
import { ItemAction, ItemContext, IItemCommandContext, IItemExecuteContext, IItemUriContext, IItemSnippetContext } from "./types";
import { ICommandAction, IExecuteAction, IFileAction, ISnippetAction } from "@sap-devx/app-studio-toolkit-types";

export class GuidedDevelopment {

  private readonly messages: any;
  private readonly rpc: IRpc;
  private readonly appEvents: AppEvents;
  private readonly outputChannel: AppLog;
  private readonly logger: IChildLogger;
  private readonly uiOptions: any;
  private collections: Array<IInternalCollection>;

  constructor(rpc: IRpc, appEvents: AppEvents, outputChannel: AppLog, logger: IChildLogger, messages: any, collections: IInternalCollection[], uiOptions?: any) {
    this.rpc = rpc;
    if (!this.rpc) {
      throw new Error("rpc must be set");
    }
    this.appEvents = appEvents;
    this.outputChannel = outputChannel;
    this.logger = logger;
    this.rpc.setResponseTimeout(3600000);
    this.rpc.registerMethod({ func: this.onFrontendReady, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleOutput, thisArg: this });
    this.rpc.registerMethod({ func: this.logError, thisArg: this });
    this.rpc.registerMethod({ func: this.getState, thisArg: this });
    this.rpc.registerMethod({ func: this.performAction, thisArg: this });

    this.collections = collections;
    this.messages = messages;
    this.uiOptions = uiOptions;
  }

  public setCollections(collections: Array<IInternalCollection>) {
    this.collections = collections;
    this.rpc.invoke("showCollections", [this.collections, this.uiOptions]);
  }

  private getItem(itemFqid: string): IInternalItem {
    for (const collection of this.collections) {
      for (const item of collection.items) {
        if (item.fqid === itemFqid) {
          return item;
        }
        if (item.items) {
          for (const subItem of item.items) {
            if (subItem.fqid === itemFqid) {
              return subItem;
            }  
            else if( subItem.items ){
              const deepSubitem =  this.getDeepSubitem(itemFqid, subItem);
              if(deepSubitem){
                return deepSubitem;
              }
            }
          }
        }
      }
    }
    // TODO - console log: item does not exist
  }

  private getDeepSubitem( itemFqId: string, item:IInternalItem ): IInternalItem{
    
    if( item.items ){
      for (const subItem of item.items) {
        if (subItem.fqid === itemFqId) {
          return subItem;
        } else if(subItem.items){
            return this.getDeepSubitem(itemFqId, subItem);
        } 
      }
    }

  }

  private async performAction(itemFqid: string, index: number, context?: ItemContext) {
    const item: IInternalItem = this.getItem(itemFqid);

    let itemAction: ItemAction;
    if (index === 1) {
      itemAction = item.action1;
    } else {
      itemAction = item.action2;
    }
    if (itemAction) {
      if (context) {
        switch (itemAction.action.actionType) {
          case "COMMAND":
            let commandActionParameters: any = (context as IItemCommandContext)?.params;
            if (commandActionParameters) {
              (itemAction.action as ICommandAction).params = commandActionParameters;
            }
            break;
          case "EXECUTE":
            let executeActionParameters: any = (context as IItemExecuteContext)?.params;
            if (executeActionParameters) {
              (itemAction.action as IExecuteAction).params = executeActionParameters;
            }
            break;
          case "FILE":
          case "URI":
            let fileActionUri: any = (context as IItemUriContext)?.uri;
            if (fileActionUri) {
              (itemAction.action as IFileAction).uri = fileActionUri;
            }
            break;
          case "SNIPPET":
            let snippetActionContext: any = (context as IItemSnippetContext)?.context;
            if (snippetActionContext) {
              (itemAction.action as ISnippetAction).context = snippetActionContext;
            }
            break;
        }
      }
      this.appEvents.performAction(itemAction.action);
    }
  }

  private async getState() {
    return this.messages;
  }

  private async logError(error: any, prefixMessage?: string) {
    let errorMessage = this.getErrorInfo(error);
    if (prefixMessage) {
      errorMessage = `${prefixMessage}\n${errorMessage}`;
    }

    this.logger.error(errorMessage);
    return errorMessage;
  }

  private async onFrontendReady() {
    try {
      await this.rpc.invoke("showCollections", [this.collections, this.uiOptions]);
    } catch (error) {
      this.logError(error);
    }
  }

  private toggleOutput(): boolean {
    return this.outputChannel.showOutput();
  }

  private getErrorInfo(error: any = "") {
    if (_.isString(error)) {
      return error;
    }

    const name = _.get(error, "name", "");
    const message = _.get(error, "message", "");
    const stack = _.get(error, "stack", "");

    return `name: ${name}\n message: ${message}\n stack: ${stack}\n string: ${error.toString()}\n`;
  }
}
