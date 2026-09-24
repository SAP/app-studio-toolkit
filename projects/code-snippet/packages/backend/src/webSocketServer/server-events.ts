import { AppEvents } from "../app-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { WorkspaceEdit } from "vscode";

export class ServerEvents implements AppEvents {
  private readonly rpc: RpcCommon;

  constructor(rpc: RpcCommon) {
    this.rpc = rpc;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match interface
  public async doApply(we: WorkspaceEdit): Promise<any> {
    // Apply code
  }

  doSnippeDone(suceeded: boolean, message: string, targetPath = ""): void {
    this.rpc.invoke("snippetDone", [suceeded, message, targetPath]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match interface
  executeCommand(id: string, ...args: any[]): Thenable<any> {
    return;
  }

  public doClose(): void {
    return;
  }
}
