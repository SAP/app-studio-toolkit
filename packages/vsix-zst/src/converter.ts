import { createWriteStream } from "fs";
import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import { zipToTar } from "./tar";
import { zstdCompress } from "./zstd";

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

function writeFile(path: string, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path);
    stream.once("error", reject);
    stream.once("finish", resolve);
    stream.end(data);
  });
}
