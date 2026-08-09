import { createWriteStream } from "node:fs";
import { readdir, rm, stat, unlink } from "node:fs/promises";
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
  try {
    try {
      await pipeline(
        createTarStream(zipFile),
        createZstdCompress(),
        createWriteStream(vsixZstPath)
      );
    } catch (error) {
      await rm(vsixZstPath, { force: true });
      throw error;
    }
  } finally {
    zipFile.close();
  }
}

function createTarStream(zipFile: ZipFile): Pack {
  const tarPack = createTarPack();
  void addZipEntriesToTar(zipFile, tarPack).catch((error: unknown) => {
    tarPack.destroy(error as Error);
  });
  return tarPack;
}

async function addZipEntriesToTar(
  zipFile: ZipFile,
  tarPack: Pack
): Promise<void> {
  for await (const zipEntry of zipFile.eachEntry()) {
    if (zipEntry.fileName === "") {
      throw new Error("Unsafe archive entry in VSIX: empty filename");
    }

    const tarEntryName = zipEntry.fileName.replace(/\/$/, "");
    // Unix ZIP entries store mode bits in the upper half of external attributes.
    const tarEntryMode =
      zipEntry.versionMadeBy >>> 8 === 3
        ? (zipEntry.externalFileAttributes >>> 16) & 0o7777
        : undefined;
    if (zipEntry.fileName.endsWith("/")) {
      tarPack.entry(
        { name: tarEntryName, type: "directory", mode: tarEntryMode },
        Buffer.alloc(0)
      );
      continue;
    }

    const zipEntryStream = await zipFile.openReadStreamPromise(zipEntry);
    try {
      const tarEntryStream = tarPack.entry({
        name: tarEntryName,
        size: zipEntry.uncompressedSize,
        mode: tarEntryMode,
      });
      await pipeline(zipEntryStream, tarEntryStream);
    } catch (error) {
      // The TAR entry may fail before pipeline() takes ownership of the ZIP stream.
      zipEntryStream.destroy();
      throw error;
    }
  }

  tarPack.finalize();
}
