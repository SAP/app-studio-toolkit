import { ZstdCodec, ZstdModule } from "zstd-codec";

export function zstdCompress(input: Uint8Array): Promise<Uint8Array> {
  return withZstd((zstd) => new zstd.Streaming().compress(input));
}

function withZstd<T>(callback: (zstd: ZstdModule) => T): Promise<T> {
  return new Promise((resolve) => {
    ZstdCodec.run((zstd) => resolve(callback(zstd)));
  });
}
