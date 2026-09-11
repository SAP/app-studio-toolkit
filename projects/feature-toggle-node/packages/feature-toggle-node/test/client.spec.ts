import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import { expect } from "chai";
import * as Cache from "../src/cache";
import * as Request from "../src/request";
import * as Strategies from "../src/strategies";
import * as Client from "../src/client";

describe("findToggleAndReturnState", () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
    Cache.flushCache();
  });

  afterEach(function () {
    this.clock = sinon.restore();
  });

  function stubDependencies(features: Client.Features): void {
    sinon.stub(Request, "requestFeatureToggles").resolves(features);
    sinon.stub(Strategies, "isToggleEnabled").returns(true);
    sinon.stub(Cache, "getFeatureToggles").returns(undefined);
    sinon.stub(Cache, "setFeatureToggles").returns();
    sinon.stub(Cache, "getToggleByKey").returns(undefined);
    sinon.stub(Cache, "setTogglesByKey").returns();
  }

  it("toggle name found in cache by key - return true", async () => {
    const ftName = "ext.ftName";

    sinon.stub(Cache, "getToggleByKey").returns(true);
    sinon.stub(Request, "requestFeatureToggles").resolves(undefined);

    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.true;
  });

  it("toggle name not presented in toggles list - return false", async () => {
    const ftName = "ext.wrongName";
    const features = {
      features: [
        {
          name: "ext.ftName",
          description: "enabled",
          strategies: false,
          disabled: false,
        } as Client.Toggle,
      ],
    };

    stubDependencies(features);
    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.false;
  });

  it("toggle name not presented in cache and found in toggles list - return true", async () => {
    const ftName = "ext.ftName";
    const features: Client.Features = {
      features: [
        {
          name: "ext.ftName",
          description: "enabled",
          strategies: false,
          disabled: false,
        } as Client.Toggle,
      ],
    };

    stubDependencies(features);
    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.true;
  });

  it("response return empty feature toggles list - return false", async () => {
    const ftName = "ext.ftName";
    const features: Client.Features = {
      features: [],
    };

    sinon.stub(Request, "requestFeatureToggles").resolves(features);
    sinon.stub(Strategies, "isToggleEnabled").returns(true);
    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.false;
  });

  it("gets feature toggles list from cache - return true", async () => {
    const ftName = "ext.ftName";
    const features: Client.Features = {
      features: [
        {
          name: "ext.ftName",
          description: "enabled",
          strategies: false,
          disabled: false,
        } as Client.Toggle,
      ],
    };

    sinon.stub(Request, "requestFeatureToggles").resolves(undefined);
    sinon.stub(Strategies, "isToggleEnabled").returns(true);
    sinon.stub(Cache, "getFeatureToggles").returns(features);
    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.true;
  });

  it("gets empty object from requestFeatureToggles return false", async () => {
    const ftName = "ext.ftName";

    sinon.stub(Cache, "getToggleByKey").returns(false);
    sinon.stub(Request, "requestFeatureToggles").resolves({} as Client.Features);

    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.false;
  });

  it("gets null from requestFeatureToggles return false", async () => {
    // flow should not happen
    const ftName = "ext.ftName";
    const features: Client.Features = (null as unknown) as Client.Features;

    sinon.stub(Request, "requestFeatureToggles").resolves(features);
    sinon.stub(Strategies, "isToggleEnabled").returns(false);
    const isEnabled = await Client.findToggleAndReturnState(ftName);
    expect(isEnabled).to.be.false;
  });
});

describe("refreshCacheByInterval", () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    this.clock = sinon.restore();
  });
});

async function stubFlushAndSet(features: Client.Features): Promise<void> {
  sinon.stub(Request, "requestFeatureToggles").resolves(features);

  const flushSpy = sinon.stub(Cache, "flushCache");
  const setSpy = sinon.stub(Cache, "setFeatureToggles");
  await Client.requestTogglesAndSaveNewCache();

  expect(flushSpy.callCount).to.be.equal(0);
  expect(setSpy.callCount).to.be.equal(0);
}

describe("requestTogglesAndSaveNewCache", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("empty feature toggles list not call flushCache and setFeatures", async () => {
    const features: Client.Features = {
      features: [],
    };
    await stubFlushAndSet(features);
  });

  it("empty feature toggles object not call flushCache and setFeatures", async () => {
    const features: Client.Features = {} as Client.Features;
    await stubFlushAndSet(features);
  });

  it("feature toggles calls flushCache and setFeatures", async () => {
    const features: Client.Features = {
      features: [{} as Client.Toggle],
    };

    sinon.stub(Request, "requestFeatureToggles").resolves(features);

    const flushSpy = sinon.stub(Cache, "flushCache");
    const setSpy = sinon.stub(Cache, "setFeatureToggles");
    await Client.requestTogglesAndSaveNewCache();

    expect(flushSpy.callCount).to.be.equal(1);
    expect(setSpy.callCount).to.be.equal(1);
  });

  it("undefined features not call flush and set Cache", async () => {
    sinon.stub(Request, "requestFeatureToggles").callsFake(() => {
      return new Promise((resolve) => {
        resolve((null as unknown) as Client.Features);
      });
    });

    const flushSpy = sinon.stub(Cache, "flushCache");
    const setSpy = sinon.stub(Cache, "setFeatureToggles");
    await Client.requestTogglesAndSaveNewCache();

    expect(flushSpy.callCount).to.be.equal(0);
    expect(setSpy.callCount).to.be.equal(0);
  });
});
