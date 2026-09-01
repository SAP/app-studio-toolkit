import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as api from "../src/api";
import { IItem, ICollection, CollectionType } from "../src/types";
import { IInternalItem, IInternalCollection } from "./Collection";

describe('api unit test', () => {
    let sandbox: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });
    after(() => {
        sandbox.restore();
    });
    beforeEach(() => {  
    });
    afterEach(() => {
    });

    describe('setSetData', () => {
        it("commands registration", () => {
            let _setData: any;
            let _thisArg: any;
            api.setSetData(_setData, _thisArg);

            let res = api["managerApi"].setData("",[],[]);
            expect(res).to.be.undefined;
        });

        it("commands registration", () => {

            const itemId1 = "id1";
            const itemId2 = "id2";
            const extensionId = "extId";
            const fqid1 = `${extensionId}.${itemId1}`;
            const fqid2 = `${extensionId}.${itemId2}`;

            const item1: IInternalItem = {
                id: itemId1,
                fqid: fqid1,
                description: "description1",
                title: "title1",
                labels: [],
            };
            const item2: IInternalItem = {
                id: itemId2,
                fqid: fqid2,
                description: "description2",
                title: "title2",
                labels: [],
                itemIds: [fqid1]
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [fqid1, fqid2],
                type: CollectionType.Platform,
                items: [item2]
            };

            let _setData: any;
            let _thisArg: any;

            _setData = {
                call: (_thisArg: any, extensionId: string, [collection1]: ICollection[] , [item1, item2]: IItem[]) => {return collection1}
            }
            api.setSetData(_thisArg, _setData);
            api["managerApi"].setData(extensionId,[collection1],[item1, item2]);
            expect(api["managerApi"].setData).contains(() => _setData);
        });

    });

});
