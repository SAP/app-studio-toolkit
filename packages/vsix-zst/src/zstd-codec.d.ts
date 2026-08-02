declare module "zstd-codec" {
  export const ZstdCodec: {
    run(callback: (zstd: ZstdModule) => void): void;
  };

  export interface ZstdModule {
    Streaming: new () => {
      compress(input: Uint8Array, compressionLevel?: number): Uint8Array;
      decompress(input: Uint8Array, sizeHint?: number): Uint8Array;
    };
  }
}
