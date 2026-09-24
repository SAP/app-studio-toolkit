import { ISnippet } from "@sap-devx/code-snippet-types";
import * as vscode from "vscode";
import * as _ from "lodash";
import { ConfigHelper } from "./configHelper";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- tech debt missing interface definition...
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "snippet1" is now active!');

  const disposable = vscode.commands.registerCommand(
    "extension.showCodeSnippetContrib",
    async (uri: vscode.Uri) => {
      try {
        await vscode.commands.executeCommand("loadCodeSnippet", {
          contributorId: "SAPOSS.vscode-snippet-contrib",
          snippetName: "snippet_1",
          context: { uri: uri },
          isNonInteractive: false,
          snippetArgs: {
            configType: "extensionHost",
            configName: "defaultName2",
          },
        });
      } catch (error) {
        vscode.window.showInformationMessage(error as string);
      }
    }
  );

  context.subscriptions.push(disposable);

  const api = {
    getCodeSnippets(context: any) {
      const snippets = new Map<string, ISnippet>();
      const snippet: ISnippet = {
        getMessages() {
          return {
            title: "Create Launch Configuration",
            description:
              "Provide details for the launch configuration you want to create.",
            applyButton: "Create",
          };
        },
        async getQuestions() {
          return createCodeSnippetQuestions();
        },
        async getWorkspaceEdit(answers: any) {
          let outputFile: string;
          if (context.uri) {
            outputFile = context.uri.path;
          } else {
            const outputFolder = _.get(
              vscode,
              "workspace.workspaceFolders[0].uri.path"
            );
            if (!outputFolder || !outputFolder.length) {
              vscode.window.showErrorMessage("Cannot find folder");
              return;
            }
            outputFile = outputFolder + "/.vscode/launch.json";
          }

          const docUri: vscode.Uri = vscode.Uri.parse(outputFile);

          const configurations = await ConfigHelper.readFile(docUri.fsPath);

          const config = {
            name: answers.configName,
            type: answers.configType,
            program: answers.configProgram,
          };
          configurations["configurations"].push(config);

          const we = new vscode.WorkspaceEdit();
          we.createFile(docUri, { ignoreIfExists: true });

          const metadata = {
            needsConfirmation: true,
            label: "snippet contributor",
          };
          const newText = ConfigHelper.getString(configurations);
          const range = await ConfigHelper.getRange(docUri);
          we.replace(docUri, range, newText, metadata);

          return we;
        },
      };
      snippets.set("snippet_1", snippet);
      return snippets;
    },
  };

  return api;
}

function createCodeSnippetQuestions(): any[] {
  const questions: any[] = [];

  questions.push(
    {
      guiOptions: {
        hint: "Select the type of configuration you want to create.",
        link: {
          text: "wikipedia",
          url: "https://en.wikipedia.org/wiki/Configuration",
        },
      },
      type: "list",
      name: "configType",
      message: "Type",
      choices: ["node", "extensionHost"],
      default: "node",
    },
    {
      guiOptions: {
        hint: "Provide a name for your new configuration.",
        mandatory: true,
      },
      type: "input",
      name: "configName",
      message: "Name",
      default: () => "defaultName",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- should match interface
      validate: (value: any, answers: any) => {
        return value.length > 1 ? true : "Enter at least 2 characters";
      },
    },
    {
      guiOptions: {
        hint: "Select the path to the program you want to run.",
        type: "file-browser",
        link: {
          text: "Open Settings",
          command: {
            id: "workbench.action.openSettings",
            params: ["Typescript.Format"],
          },
        },
      },
      type: "input",
      name: "configProgram",
      default: "",
      message: "Program",
    },
    {
      guiOptions: {
        hint: "Select the folder you want to run.",
        type: "folder-browser",
        link: {
          text: "Open Settings",
          command: {
            id: "workbench.action.openSettings",
            params: ["Typescript.Format"],
          },
        },
      },
      type: "input",
      name: "folder",
      default: "",
      message: "Select folder",
    },
    {
      type: "input",
      guiOptions: {
        type: "radio",
        hint: "Please select radio",
      },
      name: "agree",
      message: "hi radio",
      choices: ["new", "existing1"],
      default: "existing",
    },
    {
      guiOptions: {
        hint: "Select the type of configuration you want to create.",
      },
      type: "confirm",
      name: "isSampleService",
      message: "Do you want to add a sample service?",
      default: false,
    },
    {
      // Entities checklist
      type: "checkbox",
      name: "entities",
      message: "Select entities to add:",
      choices: ["Products", "Suppliers", "Customers", "Employees"],
      validate: (value: string[], answers: any) => {
        return answers.entities.length !== 0
          ? true
          : `Select at least one entity to add.`;
      },
    },
    {
      guiOptions: {
        mandatory: true,
      },
      type: "password",
      name: "password",
      message: "Password",
      validate: (value: string | undefined) => {
        return !value ? true : "";
      },
    }
  );

  return questions;
}
