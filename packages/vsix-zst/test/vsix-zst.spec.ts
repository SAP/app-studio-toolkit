import { createWriteStream } from "fs";
import { execFile } from "child_process";
import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import { get } from "https";
import { tmpdir } from "os";
import { basename, join } from "path";
import { URL } from "url";
import { extract } from "tar-stream";
import { Entry, open, ZipFile } from "yauzl";
import { expect } from "chai";
import { convertVsixFolder } from "../src";
import { ZstdCodec, ZstdModule } from "zstd-codec";

const THEMES_VSIX =
  "https://github.com/SAP/app-studio-toolkit/releases/download/app-studio-toolkit-themes%406.0.1/app-studio-toolkit-themes-6.0.1.vsix";
const UPGRADE_TOOL_VSIX =
  "https://github.com/SAP/app-studio-toolkit/releases/download/vscode-deps-upgrade-tool%405.0.0/vscode-deps-upgrade-tool-5.0.0.vsix";

describe("vsix-zst", () => {
  let tempFolders: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempFolders.map((folder) => rm(folder, { recursive: true, force: true }))
    );
    tempFolders = [];
  });

  it("converts one real VSIX and deletes the original by default", async () => {
    const folder = await tempFolder();
    const vsix = await downloadVsix(THEMES_VSIX, folder);

    const outputs = await convertVsixFolder(folder);

    expect(outputs).to.deep.equal([`${vsix}.zst`]);
    expect(await readdir(folder)).to.deep.equal([`${basename(vsix)}.zst`]);
  });

  it("converts multiple real VSIX files and preserves exact contents with --keep", async () => {
    const folder = await tempFolder();
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

  it("rejects when the folder has no VSIX files", async () => {
    const folder = await tempFolder();

    await expect(runCli([folder])).to.be.rejectedWith("No .vsix files");
  });

  it("returns non-zero when the folder argument is missing", async () => {
    await expect(runCli([])).to.be.rejectedWith("Usage: vsix-zst");
  });

  async function tempFolder(): Promise<string> {
    const folder = await mkdtemp(join(tmpdir(), "vsix-zst-"));
    tempFolders.push(folder);
    return folder;
  }
});

async function downloadVsix(url: string, folder: string): Promise<string> {
  const target = join(folder, basename(new URL(url).pathname));
  await downloadTo(url, target);
  return target;
}

function downloadTo(url: string, target: string): Promise<void> {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      if (
        response.statusCode !== undefined &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location !== undefined
      ) {
        void downloadTo(response.headers.location, target).then(
          resolve,
          reject
        );
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const file = createWriteStream(target);
      file.once("error", reject);
      file.once("finish", resolve);
      response.pipe(file);
    }).once("error", reject);
  });
}

interface ArchiveEntry {
  name: string;
  data: Buffer;
}

async function readZipEntries(vsixPath: string): Promise<ArchiveEntry[]> {
  const zip = await openZip(vsixPath);
  const entries: ArchiveEntry[] = [];

  try {
    while (true) {
      const entry = await readEntry(zip);
      if (entry === undefined) {
        return sortEntries(entries);
      }
      if (!entry.fileName.endsWith("/")) {
        entries.push({
          name: entry.fileName,
          data: await readEntryData(zip, entry),
        });
      }
    }
  } finally {
    zip.close();
  }
}

async function readZstTarEntries(path: string): Promise<ArchiveEntry[]> {
  const tarBuffer = await zstdDecompress(await readFile(path));
  const untar = extract();
  const entries: ArchiveEntry[] = [];

  const done = new Promise<ArchiveEntry[]>((resolve, reject) => {
    untar.on("entry", (header, stream, next) => {
      if (header.type === "directory") {
        stream.resume();
        stream.once("end", next);
        return;
      }

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.once("error", reject);
      stream.once("end", () => {
        entries.push({ name: header.name, data: Buffer.concat(chunks) });
        next();
      });
    });
    untar.once("error", reject);
    untar.once("finish", () => resolve(sortEntries(entries)));
  });

  untar.end(tarBuffer);
  return done;
}

function openZip(vsixPath: string): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    open(vsixPath, { lazyEntries: true }, (error, zip) => {
      if (error !== null) {
        reject(error);
        return;
      }
      if (zip === undefined) {
        reject(new Error(`Failed to open ${vsixPath}`));
        return;
      }
      resolve(zip);
    });
  });
}

function readEntry(zip: ZipFile): Promise<Entry | undefined> {
  return new Promise((resolve, reject) => {
    function onEntry(entry: Entry): void {
      cleanup();
      resolve(entry);
    }
    function onEnd(): void {
      cleanup();
      resolve(undefined);
    }
    function onError(error: Error): void {
      cleanup();
      reject(error);
    }
    function cleanup(): void {
      zip.off("entry", onEntry);
      zip.off("end", onEnd);
      zip.off("error", onError);
    }

    zip.once("entry", onEntry);
    zip.once("end", onEnd);
    zip.once("error", onError);
    zip.readEntry();
  });
}

function readEntryData(zip: ZipFile, entry: Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error !== null) {
        reject(error);
        return;
      }
      if (stream === undefined) {
        reject(new Error(`Failed to read ${entry.fileName}`));
        return;
      }

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.once("error", reject);
      stream.once("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}

function zstdDecompress(input: Uint8Array): Promise<Uint8Array> {
  return withZstd((zstd) => new zstd.Streaming().decompress(input));
}

function withZstd<T>(callback: (zstd: ZstdModule) => T): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      ZstdCodec.run((zstd) => resolve(callback(zstd)));
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function sortEntries(entries: ArchiveEntry[]): ArchiveEntry[] {
  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [join(__dirname, "..", "src", "cli.js"), ...args],
      (error, stdout, stderr) => {
        if (error !== null) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}
