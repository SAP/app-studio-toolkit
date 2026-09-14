/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { expect } from "chai";
import * as childProcess from "child_process";
import { stringify } from "comment-json";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import { Cli } from "../src/cli";

describe("cli unit tests", () => {
  let sandbox: SinonSandbox;
  let childProcessMock: SinonMock;
  const token = {
    isCancellationRequested: false,
    onCancellationRequested: () => {
      return;
    },
  };
  const execResult = {
    kill: () => {
      return;
    },
    stdin: {
      end: () => {
        return;
      },
    },
    stdout: {
      on: (type: string, callback: any) => callback("outData1"),
    },
    stderr: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      on: (type: string, callback: any) => {
        return;
      },
    },
    on: (type: string, callback: any) => (type === "exit" ? callback(0) : {}),
  };

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    childProcessMock = sandbox.mock(childProcess);
  });

  afterEach(() => {
    childProcessMock.verify();
  });

  describe("execute", () => {
    it("stdout has no error data, options are provided, exit code 0", async () => {
      childProcessMock.expects("spawn").withArgs("cf", []).returns(execResult);
      const result = await Cli.execute([], {}, token);
      expect(result.stdout).to.be.equal("outData1");
      expect(result.exitCode).to.be.equal(0);
    });

    it("token skiped, stdout has no error data, options are provided, exit code 0", async () => {
      childProcessMock.expects("spawn").withArgs("cf", []).returns(execResult);
      const result = await Cli.execute([], {});
      expect(result.stdout).to.be.equal("outData1");
      expect(result.exitCode).to.be.equal(0);
    });

    it("stdout has no error data, exit code 0", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(0) : {});
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.equal("outData1");
      expect(result.exitCode).to.be.equal(0);
    });

    it("stdout has no data, exit code 0", async () => {
      execResult.stdout = { on: (type: string, callback: any) => callback("") };
      childProcessMock.expects("spawn").withArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stderr).to.be.empty;
      expect(result.stdout).to.be.empty;
      expect(result.exitCode).to.be.equal(0);
    });

    it("stderr has error data, exit code 2", async () => {
      execResult.stderr.on = (type: string, callback: any) => callback("errData1");
      execResult.on = (type: string, callback: any) =>
        type === "error" ? callback({ message: "test error message", code: 2 }) : {};
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.empty;
      expect(result.stderr).to.be.equal("errData1");
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal("test error message");
    });

    it("stderr has error data, exit code ENOENT", async () => {
      execResult.on = (type: string, callback: any) =>
        type === "error" ? callback({ message: "test ENOENT message", code: "ENOENT" }) : {};
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.empty;
      expect(result.stderr).to.be.equal("errData1");
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal(`cf: command not found`);
    });

    it("stdout has error_code, code is 10002", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      execResult.stderr.on = (type: string, callback: any) => {
        return;
      };
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(1) : {});
      execResult.stdout.on = (type: string, callback: any) => callback(`{"type": "error_code", "code": 10002}`);
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.equal(`{"type": "error_code", "code": 10002}`);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal("Not logged in. Use 'cf login' to log in.");
    });

    it("stdout has error_code, code is 404", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(1) : {});
      execResult.stdout.on = (type: string, callback: any) =>
        callback(`{"type": "error_code", "code": 404, "description": "test error description"}`);
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.equal(`{"type": "error_code", "code": 404, "description": "test error description"}`);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal("test error description");
    });

    it("stdout starts with FAILED and has 'Error creating request'", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(1) : {});
      execResult.stdout.on = (type: string, callback: any) => callback("FAILED and has 'Error creating request'");
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.equal("FAILED and has 'Error creating request'");
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal("Not logged in. Use 'cf login' to log in.");
    });

    it("stdout command failed and has 'Error: some error occured'", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(1) : {});
      execResult.stdout.on = (type: string, callback: any) =>
        callback("Request is failed. Error: it is impossible to access db.");
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const mockStdin = sandbox.mock(execResult.stdin);
      mockStdin.expects("end").returns("");
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.equal("Request is failed. Error: it is impossible to access db.");
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal("Request is failed. Error: it is impossible to access db.");
      mockStdin.verify();
    });

    it("stdout command has the substring math 'Error: some error occured' but as a multiline output", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(0) : {});
      const output = "Request is failed.\n Error: it is impossible to access db.";
      execResult.stdout.on = (type: string, callback: any) => callback(output);
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute();
      expect(result.stdout).to.be.equal(output);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(0);
      expect(result.error).to.be.undefined;
    });

    it("stdout command has the substring math 'Error: some error occured' but as a part of well structured output", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(0) : {});
      const output = stringify({
        description:
          'failed to create subscription, error: {"message":"subscribe failed. Parameters: rootSubscription: 2,726,700. Error description: Timestamp: Mon Nov 29 20:02:24 GMT 2021 "}',
      });
      execResult.stdout.on = (type: string, callback: any) => callback(output);
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute();
      expect(result.stdout).to.be.equal(output);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(0);
      expect(result.error).to.be.undefined;
    });

    it("stdout starts with FAILED and has 'No API endpoint set'", async () => {
      const errorText =
        "FAILED\
                                No API endpoint set.";
      const execResult = {
        stdin: {
          end: () => {
            return;
          },
        },
        stdout: {
          on: (type: string, callback: any) => callback(errorText),
        },
        stderr: {
          on: () => {
            return;
          },
        },
        on: (type: string, callback: any) => (type === "exit" ? callback(1) : {}),
      };
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute(undefined, undefined, token);
      expect(result.stdout).to.be.equal(errorText);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(-1);
      expect(result.error).to.be.equal(errorText);
    });

    it("token cancelation received", async () => {
      const cancelationToken = {
        isCancellationRequested: true,
        onCancellationRequested: () => {
          return;
        },
      };
      childProcessMock.expects("spawn").never();
      const result = await Cli.execute(undefined, undefined, cancelationToken);
      expect(result.stderr).to.be.empty;
      expect(result.stdout).to.be.empty;
      expect(result.exitCode).to.be.equal(-2);
    });

    it("stdout command succeedded but output contains instance problem description with 'failed' and 'Error:' mutiline combination", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(0) : {});
      const output = `{
                "last_operation": {
                    "state": "failed",
                    "description": "Status: 503; ErrorMessage: <nil>; Description: <nil>; Response Error: invalid character '<' looking for beginning of value",
                    "created_at": "2021-11-10T16:01:26Z"
                }
            }`;
      execResult.stdout.on = (type: string, callback: any) => callback(output);
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute();
      expect(result.stdout).to.be.equal(output);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(0);
      expect(result.error).to.be.undefined;
    });

    it("stdout command succeedded but output contains instance problem description with 'failed' and 'Error:' single line combination", async () => {
      execResult.on = (type: string, callback: any) => (type === "exit" ? callback(0) : {});
      const output = JSON.stringify({
        last_operation: {
          state: "failed",
          description:
            "Status: 503; ErrorMessage: <nil>; Description: <nil>; ResponseError: invalid character '<' looking for beginning of value",
          created_at: "2021-11-10T16:01:26Z",
        },
      });
      execResult.stdout.on = (type: string, callback: any) => callback(output);
      childProcessMock.expects("spawn").withExactArgs("cf", undefined, undefined).returns(execResult);
      const result = await Cli.execute();
      expect(result.stdout).to.be.equal(output);
      expect(result.stderr).to.be.empty;
      expect(result.exitCode).to.be.equal(0);
      expect(result.error).to.be.undefined;
    });
  });
});
