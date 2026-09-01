import * as vscode from 'vscode';
import * as path from 'path';
import { ICollection, CollectionType, IItem, ManagerAPI, IItemExecuteAction, IItemExecuteContext } from '@sap-devx/guided-development-types';
import { bas, IExecuteAction } from '@sap-devx/app-studio-toolkit-types';
// @ts-ignore
import * as datauri from "datauri";

const EXT_ID = "saposs.vscode-contrib-cake";

const projectsMap: Map<string, any> = new Map();

let extensionPath: string;

let eatAction: IExecuteAction,
    buyAction: IExecuteAction,
    mixAction: IExecuteAction,
    bakeAction: IExecuteAction,
    pourAction: IExecuteAction

let bakeItemAction: IItemExecuteAction;
    
function initActions(basAPI: typeof bas) {
    eatAction = new basAPI.actions.ExecuteAction();
    eatAction.executeAction = () => {
        return vscode.window.showInformationMessage("You are now ready to bake a cake.");
    };
    buyAction = new basAPI.actions.ExecuteAction();
    buyAction.executeAction = () => {
        return vscode.window.showInformationMessage("The ingredients will be delivered to your house.");
    };
    mixAction = new basAPI.actions.ExecuteAction();
    mixAction.executeAction = () => {
        return vscode.window.showInformationMessage("Make sure there are no lumps in the mix.");
    };

    bakeAction = new basAPI.actions.ExecuteAction();
    bakeAction.executeAction = (params) => {
        if (params && params.length > 0) {
            return vscode.window.showInformationMessage(`Check if the cake is ready using a toothpick. (${params})`);
        } else {
            return vscode.window.showInformationMessage(`Check if the cake is ready using a toothpick.`);
        }
    };
    bakeItemAction = {
        name: "Bake",
        action: bakeAction,
        contexts: []
    };

    pourAction = new basAPI.actions.ExecuteAction();
    pourAction.executeAction = () => {
        return vscode.window.showInformationMessage("We recommend you use a round pan.");
    };
}

function getCollections(): ICollection[] {
    const collections: ICollection[] = [];

    const noBakeCollection = {
        id: "collection1",
        title: "Make a No Bake Cake",
        description: "This is a recipe for making a no-bake cake.",
        type: CollectionType.Scenario,
        itemIds: [
            `${EXT_ID}.buy-ingredients`,
            `${EXT_ID}.mix-ingredients`,
            `${EXT_ID}.pour-mix`,
            `${EXT_ID}.eat-cake`,
        ]
    };
    collections.push(noBakeCollection);

    const bakeCollection: ICollection = {
        id: "collection2",
        title: "Bake a Cake",
        description: "This is a repice for making baked cakes. You can bake a cake only if there is a bake.json file in your workspace",
        type: CollectionType.Scenario,
        itemIds: [
            `${EXT_ID}.buy-ingredients`,
            `${EXT_ID}.mix-ingredients`,
            `${EXT_ID}.pour-mix`,
            `${EXT_ID}.bake`,
            `${EXT_ID}.eat-cake`,
        ]
    };
    
    collections.push(bakeCollection);
    return collections;
}

function getItems(): Array<IItem> {
    bakeItemAction.contexts = [];
    for (const project of projectsMap) {
        const context: IItemExecuteContext = {
            project: project[1],
            params: [project[0]]
        }
        bakeItemAction.contexts.push(context);
    }

    return getInitialItems();
}

function getInitialItems(): Array<IItem> {
    const items: Array<IItem> = [];
    let item: IItem = {
        id: "eat-cake",
        title: "Eat Cake",
        description: "You're done!! The cake is ready to be enjoyed as the perfect dessert.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'cake.png')),
            note: "We recommend to eat this cake together with vanilla ice-cream."
        },
        action1: {
            name: "Eat",
            action: eatAction
        },
        labels: [
            { "Project Type": "All Cakes" }
        ]
    };
    items.push(item);

    item = {
        id: "buy-ingredients",
        title: "Buy Ingredients",
        description: "For this cake you will need dark chocolate, flour, and eggs.",
        action1: {
            name: "Buy",
            action: buyAction
        },
        labels: []
    };
    items.push(item);

    item = {
        id: "mix-ingredients",
        title: "Mix Ingredients",
        description: "Add the dry ingredients to a bowl, then add the liquid ingredients and mix them together.",
        action1: {
            name: "Mix",
            action: mixAction
        },
        labels: []
    };
    items.push(item);

    item = {
        id: "bake",
        title: "Bake your Cake",
        description: "Pre-heat the oven. Leave the cake inside the oven for 45 minutes at a high temperature.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'chief.png')),
            note: "Don’t open the oven 25 times as the cake bakes. This lets in cool air and the drastic temperature change causes the rising cake to sink."
        },
        action1: bakeItemAction,
        labels: []
    };
    items.push(item);

    item = {
        id: "pour-mix",
        title: "Pour Mix into Pan",
        description: "Pour the mix into a pan that was previously oiled.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'cook.png')),
            note: "You can add chocolate sprinkles on top."
        },
        action1: {
            name: "Pour",
            action: pourAction
        },
        labels: []
    };
    items.push(item);

    item = {
        id: "place-pan",
        title: "Place Pan in Oven",
        description: "Place the pan with the mix in the oven",
        itemIds: [
            `${EXT_ID}.insert-pan`,
        ],
        labels: []
    };
    items.push(item);

    return items;
}

function addBakeCollection(dirPath: string): void {
    const name = path.parse(dirPath).name;
    projectsMap.set(dirPath, name);
}

function removeBakeCollection(dirPath: string): void {
    projectsMap.delete(dirPath);
}

export async function activate(context: vscode.ExtensionContext) {
    extensionPath = context.extensionPath;

    const basAPI: typeof bas = vscode.extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;
    basAPI.getExtensionAPI<ManagerAPI>("SAPOSS.guided-development").then((managerAPI) => {
        initActions(basAPI);
        createFileSystemWatcher("**/bake.json", managerAPI);
        managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    console.log(`[Extension ${EXT_ID}] Activated`);
}

function createFileSystemWatcher(globPattern: vscode.GlobPattern, managerAPI: ManagerAPI) {
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
        // when first folder is added to the workspace, the extension is reactivated, so we could let the find files upon activation handle this use-case
        // when last folder removed from workspace, the extension is reactivated, so we could let the find files upon activation handle this use-case

        for (const folder of e.removed) {
            console.dir(`${folder.uri.path} removed from workspace`);
            removeBakeCollection(folder.uri.path);
            managerAPI.setData(EXT_ID, getCollections(), getItems());
        }

        for (const folder of e.added) {
            console.dir(`${folder.uri.path} added to workspace`);
            addBakeCollection(folder.uri.path);
            managerAPI.setData(EXT_ID, getCollections(), getItems());
        }
    });

    const watcher = vscode.workspace.createFileSystemWatcher(globPattern);
    watcher.onDidDelete((e) => {
        console.log(`${e.path} deleted`);
        removeBakeCollection(path.dirname(e.path));
        managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    watcher.onDidCreate((e) => {
        console.log(`${e.path} created`);
        addBakeCollection(path.dirname(e.path));
        managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    watcher.onDidChange((e) => {
        console.log(`${e.path} changed`);
        // TODO: update items based on contents of bake.json?
        // managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    vscode.workspace.findFiles(globPattern).then((uris) => {
        for (const uri of uris) {
            console.log(`found ${uri.path} on activation`);
            addBakeCollection(path.dirname(uri.path));
            managerAPI.setData(EXT_ID, getCollections(), getItems());
        }
    });
}

function getImage(imagePath: string): string {
    let image;
    try {
        image = datauri.sync(imagePath);
    } catch (error) {
        // image = DEFAULT_IMAGE;
    }
    return image;
}


export function deactivate() { }

// OPEN ISSUES:
//   Collection that reference items from other contributors:
//      Are those items necessarily not bound to a specific project?
//      Does that mean they are static?
//      No labels?
//      Constant item IDs?
