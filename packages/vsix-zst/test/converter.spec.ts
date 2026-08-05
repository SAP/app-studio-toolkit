import { mkdir, readdir, writeFile } from "fs/promises";
import { basename, join } from "path";
import { expect } from "chai";
import { convertVsix, convertVsixFolder } from "../src/converter";
import { downloadVsix, THEMES_VSIX } from "./helpers/downloads";
import { createTempTracker } from "./helpers/temp";

describe("converter", () => {
  const temp = createTempTracker();

  afterEach(() => temp.cleanup());

  it("converts one real VSIX and deletes the original by default", async () => {
    const folder = await temp.tempFolder();
    const vsix = await downloadVsix(THEMES_VSIX, folder);

    const outputs = await convertVsixFolder(folder);

    expect(outputs).to.deep.equal([`${vsix}.zst`]);
    expect(await readdir(folder)).to.deep.equal([`${basename(vsix)}.zst`]);
  });

  it("rejects when the input path is not a folder", async () => {
    const folder = await temp.tempFolder();
    const file = join(folder, "not-a-folder");
    await writeFile(file, "nope");

    await expect(convertVsixFolder(file)).to.be.rejectedWith("Not a folder");
  });

  it("rejects when the source VSIX is missing", async () => {
    const folder = await temp.tempFolder();

    await expect(convertVsix(join(folder, "missing.vsix"))).to.be.rejected;
  });

  it("rejects when the output path cannot be written", async () => {
    const folder = await temp.tempFolder();
    const vsix = await downloadVsix(THEMES_VSIX, folder);
    await mkdir(`${vsix}.zst`);

    await expect(convertVsix(vsix)).to.be.rejected;
  });
});
