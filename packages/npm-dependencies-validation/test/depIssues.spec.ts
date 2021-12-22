import { expect } from "chai";
import { resolve } from "path";
import { findDependencyIssues } from "../src/api";

describe("`findDependencyIssues()` validation function ", () => {
  // `__dirname` is executed in the compiled output...
  const samplesDir = resolve(__dirname, "..", "..", "test", "packages-samples");

  context("positive - issues detected", () => {
    const positiveSamplesDir = resolve(samplesDir, "positive");

    it("will detect multiple missing deps", async () => {
      const samplePackage = resolve(
        positiveSamplesDir,
        "missing_deps/package.json"
      );
      const { problems } = await findDependencyIssues(samplePackage);
      const jsonFixerProblem = problems.find((problem) =>
        problem.startsWith("missing: json-fixer@1.6.12")
      );
      expect(jsonFixerProblem).to.exist;
      const lodashProblem = problems.find((problem) =>
        problem.startsWith("missing: lodash@~4.17.21")
      );
      expect(lodashProblem).to.exist;
    });

    it("will detect a single missing dev dep", async () => {
      const samplePackage = resolve(
        positiveSamplesDir,
        "missing_dev_deps/package.json"
      );
      const { problems } = await findDependencyIssues(samplePackage);
      const typeScriptProblem = problems.find((problem) =>
        problem.startsWith("missing: typescript@^4.4.4")
      );
      expect(typeScriptProblem).to.exist;
    });
  });

  context("negative - no issues expected", () => {
    const negativeSampleDir = resolve(samplesDir, "negative");

    it("will not detect any issues when package is not found", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "somewhere",
        "over",
        "the",
        "rainbow"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result.problems).to.be.empty;
    });

    it("will not detect any issues when, project type is not supported", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "not_supported/package.json"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result.problems).to.be.empty;
    });

    it("will not detect any issues for a package without any dependencies", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "empty_no_issues/package.json"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result.problems).to.be.empty;
    });

    it("will not detect any issues for an invalid package", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "invalid_package_json/package.json"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result.problems).to.be.empty;
    });
  });
});
