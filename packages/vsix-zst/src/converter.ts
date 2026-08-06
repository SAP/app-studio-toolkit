import { createWriteStream } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createZstdCompress } from "node:zlib";
import { pack as createPack } from "tar-stream";
import { openPromise } from "yauzl";

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
  const zip = await openPromise(vsixPath);
  const pack = createPack();
  const output = pipeline(
    pack,
    createZstdCompress(),
    createWriteStream(outputPath)
  );

  const feed = (async () => {
    for await (const entry of zip.eachEntry()) {
      if (entry.fileName === "") {
        throw new Error("Unsafe archive entry in VSIX: empty filename");
      }

      const name = entry.fileName.replace(/\/$/, "");
      if (entry.fileName.endsWith("/")) {
        pack.entry({ name, type: "directory" }, Buffer.alloc(0));
        continue;
      }

      const source = await zip.openReadStreamPromise(entry);
      try {
        await pipeline(
          source,
          pack.entry({ name, size: entry.uncompressedSize })
        );
      } catch (error) {
        /* istanbul ignore next -- requires output failure after opening the ZIP source but before attaching its TAR target. */
        source.destroy();
        /* istanbul ignore next -- rethrows the same untestable race failure. */
        throw error;
      }
    }

    pack.finalize();
  })().catch((error: unknown) => {
    pack.destroy(error as Error);
    throw error;
  });

  try {
    await Promise.all([feed, output]);
  } finally {
    zip.close();
  }
}
