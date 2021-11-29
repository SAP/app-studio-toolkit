import { fail } from "assert";
import { expect } from "chai";
import { createSandbox, SinonSpy } from "sinon";
import { NpmLsResult, VscodeOutputChannel } from "../../src/types";
import { invokeNPMCommand, getNPM } from "../../src/utils/npmUtil";

describe("npmUtil unit test", () => {
  const sandbox = createSandbox();
  const outputChannel: VscodeOutputChannel = {
    append: (data: string) => console.log(data),
  };

  afterEach(function () {
    sandbox.restore();
  });

  describe("invokeNPMCommand failed", () => {
    it("outputChannel is not provided", () => {
      return expect(
        invokeNPMCommand(["ls"], "./non_existing_path")
      ).to.be.rejectedWith(`spawn ${getNPM()} ENOENT`);
    });

    it("outputChannel is provided", () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      return invokeNPMCommand(["ls"], "./non_existing_path", outputChannel)
        .then(() => {
          fail("test should fail");
        })
        .catch((error: Error) => {
          expect(appendSpy.called).to.be.true;
          expect(error.message).to.equal(`spawn ${getNPM()} ENOENT`);
        });
    });
  });

  describe("invokeNPMCommand succeeded with ls", () => {
    it("outputChannel is not provided", () => {
      return expect(invokeNPMCommand(["ls", "--depth=0"], "./")).to.be
        .fulfilled;
    });

    it("outputChannel is provided", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const result: NpmLsResult = await invokeNPMCommand(
        ["ls", "--depth=0"],
        "./",
        outputChannel
      );
      expect(appendSpy.called).to.be.true;
      expect(result).to.haveOwnProperty("name");
      expect(result).to.haveOwnProperty("version");
    });
  });

  describe("npm command", () => {
    const originalPlatform = process.platform;

    after(function () {
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
