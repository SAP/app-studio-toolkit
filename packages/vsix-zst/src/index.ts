import { createWriteStream } from "fs";
import { readdir, stat, unlink } from "fs/promises";
import { isAbsolute, join, normalize, sep } from "path";
import { Pack, pack as createPack } from "tar-stream";
import { Entry, open, ZipFile } from "yauzl";
import { ZstdCodec, ZstdModule } from "zstd-codec";

export interface ConvertOptions {
  keep?: boolean;
}

export async function convertVsixFolder(
  folder: string,
  options: ConvertOptions = {}
): Promise<string[]> {
  const folderStat = await stat(folder);
  if (!folderStat.isDirectory()) {
    throw new Error(`Not a folder: ${folder}`);
  }

  const vsixFiles = (await readdir(folder))
    .filter((file) => file.endsWith(".vsix"))
    .sort();

  if (vsixFiles.length === 0) {
    throw new Error(`No .vsix files found in ${folder}`);
  }

  const outputs: string[] = [];
  for (const file of vsixFiles) {
    outputs.push(await convertVsix(join(folder, file), options));
  }
  return outputs;
}

export async function convertVsix(
  vsixPath: string,
  options: ConvertOptions = {}
): Promise<string> {
  const outputPath = `${vsixPath}.zst`;
  const tarBuffer = await zipToTar(vsixPath);
  const compressed = await zstdCompress(tarBuffer);
  await writeFile(outputPath, Buffer.from(compressed));
  if (!options.keep) {
    await unlink(vsixPath);
  }
  return outputPath;
}

async function zipToTar(vsixPath: string): Promise<Buffer> {
  const entries = await readZipEntries(vsixPath);
  const tar = createPack();
  const tarBufferPromise = collectPack(tar);

  for (const entry of entries) {
    if (entry.directory) {
      await addTarEntry(tar, { name: entry.name, type: "directory" });
    } else {
      await addTarEntry(
        tar,
        { name: entry.name, size: entry.data.length },
        entry.data
      );
    }
  }

  tar.finalize();
  return tarBufferPromise;
}

interface ZipEntryData {
  name: string;
  directory: boolean;
  data: Buffer;
}

async function readZipEntries(vsixPath: string): Promise<ZipEntryData[]> {
  const zip = await openZip(vsixPath);
  const entries: ZipEntryData[] = [];

  try {
    while (true) {
      const entry = await readEntry(zip);
      if (entry === undefined) {
        return entries;
      }

      const name = validateEntryName(entry.fileName);
      const directory = entry.fileName.endsWith("/");
      const data = directory
        ? Buffer.alloc(0)
        : await readEntryData(zip, entry);
      entries.push({ name, directory, data });
    }
  } finally {
    zip.close();
  }
}

function validateEntryName(name: string): string {
  const normalized = normalize(name);
  if (
    name.length === 0 ||
    isAbsolute(name) ||
    normalized === ".." ||
    normalized.startsWith(`..${sep}`) ||
    normalized.includes(`${sep}..${sep}`)
  ) {
    throw new Error(`Unsafe archive entry in VSIX: ${name}`);
  }
  return name.replace(/\/$/, "");
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

function collectPack(tar: Pack): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    tar.on("data", (chunk: Buffer) => chunks.push(chunk));
    tar.once("error", reject);
    tar.once("end", () => resolve(Buffer.concat(chunks)));
  });
}

function addTarEntry(
  tar: Pack,
  header: Parameters<Pack["entry"]>[0],
  data?: Buffer
): Promise<void> {
  return new Promise((resolve, reject) => {
    tar.entry(header, data, (error?: Error | null) => {
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function zstdCompress(input: Uint8Array): Promise<Uint8Array> {
  return withZstd((zstd) => new zstd.Streaming().compress(input));
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

function writeFile(path: string, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path);
    stream.once("error", reject);
    stream.once("finish", resolve);
    stream.end(data);
  });
}

export const _test = {
  zipToTar,
  zstdCompress,
};
