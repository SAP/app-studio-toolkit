import * as fsPromises from "fs/promises";
import { expect, assert } from "chai";
import { SinonMock, createSandbox } from "sinon";
import { findDependencyIssues } from "../src/api";

describe("dependencyIssues unit test", () => {
  it("2 dependencies and 1 devDependency declared but are not installed", async () => {
    const result = await findDependencyIssues(
      "./test/projects/no_deps_installed/package.json"
    );
    // missing json-fixer dependency
    const jsonFixer = result.find((dep) => dep.name === "json-fixer");
    assert.isDefined(jsonFixer);
    expect(jsonFixer?.type).to.be.equal("missing");
    expect(jsonFixer?.version).to.be.equal("1.6.12");
    // missing lodash dependency
    const lodash = result.find((dep) => dep.name === "lodash");
    assert.isDefined(lodash);
    expect(lodash?.devDependency).to.be.false;
    expect(lodash?.type).to.be.equal("missing");
    expect(lodash?.version).to.be.equal("~4.17.21");
    // missing typescript devDependency
    const typescript = result.find(
      (dep) => dep.name === "typescript" && dep.devDependency === true
    );
    assert.isDefined(typescript);
    expect(typescript?.type).to.be.equal("missing");
    expect(typescript?.version).to.be.equal("^4.4.4");
  });

  it("1 dependency and 1 devDependency declared but are not installed, 1 dependency is installed", async () => {
    const result = await findDependencyIssues(
      "./test/projects/some_deps_installed/package.json"
    );
    // missing lodash dependency
    const lodash = result.find((dep) => dep.name === "lodash");
    assert.isDefined(lodash);
    expect(lodash?.devDependency).to.be.false;
    expect(lodash?.type).to.be.equal("missing");
    expect(lodash?.version).to.be.equal("~4.17.21");
    // missing typescript devDependency
    const typescript = result.find(
      (dep) => dep.name === "typescript" && dep.devDependency === true
    );
    assert.isDefined(typescript);
    expect(typescript?.type).to.be.equal("missing");
    expect(typescript?.version).to.be.equal("^4.4.4");
  });

  it("1 dependency and 1 devDependency declared but not installed, 1 dependency is installed but redundant", async () => {
    const result = await findDependencyIssues(
      "./test/projects/some_deps_redundant/package.json"
    );
    // missing lodash dependency
    const lodash = result.find((dep) => dep.name === "lodash");
    assert.isDefined(lodash);
    expect(lodash?.devDependency).to.be.false;
    expect(lodash?.type).to.be.equal("missing");
    expect(lodash?.version).to.be.equal("4.17.21");
    // missing typescript devDependency
    const typescript = result.find(
      (dep) => dep.name === "typescript" && dep.devDependency === true
    );
    assert.isDefined(typescript);
    expect(typescript?.type).to.be.equal("missing");
    expect(typescript?.version).to.be.equal("4.4.4");
    // redundant json-fixer devDependency
    const jsonFixer = result.find((dep) => dep.name === "json-fixer");
    assert.isDefined(jsonFixer);
    expect(jsonFixer?.devDependency).to.be.false;
    expect(jsonFixer?.type).to.be.equal("extraneous");
    expect(jsonFixer?.version).to.be.equal("1.6.12");
  });

  describe("findDependencyIssues fails", () => {
    let fsMock: SinonMock;

    beforeEach(() => {
      fsMock = createSandbox().mock(fsPromises);
    });

    afterEach(() => {
      fsMock.restore();
    });

    it("invalid package.json", async () => {
      fsMock.expects("readFile").rejects(new Error("invalid json"));
      const result = await findDependencyIssues(
        "./test/projects/invalid_package_json/package.json"
      );
      expect(result).to.have.lengthOf(0);
    });
  });

  it("1 dependency and 1 devDependency are installed, but in package.json their versions are invalid", async () => {
    const result = await findDependencyIssues(
      "./test/projects/invalid_dependency/package.json"
    );
    // invalid json-fixer dependency
    const jsonFixer = result.find((dep) => dep.name === "json-fixer");
    assert.isDefined(jsonFixer);
    expect(jsonFixer?.devDependency).to.be.false;
    expect(jsonFixer?.type).to.be.equal("invalid");
    expect(jsonFixer?.version).to.equal("1.6.12");
    // invalid typescript devDependency
    const typescript = result.find(
      (dep) => dep.name === "typescript" && dep.devDependency === true
    );
    assert.isDefined(typescript);
    expect(typescript?.devDependency).to.be.true;
    expect(typescript?.type).to.be.equal("invalid");
    expect(typescript?.version).to.equal("4.5.2");
  });

  it("no dependency issue are found, package is not supported", async () => {
    const result = await findDependencyIssues(
      "./test/projects/not_supported/package.json"
    );
    expect(result).to.have.lengthOf(0);
  });
});
