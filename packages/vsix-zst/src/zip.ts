import { isAbsolute, normalize, sep } from "path";
import { Entry, open, ZipFile } from "yauzl";

export interface ZipEntryData {
  name: string;
  directory: boolean;
  data: Buffer;
}

export async function readZipEntries(
  vsixPath: string
): Promise<ZipEntryData[]> {
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

export function validateEntryName(name: string): string {
  const normalized = normalize(name);
  const parts = name.split(/[\\/]/);
  if (
    name.length === 0 ||
    isAbsolute(name) ||
    normalized === ".." ||
    normalized.startsWith(`..${sep}`) ||
    normalized.includes(`${sep}..${sep}`) ||
    parts.includes("..")
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
    /* istanbul ignore next -- yauzl emits entry iteration errors from internals; forcing it requires mocking ZipFile, this wrapper only forwards the error. */
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
      /* istanbul ignore next -- yauzl stream failures require corrupt dependency internals; this wrapper only forwards the error. */
      stream.once("error", reject);
      stream.once("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}
