import { createWriteStream } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createZstdCompress } from "node:zlib";
import { pack as createTarPack, Pack } from "tar-stream";
import { openPromise as openZip, ZipFile } from "yauzl";

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
  vsixZstPath: string
): Promise<void> {
  const zipFile = await openZip(vsixPath);
  const tarPack = createTarPack();

  // Start consuming TAR output before producing entries so backpressure and
  // output errors are connected for the entire conversion.
  const writeCompressedArchive = pipeline(
    tarPack,
    createZstdCompress(),
    createWriteStream(vsixZstPath)
  );
  const addEntries = addZipEntriesToTar(zipFile, tarPack);

  try {
    await Promise.all([addEntries, writeCompressedArchive]);
  } finally {
    zipFile.close();
  }
}

async function addZipEntriesToTar(
  zipFile: ZipFile,
  tarPack: Pack
): Promise<void> {
  try {
    for await (const zipEntry of zipFile.eachEntry()) {
      if (zipEntry.fileName === "") {
        throw new Error("Unsafe archive entry in VSIX: empty filename");
      }

      const tarEntryName = zipEntry.fileName.replace(/\/$/, "");
      if (zipEntry.fileName.endsWith("/")) {
        tarPack.entry(
          { name: tarEntryName, type: "directory" },
          Buffer.alloc(0)
        );
        continue;
      }

      const zipEntryStream = await zipFile.openReadStreamPromise(zipEntry);
      try {
        const tarEntryStream = tarPack.entry({
          name: tarEntryName,
          size: zipEntry.uncompressedSize,
        });
        await pipeline(zipEntryStream, tarEntryStream);
      } catch (error) {
        /* istanbul ignore next -- requires output failure after opening the ZIP source but before attaching its TAR target. */
        zipEntryStream.destroy();
        /* istanbul ignore next -- rethrows the same untestable race failure. */
        throw error;
      }
    }

    tarPack.finalize();
  } catch (error) {
    tarPack.destroy(error as Error);
    throw error;
  }
}
