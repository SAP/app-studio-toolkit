import { getDependencyIssues } from "../src/index";
import { expect, assert } from "chai";

describe("ProjectValidator unit test", () => {
  it("2 dependencies and 1 devDependency declared but are not installed", async () => {
    const result = await getDependencyIssues(
      "./test/projects/no_deps_installed"
    );
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
    const result = await getDependencyIssues(
      "./test/projects/some_deps_installed"
    );
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
    const result = await getDependencyIssues(
      "./test/projects/some_deps_redundant"
    );
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
    expect(jsonFixer?.devDependency).to.be.undefined;
    expect(jsonFixer?.type).to.be.equal("extraneous");
    expect(jsonFixer?.version).to.be.equal("1.6.12");
  });

  it("invalid package.json", async () => {
    const result = await getDependencyIssues(
      "./test/projects/invalid_package_json"
    );
    expect(result).to.have.lengthOf(0);
  });

  it("no package.json", async () => {
    const result = await getDependencyIssues("./test/projects/no_package_json");
    expect(result).to.have.lengthOf(0);
  });
});
