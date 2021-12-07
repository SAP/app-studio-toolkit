import { assert, expect } from "chai";
import { createSandbox, SinonSpy } from "sinon";
import { NpmLsResult, OutputChannel } from "../../src/types";
import {
  invokeNPMCommand,
  getNPM,
  invokeNPMCommandWithJsonResult,
} from "../../src/utils/npmUtil";

describe("npmUtil unit test", () => {
  const sandbox = createSandbox();
  const outputChannel: OutputChannel = {
    append: (data: string) => console.log(data),
  };

  afterEach(() => {
    sandbox.restore();
  });

  context("invokeNPMCommandWithJsonResult()", () => {
    it("invokeNPMCommandWithJsonResult failed", () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      return invokeNPMCommandWithJsonResult(config, outputChannel)
        .then(() => {
          assert.fail("test should fail");
        })
        .catch((error: Error) => {
          expect(appendSpy.called).to.be.true;
          expect(error.message).to.equal(`spawn ${getNPM()} ENOENT`);
        });
    });

    it("invokeNPMCommandWithJsonResult succeeded with ls", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls", "--depth=0"], cwd: "./" };
      const result: NpmLsResult = await invokeNPMCommandWithJsonResult(
        config,
        outputChannel
      );
      expect(appendSpy.called).to.be.true;
      expect(result).to.haveOwnProperty("name");
      expect(result).to.haveOwnProperty("version");
    });
  });

  context("invokeNPMCommand()", () => {
    it("invokeNPMCommand failed", () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      return invokeNPMCommand(config, outputChannel)
        .then(() => {
          assert.fail("test should fail");
        })
        .catch((error: Error) => {
          expect(appendSpy.called).to.be.true;
          expect(error.message).to.equal(`spawn ${getNPM()} ENOENT`);
        });
    });

    it("invokeNPMCommand succeeded with ls", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls", "--depth=0"], cwd: "./" };
      await invokeNPMCommand(config, outputChannel);
      expect(appendSpy.called).to.be.true;
    });
  });
  describe("npm command", () => {
    const originalPlatform = process.platform;

    after(() => {
      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("npm on windows", () => {
      Object.defineProperty(process, "platform", {
        value: "win32",
      });
      expect(getNPM()).to.be.equal("npm.cmd");
    });

    it("npm on linux", () => {
      Object.defineProperty(process, "platform", {
        value: "linux",
      });
      expect(getNPM()).to.be.equal("npm");
    });
  });
});
