import { createWriteStream } from "fs";
import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import { pipeline } from "stream/promises";
import { createZstdCompress } from "zlib";
import { pack as createPack, Pack } from "tar-stream";
import { Entry, ZipFile } from "yauzl";
import { openZip, readEntry, validateEntryName } from "./zip";

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
  await streamVsixToZst(vsixPath, outputPath);
  if (!options.keep) {
    await unlink(vsixPath);
  }
  return outputPath;
}

async function streamVsixToZst(
  vsixPath: string,
  outputPath: string
): Promise<void> {
  const zip = await openZip(vsixPath);
  const pack = createPack();
  const done = pipeline(
    pack,
    createZstdCompress(),
    createWriteStream(outputPath)
  );
  const feed = feedZipIntoPack(zip, pack).catch((error: unknown) => {
    pack.destroy(error as Error);
    throw error;
  });
  try {
    await Promise.all([feed, done]);
  } finally {
    zip.close();
  }
}

async function feedZipIntoPack(zip: ZipFile, pack: Pack): Promise<void> {
  while (true) {
    const entry = await readEntry(zip);
    if (entry === undefined) {
      pack.finalize();
      return;
    }
    const name = validateEntryName(entry.fileName);
    if (entry.fileName.endsWith("/")) {
      await addDirectoryEntry(pack, name);
    } else {
      await pipeFileEntry(zip, entry, name, pack);
    }
  }
}

function addDirectoryEntry(pack: Pack, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    pack.entry({ name, type: "directory" }, (error?: Error | null) => {
      /* istanbul ignore next -- tar-stream directory-entry callback errors require dependency-level failure. */
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function pipeFileEntry(
  zip: ZipFile,
  entry: Entry,
  name: string,
  pack: Pack
): Promise<void> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (error, source) => {
      if (error !== null) {
        reject(error);
        return;
      }
      let target;
      try {
        target = pack.entry(
          { name, size: entry.uncompressedSize },
          (err?: Error | null) => {
            /* istanbul ignore next -- entry-completion errors require tar-stream failure. */
            if (err != null) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      } catch (err) {
        // Pack was destroyed (e.g., pipeline sink failed) between the
        // openReadStream request and its callback. Drain the source so
        // yauzl releases its file handle, then propagate.
        source.resume();
        reject(err as Error);
        return;
      }
      /* istanbul ignore next -- target/source error paths require stream corruption we cannot force in tests. */
      target.once("error", reject);
      /* istanbul ignore next -- target/source error paths require stream corruption we cannot force in tests. */
      source.once("error", reject);
      source.pipe(target);
    });
  });
}
