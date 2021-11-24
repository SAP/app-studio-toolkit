import { expect } from "chai";
import { invokeNPMCommand, getNPM } from "../../src/utils/npmUtil";

describe("npmUtil unit test", () => {
  it("invokeNPMCommand failed", () => {
    return expect(
      invokeNPMCommand(["ls"], "./non_existing_path")
    ).to.be.rejectedWith(`spawn ${getNPM()} ENOENT`);
  });

  it("invokeNPMCommand succeeded with ls", () => {
    return expect(invokeNPMCommand(["ls", "--depth=0"], "./")).to.be.fulfilled;
  });

  describe("npm command", () => {
    const originalPlatform = process.platform;

    // reset global state changes after **every** test.
    afterEach(function () {
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
