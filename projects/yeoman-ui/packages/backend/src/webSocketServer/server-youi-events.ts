import { YouiEvents } from "../youi-events.js";
import type { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common.js";
import { AppWizard } from "@sap-devx/yeoman-ui-types";

export class ServerYouiEvents implements YouiEvents {
  private readonly rpc: RpcCommon;

  constructor(rpc: RpcCommon) {
    this.rpc = rpc;
  }
  setAppWizardHeaderTitle(title: string, info?: string): void {
    void this.rpc.invoke("setHeaderTitle", [title, info]);
  }

  executeCommand(): Thenable<any> {
    return Promise.resolve();
  }

  getAppWizard(): AppWizard {
    return null;
  }

  selectFolder(): void {
    void this.rpc.invoke("selectOutputFolder");
  }

  doGeneratorDone(
    suceeded: boolean,
    message: string,
    selectedWorkspace: string,
    type: string,
    targetPath = ""
  ): Promise<void> {
    return this.rpc.invoke("generatorDone", [
      suceeded,
      message,
      selectedWorkspace,
      type,
      targetPath,
    ]) as Promise<void>;
  }

  public async doGeneratorProgress(
    projectName: string | undefined,
    phase: "writing" | "install" | "end",
    showProgress: boolean = false
  ): Promise<void> {
    // Only invoke if generator opts in (WebSocket doesn't have VS Code settings)
    if (!showProgress) {
      return;
    }
    // WebSocket implementation - invoke RPC method with progress info
    await this.rpc.invoke("generatorProgress", [projectName, phase]);
  }

  public showProgress(): void {
    void this.rpc.invoke("showProgress");
  }
}
