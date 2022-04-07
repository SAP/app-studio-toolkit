import { expect } from "chai";
import { resolve } from "path";
import { noop } from "lodash";
import { createSandbox, SinonSpy } from "sinon";
import { OutputChannel } from "../../src/types";
import { getNPM, invokeNPMCommand } from "../../src/utils/npmUtil";
import { npmSpawnTestTimeout } from "../config";

describe("npmUtil unit test", () => {
  const sandbox = createSandbox();
  const outputChannel: OutputChannel = {
    appendLine: (data: string) => console.log(data),
    show: noop,
  };

  afterEach(() => {
    sandbox.restore();
  });

  context("invokeNPMCommand()", () => {
    it("fails with non-existing package.json path", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "appendLine");
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      await expect(invokeNPMCommand(config, outputChannel)).to.be.rejectedWith(
        `spawn ${getNPM()} ENOENT`
      );
      expect(appendSpy.called).to.be.true;
    });

    it("passes with npm -v", async function () {
      this.timeout(npmSpawnTestTimeout);
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "appendLine");
      const config = { commandArgs: ["-v"], cwd: "./" };
      await invokeNPMCommand(config, outputChannel);
      expect(appendSpy.called).to.be.true;
    });

    it("fails when installing non existing npm package", async function () {
      this.timeout(npmSpawnTestTimeout * 2);
      const cwd = resolve("./test/packages-samples/negative");
      const config = {
        commandArgs: ["install", "nonexisting@1.2.3"],
        cwd,
      };
      await expect(invokeNPMCommand(config, outputChannel)).to.be.rejected;
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
