import * as fsPromises from "fs/promises";
import { expect, assert } from "chai";
import { SinonMock, createSandbox } from "sinon";
import { findDependencyIssues } from "../src/api";

describe("dependencyIssues unit test", () => {
  it("2 dependencies and 1 devDependency declared but are not installed", async () => {
    const result = await findDependencyIssues({
      fsPath: "./test/projects/no_deps_installed/package.json",
    });
    expect(result).to.have.lengthOf(3);
    // missing json-fixer dependency
    const jsonFixer = result.find((dep) => dep.name === "json-fixer");
    assert.isDefined(jsonFixer);
    expect(jsonFixer?.devDependency).to.be.false;
    expect(jsonFixer?.type).to.be.equal("missing");
    expect(jsonFixer?.version).to.be.equal("1.6.12");
    // missing lodash dependency
    const lodash = result.find((dep) => dep.name === "lodash");
    assert.isDefined(lodash);
    expect(lodash?.devDependency).to.be.false;
    expect(lodash?.type).to.be.equal("missing");
    expect(lodash?.version).to.be.equal("~4.17.21");
    // missing typescript devDependency
    const typescript = result.find((dep) => dep.name === "typescript");
    assert.isDefined(typescript);
    expect(typescript?.devDependency).to.be.true;
    expect(typescript?.type).to.be.equal("missing");
    expect(typescript?.version).to.be.equal("^4.4.4");
  });

  it("1 dependency and 1 devDependency declared but are not installed, 1 dependency is installed", async () => {
    const result = await findDependencyIssues({
      fsPath: "./test/projects/some_deps_installed/package.json",
    });
    expect(result).to.have.lengthOf(2);
    // missing lodash dependency
    const lodash = result.find((dep) => dep.name === "lodash");
    assert.isDefined(lodash);
    expect(lodash?.devDependency).to.be.false;
    expect(lodash?.type).to.be.equal("missing");
    expect(lodash?.version).to.be.equal("~4.17.21");
    // missing typescript devDependency
    const typescript = result.find((dep) => dep.name === "typescript");
    assert.isDefined(typescript);
    expect(typescript?.devDependency).to.be.true;
    expect(typescript?.type).to.be.equal("missing");
    expect(typescript?.version).to.be.equal("^4.4.4");
  });

  it("1 dependency and 1 devDependency declared but not installed, 1 dependency is installed but redundant", async () => {
    const result = await findDependencyIssues({
      fsPath: "./test/projects/some_deps_redundant/package.json",
    });
    expect(result).to.have.lengthOf(3);
    // missing lodash dependency
    const lodash = result.find((dep) => dep.name === "lodash");
    assert.isDefined(lodash);
    expect(lodash?.devDependency).to.be.false;
    expect(lodash?.type).to.be.equal("missing");
    expect(lodash?.version).to.be.equal("4.17.21");
    // missing typescript devDependency
    const typescript = result.find((dep) => dep.name === "typescript");
    assert.isDefined(typescript);
    expect(typescript?.devDependency).to.be.true;
    expect(typescript?.type).to.be.equal("missing");
    expect(typescript?.version).to.be.equal("4.4.4");
    // redundant json-fixer devDependency
    const jsonFixer = result.find((dep) => dep.name === "json-fixer");
    assert.isDefined(jsonFixer);
    expect(jsonFixer?.devDependency).to.be.false;
    expect(jsonFixer?.type).to.be.equal("extraneous");
    expect(jsonFixer?.version).to.be.equal("1.6.12");
  });

  it("invalid package.json", async () => {
    const fsMock: SinonMock = createSandbox().mock(fsPromises);
    fsMock.expects("readFile").rejects(new Error("invalid json"));
    const result = await findDependencyIssues({
      fsPath: "./test/projects/invalid_package_json/package.json",
    });
    expect(result).to.have.lengthOf(0);
    fsMock.restore();
  });

  it("1 dependency is installed, but in package.json it's version is invalid", async () => {
    const result = await findDependencyIssues({
      fsPath: "./test/projects/invalid_dependency/package.json",
    });
    expect(result).to.have.lengthOf(1);
    // invalid json-fixer dependency
    const jsonFixer = result.find((dep) => dep.name === "json-fixer");
    assert.isDefined(jsonFixer);
    expect(jsonFixer?.devDependency).to.be.false;
    expect(jsonFixer?.type).to.be.equal("invalid");
    expect(jsonFixer?.version).to.be.equal("1.6.12");
  });

  it("no dependency issue are found, package is not supported", async () => {
    const result = await findDependencyIssues({
      fsPath: "./test/projects/not_supported/package.json",
    });
    expect(result).to.have.lengthOf(0);
  });
});
