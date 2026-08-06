import { join } from "node:path";
import { expect } from "chai";
import { convertVsixFolder } from "../src/converter";
import {
  createUnsupportedCompressionVsix,
  createVsixWithDirectory,
  createVsixWithEntry,
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

    const createdArchivePaths = await convertVsixFolder(folder, { keep: true });

    expect(createdArchivePaths.sort()).to.deep.equal(
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

    const [createdArchivePath] = await convertVsixFolder(folder, {
      keep: true,
    });

    expect(await readZstTarEntries(createdArchivePath, true)).to.deep.equal([
      { name: "extension", data: Buffer.alloc(0) },
    ]);
  });

  it("rejects when a zip entry cannot be read", async () => {
    const folder = await temp.tempFolder();
    const vsix = join(folder, "unsupported-compression.vsix");
    await createUnsupportedCompressionVsix(vsix);

    await expect(convertVsixFolder(folder)).to.be.rejected;
  });

  it("rejects an empty archive entry name", async () => {
    const folder = await temp.tempFolder();
    await createVsixWithEntry(join(folder, "empty-name.vsix"), "");

    await expect(convertVsixFolder(folder)).to.be.rejectedWith(
      "Unsafe archive entry in VSIX: empty filename"
    );
  });

  it("rejects an unsafe archive entry path", async () => {
    const folder = await temp.tempFolder();
    await createVsixWithEntry(join(folder, "unsafe-name.vsix"), "../x");

    await expect(convertVsixFolder(folder)).to.be.rejectedWith(
      "invalid relative path"
    );
  });
});
