import { join } from "path";
import { expect } from "chai";
import { convertVsix, convertVsixFolder } from "../src/converter";
import { zipToTar } from "../src/tar";
import { validateEntryName } from "../src/zip";
import {
  createUnsupportedCompressionVsix,
  createVsixWithDirectory,
  readTarEntries,
  readZipEntries,
  readZstTarEntries,
} from "./helpers/archives";
import {
  downloadVsix,
  THEMES_VSIX,
  UPGRADE_TOOL_VSIX,
} from "./helpers/downloads";
import { createTempTracker } from "./helpers/temp";

describe("archive conversion", () => {
  const temp = createTempTracker();

  afterEach(() => temp.cleanup());

  it("converts multiple real VSIX files and preserves exact contents with --keep", async () => {
    const folder = await temp.tempFolder();
    const vsixFiles = [
      await downloadVsix(THEMES_VSIX, folder),
      await downloadVsix(UPGRADE_TOOL_VSIX, folder),
    ];

    const outputs = await convertVsixFolder(folder, { keep: true });

    expect(outputs).to.deep.equal(
      vsixFiles.map((file) => `${file}.zst`).sort()
    );
    for (const vsix of vsixFiles) {
      expect(await readZipEntries(vsix)).to.deep.equal(
        await readZstTarEntries(`${vsix}.zst`)
      );
    }
  });

  it("keeps explicit directory entries in the tar", async () => {
    const folder = await temp.tempFolder();
    const vsix = join(folder, "directory-entry.vsix");
    await createVsixWithDirectory(vsix);

    const tar = await zipToTar(vsix);

    expect(await readTarEntries(tar, true)).to.deep.equal([
      { name: "extension", data: Buffer.alloc(0) },
    ]);
  });

  it("rejects when a zip entry cannot be read", async () => {
    const folder = await temp.tempFolder();
    const vsix = join(folder, "unsupported-compression.vsix");
    await createUnsupportedCompressionVsix(vsix);

    await expect(convertVsix(vsix)).to.be.rejected;
  });

  it("validates archive entry names", () => {
    expect(validateEntryName("extension/file.txt")).to.equal(
      "extension/file.txt"
    );
    expect(validateEntryName("extension/")).to.equal("extension");
    for (const unsafeName of ["", "/absolute", "..", "../x", "x/../y"]) {
      expect(() => validateEntryName(unsafeName)).to.throw(
        "Unsafe archive entry"
      );
    }
  });
});
