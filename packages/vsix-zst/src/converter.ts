import { createWriteStream } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createZstdCompress } from "node:zlib";
import { pack as createPack, Pack } from "tar-stream";
import { Entry, ZipFile } from "yauzl";
import { openZip, readEntry, validateEntryName } from "./zip";

export interface ConvertOptions {
  keep?: boolean;
}

/**
 * Repackage all direct `*.vsix` files in a folder as `.vsix.zst` archives.
 *
 * @returns Paths of the created `.vsix.zst` files, using the same folder path form as the input.
 */
export async function convertVsixFolder(
  folder: string,
  options: ConvertOptions = {}
): Promise<string[]> {
  const folderStat = await stat(folder);
  if (!folderStat.isDirectory()) {
    throw new Error(`Not a folder: ${folder}`);
  }

  const vsixFiles = (await readdir(folder)).filter((file) =>
    file.endsWith(".vsix")
  );

  if (vsixFiles.length === 0) {
    throw new Error(`No *.vsix files found in ${folder}`);
  }

  const createdArchivePaths: string[] = [];
  for (const file of vsixFiles) {
    const vsixPath = join(folder, file);
    const createdArchivePath = `${vsixPath}.zst`;
    await streamVsixToZst(vsixPath, createdArchivePath);
    if (!options.keep) {
      await unlink(vsixPath);
    }
    createdArchivePaths.push(createdArchivePath);
  }
  return createdArchivePaths;
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
        /* istanbul ignore next -- requires pipeline sink failure racing with yauzl's openReadStream callback. */
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
