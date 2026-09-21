import * as vscode from "vscode";
import * as extension from "../extension";
import { join, sep } from "path";
import * as fs from "fs";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { getModuleLogger } from "../logger/logger-wrapper";
import {
  cfGetAvailableOrgs,
  cfGetAvailableSpaces,
  cfGetConfigFileField,
  cfGetTarget,
  cfLogin,
  cfLogout,
  cfSetOrgSpace,
  CredentialsLoginOptions,
  ITarget,
  OK,
  SSOLoginOptions,
  Organization,
  Space,
} from "@sap/cf-tools";
import { messages } from "../messages";
import { cfendpoint } from "@sap/bas-sdk";
import { toText } from "../utils";
import * as cheerio from "cheerio";

let loginTarget: LoginTarget | undefined;
let initTarget: { endpoint: string | undefined; org?: string | undefined; space?: string | undefined };
let panel: vscode.WebviewPanel | undefined;
let isLoginOnly: boolean | undefined;
let cmdLoginResult: string | undefined;

const LOGGER_MODULE = "loginTargetView";

export function openLoginView(
  opts: { isSplit: boolean; isLoginOnly?: boolean },
  endpoint?: string,
  org?: string,
  space?: string
): Promise<string | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initTarget = {
    endpoint: endpoint,
    org: org,
    space: space,
  };
  isLoginOnly = opts.isLoginOnly;
  // Every time the view is opened need to recalculate the login result
  cmdLoginResult = undefined;

  return new Promise<string | undefined>((resolve, reject) => {
    try {
      const split = opts.isSplit ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;
      panel = panel
        ? panel
        : vscode.window.createWebviewPanel("cfLogin", "Cloud Foundry Sign In", split, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(join(extension.getPath(), "dist", "media"))],
          });
      panel.reveal();
      panel.onDidDispose(() => {
        resolve(cmdLoginResult);
        panel = undefined;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        loginTarget = undefined;
      });

      const extensionPath = extension.getPath();
      const mediaPath = join(extensionPath, "dist", "media");
      const htmlFileName = "index.html";

      let indexHtml = fs.readFileSync(join(mediaPath, htmlFileName), "utf8");
      if (indexHtml) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.file(join(mediaPath, sep));
        const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);
        const baseUrl = scriptUri.toString();
        const $ = cheerio.load(indexHtml);

        function replaceAttributePaths(elements: any, attributeName: string) {
          elements.each((index: number, element: cheerio.Element) => {
            const currentAttr = $(element).attr(attributeName);
            if (currentAttr) {
              $(element).attr(attributeName, `${baseUrl}/${currentAttr}`);
            }
          });
        }

        replaceAttributePaths($("[src]"), "src");
        replaceAttributePaths($("[href]"), "href");

        indexHtml = $.html();
      }

      panel.webview.html = indexHtml;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      loginTarget = new LoginTarget(panel);
    } catch (e) {
      reject(e.toString());
    }
  });
}

class LoginTarget {
  private rpc: RpcExtension;
  private currentTarget: ITarget | undefined;

  constructor(private readonly panel: vscode.WebviewPanel) {
    this.rpc = new RpcExtension(panel.webview);
    this.rpc.registerMethod({ func: this.init, thisArg: this });
    this.rpc.registerMethod({ func: this.loginClick, thisArg: this });
    this.rpc.registerMethod({ func: this.logoutClick, thisArg: this });
    this.rpc.registerMethod({ func: this.getSelectedTarget, thisArg: this });
    this.rpc.registerMethod({ func: this.getOrgs, thisArg: this });
    this.rpc.registerMethod({ func: this.getSpaces, thisArg: this });
    this.rpc.registerMethod({ func: this.applyTarget, thisArg: this });
    this.rpc.registerMethod({ func: this.openPasscodeLink, thisArg: this });
  }

  private async getTarget(): Promise<ITarget | undefined> {
    // TODO: need to pass the endpoint to check if logged-in to correct endpoint.
    try {
      return (await this.invokeLongFunctionWithProgressForm(cfGetTarget, false)) as ITarget;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const errText = toText(e);
      getModuleLogger(LOGGER_MODULE).error("getTarget failed", { exception: errText });
      return undefined;
    }
  }

  private getCFDefaultLandscape(): Promise<string> {
    return cfGetConfigFileField("Target").then((cfgEndpoint: string) => {
      return cfgEndpoint || cfendpoint.getCFEndpoint();
    });
  }

  private calculatePasscodeUrl(endpoint: string): string {
    return endpoint.replace(/api./g, "login.") + "/passcode";
  }

  async init(): Promise<any> {
    this.currentTarget = await this.getTarget();
    if (!initTarget) {
      initTarget = { endpoint: undefined, org: undefined, space: undefined };
    }

    initTarget.endpoint = initTarget?.endpoint
      ? initTarget?.endpoint
      : this.currentTarget && this.currentTarget["api endpoint"]
      ? this.currentTarget["api endpoint"]
      : await this.getCFDefaultLandscape();

    return {
      defaultEndpoint: initTarget.endpoint,
      isLoggedIn: this.currentTarget !== undefined,
      passcodeUrl: this.calculatePasscodeUrl(initTarget.endpoint),
      currentOrg: this.currentTarget?.org,
      currentSpace: this.currentTarget?.space,
    };
  }

  async loginClick(payload: SSOLoginOptions | CredentialsLoginOptions) {
    try {
      cmdLoginResult = await this.invokeLongFunctionWithProgressForm(cfLogin, payload);
      if (OK !== cmdLoginResult) {
        void vscode.window.showErrorMessage(messages.login_failed);
        return false;
      }
      void vscode.window.showInformationMessage(messages.login_success);
      getModuleLogger(LOGGER_MODULE).debug("executeLogin: login succeeded");

      if (isLoginOnly) {
        setTimeout(() => {
          panel?.dispose();
        });
      }
      return true;
    } catch (error) {
      getModuleLogger(LOGGER_MODULE).error("executelogin: login error", error);
      return false;
    }
  }

  async logoutClick() {
    try {
      await this.invokeLongFunctionWithProgressForm(cfLogout);
      this.currentTarget = undefined;
      void vscode.window.showInformationMessage(messages.logout_success);
      getModuleLogger(LOGGER_MODULE).debug("executeLogout: logout succeeded");
      return true;
    } catch (error) {
      getModuleLogger(LOGGER_MODULE).error("executeLogout: logout error", error);
      return false;
    }
  }

  getSelectedTarget() {
    return {
      endpoint: this.currentTarget?.["api endpoint"],
      org: this.currentTarget?.org,
      space: this.currentTarget?.space,
    };
  }

  getOrgs(): Promise<Organization[]> {
    return cfGetAvailableOrgs()
      .then((orgs: Organization[]) => {
        getModuleLogger(LOGGER_MODULE).debug("executeGetAvaliableOrgs: get avaliable orgs succeeded");
        return orgs;
      })
      .catch((error) => {
        getModuleLogger(LOGGER_MODULE).error("executeGetAvaliableOrgs: get avaliable orgs failed", error);
        return [];
      });
  }

  getSpaces(org: string): Promise<Space[]> {
    return cfGetAvailableSpaces(org)
      .then((spaces: Space[]) => {
        getModuleLogger(LOGGER_MODULE).debug("executeGetAvaliableSpaces: get avaliable spaces succeeded");
        return spaces;
      })
      .catch((error) => {
        getModuleLogger(LOGGER_MODULE).error("executeGetAvaliableSpaces: get avaliable spaces failed", error);
        return [];
      });
  }

  async applyTarget(org: string, space: string) {
    try {
      await cfSetOrgSpace(org, space);
      cmdLoginResult = OK;
      void vscode.window.showInformationMessage(messages.success_set_org_space);
      getModuleLogger(LOGGER_MODULE).debug("executeSetOrgSpace: set org & spaces succeeded");
      panel?.dispose();
      return cmdLoginResult;
    } catch (error) {
      cmdLoginResult = undefined;
      getModuleLogger(LOGGER_MODULE).error("executeSetOrgSpace: set org & spaces failed", error);
      return "Error";
    }
  }

  openPasscodeLink(endpoint: string) {
    void vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(this.calculatePasscodeUrl(endpoint)));
  }

  async invokeLongFunctionWithProgressForm(longFunction: Function, ...args: any): Promise<any> {
    try {
      await this.rpc.invoke("setBusyIndicator", [true]);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      return await longFunction(...args);
    } finally {
      await this.rpc.invoke("setBusyIndicator", [false]);
    }
  }
}

// for testing purpose only
export const internal = {
  LoginTarget,
};
