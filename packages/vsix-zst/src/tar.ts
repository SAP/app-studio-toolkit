import { Pack, pack as createPack } from "tar-stream";
import { readZipEntries, ZipEntryData } from "./zip";

export async function zipToTar(vsixPath: string): Promise<Buffer> {
  return zipEntriesToTar(await readZipEntries(vsixPath));
}

export async function zipEntriesToTar(
  entries: ZipEntryData[]
): Promise<Buffer> {
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
      /* istanbul ignore next -- tar-stream callback errors require dependency-level failure/mocking; this wrapper only forwards the error. */
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
