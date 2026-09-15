import * as WebSocket from "ws";
import { RpcExtensionWebSockets } from "@sap-devx/webview-rpc/out.ext/rpc-extension-ws";
import { CodeSnippet } from "../code-snippet";
import { AppLog } from "../app-log";
import { ServerLog } from "./server-log";
import { ServerEvents } from "./server-events";
import backendMessages from "../messages";
import { IChildLogger } from "@vscode-logging/logger";
import { AppEvents } from "../app-events";
import { getConsoleWarnLogger } from "../logger/logger-wrapper";
import { createFlowPromise } from "../utils";

class CodeSnippetWebSocketServer {
  private rpc: RpcExtensionWebSockets | undefined;
  private codeSnippet: CodeSnippet | undefined;
  private async mockFolderDialog() {
    return "mock path";
  }

  init() {
    // web socket server
    const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 8081;
    const wss = new WebSocket.Server({ port: port }, () => {
      console.log("started websocket server");
    });
    wss.on("listening", () => {
      console.log(`listening to websocket on port ${port}`);
    });

    wss.on("error", (error) => {
      console.error(error);
    });

    wss.on("connection", (ws) => {
      console.log("new ws connection");

      // @ts-expect-error -- legacy code
      this.rpc = new RpcExtensionWebSockets(ws, getConsoleWarnLogger());
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const logger: AppLog = new ServerLog(this.rpc);
      const childLogger = {
        debug: () => "",
        error: () => "",
        fatal: () => "",
        warn: () => "",
        info: () => "",
        trace: () => "",
        getChildLogger: () => {
          return {} as IChildLogger;
        },
      };
      const appEvents: AppEvents = new ServerEvents(this.rpc);
      const snippet = {
        getQuestions() {
          return createCodeSnippetQuestions();
        },
      };

      const flowPromise = createFlowPromise<void>();

      this.codeSnippet = new CodeSnippet(
        this.rpc,
        appEvents,
        logger,
        childLogger as IChildLogger,
        flowPromise.state,
        { messages: backendMessages, snippet: snippet }
      );
      this.codeSnippet.registerCustomQuestionEventHandler(
        "folder-browser",
        "getPath",
        this.mockFolderDialog.bind(this)
      );
    });
  }
}

function createCodeSnippetQuestions(): any[] {
  const questions: any[] = [];

  questions.push(
    {
      guiOptions: {
        hint: "hint actionTemplate",
      },
      type: "list",
      name: "actionTemplate",
      message: "Action Template",
      choices: [
        "OData action",
        "Offline action",
        "Message acion",
        "Change user password",
      ],
    },
    {
      guiOptions: {
        hint: "hint actionName",
      },
      type: "input",
      name: "actionName",
      message: "Action Name",
      validate: (value: any) => {
        return value.length > 1 ? true : "Enter at least 2 characters";
      },
    },
    {
      guiOptions: {
        hint: "hint actionType",
        link: {
          text: "Open Global Settings",
          command: {
            id: "workbench.action.openGlobalSettings",
          },
        },
      },
      type: "list",
      name: "actionType",
      message: "Action Type",
      choices: ["Create entity", "Log", "Close page"],
    }
  );

  return questions;
}

const wsServer = new CodeSnippetWebSocketServer();
wsServer.init();
