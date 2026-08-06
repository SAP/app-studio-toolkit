import { isAbsolute, normalize, sep } from "path";
import { Entry, open, ZipFile } from "yauzl";

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

export function openZip(vsixPath: string): Promise<ZipFile> {
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

export function readEntry(zip: ZipFile): Promise<Entry | undefined> {
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
