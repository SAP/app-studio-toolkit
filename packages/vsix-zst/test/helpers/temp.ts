import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function createTempTracker(): {
  tempFolder(): Promise<string>;
  cleanup(): Promise<void>;
} {
  let tempFolders: string[] = [];

  return {
    async tempFolder(): Promise<string> {
      const folder = await mkdtemp(join(tmpdir(), "vsix-zst-"));
      tempFolders.push(folder);
      return folder;
    },
    async cleanup(): Promise<void> {
      await Promise.all(
        tempFolders.map((folder) =>
          rm(folder, { recursive: true, force: true })
        )
      );
      tempFolders = [];
    },
  };
}
