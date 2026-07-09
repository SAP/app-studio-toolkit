import { expect } from "chai";
import { asArray } from "../../src/utils/questionTypes.js";

describe("questionTypes", () => {
  describe("asArray()", () => {
    it("returns the array unchanged when given an array", () => {
      const questions = [{ name: "q1" }, { name: "q2" }];
      expect(asArray(questions)).to.equal(questions);
    });

    it("wraps a single question object into an array", () => {
      const question = { name: "q1" };
      expect(asArray(question)).to.deep.equal([question]);
    });
  });
});
