import { IAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction, IUriAction } from "@sap-devx/app-studio-toolkit-types";
import { Uri } from "vscode";

export enum IconCode {
    Star = 'star'
}

interface IconInfo {
    iconName: string;
    iconLabel: string;
}

export const IconList: Record<string, IconInfo> = {
    star: {iconName: 'star', iconLabel: 'Recommended'}
};

export interface IAdditionalInfo {
    tool?: string;
    isStandalone: boolean;
    estimatedTime: string;
    projectName?: string;
    longDescription: string;
    iconCode?: IconCode;
}
export interface ICollection {
    id: string;
    title: string;
    description: string;
    type: CollectionType;
    itemIds: Array<string>;
    mode?: 'single' | 'multiple';
    additionalInfo?: IAdditionalInfo;
}

export interface ITurotial {
    id: string;
    name: string;
    link: string;
    linktext: string;
    description: string;
    collectionIds: Array<string>;
    icon: string;
}

export enum CollectionType {
    Platform,
    Scenario,
    Extension
}

interface IItemContext {
    project: string;
}

interface IItemAction {
    name: string;
    title?: string;
    action: IAction;
    contexts?: IItemContext[];
}

export interface IItemCommandContext extends IItemContext {
    params?: any[];
}
export interface IItemCommandAction extends IItemAction {
    action: ICommandAction;
    contexts?: IItemCommandContext[];
}

export interface IItemExecuteContext extends IItemContext {
    params?: any[];
}
export interface IItemExecuteAction extends IItemAction {
    action: IExecuteAction;
    contexts?: IItemExecuteContext[];
}

export interface IItemSnippetContext extends IItemContext {
    context?: any;
}
export interface IItemSnippetAction extends IItemAction {
    action: ISnippetAction;
    contexts?: IItemSnippetContext[];
}

export interface IItemUriContext extends IItemContext {
    uri?: Uri;
}
export interface IItemFileAction extends IItemAction {
    action: IFileAction;
    contexts?: IItemUriContext[];
}

export interface IItemUriAction extends IItemAction {
    action: IUriAction;
    contexts?: IItemUriContext[];
}

export type ItemAction = IItemCommandAction |
IItemExecuteAction |
IItemSnippetAction |
IItemUriAction |
IItemFileAction;

export type ItemContext = IItemCommandContext |
IItemExecuteContext |
IItemSnippetContext |
IItemUriContext;

export interface IItem {
    id: string;
    title: string;
    description: string;
    image?: IImage;
    action1?: ItemAction;
    action2?: ItemAction;
    itemIds?: Array<string>;
    activeState?: boolean;
    readState?: ReadState;
    // not using Map because it does not serialize using JSON
    labels: {[key:string]:string}[];
}

export interface IImage {
    image: string;
    note: string;
    noPrefix?: boolean;
}

export type ReadState = "READ" | "UNREAD" | "WAIT";

export type ManagerAPI = {
    setData: (extensionId: string, collections: ICollection[], items: IItem[], tutorials?: ITurotial[]) => void;
}
