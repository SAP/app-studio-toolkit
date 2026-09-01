import * as vscode from 'vscode';
import * as _ from 'lodash';
import { IInternalItem, IInternalCollection } from "./Collection";
import { IItem, ICollection, ITurotial, IconList } from './types';

export class Contributors {
    private onChangedCallback: (collections: Array<IInternalCollection>) => void;
    private onChangedCallbackThis: Object;

    public registerOnChangedCallback(thisArg: Object, callback: (collections: Array<IInternalCollection>) => void): void {
        this.onChangedCallback = callback;
        this.onChangedCallbackThis = thisArg;
    }

    public static getInstance(): Contributors {
        if (!Contributors.contributors) {
            Contributors.contributors = new Contributors();
        }
        return Contributors.contributors;
    }

    private constructor() {
        this.tutorialsMap = new Map();
        this.collectionsMap = new Map();
        this.itemsMap = new Map();
    }

    private static contributors: Contributors;

    private tutorialsMap: Map<string, Array<any>>;
    private collectionsMap: Map<string, Array<IInternalCollection>>;
    private itemsMap: Map<string, IInternalItem>;

    public getCollections(): Array<IInternalCollection> {
        const collections: Array<IInternalCollection> = [];
        for (const extensionCollections of this.collectionsMap.values()) {
            collections.push(...extensionCollections);
        }

        return _.sortBy(collections, ['type']);
    }

    public getCollectionsInfo(): Array<any> {
        const collections: Array<any> = [];
        for (const extensionId of this.collectionsMap.keys()) {
            this.collectionsMap.get(extensionId).forEach(collection => {
                let iconInfo = IconList[collection.additionalInfo?.iconCode] || {};
                collections.push({
                    extensionId: extensionId,
                    "id": collection.id,
                    "title": collection.title,
                    "description": collection.description,
                    "additionalInfo": collection.additionalInfo? {...collection.additionalInfo, ...iconInfo} : undefined
                });
           });
        }
        return collections;
    }

    public getCollectionsInfoOfTutorial(extensionId:string, tutorial:any): Array<any> {
        const collections: Array<any> = [];
        tutorial.collections.forEach((collection:any) => {
            let iconInfo = IconList[collection.additionalInfo?.iconCode] || {};
            collections.push({
                extensionId: extensionId,
                "id": collection.id,
                "title": collection.title,
                "description": collection.description,
                "additionalInfo": {...collection.additionalInfo, ...iconInfo, tutorialName: tutorial.name, tutorialLink: tutorial.link}
            });
        });
        return collections;
    }

    public getGroupInfo(): Array<any> {
        const data: Array<any> = this.getTutorialsInfo();
        const standaloneGuides = {
            "id": '_standalone',
            "name": 'Guides',
            "description": '',
            "link": '',
            "linktext": '',
            "icon": '',
            "collections": this.getCollectionsInfo().filter((item) => {
                return !item.additionalInfo || item.additionalInfo.isStandalone;
            })
        };
        data.push(standaloneGuides);

        return data;
    }

    public getTutorialsInfo(): Array<any> {
        const tutorials: Array<any> = [];
        let that = this;
        for (const extensionId of this.tutorialsMap.keys()) {
            this.tutorialsMap.get(extensionId).forEach(tutorial => {
                tutorials.push({
                    extensionId: extensionId,
                    "id": tutorial.id,
                    "name": tutorial.name,
                    "description": tutorial.description,
                    "link": tutorial.link,
                    "linktext": tutorial.linktext,
                    "icon": tutorial.icon,
                    "collections": that.getCollectionsInfoOfTutorial(extensionId, tutorial)
                });
           });
        }
        return tutorials;
    }

    private static activateExtension(extension: vscode.Extension<any>): void {
        if (!extension.isActive) {
            try {
                extension.activate();
            } catch (error) {
                console.error(error);
                // TODO: Add Logger.error here ("Failed to activate extension", {extensionId: extensionId})
            }
        }
    }

    private removeItems(extensionId: string): void {
        // remove all items that this extension contributed from itemsMap
        for (const fqid of this.itemsMap.keys()) {
            if (fqid.startsWith(extensionId)) {
                this.itemsMap.delete(fqid);
            }
        }
    }

    public setData(extensionId: string, collections: ICollection[], items: IItem[], tutorials?: ITurotial[]): void {
        const extensionIdLower: string = extensionId.toLocaleLowerCase();
        this.addTutorials(extensionIdLower, tutorials ? tutorials : []);
        this.addCollections(extensionIdLower, collections as IInternalCollection[]);
        this.addItems(extensionIdLower, items);
        this.initCollectionItems();
        this.initTutorialCollections();
        if (this.onChangedCallback) {
            this.onChangedCallback.call(this.onChangedCallbackThis, this.getCollections());
        }
        vscode.commands.executeCommand('guidedDevelopment.refreshCenter');
    }

    public init() {
        const allExtensions: readonly vscode.Extension<any>[] = vscode.extensions.all;
        for (const extension of allExtensions) {
            if (extension?.packageJSON?.BASContributes?.["guided-development"]) {
                Contributors.activateExtension(extension);
            }
        }
    }

    private addItems(extensionId: string, items: Array<IInternalItem>) {
        this.removeItems(extensionId);

        for (const item of items) {
            item.fqid = `${extensionId}.${item.id}`;
            this.itemsMap.set(item.fqid, item);
        }
    }

    private addCollections(extensionId: string, collections: Array<IInternalCollection>) {
        this.collectionsMap.set(extensionId, collections);
    }

    private addTutorials(extensionId: string, tutorials: Array<any>) {
        this.tutorialsMap.set(extensionId, tutorials);
    }

    private initTutorialCollections() {
        for (const tutorials of this.tutorialsMap.values()) {
            for (const tutorial of tutorials) {
                // TODO: handle duplicates?
                tutorial.collections = this.getCollectionsOfTutorial(tutorial);
            }
        }
    }

    private initCollectionItems() {
        for (const collections of this.collectionsMap.values()) {
            for (const collection of collections) {
                // TODO: handle context for subitems
                // TODO: handle duplicates?
                collection.items = this.getItems(collection);
            }
        }
    }

    private findCollction(collectionIdLower: string): IInternalCollection {
        let result = null;
        for (const extensionId of this.collectionsMap.keys()) {
            if (collectionIdLower.startsWith(extensionId)) {
                result = this.collectionsMap.get(extensionId).find((collection) => `${extensionId}.${collection.id.toLocaleLowerCase()}` === collectionIdLower);
            }
        }
        return result;
    }
    private getCollectionsOfTutorial(tutorial: any): IInternalCollection[] {
        const result: IInternalCollection[] = [];

        for (const collectionId of tutorial.collectionIds) {
            const collection = this.findCollction(collectionId.toLocaleLowerCase());
            if (collection) {
                result.push(collection);
            } else {
                console.error(`Could not find collection id ${collectionId}`)
            }
        }

        return result;
    }

    private getItems(collection: IInternalCollection): IInternalItem[] {
        const result: IInternalItem[] = [];

        for (const itemId of collection.itemIds) {
            const item = this.itemsMap.get(itemId.toLocaleLowerCase());
            if (item) {
                this.initSubItems(item);
                result.push(item);
            } else {
                console.error(`Could not find item id ${itemId}`)
            }
        }

        return result;
    }

    private initSubItems(item: IInternalItem) {
        if (item.itemIds) {
            item.items = [];
            for (const itemId of item.itemIds) {
                const subitem: IInternalItem = this.itemsMap.get(itemId.toLowerCase());
                if (subitem) {
                    item.items.push(subitem);
                    this.initSubItems(subitem);
                }
            }
        }
    }
}
