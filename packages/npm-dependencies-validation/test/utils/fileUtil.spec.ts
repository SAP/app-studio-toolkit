import { expect } from "chai";
import { toJsonObject } from "../../src/utils/fileUtil";

describe("fileUtil unit tests", () => {
  context("toJsonObject()", () => {
    it("will return json object for valid json string", () => {
      const content = `{"name": "test"}`;
      type TestJson = { name: string };
      const result: TestJson = toJsonObject<TestJson>(content);
      expect(result).to.haveOwnProperty("name");
      expect(result.name).to.equal("test");
    });

    it("will return empty object for invalid json string", () => {
      const content = `{"invalid json"}`;
      const result: { name: string } = toJsonObject(content);
      expect(result).to.be.empty;
    });
  });
});
