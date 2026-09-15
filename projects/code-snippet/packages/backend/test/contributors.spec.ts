import { expect } from "chai";
import _ from "lodash";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {};
_.set(testVscode, "extensions.all", []);

mockVscode(testVscode, "src/contributors.ts");
import { Contributors } from "../src/contributors";
import * as loggerWrapper from "../src/logger/logger-wrapper";

describe("Contributors unit test", () => {
  let sandbox: any;
  let loggerWrapperMock: any;
  const logger = {
    error: () => "",
    warn: () => "",
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    loggerWrapperMock = sandbox.mock(loggerWrapper);
  });

  afterEach(() => {
    loggerWrapperMock.verify();
  });

  describe("getSnippet", () => {
    function createCodeSnippetQuestions(): any[] {
      const questions: any[] = [
        {
          guiOptions: {
            hint: "hint actionTemplate",
          },
          type: "list",
          name: "actionTemplate",
          message: "Action Template",
          choices: [
            "OData action",
            "Offline action",
            "Message acion",
            "Change user password",
          ],
        },
      ];

      return questions;
    }

    const messageValue = {
      title: "Create a new action",
      description:
        "Select the action, target, service and the entity set you want to connect to.",
    };

    function getSnippet() {
      return {
        getMessages() {
          return messageValue;
        },
        async getQuestions() {
          return createCodeSnippetQuestions();
        },
        async getWorkspaceEdit() {
          return;
        },
      };
    }

    const snippetName = "snippet_test";
    const api = {
      id: "id",
      extensionPath: "extensionPath",
      extensionUri: null as any,
      isActive: true,
      packageJSON: {
        name: "vscode-snippet-contrib",
        publisher: "BLABLA3",
        extensionDependencies: ["saposs.code-snippet-tool"],
      },
      extensionKind: null as any,
      activate: () =>
        Promise.resolve({
          getCodeSnippets: () => {
            const snippets = new Map<string, any>();
            const snippet: any = getSnippet();
            snippets.set(snippetName, snippet);
            return snippets;
          },
        }),
      exports: {
        getCodeSnippets: () => {
          const snippets = new Map<string, any>();
          const snippet: any = getSnippet();
          snippets.set(snippetName, snippet);
          return snippets;
        },
      },
    };
    const extensionId = "BLABLA3.vscode-snippet-contrib";

    it("receives no contributorId and no snippetName ---> returns undefined snippet", async () => {
      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const contributors = new Contributors();
      const snippet = await contributors.getSnippet({});
      expect(snippet).to.be.undefined;
    });

    it("receives valid contributorId and snippetName from exports ---> returns valid snippet", async () => {
      _.set(testVscode, "extensions.all", [api]);

      const uiOptions = {
        contributorId: extensionId,
        snippetName: snippetName,
      };

      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const contributors = new Contributors();
      const snippet = await contributors.getSnippet(uiOptions);
      expect(snippet.getMessages()).to.deep.equal(messageValue);
    });

    it("receives valid contributorId and snippetName from exports ---> returns valid snippet (for old ID)", async () => {
      const oldApi = {
        ...api,
        packageJSON: {
          ...api.packageJSON,
          extensionDependencies: ["saposs.code-snippet"],
        },
      };

      _.set(testVscode, "extensions.all", [oldApi]);

      const uiOptions = {
        contributorId: extensionId,
        snippetName: snippetName,
      };

      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const contributors = new Contributors();
      const snippet = await contributors.getSnippet(uiOptions);
      expect(snippet.getMessages()).to.deep.equal(messageValue);
    });

    it("receives valid contributorId and snippetName from activate ---> returns valid snippet", async () => {
      api.isActive = false;
      _.set(testVscode, "extensions.all", [api]);

      const uiOptions = {
        contributorId: extensionId,
        snippetName: snippetName,
      };

      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const contributors = new Contributors();
      const snippet = await contributors.getSnippet(uiOptions);
      expect(snippet.getMessages()).to.deep.equal(messageValue);
    });

    it("contributer extension activate fails", async () => {
      api.isActive = false;
      api.activate = () => {
        throw new Error();
      };
      _.set(testVscode, "extensions.all", [api]);

      const uiOptions = {
        contributorId: extensionId,
        snippetName: snippetName,
      };

      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const errorSpy = sinon.spy(logger, "error");
      const contributors = new Contributors();
      const res = await contributors.getSnippet(uiOptions);
      expect(res).to.be.undefined;
      expect(errorSpy.calledOnce).to.be.true;
      errorSpy.restore();
    });

    it("contributer extension not found", async () => {
      api.packageJSON = {
        name: "vscode-snippet-contrib",
        publisher: "BLABLA3",
        extensionDependencies: ["saposs-other.code-snippet"],
      };
      _.set(testVscode, "extensions.all", [api]);

      const uiOptions = {
        contributorId: extensionId,
        snippetName: snippetName,
      };

      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const contributors = new Contributors();
      const warnSpy = sinon.spy(logger, "warn");
      const res = await contributors.getSnippet(uiOptions);
      expect(res).to.be.undefined;
      expect(warnSpy.calledOnce).to.be.true;
      warnSpy.restore();
    });

    it("contributer extension not found by contributorId", async () => {
      api.packageJSON = {
        name: "vscode-snippet-contrib",
        publisher: "BLABLA3",
        extensionDependencies: ["saposs.code-snippet-tool"],
      };
      _.set(testVscode, "extensions.all", [api]);

      const uiOptions = {
        contributorId: extensionId + "-other",
        snippetName: snippetName,
      };

      loggerWrapperMock.expects("getClassLogger").returns(logger);
      const warnSpy = sinon.spy(logger, "warn");
      const contributors = new Contributors();
      const res = await contributors.getSnippet(uiOptions);
      expect(res).to.be.undefined;
      expect(warnSpy.calledOnce).to.be.true;
      warnSpy.restore();
    });
  });
});
