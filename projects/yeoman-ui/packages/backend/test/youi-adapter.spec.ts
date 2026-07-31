// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as mocha from "mocha";
import { expect } from "chai";
import { YouiEvents } from "../src/youi-events.js";
import type {
  IMethod,
  IPromiseCallbacks,
  IRpc,
} from "@sap-devx/webview-rpc/out.ext/rpc-common.js";
import { GeneratorFilter } from "../src/filter.js";
import { AppWizard } from "@sap-devx/yeoman-ui-types";
import { YouiAdapter } from "../src/youi-adapter.js";
import { YeomanUI } from "../src/yeomanui.js";
import messages from "../src/messages.js";
import { createFlowPromise } from "../src/utils/promise.js";

describe("YouiAdapter", () => {
  class TestEvents implements YouiEvents {
    public doGeneratorDone(): void {
      return;
    }
    public doGeneratorInstall(): void {
      return;
    }
    public showProgress(): void {
      return;
    }
    public getAppWizard(): AppWizard {
      return;
    }
    public executeCommand(): Thenable<any> {
      return;
    }
    public setAppWizardHeaderTitle(): void {
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

  const testLogger = {
    debug: () => true,
    error: () => true,
    fatal: () => true,
    warn: () => true,
    info: () => true,
    trace: () => true,
    getChildLogger: () => {
      return testLogger;
    },
  };

  const rpc = new TestRpc();
  const outputChannel: any = {
    appendLine: () => "",
    show: () => "",
  };

  const youiEvents = new TestEvents();

  const yeomanUi: YeomanUI = new YeomanUI(
    rpc,
    youiEvents,
    outputChannel,
    testLogger,
    { filter: GeneratorFilter.create(), messages },
    createFlowPromise<void>().state
  );

  describe("#prompt()", () => {
    it("passes null call back", async () => {
      const firstName = "john";
      const lastName = "doe";
      (rpc.invoke as (methodName: string, params: any[]) => Promise<any>) = (
        methodName: string,
        params: any[]
      ) => {
        const questionName: string = params[0][0].name;
        if (questionName === "q1") {
          return Promise.resolve({
            firstName,
            lastName,
          });
        } else {
          return Promise.resolve({});
        }
      };

      const youiAdapter = new YouiAdapter(youiEvents, outputChannel);
      youiAdapter.setYeomanUI(yeomanUi);
      const questions = [{ name: "q1" }];
      const response: any = await youiAdapter.prompt(questions, null);
      expect(response.firstName).to.equal(firstName);
      expect(response.lastName).to.equal(lastName);
    });
  });

  describe("#v6 adapter contract", () => {
    it("aborts the signal with the given reason", () => {
      const adapter: any = new YouiAdapter(youiEvents, outputChannel);
      const reason = new Error("boom");
      expect(adapter.signal.aborted).to.equal(false);
      adapter.abort(reason);
      expect(adapter.signal.aborted).to.equal(true);
      expect(adapter.signal.reason).to.equal(reason);
    });

    it("abort() is idempotent (v6 may call it more than once per failure)", () => {
      const adapter: any = new YouiAdapter(youiEvents, outputChannel);
      adapter.abort(new Error("first"));
      // A second abort on an already-aborted controller would otherwise throw.
      expect(() => adapter.abort(new Error("second"))).to.not.throw();
    });

    it("resetSignal() yields a fresh, un-aborted signal per run", () => {
      const adapter: any = new YouiAdapter(youiEvents, outputChannel);
      adapter.abort(new Error("boom"));
      expect(adapter.signal.aborted).to.equal(true);
      adapter.resetSignal();
      expect(adapter.signal.aborted).to.equal(false);
    });

    it("progress() runs the provided step function", async () => {
      const adapter: any = new YouiAdapter(youiEvents, outputChannel);
      const result = await adapter.progress(() => "done");
      expect(result).to.equal("done");
    });

    it("onIdle() resolves", async () => {
      const adapter: any = new YouiAdapter(youiEvents, outputChannel);
      await adapter.onIdle();
    });
  });
});
