import { ICollection, IItem, ITurotial, ManagerAPI } from './types';

let _setData: any;
let _thisArg: any;

export function setSetData(thisArg: any, setData: any) {
    _thisArg = thisArg;
    _setData = setData;
}

export const managerApi: ManagerAPI = {
    setData: (extensionId: string, collections: ICollection[], items: IItem[], tutorials?: ITurotial[]) => {
        if (_setData) {
            _setData.call(_thisArg, extensionId, collections, items, tutorials);
        }
    }
}
