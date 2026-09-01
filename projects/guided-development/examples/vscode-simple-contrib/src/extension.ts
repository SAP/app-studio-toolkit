import * as vscode from 'vscode';
import { bas, ICommandAction } from "@sap-devx/app-studio-toolkit-types";
import { ICollection, CollectionType, IItem, ManagerAPI } from "@sap-devx/guided-development-types";

const EXT_ID = "SAPOSS.vscode-simple-contrib";

export async function activate(context: vscode.ExtensionContext) {
    /**
     * The `app-studio-toolkit` extension provides an API for various platform capabilities, including
     * the construction of **actions**.
     * 
     * The `app-studio-toolkit` extension is guaranteed to be activated at this stage if you specify it in the `extensionDependencies`
     * section in your `package.json` file.
     * 
     * Also, make sure you include this entry in your `pacakge.json`:
     * ```js
     * "BASContributes": {
     *    "guided-development": {}
     * }
     * ```
     * 
     * This indicates to the guided-development manager extension to activate your extension
     * when the user executes the Guided Development command.
     */
    const basAPI: typeof bas = vscode.extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;

    /**
     * An action of type **command** enables you to specify any vscode command
     * ([built-in](https://code.visualstudio.com/api/references/commands),
     * [simple](https://code.visualstudio.com/docs/getstarted/keybindings#_default-keyboard-shortcuts) or
     * [extension-provided commands](https://code.visualstudio.com/api/references/vscode-api#commands)).
     */
    const searchAction: ICommandAction = {
        actionType: "COMMAND",
        name: "workbench.extensions.search",
        params: ["SAP"]
    };

    const gitAction: ICommandAction = {
        actionType: "COMMAND",
        name: "workbench.action.showCommands"
    };

    const itemId: string = "1";
    const myItem: IItem = {
        id: itemId,
        title: "Simple Item",
        description: "This is an example of a simple item.",
        labels: [],
        action1: {
            name: "Search for SAP Extensions",
            action: searchAction
        },
        action2: {
            name: "Show Commands",
            action: gitAction
        }
    }

    /**
     * Collections reference **fully-qualified** item IDs so that other extensions can reuse the items.
     *
     * A fully-qualified item ID is in the form \<extension_id>.\<item_id>, where the extension_id is in the form \<publisher>.\<extension_name>
     * (as specified in `package.json`).
     */
    const myCollection: ICollection = {
        id: "a",
        title: "Simple Collection",
        description: "This is an example of a simple collection with 2 actions.",
        type: CollectionType.Extension,
        itemIds: [`${EXT_ID}.${itemId}`]
    }

    /**
     * We wait for the guided-development manager to get activated before we send it our
     * collections and items.
     */
    basAPI.getExtensionAPI<ManagerAPI>("SAPOSS.guided-development").then((managerAPI) => {
        managerAPI.setData(EXT_ID, [myCollection], [myItem]);
    });
}
