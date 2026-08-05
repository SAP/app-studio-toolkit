import { zstdCompressSync } from "zlib";

export function zstdCompress(input: Uint8Array): Promise<Buffer> {
  return Promise.resolve().then(() => zstdCompressSync(input));
}
