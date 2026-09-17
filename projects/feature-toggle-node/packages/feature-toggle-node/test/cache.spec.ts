import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as Cache from "../src/cache";
import { expect } from "chai";

describe("Cache", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("save toggle value by key and check value in cache return true", () => {
    Cache.setTogglesByKey("key", true);

    expect(Cache.getToggleByKey("key")).to.equal(true);
  });

  it("save toggle value by key, flush cache and check value undefined", () => {
    Cache.setTogglesByKey("key", true);
    Cache.flushCache();

    expect(Cache.getToggleByKey("key")).to.equal(undefined);
  });

  it("save features toggles in cache, check value is equal", () => {
    const features = { features: [] };
    Cache.setFeatureToggles(features);

    expect(Cache.getFeatureToggles()).to.deep.equal(features);
  });
});
