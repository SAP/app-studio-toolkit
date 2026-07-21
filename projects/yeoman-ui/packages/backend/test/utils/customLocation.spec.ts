import { expect } from "chai";
import { createSandbox, SinonSandbox } from "sinon";
import { homedir, tmpdir } from "os";
import * as path from "path";
import * as fs from "fs";
import { vscode } from "../mockUtil.js";
import * as customLocation from "../../src/utils/customLocation.js";
import { GLOBAL_CONFIG_KEY } from "../../src/utils/customLocation.js";

const NONEXISTENT = path.join(tmpdir(), "customLocation-nonexistent-xyzabc999");

describe("customLocation unit test", () => {
  let sandbox: SinonSandbox;
  let configGetStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = createSandbox();
    configGetStub = sandbox.stub(vscode.workspace.getConfiguration(), "get");
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getPath — empty / missing config", () => {
    it("returns undefined (not throw) when config value is empty string", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("");
      expect(() => customLocation.getPath()).to.not.throw();
      expect(customLocation.getPath()).to.be.undefined;
    });

    it("returns undefined (not throw) when config value is whitespace only", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("   ");
      expect(() => customLocation.getPath()).to.not.throw();
      expect(customLocation.getPath()).to.be.undefined;
    });

    it("returns undefined when path does not exist on disk", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(NONEXISTENT);
      expect(customLocation.getPath()).to.be.undefined;
    });
  });

  describe("getPath — tilde expansion", () => {
    it("expands bare '~' to homedir()", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("~");
      expect(customLocation.getPath()).to.equal(homedir());
    });

    it("expands '~/..' to an existing path one level above homedir()", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("~/..");
      // After tilde expansion the path is homedir() + "/.." which is absolute,
      // so path.resolve is skipped. existsSync accepts it (OS resolves the ..).
      const result = customLocation.getPath();
      expect(result).to.not.be.undefined;
      expect(result).to.include("..");
    });

    it("returns undefined for a '~/nonexistent' path that does not exist", () => {
      configGetStub
        .withArgs(GLOBAL_CONFIG_KEY)
        .returns("~/nonexistent-xyzabc999");
      expect(customLocation.getPath()).to.be.undefined;
    });
  });

  describe("getPath — relative path resolution", () => {
    it("resolves bare '.' against homedir()", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(".");
      expect(customLocation.getPath()).to.equal(homedir());
    });

    it("returns an existing absolute path (tmpdir) unchanged", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(tmpdir());
      expect(customLocation.getPath()).to.equal(tmpdir());
    });
  });

  describe("getPath — $HOME / %USERPROFILE% backward compatibility", () => {
    it("expands bare '$HOME' to homedir()", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("$HOME");
      expect(customLocation.getPath()).to.equal(homedir());
    });

    it("$HOME/nonexistent does not throw and returns undefined", () => {
      configGetStub
        .withArgs(GLOBAL_CONFIG_KEY)
        .returns("$HOME/nonexistent-xyzabc999");
      expect(() => customLocation.getPath()).to.not.throw();
      expect(customLocation.getPath()).to.be.undefined;
    });

    it("does NOT expand '$HOMEFOO' — token must be followed by / \\ or end-of-string", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("$HOMEFOO");
      // $HOMEFOO is not a home-dir token; treated as a relative/nonexistent path
      expect(customLocation.getPath()).to.be.undefined;
    });

    it("expands '%USERPROFILE%' to homedir()", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("%USERPROFILE%");
      expect(customLocation.getPath()).to.equal(homedir());
    });

    it("expands '%userprofile%' (lowercase) to homedir()", () => {
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns("%userprofile%");
      expect(customLocation.getPath()).to.equal(homedir());
    });
  });

  describe("getPath — injection prevention (no shell invoked)", () => {
    // Proof-of-exploit test: the OLD code ran execSync(`echo ${customPath}`).
    // These payloads verify that a malicious .vscode/settings.json cannot execute
    // arbitrary OS commands when a developer opens a crafted repository.
    //
    // Strategy: each payload writes a marker file to disk if a shell executes it.
    // After calling getPath(), we assert the marker was never created.

    let markerFile: string;

    beforeEach(() => {
      markerFile = path.join(tmpdir(), `injection-proof-${Date.now()}`);
    });

    afterEach(() => {
      // Clean up in case a test bug caused the marker to be created
      try {
        fs.unlinkSync(markerFile);
      } catch {
        /* already absent */
      }
    });

    it("semicolon command separator does not execute injected command", () => {
      // Old vulnerable code: execSync(`echo /safe; touch ${markerFile}`) → marker created
      // Fixed code: no shell → marker never created
      const payload = `/safe; touch ${markerFile}`;
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(payload);
      expect(() => customLocation.getPath()).to.not.throw();
      expect(
        fs.existsSync(markerFile),
        "shell command was executed — marker file exists"
      ).to.be.false;
    });

    it("$() subshell substitution does not execute injected command", () => {
      // Old vulnerable code: execSync(`echo $(touch ${markerFile})`) → marker created
      const payload = `$(touch ${markerFile})`;
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(payload);
      expect(() => customLocation.getPath()).to.not.throw();
      expect(
        fs.existsSync(markerFile),
        "shell command was executed — marker file exists"
      ).to.be.false;
    });

    it("backtick subshell does not execute injected command", () => {
      // Old vulnerable code: execSync(`echo \`touch ${markerFile}\``) → marker created
      const payload = `\`touch ${markerFile}\``;
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(payload);
      expect(() => customLocation.getPath()).to.not.throw();
      expect(
        fs.existsSync(markerFile),
        "shell command was executed — marker file exists"
      ).to.be.false;
    });

    it("pipe operator does not execute injected command", () => {
      const payload = `/nonexistent | touch ${markerFile}`;
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(payload);
      expect(() => customLocation.getPath()).to.not.throw();
      expect(
        fs.existsSync(markerFile),
        "shell command was executed — marker file exists"
      ).to.be.false;
    });

    it("tilde-prefixed payload does not execute injected command", () => {
      // Tilde is expanded by normaliseToAbsolute — no shell. The injected command after
      // the separator must not run.
      const payload = `~/safe; touch ${markerFile}`;
      configGetStub.withArgs(GLOBAL_CONFIG_KEY).returns(payload);
      expect(() => customLocation.getPath()).to.not.throw();
      expect(
        fs.existsSync(markerFile),
        "shell command was executed — marker file exists"
      ).to.be.false;
    });
  });
});
