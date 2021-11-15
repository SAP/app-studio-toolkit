import { spawnCommand, getNPM } from "../src/npmUtil";
import { expect } from "chai";

describe("npmUtil unit test", () => {
  it("spawnCommand failed", () => {
    return expect(
      spawnCommand(["ls"], "./non_existing_path")
    ).to.be.rejectedWith(`spawn ${getNPM()} ENOENT`);
  });

  it("spawnCommand succeeded with ls", () => {
    return expect(spawnCommand(["ls", "--depth=0"], "./")).to.be.fulfilled;
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
