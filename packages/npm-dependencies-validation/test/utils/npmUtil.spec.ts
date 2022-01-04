import { expect } from "chai";
import { resolve } from "path";
import { createSandbox, SinonSpy } from "sinon";
import { NpmLsResult, OutputChannel } from "../../src/types";
import {
  invokeNPMCommand,
  getNPM,
  invokeNPMCommandWithJsonResult,
} from "../../src/utils/npmUtil";
import { npmSpawnTestTimeout } from "../config";

describe("npmUtil unit test", () => {
  const sandbox = createSandbox();
  const outputChannel: OutputChannel = {
    append: (data: string) => console.log(data),
  };

  afterEach(() => {
    sandbox.restore();
  });

  context("invokeNPMCommandWithJsonResult()", () => {
    it("fails with non-existing package.json path", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      await expect(
        invokeNPMCommandWithJsonResult<NpmLsResult>(config, outputChannel)
      ).to.be.rejectedWith(`spawn ${getNPM()} ENOENT`);
      expect(appendSpy.called).to.be.true;
    });

    it("fails with non-existing package.json path, outputChannel is not provided", async () => {
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      await expect(
        invokeNPMCommandWithJsonResult<NpmLsResult>(config)
      ).to.be.rejectedWith(`spawn ${getNPM()} ENOENT`);
    });

    it("passes with ls", async function () {
      this.timeout(npmSpawnTestTimeout);

      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls", "--depth=0"], cwd: "./" };
      await invokeNPMCommandWithJsonResult<NpmLsResult>(config, outputChannel);
      expect(appendSpy.called).to.be.true;
    });

    it("returns empty json object when package.json content is invalid json", async function () {
      this.timeout(npmSpawnTestTimeout);

      const jsonMock = sandbox.mock(JSON);
      jsonMock
        .expects("parse")
        .returns({ invalid: true, problems: ["JSON parse error..."] });
      const config = {
        commandArgs: ["ls", "--depth=0"],
        cwd: resolve("./test/packages-samples/negative/invalid_package_json"),
      };
      const result: NpmLsResult =
        await invokeNPMCommandWithJsonResult<NpmLsResult>(
          config,
          outputChannel
        );
      expect(result).to.be.empty;
      jsonMock.verify();
    });
  });

  context("invokeNPMCommand()", () => {
    it("fails with non-existing package.json path", async () => {
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls"], cwd: "./non_existing_path" };
      await expect(invokeNPMCommand(config, outputChannel)).to.be.rejectedWith(
        `spawn ${getNPM()} ENOENT`
      );
      expect(appendSpy.called).to.be.true;
    });

    it("passes with ls", async function () {
      this.timeout(npmSpawnTestTimeout);
      const appendSpy: SinonSpy = sandbox.spy(outputChannel, "append");
      const config = { commandArgs: ["ls", "--depth=0"], cwd: "./" };
      await invokeNPMCommand(config, outputChannel);
      expect(appendSpy.called).to.be.true;
    });

    it("fails when installing non existing npm package", async function () {
      this.timeout(npmSpawnTestTimeout);
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
