import { ISnippet } from '@sap-devx/code-snippet-types';
import { ICollection, CollectionType, IItem, ManagerAPI, IItemExecuteAction, IItemExecuteContext } from '@sap-devx/guided-development-types';
import { bas, IExecuteAction, ISnippetAction, IFileAction } from '@sap-devx/app-studio-toolkit-types';
import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as path from 'path';
import { ConfigHelper } from "./configHelper";
const datauri = require("datauri");

const EXT_ID = "saposs.vscode-snippet-food-contrib";
const projectsMap: Map<string, any> = new Map();
let extensionPath: string;

let foodqItemAction: IItemExecuteAction;
let foodqAction: IExecuteAction;
let michelin3StarsAction: IFileAction;
let michelin2StarsAction: IFileAction;
let groceryListAction: ISnippetAction;
let foodqCollectionTemplate: ICollection = {
    id: "collection2",
    title: "Restaurants",
    description: "Find your desired restaurant from the options below. You can order take-away, delivery, or reserve a table. (The options rely on the 'foodq.json' file in your workspace.)",
    type: CollectionType.Scenario,
    itemIds: [
        `${EXT_ID}.foodq-restaurant`,
        `${EXT_ID}.michelin-restaurants`
    ]
};

function getCollections(): ICollection[] {
    const collections: ICollection[] = [];

    let collection: ICollection = {
        id: "collection1",
        title: "Create Grocery List",
        description: "This is a tool to create a grocery list",
        type: CollectionType.Scenario,
        itemIds: [
            `${EXT_ID}.create-grocery-list`
        ]
    };
    collections.push(collection);

    if (projectsMap.size > 0) {
        collections.push(foodqCollectionTemplate);
    }

    return collections;
}

function getItems(): Array<IItem> {
    foodqItemAction.contexts = [];
    for (const project of projectsMap) {
        const context: IItemExecuteContext = {
            project: project[1],
            params: [project[0]]
        }
        foodqItemAction.contexts?.push(context);
    }
    return getInitialItems();

}

function getInitialItems(): Array<IItem> {
	const items: Array<IItem> = [];
	let item: IItem;
    item = {
        id: "create-grocery-list",
        title: "Populate List",
        description: "Select the items you need to buy from the options provided.<br>\
        This list is saved so that you can reuse it every time you go shopping. This saves you time and money.<br>\
        We bring our groceries from across the country, thus helping the local farmers and making sure the products are fresh and straight from the fields.<br>\
        It is a well known fact that creating a grocery list helps you not only to buy only the items you need, but it also acts as a reminder of the things you usually buy so that even if you were not aware you needed to select a certain item, when you see it on the list, a memory will be triggered and you can select it.<br>\
        To select items for your grocery cart:<br>\
        <ol>\
        <li>Click <b>Create Grocery List</b>.<br>\
        The grocery list is opened in a new tab next to this one.</li>\
        <li>Select the checkboxes next to the items you need.</li>\
        <li>Enter the target folder to define where you want to save your grocery list.</li>\
        <li>Specify if you need delivery.</li>\
        <li>If you need delivery, add your address and phone number.</li>\
        <li>Click <b>Create</b>.</li>\
        </ol>",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'list.png')),
            note: "Our products are always fresh and of the best quality."
        },
        action1:  {
            name: "Create Grocery List",
            action: groceryListAction,
            contexts: [{
                project: "myProj",
                context: {}
            }]
        },
        labels: [
            { "Project Type": "create-grocery-list" }
        ]
    };
    items.push(item);
    item = {
        id: "foodq-restaurant",
        title: "FoodQ",
        description: "Order your favorite dishes from the FoodQ restaurant.<br>\
        FoodQ is our restaurant of choice. It has a mix of all the dishes that we like most from other restaurants. You can have Asian, fast food, Mexican, Italian, or even a bit of all. Our dishes are large and tasty. We make sure our suppliers use the best raw materials and that the food is brought to you in a visually attractive way.<br>\
        We have received very good customer feedback. The people who eat at FoodQ are recurring customers, they tend to order from us at least twice a week. We would like to think they feel it as their family restaurant, the food they eat to feel at home.<br>\
        We ensure a speedy delivery so that the food gets to your house still warm from our kitchens!<br>\
        So click <b>Order</b>, pick out your favorite food, and we'll take care of the rest.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'SAP.png')),
            note: "You can sit at the restaurant or we can deliver the food to your home."
        },
        action1: foodqItemAction,
        labels: [
            { "Project Type": "foodq-restaurant" }
        ]
    };
	items.push(item);
    item = {
        id: "michelin-restaurants",
        title: "Michelin Restaurants",
        description: "Treat yourself to a first-class experience at our Michelin restaurants.<br>\
        Michelin restaurants are defined by being listed in the Michelin Guides. Michelin Guides (are a series of guide books published by the French tire company Michelin for more than a century. The term normally refers to the annually published Michelin Red Guide, the oldest European hotel and restaurant reference guide, which awards up to three Michelin stars for excellence to a select few establishments. The acquisition or loss of a star can have dramatic effects on the success of a restaurant. Michelin also publishes a series of general guides to cities, regions, and countries, the Green Guides.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'Michelin.png')),
            note: "image note of michelin-restaurants"
        },
        itemIds: [
			`${EXT_ID}.michelin-restaurants-3stars`,
			`${EXT_ID}.michelin-restaurants-2stars`
        ],
        labels: [
            { "Project Type": "michelin-restaurants" }
        ]
    };
	items.push(item);
    item = {
        id: "michelin-restaurants-3stars",
        title: "3-Star Michelin Restaurants",
        description: "The Michelin guide defines 3-star restaurants as \"exceptional cuisine that is worth a special journey\". So embark in that journey and come enjoy the food.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'Michelin-3-stars.png')),
            note: "Currently, there are 137 restaurants with 3 Michelin stars."
        },
        action1: {
            name: "3-Star Michelin Restaurants",
            action: michelin3StarsAction
        },
        labels: [
            { "Project Type": "foodq-restaurant" }
        ]
    };
	items.push(item);
    item = {
        id: "michelin-restaurants-2stars",
        title: "2-Star Michelin Restaurants",
        description: "The Michelin guide defines 2-star restaurants as \"excellent cooking that is worth a detour\". Select one of the restaurants in this list of a guaranteed delicious meal.",
        image: {
            image: getImage(path.join(extensionPath, 'resources', 'Michelin-2-stars.png')),
            note: "Currently, there are 382 restaurants with 2 Michelin stars."
        },
        action1: {
            name: "2-Star Michelin Restaurants",
            action: michelin2StarsAction
        },
        labels: [
            { "Project Type": "foodq-restaurant" }
        ]
    };
	items.push(item);
    return items;
}

export async function activate(context: vscode.ExtensionContext) {
    extensionPath = context.extensionPath;
    
    const basAPI: typeof bas = vscode.extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;
    basAPI.getExtensionAPI<ManagerAPI>("SAPOSS.guided-development").then((managerAPI) => {
        createGuidedDevActions(basAPI);
        createFileSystemWatcher("**/foodq.json", managerAPI);
        managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    const api = {
		getCodeSnippets(context: any) {
			const snippets = new Map<string, ISnippet>();
			let snippet: ISnippet = {
				getMessages() {
					return {
						title: "Create Grocery List",
						description: "Create an organized grocery list to avoid buying items you don't really need.",
						applyButton: "Create"
					};
				},
				async getQuestions() {
					return createCodeSnippetQuestions(context);
				},
				async getWorkspaceEdit(answers: any) {
					return createCodeSnippetWorkspaceEdit(answers, context);
				}
			}
			snippets.set("snippet_1", snippet);
			return snippets;
		},
    };

    return api;
}

function createGuidedDevActions(basAPI: typeof bas) {
    foodqAction = new basAPI.actions.ExecuteAction()
    foodqAction.executeAction = (params) => {
        return vscode.commands.executeCommand("loadYeomanUI", { filter: { type: "foodq" }, data: { folder: _.get(params, "[0]") } });
	};
    groceryListAction = new basAPI.actions.SnippetAction()
    groceryListAction.contributorId = EXT_ID;
    groceryListAction.snippetName = "snippet_1";
    groceryListAction.context = {};
    michelin3StarsAction = new basAPI.actions.FileAction();
    michelin3StarsAction.uri = vscode.Uri.parse("https://guide.michelin.com/en/restaurants/3-stars-michelin");
    michelin2StarsAction = new basAPI.actions.FileAction();
    michelin2StarsAction.uri = vscode.Uri.parse("https://guide.michelin.com/en/restaurants/2-stars-michelin");

    foodqItemAction = {
        title: "Your food is only one click away.",
        name: "Order",
        action: foodqAction,
        contexts: []
    };

}

function createFileSystemWatcher(globPattern: vscode.GlobPattern, managerAPI: ManagerAPI) {
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
        // when first folder is added to the workspace, the extension is reactivated, so we could let the find files upon activation handle this use-case
        // when last folder removed from workspace, the extension is reactivated, so we could let the find files upon activation handle this use-case

        for (const folder of e.removed) {
            console.dir(`${folder.uri.path} removed from workspace`);
            removeFoodqProject(folder.uri.path);
            managerAPI.setData(EXT_ID, getCollections(), getItems());
        }

        for (const folder of e.added) {
            console.dir(`${folder.uri.path} added to workspace`);
            addFoodqPoject(folder.uri.path);
            managerAPI.setData(EXT_ID, getCollections(), getItems());
        }
    });

    vscode.workspace.findFiles(globPattern).then((uris) => {
        for (const uri of uris) {
            console.log(`found ${uri.path} on activation`);
            addFoodqPoject(path.dirname(uri.path));
            managerAPI.setData(EXT_ID, getCollections(), getItems());
        }
    });

    const watcher = vscode.workspace.createFileSystemWatcher(globPattern);
    watcher.onDidDelete((e) => {
        console.log(`${e.path} deleted`);
        removeFoodqProject(path.dirname(e.path));
        managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    watcher.onDidCreate((e) => {
        console.log(`${e.path} created`);
        addFoodqPoject(path.dirname(e.path));
        managerAPI.setData(EXT_ID, getCollections(), getItems());
    });

    watcher.onDidChange((e) => {
        console.log(`${e.path} changed`);
        // TODO: update items based on contents of bake.json?
        // managerAPI.setData(EXT_ID, getCollections(), getItems());
    });
}

function addFoodqPoject(dirPath: string): void {
    const name = path.parse(dirPath).name;
    projectsMap.set(dirPath, name);
}

function removeFoodqProject(dirPath: string): void {
    projectsMap.delete(dirPath);
}

async function createCodeSnippetWorkspaceEdit(answers: any, context: any) {
	let outputFile: string;
	if (answers.path) {
		outputFile = answers.path + '/foodq.json';
	} else {
		let outputFolder = _.get(vscode, "workspace.workspaceFolders[0].uri.path");
		if (!outputFolder || !outputFolder.length) {
			vscode.window.showErrorMessage("Cannot find folder");
			return;
		}
		outputFile = outputFolder + '/foodq.json';
	}

	const docUri: vscode.Uri = vscode.Uri.parse(outputFile);

	const configurations = await ConfigHelper.readFile(docUri.fsPath);

	const config = {
		groceries: answers.groceries,
		path: answers.path,
		isDelivery: answers.isDelivery,
		address: answers.address,
		phoneNumber: answers.phoneNumber
	};
	configurations['configurations'].push(config);

	const we = new vscode.WorkspaceEdit();
	we.createFile(docUri, { ignoreIfExists: true });

	const metadata = {needsConfirmation: true, label: "snippet contributor"};
	const newText = ConfigHelper.getString(configurations);
	const range = await ConfigHelper.getRange(docUri);
	we.replace(docUri, range, newText, metadata);

	return we;
}

function createCodeSnippetQuestions(context: any) : any[] {
	const questions: any[] = [];

    questions.push(
		{
		  guiOptions: {
			hint: "Add your favorite groceries to the list."
		  },
		  type: "checkbox",
		  name: "groceries",
		  message: "Groceries",
		  choices: [
			'Banana',
			'Orange',
			'Carrot',
			'Bread',
			'Pasta',
			'Rice',
			'Milk',
			'Yogurt',
			'Cheese'
		  ]
		},
		{
		  guiOptions: {
			hint: "Select the folder to which you want to save the grocery list.",
			type: "folder-browser",
		  },
		  type: "input",
		  name: "path",
		  message: "Target Folder",
		  default: "/home/user/projects"
        },
		{
            guiOptions: {
                hint: "Do you want the groceries delivered to your home?",
            },
            type: "confirm",
            name: "isDelivery",
            message: "Delivery",
            default: false
        },
        {
            guiOptions: {
                hint: "Provide the address for delivery.",
            },
            type: "input",
            name: "address",
            message: "Address",
            when: function (answers: any) {
              return answers.isDelivery;
            }
        },
        {
            guiOptions: {
                hint: "Provide your phone number.",
            },
            type: "input",
            name: "phoneNumber",
            message: "Phone Number",
            when: function (answers: any) {
              return answers.isDelivery;
            },
            validate: function (value: any) {
                return value.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im) ? true : "Enter valid phone number.";
              }
          }
      );
  
    return questions;
}

function getImage(imagePath: string) :string {
    let image;
    try {
      image = datauri.sync(imagePath);
    } catch (error) {
        // image = DEFAULT_IMAGE;
    }
    return image;
}

export function deactivate() {}
