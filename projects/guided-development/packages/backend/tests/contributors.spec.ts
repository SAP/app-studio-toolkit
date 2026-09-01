import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";

const testVscode = {
    extensions: {
        all: new Array()
    },
    Extension: <any>[],
    commands: {
        executeCommand: () => Promise.resolve()
    }
};

mockVscode(testVscode, "src/contributors.ts");
import { Contributors } from "../src/contributors";
import { IItem, CollectionType, ITurotial, IconCode } from "../src/types";
import { IInternalItem, IInternalCollection } from "./Collection";

describe('Contributors unit test', () => {
    let sandbox: any;
    let extensionsMock: any;
    let contributorsMock: any;
    let consoleMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        consoleMock = sandbox.mock(console);
        extensionsMock = sandbox.mock(testVscode.extensions);
        contributorsMock = sandbox.mock(Contributors);
    });

    afterEach(() => {
        consoleMock.verify();
        extensionsMock.verify();
        contributorsMock.verify();
    });

    describe('registerOnChangedCallback', () => {
        it("no guided development exists", () => {
            Contributors.getInstance().registerOnChangedCallback(undefined, undefined);
            expect(Contributors.getInstance()["onChangedCallback"]).to.equal(undefined);
            expect(Contributors.getInstance()["onChangedCallbackThis"]).to.equal(undefined);
        });
    });

    describe('init', () => {
        it("No Contributors", () => {
            Contributors.getInstance().init();
            expect(Contributors.getInstance().getCollections()).to.have.length(0);
            expect(Contributors.getInstance().getCollectionsInfo()).to.have.length(0);
        });

        it("Contributor exists", () => {
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
            Contributors.getInstance().setData(extensionId, [collection1], [item1, item2]);
            expect(Contributors.getInstance().getCollections()).to.have.length(1);
            expect(Contributors.getInstance().getCollectionsInfo()).to.have.length(1);
            expect(Contributors.getInstance()["collectionsMap"]).to.have.keys("extid");
        });

        it("item with subItem", () => {
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
            Contributors.getInstance().setData(extensionId, [collection1], [item1, item2]);
            const itemsMap = Contributors.getInstance()["itemsMap"];
            expect(itemsMap.get(fqid1.toLocaleLowerCase()).id).to.equal(itemId1);
            expect(itemsMap.get(fqid2.toLocaleLowerCase()).id).to.equal(itemId2);

            expect(Contributors.getInstance().getCollections()).to.have.length(1);
            expect(Contributors.getInstance().getCollectionsInfo()).to.have.length(1);
        });
    });

    describe('setData', () => {
        it("set 1 item", () => {
            const itemId = "id1";
            const extensionId = "extId1";
            const fqid = `${extensionId}.${itemId}`;

            const item1: IItem = {
                id: itemId,
                description: "description1",
                title: "title1",
                labels: []
            };

            Contributors.getInstance().setData(extensionId, [], [item1]);
            const itemsMap = Contributors.getInstance()["itemsMap"];
            expect (itemsMap.has(fqid.toLocaleLowerCase())).to.be.true;
            expect (itemsMap.get(fqid.toLocaleLowerCase()).id).to.equal(itemId);
        });

        it("set 2 items in 1 collection", () => {
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
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [fqid1, fqid2],
                type: CollectionType.Platform,
                items: [item1, item2]
            };

            Contributors.getInstance().registerOnChangedCallback({}, ([collection1]) => {});

            Contributors.getInstance().setData(extensionId, [collection1], [item1, item2]);
            const items = Contributors.getInstance()["getItems"](collection1);
            expect(items).to.have.length(2);
        });

        it("set 1 collection in 1 tutorial", () => {
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
            };
            const collection1: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: [fqid1, fqid2],
                type: CollectionType.Platform,
                items: [item1, item2],
                additionalInfo: {
                    tool: 'BAS CDS Modeler',
                    isStandalone: false,
                    estimatedTime: "15 min",
                    projectName: "",
                    longDescription: "Long Description <br><b>Note: Test</b>",
                    iconCode: IconCode.Star
                },
            };
            const tutorial1: ITurotial = {
                id: "tutorial1",
                name: "tutorial1",
                link: '',
                linktext: '',
                description: "description1",
                collectionIds: [`${extensionId}.id1`, `${extensionId}.id2`],
                icon: ''
            };

            Contributors.getInstance().registerOnChangedCallback({}, ([collection1]) => {});

            Contributors.getInstance().setData(extensionId, [collection1], [item1, item2], [tutorial1]);
            const items = Contributors.getInstance()["getItems"](collection1);
            expect(items).to.have.length(2);
            const info = Contributors.getInstance().getGroupInfo();
            expect(info).to.have.length(2);
        });
    });

    describe('getItems', () => {
        it("collection has invalid itemId", () => {
            const collection2: IInternalCollection = {
                id: "id1",
                title: "title1",
                description: "description1",
                itemIds: ["itemId1"],
                type: CollectionType.Platform,
                items: []
            };
            consoleMock.expects("error").withExactArgs('Could not find item id itemId1');
            const items = Contributors.getInstance()["getItems"](collection2);
            expect(items).to.have.length(0);
        });
    });

    describe('initSubItems', () => {
        it("item has a subitem that does not exist", () => {
            const item1: IItem = {
                id: "id1",
                description: "description1",
                title: "title1",
                itemIds: ["itemId1"],
                labels: []
            };
            Contributors.getInstance()["initSubItems"](item1);
            expect(Contributors.getInstance()["itemsMap"].get("itemId1".toLowerCase())).to.be.undefined;
        });
    });

    describe('activateExtension', () => {
        it("extension isn't activate", () => {
            consoleMock.expects("error");
            Contributors["activateExtension"](testVscode.Extension);
        });

        it("extension is active", () => {
            testVscode.Extension = {
                isActive: true
            }
            consoleMock.expects("error").never();
            Contributors["activateExtension"](testVscode.Extension);
        });
    });
});

