import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { expect } from "chai";
import { convertVsixFolder } from "../src/converter";
import { downloadVsix, THEMES_VSIX } from "./helpers/downloads";
import { createTempTracker } from "./helpers/temp";

describe("converter", () => {
  const temp = createTempTracker();

  afterEach(() => temp.cleanup());

  it("converts one real VSIX and deletes the original by default", async () => {
    const folder = await temp.tempFolder();
    const vsix = await downloadVsix(THEMES_VSIX, folder);

    const createdArchivePaths = await convertVsixFolder(folder);

    expect(createdArchivePaths).to.deep.equal([`${vsix}.zst`]);
    expect(await readdir(folder)).to.deep.equal([`${basename(vsix)}.zst`]);
  });

  it("rejects when the input path is not a folder", async () => {
    const folder = await temp.tempFolder();
    const file = join(folder, "not-a-folder");
    await writeFile(file, "nope");

    await expect(convertVsixFolder(file)).to.be.rejectedWith("Not a folder");
  });

  it("rejects when a direct VSIX entry cannot be opened", async () => {
    const folder = await temp.tempFolder();
    await mkdir(join(folder, "not-a-zip.vsix"));

    await expect(convertVsixFolder(folder)).to.be.rejected;
  });

  it("rejects when the output path cannot be written", async () => {
    const folder = await temp.tempFolder();
    const vsix = await downloadVsix(THEMES_VSIX, folder);
    await mkdir(`${vsix}.zst`);

    await expect(convertVsixFolder(folder)).to.be.rejected;
  });
});
