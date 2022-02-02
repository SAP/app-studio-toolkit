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
      const problems = await findDependencyIssues(samplePackage);

      expect(problems).to.deep.equalInAnyOrder([
        {
          type: "missing",
          name: "lodash",
          isDev: false,
        },
        {
          type: "missing",
          name: "json-fixer",
          isDev: false,
        },
      ]);
    });

    it("will detect a single missing dev dep", async () => {
      const samplePackage = resolve(
        positiveSamplesDir,
        "missing_dev_deps/package.json"
      );
      const problems = await findDependencyIssues(samplePackage);
      expect(problems).to.deep.equalInAnyOrder([
        {
          type: "missing",
          name: "typescript",
          isDev: true,
        },
      ]);
    });

    it("will detect a single mis-matched dep", async () => {
      const samplePackage = resolve(
        positiveSamplesDir,
        "mismatch_deps/package.json"
      );
      const problems = await findDependencyIssues(samplePackage);
      expect(problems).to.deep.equalInAnyOrder([
        {
          type: "mismatch",
          name: "mismatched",
          expected: "3.3.3",
          actual: "6.6.6",
          isDev: false,
        },
        {
          type: "mismatch",
          name: "range-parser",
          expected: "~1.2.1",
          actual: "2.0.0",
          isDev: true,
        },
      ]);
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
      expect(result).to.be.empty;
    });

    it("will not detect any issues when, project type is not supported", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "not_supported/package.json"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result).to.be.empty;
    });

    it("will not detect any issues for a package without any dependencies", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "empty_no_issues/package.json"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result).to.be.empty;
    });

    it("will not detect any issues when a dep's `package.json` is missing the `version` property", async () => {
      const samplePackage = resolve(
        negativeSampleDir,
        "no_version_for_dep/package.json"
      );
      const result = await findDependencyIssues(samplePackage);
      expect(result).to.be.empty;
    });
  });
});
