import { assert, expect } from "chai";
import { createSandbox, SinonSpy } from "sinon";
import { NpmLsResult, OutputChannel } from "../../src/types";
import { invokeNPMCommand, getNPM } from "../../src/utils/npmUtil";

describe("npmUtil unit test", () => {
  const sandbox = createSandbox();
  const outputChannel: OutputChannel = {
    append: (data: string) => console.log(data),
  };

  afterEach(() => {
    sandbox.restore();
  });

  describe("invokeNPMCommand failed", () => {
    it("outputChannel is not provided", () => {
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      return expect(invokeNPMCommand(config)).to.be.rejectedWith(
        `spawn ${getNPM()} ENOENT`
      );
    });

    it("outputChannel is provided", () => {
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
  });

  describe("invokeNPMCommand succeeded with ls", () => {
    it("outputChannel is not provided", () => {
      const config = { commandArgs: ["ls", "--depth=0"], cwd: "./" };
      return expect(invokeNPMCommand(config)).to.be.fulfilled;
    });

    it("outputChannel is provided", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls", "--depth=0"], cwd: "./" };
      const result: NpmLsResult = await invokeNPMCommand(config, outputChannel);
      expect(appendSpy.called).to.be.true;
      expect(result).to.haveOwnProperty("name");
      expect(result).to.haveOwnProperty("version");
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
