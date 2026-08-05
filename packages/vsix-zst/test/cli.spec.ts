import { readdir } from "fs/promises";
import { basename } from "path";
import { expect } from "chai";
import { runCli } from "./helpers/cli";
import { downloadVsix, THEMES_VSIX } from "./helpers/downloads";
import { createTempTracker } from "./helpers/temp";

describe("cli", () => {
  const temp = createTempTracker();

  afterEach(() => temp.cleanup());

  it("converts through the CLI with --keep", async () => {
    const folder = await temp.tempFolder();
    const vsix = await downloadVsix(THEMES_VSIX, folder);

    const result = await runCli([folder, "--keep"]);

    expect(result.stdout.trim()).to.equal(`${vsix}.zst`);
    expect(result.stderr).to.equal("");
    expect((await readdir(folder)).sort()).to.deep.equal(
      [basename(vsix), `${basename(vsix)}.zst`].sort()
    );
  });

  it("rejects when the folder has no VSIX files", async () => {
    const folder = await temp.tempFolder();

    await expect(runCli([folder])).to.be.rejectedWith("No .vsix files");
  });

  it("returns non-zero when the folder argument is missing", async () => {
    await expect(runCli([])).to.be.rejectedWith("missing required argument");
  });

  it("prints help", async () => {
    const result = await runCli(["--help"]);

    expect(result.stdout).to.contain("Usage: vsix-zst [options] <folder>");
    expect(result.stdout).to.contain("--keep");
    expect(result.stdout).to.contain("keep original .vsix files");
    expect(result.stderr).to.equal("");
  });
});
