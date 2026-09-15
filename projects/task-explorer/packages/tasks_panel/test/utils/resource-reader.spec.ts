import { expect } from "chai";
import { fail } from "assert";
import * as fs from "fs/promises";
import { mock, SinonMock } from "sinon";
import { readResource } from "../../src/utils/resource-reader";

describe("The resource-reader utils", () => {
  const file = "/my/path/file";
  let mockFsextra: SinonMock;
  beforeEach(() => {
    mockFsextra = mock(fs);
  });

  afterEach(() => {
    mockFsextra.verify();
  });

  it("readResource - success", async () => {
    const content = "file content";
    mockFsextra.expects("readFile").withExactArgs(file, "utf8").resolves(content);
    expect(await readResource(file)).to.be.equal(content);
  });

  it("readResource - i/o rejected", async () => {
    const error = new Error("i/o problem");
    mockFsextra.expects("readFile").withExactArgs(file, "utf8").rejects(error);
    try {
      await readResource(file);
      fail("should fail");
    } catch (e: any) {
      expect(e).to.be.deep.equal(error);
    }
  });
});
