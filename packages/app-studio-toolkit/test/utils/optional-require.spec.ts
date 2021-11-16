import { expect } from "chai";
import { optionalRequire } from "../../src/utils/optional-require";

describe("the optionalRequire utility", () => {
  it("return undefined if a module does not exist", () => {
    // unicode heart is not a valid module name (at least currently).
    const tinManHeart = optionalRequire("♥");
    expect(tinManHeart).to.be.undefined;
  });

  context("with a module that throws an error during init", () => {
    before(() => {
      delete (global as any).basketBall;
    });

    it("silently return undefined if a module throws an error", () => {
      expect((global as any).basketBall).to.be.undefined;
      const optionalModule = optionalRequire(
        // local require reference not supported
        // so we have to pass the path relative to our `optional-require` module
        "../../test/utils/samples/throwing-module"
      );
      expect(optionalModule).to.be.undefined;
      expect((global as any).basketBall).to.be.true;
    });

    after(() => {
      delete (global as any).basketBall;
    });
  });

  it("returns the module if it exist", () => {
    // `crypto` is built-in in nodejs and should always be available
    const cryptoBubble = optionalRequire("crypto");
    expect(cryptoBubble).to.exist;
    // @ts-expect-error -- dynamic import
    expect(cryptoBubble.Cipher).to.exist;
  });
});
