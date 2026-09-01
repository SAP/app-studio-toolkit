import {initComponent, destroy} from './Utils'
import App from '../../src/App.vue';
import {createApp, h} from "vue";
const app = createApp({
  render: () => 
    h(App, {
    ref: 'appRef',
    
  }),
});
import { createVuetify } from "vuetify";
const Vuetify = new createVuetify({
});
import { WebSocket } from 'mock-socket'

app.use(Vuetify);
global.WebSocket = WebSocket;

let wrapper;

describe('App.vue', () => {
  afterEach(() => {
    destroy(wrapper)
  })

  it('component name', () => {
    wrapper = initComponent(App, {}, true)
    //expect(wrapper.name()).toBe('App')
  })

  it('initRpc - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.rpc = {
      invoke: jest.fn().mockImplementation(async () => { return { data: {} }; }),
      registerMethod: jest.fn()
    }
    
    wrapper.vm.showCollections = jest.fn()

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    const registerMethodSpy = jest.spyOn(wrapper.vm.rpc, 'registerMethod')
    wrapper.vm.initRpc();
    
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.showCollections, thisArg: wrapper.vm, name: 'showCollections'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.changeItemsState, thisArg: wrapper.vm, name: 'changeItemsState'})
    expect(invokeSpy).toHaveBeenCalledWith("getState")

    invokeSpy.mockRestore()
    registerMethodSpy.mockRestore()
  })

  it('reload - method', () => {
    wrapper = initComponent(App)

    wrapper.vm.rpc = {
      invoke: jest.fn().mockImplementation(async () => { return { data: {} }; })
    }
    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    wrapper.vm.reload();
    
    expect(invokeSpy).toHaveBeenCalledWith("getState")

    invokeSpy.mockRestore()
  })

  it('showCollections - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.showCollections("collection");
    expect(wrapper.vm.collections).toEqual("collection");
  })

  it("change not exist item's state", () => {
    wrapper = initComponent(App);
    const fqid1 = "extName1.extPublisher1.id1";
    const item1 = {
        id: "id1",
        fqid: fqid1,
        description: "description1",
        title: "title1",
        readState: "UNREAD",
        labels: []
    };
    const fqid2 = "extName1.extPublisher1.id2";
    const item2 = {
        id: "id2",
        fqid: fqid2,
        description: "description2",
        title: "title2",
        labels: [],
        items: [item1]
    };
    const collection1 = {
        id: "id1",
        title: "colTitle1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [item2]
    };
    const notExistsItemFqid = "extName1.extPublisher1.null";
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1]);
    const ret = wrapper.vm.changeItemsState([{fqid:notExistsItemFqid, readState: "READ"}]);
    expect(ret).toBeFalsy();
  })

  it("change exist item's state", () => {
    wrapper = initComponent(App);
    const secondNestedLevelItemFqid = "extName1.extPublisher1.secondNestedLevelItem";
    const secondNestedLevelItem = {
        id: "secondNestedLevelItem",
        fqid: secondNestedLevelItemFqid,
        description: "secondNestedLevelItemDescription",
        title: "secondNestedLevelItemTitle",
        readState: "UNREAD",
        labels: []
    };
    const topLevelItemFqid = "extName1.extPublisher1.topLevelItem";
    const topLevelItem = {
        id: "topLevelItem",
        fqid: topLevelItemFqid,
        description: "topLevelItemDescription",
        title: "topLevelItemTitle",
        labels: [],
        items: [secondNestedLevelItem]
    };
    const collection1 = {
        id: "id1",
        title: "title1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [topLevelItem]
    };
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1]);
    const targetItem = wrapper.vm.getItemByFqid(secondNestedLevelItemFqid);
    expect(targetItem.readState).toEqual("UNREAD");
    wrapper.vm.changeItemsState([{fqid:secondNestedLevelItemFqid, readState: "READ"}]);
    expect(targetItem.readState).toEqual("READ");
  }) 

  it('find an item not exists', () => {
    const fqid1 = "extName1.extPublisher1.id1";
    const item1 = {
        id: "id1",
        fqid: fqid1,
        description: "description1",
        title: "title1",
        labels: []
    };
    const collection1 = {
        id: "id1",
        title: "title1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [item1]
    };
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1]);
    const notExistsItemFqid = "extName1.extPublisher1.null";
    const targetItem = wrapper.vm.getItemByFqid(notExistsItemFqid);
    expect(targetItem).toBeFalsy();
  })

  it('find an item at root level', () => {
    const topLevelItemFqid = "extName1.extPublisher1.topLevelItem";
    const topLevelItem = {
        id: "topLevelItem",
        fqid: topLevelItemFqid,
        description: "topLevelItemDescription",
        title: "topLevelItemTitle",
        labels: [],
        items: []
    };
    const collection1 = {
        id: "id1",
        title: "colTitle1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [topLevelItem]
    };
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1]);
    const targetItem = wrapper.vm.getItemByFqid(topLevelItemFqid);
    expect(targetItem.title).toEqual("topLevelItemTitle")
  })

  it('find an item at second level', () => {
    const secondNestedLevelItemFqid = "extName1.extPublisher1.secondNestedLevelItem";
    const secondNestedLevelItem = {
        id: "secondNestedLevelItem",
        fqid: secondNestedLevelItemFqid,
        description: "secondNestedLevelItemDescription",
        title: "secondNestedLevelItemTitle",
        readState: "UNREAD",
        labels: []
    };
    const topLevelItemFqid = "extName1.extPublisher1.topLevelItem";
    const topLevelItem = {
        id: "topLevelItem",
        fqid: topLevelItemFqid,
        description: "topLevelItemDescription",
        title: "topLevelItemTitle",
        labels: [],
        items: [secondNestedLevelItem]
    };
    const collection1 = {
        id: "id1",
        title: "title1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [topLevelItem]
    };
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1]);
    const targetItem = wrapper.vm.getItemByFqid(secondNestedLevelItemFqid);
    expect(targetItem.title).toEqual("secondNestedLevelItemTitle")
  })
  
  it('find an item at third level', () => {
    const thirdNestedLevelItemFqid = "extName1.extPublisher1.thirdNestedLevelItem";
    const thirdNestedLevelItem = {
        id: "thirdNestedLevelItem",
        fqid: thirdNestedLevelItemFqid,
        description: "thirdNestedLevelItemDescription",
        title: "thirdNestedLevelItemTitle",
        labels: [],
        items: []
    };

    const secondNestedLevelItemFqid = "extName1.extPublisher1.secondNestedLevelItem";
    const secondNestedLevelItem = {
        id: "secondNestedLevelItem",
        fqid: secondNestedLevelItemFqid,
        description: "secondNestedLevelItemDescription",
        title: "secondNestedLevelItemTitle",
        labels: [],
        items: [thirdNestedLevelItem]
    };
    const topLevelItemFqid = "extName1.extPublisher1.topLevelItem";
    const topLevelItem = {
        id: "topLevelItem",
        fqid: topLevelItemFqid,
        description: "topLevelItemDescription",
        title: "topLevelItemTitle",
        labels: [],
        items: [secondNestedLevelItem]
    };
    const collection1 = {
        id: "id1",
        title: "title1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [topLevelItem]
    };
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1]);
    const targetItem = wrapper.vm.getItemByFqid(thirdNestedLevelItemFqid);
    expect(targetItem.title).toEqual("thirdNestedLevelItemTitle")
  })

  it('find an item of multiple collections', () => {
    const fqid1 = "extName1.extPublisher1.id1";
    const item1 = {
        id: "id1",
        fqid: fqid1,
        description: "description1",
        title: "title1",
        labels: []
    };
    const secondNestedLevelItemFqid = "extName1.extPublisher1.secondNestedLevelItem";
    const secondNestedLevelItem = {
        id: "secondNestedLevelItem",
        fqid: secondNestedLevelItemFqid,
        description: "secondNestedLevelItemDescription",
        title: "secondNestedLevelItemTitle",
        readState: "UNREAD",
        labels: []
    };
    const topLevelItemFqid = "extName1.extPublisher1.topLevelItem";
    const topLevelItem = {
        id: "topLevelItem",
        fqid: topLevelItemFqid,
        description: "topLevelItemDescription",
        title: "topLevelItemTitle",
        labels: [],
        items: [secondNestedLevelItem]
    };
    const collection1 = {
        id: "id1",
        title: "title1",
        description: "description1",
        itemIds: [],
        type: 0,
        items: [item1]
    };
    const collection2 = {
        id: "colId2",
        title: "colTitle2",
        description: "colDescription2",
        itemIds: [],
        type: 0,
        items: [topLevelItem]
    };
    wrapper = initComponent(App);
    wrapper.vm.showCollections([collection1, collection2]);
    const targetItem = wrapper.vm.getItemByFqid(secondNestedLevelItemFqid);
    expect(targetItem.title).toEqual("secondNestedLevelItemTitle")
  })
  
  
  it('onAction - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.rpc = {
      invoke: jest.fn().mockImplementation(async () => { return { data: {} }; })
    }
    const contextualItem = {
      item: {
        fqid: "fqid"
      },
      context: "context"
    }
    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    wrapper.vm.onAction(contextualItem, 1);
    
    expect(invokeSpy).toHaveBeenCalledWith("performAction", ["fqid", 1, "context"])

    invokeSpy.mockRestore()
  })

})
