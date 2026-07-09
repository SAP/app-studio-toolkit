import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { expect } from "chai";
import { vscode } from "../mockUtil.js";
import {
  getLegacyGeneratorList,
  isLegacyNamespace,
  namespaceToName,
} from "../../src/utils/legacyGenerators.js";

const ENV_VAR = "YEOMAN_UI_LEGACY_GENERATORS";

describe("legacyGenerators", () => {
  let sandbox: SinonSandbox;
  let wsConfigMock: SinonMock;
  let originalEnv: string | undefined;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    originalEnv = process.env[ENV_VAR];
    delete process.env[ENV_VAR];
    // The vscodeProxy mock returns the same configuration object on every
    // getConfiguration() call, so mocking it once per test is stable.
    wsConfigMock = sandbox.mock(vscode.workspace.getConfiguration());
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_VAR];
    } else {
      process.env[ENV_VAR] = originalEnv;
    }
    wsConfigMock.verify();
    sandbox.restore();
  });

  describe("getLegacyGeneratorList()", () => {
    it("returns empty array when neither env-var nor setting is set", () => {
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal([]);
    });

    it("reads a single value from the env-var", () => {
      process.env[ENV_VAR] = "@sap/adaptation-project";
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal([
        "@sap/adaptation-project",
      ]);
    });

    it("splits a comma-separated env-var value", () => {
      process.env[ENV_VAR] = "@sap/one, @sap/two,@sap/three";
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal([
        "@sap/one",
        "@sap/two",
        "@sap/three",
      ]);
    });

    it("filters empty and whitespace-only comma entries", () => {
      process.env[ENV_VAR] = ",, @sap/one ,,   ,@sap/two,";
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/one", "@sap/two"]);
    });

    it("parses a JSON array env-var value", () => {
      process.env[ENV_VAR] = '["@sap/one", "@sap/two"]';
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/one", "@sap/two"]);
    });

    it("falls back to comma splitting when JSON is malformed", () => {
      // Starts with '[' but not valid JSON — the parser should try JSON, fail,
      // then fall through to comma splitting rather than raise.
      process.env[ENV_VAR] = "[not,json,but,commas";
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal([
        "[not",
        "json",
        "but",
        "commas",
      ]);
    });

    it("ignores non-string entries inside a JSON array", () => {
      process.env[ENV_VAR] = '["@sap/one", 42, null, "@sap/two", ""]';
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/one", "@sap/two"]);
    });

    it("returns empty array when env-var is set to whitespace only", () => {
      process.env[ENV_VAR] = "   ";
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(getLegacyGeneratorList()).to.deep.equal([]);
    });

    it("returns the VSCode setting value when env-var is unset", () => {
      wsConfigMock
        .expects("get")
        .withArgs("legacyGenerators")
        .returns(["@sap/fiori"]);
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/fiori"]);
    });

    it("unions env-var and VSCode setting, deduplicating identical entries", () => {
      process.env[ENV_VAR] = "@sap/one,@sap/shared";
      wsConfigMock
        .expects("get")
        .withArgs("legacyGenerators")
        .returns(["@sap/shared", "@sap/two"]);
      expect(getLegacyGeneratorList()).to.deep.equal([
        "@sap/one",
        "@sap/shared",
        "@sap/two",
      ]);
    });

    it("trims whitespace and skips empty strings in the VSCode setting", () => {
      wsConfigMock
        .expects("get")
        .withArgs("legacyGenerators")
        .returns(["  @sap/one  ", "", "   ", "@sap/two"]);
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/one", "@sap/two"]);
    });

    it("skips non-string entries in the VSCode setting", () => {
      wsConfigMock
        .expects("get")
        .withArgs("legacyGenerators")
        .returns(["@sap/one", 42 as any, null as any, "@sap/two"]);
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/one", "@sap/two"]);
    });

    it("tolerates a non-array VSCode setting value", () => {
      wsConfigMock
        .expects("get")
        .withArgs("legacyGenerators")
        .returns("not-an-array" as any);
      expect(getLegacyGeneratorList()).to.deep.equal([]);
    });

    it("survives getConfiguration() throwing (activation-race path)", () => {
      process.env[ENV_VAR] = "@sap/from-env";
      sandbox
        .stub(vscode.workspace, "getConfiguration")
        .throws(new Error("configuration service not ready"));
      expect(getLegacyGeneratorList()).to.deep.equal(["@sap/from-env"]);
    });
  });

  describe("isLegacyNamespace()", () => {
    it("returns false for an empty list", () => {
      expect(isLegacyNamespace("@sap/adaptation-project:app", [])).to.be.false;
    });

    it("matches an exact namespace", () => {
      expect(
        isLegacyNamespace("@sap/adaptation-project", [
          "@sap/adaptation-project",
        ])
      ).to.be.true;
    });

    it("matches a colon-delimited descendant of an entry", () => {
      expect(
        isLegacyNamespace("@sap/adaptation-project:app", [
          "@sap/adaptation-project",
        ])
      ).to.be.true;
      expect(
        isLegacyNamespace("@sap/adaptation-project:adp:sub", [
          "@sap/adaptation-project",
        ])
      ).to.be.true;
    });

    it("rejects a namespace that only shares a name prefix (no colon boundary)", () => {
      // "@sap/adaptation-project-extended" must NOT match "@sap/adaptation-project"
      expect(
        isLegacyNamespace("@sap/adaptation-project-extended:app", [
          "@sap/adaptation-project",
        ])
      ).to.be.false;
    });

    it("rejects a namespace not in the list", () => {
      expect(isLegacyNamespace("@sap/fiori:app", ["@sap/adaptation-project"]))
        .to.be.false;
    });

    it("matches when any of several list entries applies", () => {
      const list = ["@sap/fiori", "@sap/adaptation-project", "@bas-dev/cicd"];
      expect(isLegacyNamespace("@sap/fiori:abap", list)).to.be.true;
      expect(isLegacyNamespace("@bas-dev/cicd", list)).to.be.true;
      expect(isLegacyNamespace("@sap/unrelated:app", list)).to.be.false;
    });

    it("defaults to the merged list from env + settings when none is passed", () => {
      process.env[ENV_VAR] = "@sap/fiori";
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(isLegacyNamespace("@sap/fiori:app")).to.be.true;
      // second call re-reads the default list — set up a fresh expectation
      wsConfigMock.expects("get").withArgs("legacyGenerators").returns([]);
      expect(isLegacyNamespace("@sap/other:app")).to.be.false;
    });
  });

  describe("namespaceToName()", () => {
    it("strips the sub-generator segment from a scoped namespace", () => {
      expect(namespaceToName("@sap/adaptation-project:app")).to.equal(
        "@sap/adaptation-project"
      );
    });

    it("drops the generator- prefix on a scoped package", () => {
      expect(namespaceToName("@bas-dev/generator-abap-project:app")).to.equal(
        "@bas-dev/abap-project"
      );
    });

    it("drops the generator- prefix on a bare package", () => {
      expect(namespaceToName("generator-foo:app")).to.equal("foo");
    });

    it("returns the namespace unchanged when no colon or generator- prefix", () => {
      expect(namespaceToName("plain-name")).to.equal("plain-name");
    });
  });
});
