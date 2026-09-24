import { expect } from "chai";
import * as sinon from "sinon";

import * as extension from "../src/extension";

describe("extension unit test", () => {
  let sandbox: any;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  describe("activate", () => {
    it("activation", () => {
      expect(extension.activate()).to.be.undefined;
    });
  });

  it("deactivate", () => {
    expect(extension.deactivate()).to.be.undefined;
  });
});
