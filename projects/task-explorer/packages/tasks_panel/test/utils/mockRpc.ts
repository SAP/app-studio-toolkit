// eslint-disable-next-line eslint-comments/disable-enable-pair -- suppresed: test scope
/* eslint-disable @typescript-eslint/no-unused-vars -- suppresed: test scope */
import { IRpc, IMethod } from "@sap-devx/webview-rpc/out.ext/rpc-common";

export class MockRpc implements IRpc {
  private methods = new Map();
  public invokedMethod: string | undefined;
  public params: any[] = [];

  handleRequest(message: any): void {
    return;
  }

  handleResponse(message: any): void {
    return;
  }

  async invoke(method: string, params?: any): Promise<any> {
    this.invokedMethod = method;
    this.params = params;
  }

  listLocalMethods(): string[] {
    return [];
  }

  async listRemoteMethods(): Promise<string[]> {
    return [];
  }

  registerMethod(method: IMethod): void {
    this.methods.set(method.func.name, method);
  }

  sendRequest(id: number, method: string, params?: any[]): void {
    return;
  }

  sendResponse(id: number, response: any, success?: boolean): void {
    return;
  }

  setResponseTimeout(timeout: number): void {
    return;
  }

  unregisterMethod(method: IMethod): void {
    return;
  }
}
