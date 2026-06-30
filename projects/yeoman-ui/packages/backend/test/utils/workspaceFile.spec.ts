import { createSandbox, SinonSandbox, SinonStub } from "sinon";
import {
  FolderUriConfig,
  getFolderUri,
  getValidFolderUri,
  isUriFlow,
  isValidUri,
  WorkspaceFile,
} from "../../src/utils/workspaceFile";
import { Constants } from "../../src/utils/constants";
import { vscode } from "../mockUtil";
import * as fs from "fs";
import { join, normalize } from "path";
import { expect } from "chai";
import messages from "../../src/messages";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let uriFileStub: SinonStub;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    const origFile = vscode.Uri.file.bind(vscode.Uri);
    uriFileStub = sandbox.stub(vscode.Uri, "file").callsFake(origFile);
  });

  describe("create workspace file", () => {
    it("createWs", () => {
      const tmpDir = join(Constants.HOMEDIR_PROJECTS, "../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });
      const wsFilePath = normalize(
        join(tmpDir, "workspace_test.code-workspace")
      );
      const folderConfig = { path: "relative/path/to/project" };

      WorkspaceFile.createWs(wsFilePath, folderConfig);

      expect(uriFileStub.calledWith(wsFilePath)).to.be.true;
      const written = JSON.parse(fs.readFileSync(wsFilePath, "utf8"));
      expect(written).to.deep.equal({ folders: [folderConfig], settings: {} });
      fs.unlinkSync(wsFilePath);
    });

    it("create createWsWithPath", () => {
      fs.mkdirSync(Constants.HOMEDIR_PROJECTS, { recursive: true });
      const targetFolderPath = normalize(
        join(Constants.HOMEDIR_PROJECTS, "../tmp/targetFolderPath")
      );
      const targetFolderUri = vscode.Uri.file(targetFolderPath);

      // Let the real filesystem handle existsSync - cleanup written files after
      expect(() =>
        WorkspaceFile.createWsWithPath(targetFolderUri)
      ).to.not.throw();

      // Cleanup any written workspace files
      const possiblePaths = [
        join(Constants.HOMEDIR_PROJECTS, "workspace.code-workspace"),
        join(Constants.HOMEDIR_PROJECTS, "workspace_test.code-workspace"),
      ];
      possiblePaths.forEach((p) => {
        try {
          fs.unlinkSync(p);
        } catch {}
      });
    });

    it("workspace file exists with isUri true", () => {
      fs.mkdirSync(Constants.HOMEDIR_PROJECTS, { recursive: true });
      const targetFolderPath = normalize(
        join(Constants.HOMEDIR_PROJECTS, "../projects/tmp/targetFolderPath")
      );

      const folderConfig: FolderUriConfig = {
        uri: targetFolderPath,
        name: "targetFolder",
      };

      // Let the real filesystem handle existsSync - cleanup written files after
      expect(() => WorkspaceFile.createWsWithUri(folderConfig)).to.not.throw();

      // Cleanup any written workspace files
      for (let i = 0; i <= 5; i++) {
        const suffix = i === 0 ? "" : `.${i}`;
        try {
          fs.unlinkSync(
            join(
              Constants.HOMEDIR_PROJECTS,
              `workspace${suffix}.code-workspace`
            )
          );
        } catch {}
      }
    });
  });

  describe("isValidUri", () => {
    it("should return true for valid uri", () => {
      const uri = "https://example.com";
      const result = isValidUri(uri);
      expect(result).to.be.true;
    });

    it("should return false for invalid uri", () => {
      const uri = "invalid-uri";
      const result = isValidUri(uri);
      expect(result).to.be.false;
    });

    it("should return false for empty uri", () => {
      const uri = "";
      const result = isValidUri(uri);
      expect(result).to.be.false;
    });
  });

  describe("getValidFolderUri", () => {
    it("should return valid FolderUriConfig for valid input", () => {
      const folderUri = {
        uri: "https://example.com",
        name: "example",
      };
      const result = getValidFolderUri(folderUri);
      expect(result).to.deep.equal(folderUri);
    });

    it("should throw error for invalid uri", () => {
      const folderUri = {
        uri: "invalid-uri",
        name: "example",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(
        messages.bad_project_uri_config_error
      );
    });

    it("should throw error for missing uri", () => {
      const folderUri = {
        name: "example",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(
        messages.bad_project_uri_config_error
      );
    });

    it("should throw error for missing name", () => {
      const folderUri = {
        uri: "https://example.com",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(
        messages.bad_project_uri_config_error
      );
    });

    it("should throw error for non-string uri", () => {
      const folderUri = {
        uri: 123,
        name: "example",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(
        messages.bad_project_uri_config_error
      );
    });

    it("should throw error for non-string name", () => {
      const folderUri = {
        uri: "https://example.com",
        name: 123,
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(
        messages.bad_project_uri_config_error
      );
    });

    describe("getFolderUri", () => {
      it("should return FolderUriConfig for valid JSON string with uri and name", () => {
        const optionalFolderUri = JSON.stringify({
          uri: "https://example.com",
          name: "example",
        });
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.deep.equal({
          uri: "https://example.com",
          name: "example",
        });
      });

      it("should return undefined for valid JSON string without uri", () => {
        const optionalFolderUri = JSON.stringify({ name: "example" });
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });

      it("should return undefined for valid JSON string without name", () => {
        const optionalFolderUri = JSON.stringify({
          uri: "https://example.com",
        });
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });

      it("should return undefined for invalid JSON string", () => {
        const optionalFolderUri =
          "{ uri: 'https://example.com', name: 'example' }";
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });

      it("should return undefined for non-JSON string", () => {
        const optionalFolderUri = "not a json string";
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });
    });
  });

  describe("isUriFlow", () => {
    it("should return true when  getFolderUri is not undefined", () => {
      const optionalFolderUri = JSON.stringify({
        uri: "https://example.com",
        name: "example",
      });
      const result = isUriFlow(optionalFolderUri);
      expect(result).to.be.true;
    });

    it("should return false when getFolderUri is undefined", () => {
      const optionalFolderUri = "not a json string";
      const result = isUriFlow(optionalFolderUri);
      expect(result).to.be.false;
    });
  });
});
