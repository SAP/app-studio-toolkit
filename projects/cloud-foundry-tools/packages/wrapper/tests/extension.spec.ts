import { expect } from "chai";
import { createSandbox } from "sinon";
import { activate, deactivate } from "./../src/extension";

describe("extension unit test", () => {
  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {});

  afterEach(() => {
    sandbox.restore();
  });

  describe("activate", () => {
    it("activation test", () => {
      expect(activate()).to.be.undefined;
    });
  });

  describe("deactivate", () => {
    it("deactivation test", () => {
      expect(deactivate()).to.be.undefined;
    });
  });
});
