import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { text } from "node:stream/consumers";
import { promisify } from "node:util";
import { zstdDecompress } from "node:zlib";
import { expect } from "chai";
import { strToU8, zipSync } from "fflate";
import { extract } from "tar-stream";

const execFileAsync = promisify(execFile);
const zstdDecompressAsync = promisify(zstdDecompress);
const cliPath = join(__dirname, "..", "src", "cli.js");
const fixtureContents = {
  "extension/package.json": '{"name":"fixture"}',
  "extension/readme.txt": "hello",
  "extension/dist/index.js": "module.exports = {};",
};
const fixtureArchive = zipSync({
  "extension/package.json": strToU8(fixtureContents["extension/package.json"]),
  "extension/readme.txt": strToU8(fixtureContents["extension/readme.txt"]),
  "extension/dist/index.js": strToU8(
    fixtureContents["extension/dist/index.js"]
  ),
});

async function writeVsix(path: string): Promise<void> {
  await writeFile(path, fixtureArchive);
}

function runCli(...args: string[]) {
  return execFileAsync(process.execPath, [cliPath, ...args]);
}

async function readTarFiles(path: string): Promise<Record<string, string>> {
  const tar = extract();
  const files: Record<string, string> = {};
  const readEntries = (async () => {
    for await (const entry of tar) {
      if (entry.header.type === "file") {
        files[entry.header.name] = await text(entry);
      } else {
        entry.resume();
      }
    }
  })();

  tar.end(await zstdDecompressAsync(await readFile(path)));
  await readEntries;
  return files;
}

describe("vsix-zst CLI", () => {
  let tempWorkFolder: string;

  beforeEach(async () => {
    tempWorkFolder = await mkdtemp(join(tmpdir(), "vsix-zst-"));
  });

  afterEach(async () => {
    await rm(tempWorkFolder, { recursive: true, force: true });
  });

  it("converts direct VSIX files with --keep and preserves their contents", async () => {
    const sourcePaths = [
      join(tempWorkFolder, "one.vsix"),
      join(tempWorkFolder, "two.vsix"),
    ];
    await Promise.all(sourcePaths.map(writeVsix));

    const { stdout, stderr } = await runCli(tempWorkFolder, "--keep");
    const outputPaths = sourcePaths.map((path) => `${path}.zst`);

    expect(stderr).to.equal("");
    expect(stdout.trim().split("\n")).to.have.members([
      ...outputPaths,
      "Finished converting 2 VSIX archive(s).",
    ]);
    expect((await readdir(tempWorkFolder)).sort()).to.deep.equal(
      [...sourcePaths, ...outputPaths].map((path) => basename(path)).sort()
    );
    for (const outputPath of outputPaths) {
      expect(
        await readTarFiles(outputPath),
        `Unexpected archive contents in ${outputPath}`
      ).to.deep.equal(fixtureContents);
    }
  });

  it("deletes the source VSIX by default", async () => {
    const sourcePath = join(tempWorkFolder, "delete.vsix");
    const outputPath = `${sourcePath}.zst`;
    await writeVsix(sourcePath);

    expect(
      existsSync(sourcePath),
      "source VSIX should exist before conversion"
    ).to.equal(true);

    await runCli(tempWorkFolder);

    expect(
      existsSync(sourcePath),
      "source VSIX should be deleted after conversion"
    ).to.equal(false);
    expect(
      existsSync(outputPath),
      "converted archive should be created"
    ).to.equal(true);
  });

  it("rejects a folder without VSIX files", async () => {
    await expect(runCli(tempWorkFolder)).to.be.rejectedWith(
      `No *.vsix files found in ${tempWorkFolder}`
    );
  });

  it("rejects a corrupt VSIX without deleting it", async () => {
    const sourcePath = join(tempWorkFolder, "broken.vsix");
    await writeFile(sourcePath, "not a zip");

    await expect(runCli(tempWorkFolder)).to.be.rejectedWith(
      "End of central directory record signature not found"
    );

    expect(await readFile(sourcePath, "utf8")).to.equal("not a zip");
  });
});
