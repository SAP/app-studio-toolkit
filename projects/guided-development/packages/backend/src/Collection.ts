import { ICollection, IItem, ITurotial } from "./types";

export interface IInternalCollection extends ICollection {
    items: IInternalItem[];
}

export interface IInternalItem extends IItem {
    fqid?: string;
    items?: IInternalItem[];
}

export interface IInternalTutorial extends ITurotial {
}
