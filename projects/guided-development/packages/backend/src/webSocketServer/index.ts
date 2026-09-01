import * as WebSocket from 'ws';
import { RpcExtensionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { GuidedDevelopment } from '../guided-development';
import { AppLog } from "../app-log";
import { ServerLog } from './server-log';
import backendMessages from "../messages";
import { IChildLogger } from "@vscode-logging/logger";
import { AppEvents } from '../app-events';
import { CollectionType, IconCode } from "../types";
import { IInternalItem, IInternalCollection } from "../Collection";
import { ServerEvents } from './server-events';

import { ICommandAction, IExecuteAction, ISnippetAction } from "@sap-devx/app-studio-toolkit-types";

import * as api from "../api";

const collectionAdditionalInfo = {
  tool: 'BAS CDS Modeler',
  projectName: "Test",
  isStandalone: false,
  estimatedTime: "5 mins",
  longDescription: 'This guide is part of the <a href="">Golden Path</a> and is recommended because of your current project configuration.',
  iconCode: IconCode.Star
};

class GuidedDevelopmentWebSocketServer {
  private rpc: RpcExtensionWebSockets | undefined;
  private guidedDevelopment: GuidedDevelopment | undefined;
  private readonly appEvents: AppEvents;

  constructor() {
    this.appEvents = new ServerEvents();
    api.setSetData(this.appEvents, this.appEvents.setData);
  }

  init() {
    // web socket server
    const port = (process.env.PORT ? Number.parseInt(process.env.PORT) : 8081);
    const wss = new WebSocket.Server({ port: port }, () => {
      console.log('started websocket server');
    });
    wss.on('listening', () => {
      console.log(`listening to websocket on port ${port}`);
    });

    wss.on('error', (error) => {
      console.error(error);
    });

    wss.on('connection', (ws) => {
      console.log('new ws connection');

      this.rpc = new RpcExtensionWebSockets(ws);
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const logger: AppLog = new ServerLog(this.rpc);
      const childLogger = { debug: () => '', error: () => '', fatal: () => '', warn: () => '', info: () => '', trace: () => '', getChildLogger: () => { return {} as IChildLogger; } };
      const collections = createCollections();
      const guide = collections[0];
      const uiOptions = {renderType: "collection", extensionId: '', id: guide.id, title: guide.title, description: guide.description, additionalInfo: guide.additionalInfo};
      this.guidedDevelopment = new GuidedDevelopment(this.rpc, this.appEvents, logger, childLogger as IChildLogger, {...backendMessages, collectionAdditionalInfo}, collections, uiOptions);

      // demonstrate updating of items (mimics contributors calling the onChange callback)
      setTimeout(() => {
        collections[0].itemIds.push("saposs.vscode-contrib1.new");

        const openAction: IExecuteAction = {
          actionType: "EXECUTE",
          executeAction: () => {
            console.log("workbench.action.openGlobalSettings");
            return Promise.resolve();
          }
        };

        const item: IInternalItem = {
          id: "new",
          fqid: "saposs.vscode-contrib1.new",
          title: "New Item",
          description: "It is easy to configure Visual Studio Code to your liking through its various settings.",
          image: {
            image: getImage(),
            note: "image note of new item"
          },
          action1: {
            title: "Open Title",
            name: "Open",
            action: openAction
          },
          labels: [
            { "Project Name": "cap1" },
            { "Project Path": "/home/user/projects/cap1" },
            { "Project Type": "CAP" },
          ]
        };

        collections[0].items.push(item);
        this.guidedDevelopment.setCollections(collections);
      }, 3000);
    });
  }
}

function createCollections(): IInternalCollection[] {
  /**
   * Actions
   */
  const myExecuteAction: IExecuteAction = {
    actionType: "EXECUTE",
    executeAction: (params?: any[]) => {
      console.log(`Performing execute action with params ${params.join()}`);
      return Promise.resolve();
    }
  };

  const openViaCommandAction: ICommandAction = {
    actionType: "COMMAND",
    name: "workbench.action.openGlobalSettings"
  };

  const showInfoMessageAction: ICommandAction = {
    actionType: "COMMAND",
    name: "workbench.action.openGlobalSettings"
  };

  const snippet1Action: ISnippetAction = {
    actionType: "SNIPPET",
    contributorId: "SAPOSS.vscode-snippet-food-contrib",
    snippetName: "snippet_1",
    context: { uri: "uri" }
  };

  /** 
   * Collections
   */
  const collections: IInternalCollection[] = [];
  let collection: IInternalCollection = {
    id: "collection1",
    title: "Demo collection [Scenario]",
    description: "This is a demo collection. It contains a self-contributed item and and items contributed by a different contributor.",
    type: CollectionType.Scenario,
    itemIds: [
      "saposs.vscode-contrib1.open",
      "saposs.vscode-contrib2.clone"
    ],
    additionalInfo: collectionAdditionalInfo,
    items: [
      {
        id: "open",
        fqid: "saposs.vscode-contrib1.open",
        title: "Execute a method",
        description: `It is easy to configure Visual Studio Code to your liking through its various settings. Example of composite a hyperlink into description: <a href="https://docs.github.com/en/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax">Github Basic Formating Sintax</a>`,
        image: {
          image: getImage(),
          note: ""
        },
        action1: {
          name: "Execute",
          action: myExecuteAction,
          contexts: [
            {
              project: "P1",
              params: ["p1"]
            },
            {
              project: "P2",
              params: ["p2"]
            }
          ]
        },
        labels: [
          { "Project Name": "cap1" },
          { "Project Path": "/home/user/projects/cap1" },
          { "Project Type": "CAP" },
        ],
      },
      {
        id: "open-snippet",
        fqid: "SAPOSS.vscode-contrib3.open-snippet",
        title: "Open Snippet (via snippet)",
        description: "It is easy to configure Visual Studio Code to your liking through its various settings.",
        labels: [],
        items: [{
          id: "sub-open-snippet",
          fqid: "SAPOSS.vscode-contrib3.sub-open-snippet",
          title: "subitem1",
          description: "",
          action1: {
            title: "Snippet Action Title",
            name: "Snippet",
            action: snippet1Action
          },
          labels: [
            { "Project Name": "cap3" },
            { "Project Path": "/home/user/projects/cap3" },
            { "Project Type": "CAP" },
          ]
        }]
      },
    ]
  };
  collections.push(collection);

  collection = {
    id: "collection2",
    title: "Another demo collection [Platform]",
    description: "This is another demo collection.",
    type: CollectionType.Platform,
    itemIds: [
      "saposs.vscode-contrib2.show-items"
    ],
    items: [
      {
        id: "show-items",
        title: "Show items",
        description: "Shows list of items",
        fqid: "saposs.vscode-contrib2.show-items",
        itemIds: [
          "saposs.vscode-contrib2.open-command"
        ],
        items: [
          {
            id: "open-command",
            fqid: "saposs.vscode-contrib2.open-command",
            title: "Open Global Settings (via command)",
            description: "It is easy to configure Visual Studio Code to your liking through its various settings.",
            action1: {
              name: "Open via command",
              action: openViaCommandAction
            },
            action2: {
              name: "Show info message",
              action: showInfoMessageAction
            },
            labels: [
              { "Project Name": "cap2" },
              { "Project Path": "/home/user/projects/cap2" },
              { "Project Type": "CAP" },
            ]
          }
        ],
        labels: [
          { "Project Name": "cap1" },
          { "Project Path": "/home/user/projects/cap1" },
          { "Project Type": "CAP" },
        ]
      }
    ]
  };
  collections.push(collection);

  return collections;
}

const wsServer = new GuidedDevelopmentWebSocketServer();
wsServer.init();

function getImage() {
  return "data:image/jpeg;base64,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";
}
