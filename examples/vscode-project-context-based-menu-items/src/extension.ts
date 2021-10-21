import {ExtensionContext} from "vscode";
import { registerCommands } from "./commands";

function activate(context: ExtensionContext): void {
  registerCommands(context.subscriptions);
}

module.exports = {
  activate,
};
