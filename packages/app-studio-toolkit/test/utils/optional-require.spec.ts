import { expect } from "chai";
import { optionalRequire } from "../../src/utils/optional-require";

describe("the optionalRequire utility", () => {
  it("return undefined if a module does not exist", () => {
    // unicode heart is not a valid module name (at least currently).
    const tinManHeart = optionalRequire("♥");
    expect(tinManHeart).to.be.undefined;
  });

  it("returns the module if it exist", () => {
    // `crypto` is built-in in nodejs and should always be available
    const cryptoBubble = optionalRequire("crypto");
    expect(cryptoBubble).to.exist;
    // @ts-expect-error -- dynamic import
    expect(cryptoBubble.Cipher).to.exist;
  });
});
