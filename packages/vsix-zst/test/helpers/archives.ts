import { readFile, writeFile } from "fs/promises";
import { zstdDecompressSync } from "zlib";
import { extract } from "tar-stream";
import { Entry, open, ZipFile } from "yauzl";

export interface ArchiveEntry {
  name: string;
  data: Buffer;
}

export async function readZipEntries(
  vsixPath: string
): Promise<ArchiveEntry[]> {
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

export async function readZstTarEntries(
  path: string,
  includeDirectories = false
): Promise<ArchiveEntry[]> {
  const tarBuffer = zstdDecompressSync(await readFile(path));
  return readTarEntries(tarBuffer, includeDirectories);
}

export function readTarEntries(
  tarBuffer: Uint8Array,
  includeDirectories = false
): Promise<ArchiveEntry[]> {
  const untar = extract();
  const entries: ArchiveEntry[] = [];

  const done = new Promise<ArchiveEntry[]>((resolve, reject) => {
    untar.on("entry", (header, stream, next) => {
      if (header.type === "directory") {
        if (includeDirectories) {
          entries.push({ name: header.name, data: Buffer.alloc(0) });
        }
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

export function createVsixWithDirectory(path: string): Promise<void> {
  const name = Buffer.from("extension/");
  return writeFile(path, createZip(name, 0x10));
}

export function createUnsupportedCompressionVsix(path: string): Promise<void> {
  const name = Buffer.from("extension/file.txt");
  return writeFile(path, createZip(name, 0, 0, 99));
}

function createZip(
  name: Buffer,
  externalAttributes: number,
  flags = 0,
  compressionMethod = 0
): Buffer {
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(flags, 6);
  local.writeUInt16LE(compressionMethod, 8);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(flags, 8);
  central.writeUInt16LE(compressionMethod, 10);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(externalAttributes, 38);
  name.copy(central, 46);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length, 16);

  return Buffer.concat([local, central, end]);
}

function openZip(vsixPath: string): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    open(vsixPath, { lazyEntries: true }, (error, zip) => {
      if (error !== null) {
        reject(error);
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

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.once("error", reject);
      stream.once("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}

function sortEntries(entries: ArchiveEntry[]): ArchiveEntry[] {
  return entries.sort((left, right) => left.name.localeCompare(right.name));
}
