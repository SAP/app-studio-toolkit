import { expect, assert } from "chai";
import { resolve } from "path";
import { findDependencyIssues } from "../src/api";

describe("dependencyIssues unit test", () => {
  it("2 dependencies declared but are not installed", async () => {
    const { problems } = await findDependencyIssues(
      "./test/projects/no_deps_installed/package.json"
    );
    // missing json-fixer dependency
    const jsonFixerProblem = problems.find((problem) =>
      problem.startsWith("missing: json-fixer@1.6.12")
    );
    assert.isDefined(jsonFixerProblem);
    // missing lodash dependency
    const lodashProblem = problems.find((problem) =>
      problem.startsWith("missing: lodash@~4.17.21")
    );
    assert.isDefined(lodashProblem);
  });

  it("2 devDependency declared but are not installed", async () => {
    const { problems } = await findDependencyIssues(
      "./test/projects/no_devDeps_installed/package.json"
    );
    // missing typescript devDependency
    const typescriptProblem = problems.find((problem) =>
      problem.startsWith("missing: typescript@^4.4.4")
    );
    assert.isDefined(typescriptProblem);
    // missing json-fixer devDependency
    const jsonFixerProblem = problems.find((problem) =>
      problem.startsWith("missing: json-fixer@~1.6.12")
    );
    assert.isDefined(jsonFixerProblem);
  });

  it("no dependency issues are found, package.json is not found", async () => {
    const result = await findDependencyIssues(
      "./test/projects/non_existing_folder/package.json"
    );
    expect(result.problems).to.be.empty;
  });

  it("no dependency issues are found, package is not supported", async () => {
    const result = await findDependencyIssues(
      resolve("./test/projects/not_supported/package.json")
    );
    expect(result.problems).to.be.empty;
  });

  it.only("would detect no issues for a package.json without dependencies", async () => {
    const result = await findDependencyIssues(
      resolve("./test/projects/empty_no_issues/package.json")
    );
    expect(result.problems).to.be.empty;
  });
});
