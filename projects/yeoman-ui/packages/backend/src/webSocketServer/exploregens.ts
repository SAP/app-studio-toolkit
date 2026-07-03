import { WebSocketServer } from "ws";
import { RpcExtensionWebSockets } from "@sap-devx/webview-rpc/out.ext/rpc-extension-ws.js";
import type { IChildLogger } from "@vscode-logging/logger";
import { ExploreGens } from "../exploregens.js";
import { getConsoleWarnLogger } from "../logger/console-logger.js";

class ExploreGensWebSocketServer {
  private rpc: RpcExtensionWebSockets;
  private exploreGens: ExploreGens;

  init() {
    // web socket server
    const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 8082;

    const wss = new WebSocketServer({ port: port }, () => {
      console.log("started websocket server");
    });
    wss.on("listening", () => {
      console.log(`exploregens: listening to websocket on port ${port}`);
    });

    wss.on("error", (error) => {
      console.error(`exploregens: ${error}`);
    });

    wss.on("connection", (ws) => {
      console.log("exploregens: new ws connection");
      const childLogger: IChildLogger = getConsoleWarnLogger();
      // Cast: rpc-extension-ws.d.ts types its ctor param via
      // `import * as WebSocket from "ws"`, which under node16 resolution
      // is not structurally interchangeable with the WebSocket class
      // instance emitted by `on("connection")`.
      this.rpc = new RpcExtensionWebSockets(ws as any, childLogger);

      this.exploreGens = new ExploreGens(childLogger);
      this.exploreGens.init(this.rpc);
    });
  }
}

const wsServer = new ExploreGensWebSocketServer();
wsServer.init();
