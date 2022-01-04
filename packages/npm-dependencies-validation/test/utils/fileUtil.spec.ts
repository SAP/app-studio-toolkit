import { expect } from "chai";
import { join } from "path";
import { toJsonObject, createFilePaths } from "../../src/utils/fileUtil";

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

  context("createFilePaths()", () => {
    const folderPath = join("root", "project", "folder");
    const fileName = "package.json";

    it("absPath points to a folder", () => {
      const result = createFilePaths(folderPath, fileName);
      expect(result.filePath).to.equal(join(folderPath, fileName));
      expect(result.dirPath).to.equal(folderPath);
    });

    it("absPath points to a file", () => {
      const absPath = join(folderPath, fileName);
      const result = createFilePaths(absPath, fileName);
      expect(result.filePath).to.equal(absPath);
      expect(result.dirPath).to.equal(folderPath);
    });
  });
});
