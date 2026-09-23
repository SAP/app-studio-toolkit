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

  public doGeneratorInstall(): void {
    void this.rpc.invoke("generatorInstall");
  }

  public doGeneratorProgress(
    projectName: string | undefined,
    phase: "writing" | "install" | "end",
    showProgress: boolean = false
  ): void {
    // Backward compatibility: if generator doesn't opt in, fall back to classic behavior
    // (only show toast on "install" phase)
    if (!showProgress) {
      if (phase === "install") {
        // Show classic "Installing dependencies..." event
        this.doGeneratorInstall();
      }
      return;
    }
    // WebSocket implementation - invoke RPC method with progress info
    void this.rpc.invoke("generatorProgress", [projectName, phase]);
  }

  public showProgress(): void {
    void this.rpc.invoke("showProgress");
  }
}
