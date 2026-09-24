const datauri = require("datauri"); // eslint-disable-line @typescript-eslint/no-var-requires -- legacy code
import { expect } from "chai";
import { CodeSnippet } from "../src/code-snippet";
import { AppLog } from "../src/app-log";
import { AppEvents } from "../src/app-events";
import {
  IMethod,
  IPromiseCallbacks,
  IRpc,
} from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { IChildLogger } from "@vscode-logging/logger";
import { fail } from "assert";
import { AnalyticsWrapper } from "../src/usage-report/usage-analytics-wrapper";
import * as sinon from "sinon";
import { SinonMock } from "sinon";
import { createFlowPromise, FlowPromise } from "../src/utils";

describe("codeSnippet unit test", () => {
  let sandbox: sinon.SinonSandbox;
  let datauriMock: SinonMock;
  let loggerMock: SinonMock;
  let rpcMock: SinonMock;
  let appEventsMock: SinonMock;
  let trackerWrapperMock: SinonMock;
  let panelPromiseFuncsMock: SinonMock;

  class TestEvents implements AppEvents {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match interface
    public async doApply(we: any): Promise<any> {
      return;
    }
    public doSnippeDone(
      /* eslint-disable @typescript-eslint/no-unused-vars -- must match interface */
      success: boolean,
      message: string,
      targetPath?: string
      /* eslint-enable @typescript-eslint/no-unused-vars -- must match interface */
    ): void {
      return;
    }
    public doClose(): void {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match interface
    public executeCommand(command: string, ...rest: any[]): Thenable<any> {
      return;
    }
  }
  class TestRpc implements IRpc {
    public timeout: number;
    public promiseCallbacks: Map<number, IPromiseCallbacks>;
    public methods: Map<string, IMethod>;
    public sendRequest(): void {
      return;
    }
    public sendResponse(): void {
      return;
    }
    public setResponseTimeout(): void {
      return;
    }
    public registerMethod(): void {
      return;
    }
    public unregisterMethod(): void {
      return;
    }
    public listLocalMethods(): string[] {
      return [];
    }
    public handleResponse(): void {
      return;
    }
    public listRemoteMethods(): Promise<string[]> {
      return Promise.resolve([]);
    }
    public invoke(): Promise<any> {
      return Promise.resolve();
    }
    public handleRequest(): Promise<void> {
      return Promise.resolve();
    }
  }
  class TestOutputChannel implements AppLog {
    public log(): void {
      return;
    }
    public writeln(): void {
      return;
    }
    public create(): void {
      return;
    }
    public force(): void {
      return;
    }
    public conflict(): void {
      return;
    }
    public identical(): void {
      return;
    }
    public skip(): void {
      return;
    }
    public showOutput(): boolean {
      return false;
    }
  }

  const testLogger = {
    debug: () => "",
    error: () => "",
    fatal: () => "",
    warn: () => "",
    info: () => "",
    trace: () => "",
    getChildLogger: () => ({} as IChildLogger),
  };

  const snippet: any = {
    getMessages() {
      return "getMessages";
    },
    async getQuestions() {
      return "createCodeSnippetQuestions";
    },
    async getWorkspaceEdit() {
      return "getWorkspaceEdit";
    },
  };

  const rpc = new TestRpc();
  const outputChannel = new TestOutputChannel();
  const appEvents = new TestEvents();
  const snippetTitle = "snippet title";
  const uiOptions = { messages: { title: snippetTitle }, snippet: snippet };
  const flowPromise: FlowPromise<void> = createFlowPromise<void>();

  const codeSnippet: CodeSnippet = new CodeSnippet(
    rpc,
    appEvents,
    outputChannel,
    testLogger,
    flowPromise.state,
    uiOptions
  );

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    datauriMock = sandbox.mock(datauri);
    rpcMock = sandbox.mock(rpc);
    loggerMock = sandbox.mock(testLogger);
    appEventsMock = sandbox.mock(appEvents);
    trackerWrapperMock = sandbox.mock(AnalyticsWrapper);
    panelPromiseFuncsMock = sandbox.mock(flowPromise.state);
  });

  afterEach(() => {
    datauriMock.verify();
    rpcMock.verify();
    loggerMock.verify();
    appEventsMock.verify();
    trackerWrapperMock.verify();
    panelPromiseFuncsMock.verify();
  });

  it("constructor", () => {
    expect(
      () =>
        new CodeSnippet(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        )
    ).to.throw("rpc must be set");
  });

  describe("getState", () => {
    it("valid uiOptions", async () => {
      const state = await codeSnippet["getState"]();
      expect(state.messages).to.be.not.empty;
    });

    it("invalid uiOptions", async () => {
      codeSnippet["uiOptions"].test = codeSnippet["uiOptions"];
      const state = await codeSnippet["getState"]();
      expect(state.stateError).to.be.true;
    });
  });

  describe("receiveIsWebviewReady", () => {
    it("flow is successfull", async () => {
      trackerWrapperMock.expects("updateSnippetStarted").withArgs(snippetTitle);
      rpcMock
        .expects("invoke")
        .withArgs("showPrompt")
        .resolves([
          { actionName: "actionName" },
          { actionTemplate: "OData action" },
          { actionType: "Create entity" },
        ]);
      appEventsMock.expects("doApply");
      trackerWrapperMock
        .expects("updateSnippetEnded")
        .withArgs(snippetTitle, true);
      await codeSnippet["receiveIsWebviewReady"]();
    });

    it("no prompt ---> an error is thrown", async () => {
      trackerWrapperMock.expects("updateSnippetStarted").withArgs(snippetTitle);
      panelPromiseFuncsMock.expects("reject");
      await codeSnippet["receiveIsWebviewReady"]();
    });

    it("prompt throws exception ---> an error is thrown", async () => {
      trackerWrapperMock.expects("updateSnippetStarted").withArgs(snippetTitle);
      rpcMock
        .expects("invoke")
        .withArgs("showPrompt")
        .rejects(new Error("receiveIsWebviewReady error"));
      appEventsMock.expects("doApply").never();
      panelPromiseFuncsMock.expects("reject");
      await codeSnippet["receiveIsWebviewReady"]();
    });
  });

  describe("showPrompt", () => {
    it("prompt without questions", async () => {
      const answers = await codeSnippet.showPrompt([]);
      expect(answers).to.be.empty;
    });
  });

  describe("funcReplacer", () => {
    it("with function", () => {
      const res = CodeSnippet["funcReplacer"]("key", () => {
        return;
      });
      expect(res).to.be.equal("__Function");
    });

    it("without function", () => {
      const res = CodeSnippet["funcReplacer"]("key", "value");
      expect(res).to.be.equal("value");
    });
  });

  it("toggleOutput", () => {
    const codeSnippetInstance: CodeSnippet = new CodeSnippet(
      rpc,
      appEvents,
      outputChannel,
      testLogger,
      flowPromise.state,
      {}
    );
    const res = codeSnippetInstance["toggleOutput"]();
    expect(res).to.be.false;
  });

  it("getErrorInfo with error message", () => {
    const codeSnippetInstance: CodeSnippet = new CodeSnippet(
      rpc,
      appEvents,
      outputChannel,
      testLogger,
      flowPromise.state,
      {}
    );
    const errorInfo = "Error Info";
    const res = codeSnippetInstance["getErrorInfo"](errorInfo);
    expect(res).to.be.equal(errorInfo);
  });

  it("getErrorInfo without error message", () => {
    const codeSnippetInstance: CodeSnippet = new CodeSnippet(
      rpc,
      appEvents,
      outputChannel,
      testLogger,
      flowPromise.state,
      {}
    );
    const res = codeSnippetInstance["getErrorInfo"]();
    expect(res).to.be.equal("");
  });

  describe("answersUtils", () => {
    it("setDefaults", () => {
      const questions = [
        { name: "q1", default: "a" },
        {
          name: "q2",
          default: () => {
            return "b";
          },
        },
        { name: "q3" },
      ];
      for (const question of questions) {
        switch (question.name) {
          case "a":
            expect((question as any)["answer"]).to.equal("x");
            break;
          case "b":
            expect((question as any)["answer"]).to.equal("y");
            break;
          case "c":
            expect((question as any)["answer"]).to.equal("z");
            break;
        }
      }
    });
  });

  describe("showPrompt", () => {
    it("returns answers", async () => {
      const firstName = "john";
      rpc.invoke = async () => {
        return {
          firstName,
          lastName: "doe",
        };
      };
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      const questions = [{ name: "q1" }];
      const response = await codeSnippetInstance.showPrompt(questions);
      expect(response.firstName).to.equal(firstName);
    });
  });

  describe("onSuccess - onFailure", () => {
    let doSnippeDoneSpy: any;

    beforeEach(() => {
      doSnippeDoneSpy = sandbox.spy(appEvents, "doSnippeDone");
    });

    afterEach(() => {
      doSnippeDoneSpy.restore();
    });

    it("onSuccess", () => {
      trackerWrapperMock
        .expects("updateSnippetEnded")
        .withArgs("testSnippetName", true);
      codeSnippet["onSuccess"](true, "testSnippetName");
      expect(
        doSnippeDoneSpy.calledWith(
          true,
          "'testSnippetName' snippet has been created."
        )
      ).to.be.true;
    });

    it("onFailure", async () => {
      trackerWrapperMock
        .expects("updateSnippetEnded")
        .withArgs("testSnippetName", false);
      await codeSnippet["onFailure"](true, "testSnippetName", "testError");
      expect(
        doSnippeDoneSpy.calledWith(
          false,
          "testSnippetName snippet failed.\ntestError"
        )
      ).to.be.true;
    });
  });

  describe("executeCommand", () => {
    it("called with command id & args", async () => {
      const commandId = "vscode.open";
      const commandArgs = [{ fsPath: "https://en.wikipedia.org" }];
      appEventsMock
        .expects("executeCommand")
        .withExactArgs(commandId, commandArgs);
      await codeSnippet["executeCommand"](commandId, commandArgs);
    });
  });

  describe("Custom Question Event Handlers", () => {
    it("addCustomQuestionEventHandlers()", async () => {
      const testEventFunction = () => {
        return true;
      };
      const questions = [
        {
          name: "q1",
          guiType: "questionType",
        },
      ];
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );

      codeSnippetInstance["addCustomQuestionEventHandlers"](questions);
      expect(questions[0]).to.not.have.property("testEvent");

      codeSnippetInstance.registerCustomQuestionEventHandler(
        "questionType",
        "testEvent",
        testEventFunction
      );
      codeSnippetInstance["addCustomQuestionEventHandlers"](questions);
      expect(questions[0]).to.have.property("testEvent");
      expect((questions[0] as any)["testEvent"]).to.equal(testEventFunction);
    });
  });

  describe("evaluateMethod()", () => {
    it("custom question events", async () => {
      const testEventFunction = () => {
        return true;
      };
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      codeSnippetInstance.registerCustomQuestionEventHandler(
        "questionType",
        "testEvent",
        testEventFunction
      );
      codeSnippetInstance["currentQuestions"] = [
        { name: "question1", guiType: "questionType" },
      ];
      const response = await codeSnippetInstance["evaluateMethod"](
        null,
        "question1",
        "testEvent"
      );
      expect(response).to.be.true;
    });

    it("question method is called", async () => {
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      codeSnippetInstance["currentQuestions"] = [
        {
          name: "question1",
          method1: () => {
            return true;
          },
        },
      ];
      const response = await codeSnippetInstance["evaluateMethod"](
        null,
        "question1",
        "method1"
      );
      expect(response).to.be.true;
    });

    it("no relevant question", async () => {
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      codeSnippetInstance["currentQuestions"] = [
        {
          name: "question1",
          method1: () => {
            return true;
          },
        },
      ];
      const response = await codeSnippetInstance["evaluateMethod"](
        null,
        "question2",
        "method2"
      );
      expect(response).to.be.undefined;
    });

    it("no questions", async () => {
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      const response = await codeSnippetInstance["evaluateMethod"](
        null,
        "question1",
        "method1"
      );
      expect(response).to.be.undefined;
    });

    it("method throws exception", async () => {
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      codeSnippetInstance["gen"] = Object.create({});
      codeSnippetInstance["gen"].options = {};
      codeSnippetInstance["currentQuestions"] = [
        {
          name: "question1",
          method1: () => {
            throw new Error("Error");
          },
        },
      ];
      try {
        await codeSnippetInstance["evaluateMethod"](
          null,
          "question1",
          "method1"
        );
      } catch (e: any) {
        expect(e.stack).to.contain("method1");
      }
    });
  });

  describe("applyCode", () => {
    let codeSnippetInstanceMock: any;
    let codeSnippetInstance: CodeSnippet;

    beforeEach(() => {
      codeSnippetInstance = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        { messages: { title: snippetTitle } }
      );
      codeSnippetInstanceMock = sandbox.mock(codeSnippetInstance);
    });

    afterEach(() => {
      codeSnippetInstanceMock.verify();
    });

    it("createCodeSnippetWorkspaceEdit succeeds ---> onSuccess is called with showDoneMessage=true", async () => {
      panelPromiseFuncsMock.expects("resolve");
      codeSnippetInstanceMock
        .expects("createCodeSnippetWorkspaceEdit")
        .resolves({});
      trackerWrapperMock
        .expects("updateSnippetEnded")
        .withArgs(snippetTitle, true);
      await codeSnippetInstance["applyCode"]({});
    });

    it("createCodeSnippetWorkspaceEdit fails (we is undefined) ---> onSuccess is called with showDoneMessage=false", async () => {
      panelPromiseFuncsMock.expects("resolve");
      codeSnippetInstanceMock
        .expects("createCodeSnippetWorkspaceEdit")
        .resolves(undefined);
      trackerWrapperMock
        .expects("updateSnippetEnded")
        .withArgs(snippetTitle, true);
      appEventsMock.expects("doApply").never();
      appEventsMock.expects("doClose");
      await codeSnippetInstance["applyCode"]({});
    });

    it("createCodeSnippetWorkspaceEdit fails ---> onFailure is called", async () => {
      panelPromiseFuncsMock.expects("reject");
      const error = new Error("error");
      codeSnippetInstanceMock
        .expects("createCodeSnippetWorkspaceEdit")
        .rejects(error);
      trackerWrapperMock
        .expects("updateSnippetEnded")
        .withArgs(snippetTitle, false);
      await codeSnippetInstance["applyCode"]({});
    });
  });

  describe("createCodeSnippetWorkspaceEdit", () => {
    it("snippet has getWorkspaceEdit ---> call getWorkspaceEdit", async () => {
      const myCodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        { snippet: snippet }
      );
      const we = await myCodeSnippet["createCodeSnippetWorkspaceEdit"]({});
      expect(we).to.be.equal("getWorkspaceEdit");
    });
    it("snippet is undefined", async () => {
      const myCodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );
      loggerMock.expects("debug");
      const we = await myCodeSnippet["createCodeSnippetWorkspaceEdit"]({});
      expect(we).to.be.equal(undefined);
    });
  });

  describe("createCodeSnippetQuestions", () => {
    it("snippet has getQuestions ---> call getQuestions", async () => {
      const myCodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        { snippet: snippet }
      );
      const we = await myCodeSnippet["createCodeSnippetQuestions"]();
      expect(we).to.be.equal("createCodeSnippetQuestions");
    });

    it("no snippet provided ---> call getQuestions", async () => {
      const myCodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        { snippet: null }
      );
      const we = await myCodeSnippet["createCodeSnippetQuestions"]();
      expect(we).to.be.empty;
    });
  });

  describe("registerCustomQuestionEventHandler", () => {
    it("all the events handlers for the same question type are in the same entry", () => {
      const testEventFunction = () => {
        return true;
      };
      const codeSnippetInstance: CodeSnippet = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {}
      );

      codeSnippetInstance.registerCustomQuestionEventHandler(
        "questionType",
        "testEvent1",
        testEventFunction
      );
      expect(
        codeSnippetInstance["customQuestionEventHandlers"].size
      ).to.be.equal(1);

      codeSnippetInstance.registerCustomQuestionEventHandler(
        "questionType",
        "testEvent2",
        testEventFunction
      );
      expect(
        codeSnippetInstance["customQuestionEventHandlers"].size
      ).to.be.equal(1);
    });
  });

  describe("executeCodeSnippet", () => {
    let codeSnippetInstanceMock: SinonMock;
    let codeSnippetInstance: CodeSnippet;

    beforeEach(() => {
      codeSnippetInstance = new CodeSnippet(
        rpc,
        appEvents,
        outputChannel,
        testLogger,
        flowPromise.state,
        {
          messages: {
            title: snippetTitle.length,
            noResponse: "No response received.",
          },
          snippet: snippet,
          contributorInfo: { snippetArgs: {} },
        }
      );
      codeSnippetInstanceMock = sandbox.mock(codeSnippetInstance);
    });

    afterEach(() => {
      codeSnippetInstanceMock.verify();
    });

    it("interactive mode - answers param exists", async () => {
      codeSnippetInstanceMock
        .expects("createCodeSnippetWorkspaceEdit")
        .resolves({ name: "test" });
      await codeSnippetInstance["executeCodeSnippet"]({ name: "test" });
    });

    it("interactive mode - answers param is empty", async () => {
      codeSnippetInstanceMock.expects("createCodeSnippetWorkspaceEdit").never();
      trackerWrapperMock.expects("updateSnippetEnded").never();
      try {
        await codeSnippetInstance["executeCodeSnippet"]({});
        fail("test should fail");
      } catch (error) {
        expect(error).to.be.equal("No response received.");
      }
    });

    it("nonInteractive mode - answers param doesn't exist", async () => {
      snippet["getQuestions"] = () => {
        return [
          { name: "q1", default: "a" },
          { name: "q2", default: () => "b" },
        ];
      };
      codeSnippetInstanceMock
        .expects("createCodeSnippetWorkspaceEdit")
        .resolves({ q1: "a", q2: "b" });
      await codeSnippetInstance["executeCodeSnippet"]();
    });
  });
});
