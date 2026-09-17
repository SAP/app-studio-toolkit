import { resolve } from "path";
import { Server } from "ws";
import { RpcExtensionWebSockets } from "@sap-devx/webview-rpc/out.ext/rpc-extension-ws";
import { ServerEvents } from "./server-events";
import { AppEvents } from "../app-events";
import { TaskEditor } from "../task-editor";

export const MOCK_FOLDER_PATH = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "src",
  "webSocketServer"
);
export const TASKS_JSON_PATH = resolve(MOCK_FOLDER_PATH, "./tasks.json");

class TaskEditorWebSocketServer {
  private rpc: RpcExtensionWebSockets | undefined;
  private taskEditor: TaskEditor | undefined;

  init() {
    // web socket server
    const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 8081;
    const wss = new Server({ port: port }, () => {
      console.log("started websocket server");
    });

    wss.on("listening", () => {
      console.log(`listening to websocket on port ${port}`);
    });

    wss.on("error", (error: any) => {
      console.error(error);
    });

    wss.on("connection", async (ws: any) => {
      console.log("new ws connection");

      this.rpc = new RpcExtensionWebSockets(ws);
      const appEvents: AppEvents = new ServerEvents();
      this.taskEditor = new TaskEditor(this.rpc, appEvents, mockTaskInfo());
    });
  }
}

function mockTaskInfo(): any {
  return {
    label: "labela",
    type: "deploy",
    prop1: "prop1a",
    prop2: "prop2",
    __index: 0,
    __intent: "Deploy",
  };
}

const wsServer = new TaskEditorWebSocketServer();
wsServer.init();
