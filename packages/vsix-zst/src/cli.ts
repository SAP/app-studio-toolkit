#!/usr/bin/env node

import { Command } from "commander";
import { convertVsixFolder } from "./converter";

async function main(): Promise<void> {
  const program = new Command()
    .name("vsix-zst")
    .description("Repackage VSIX archives as Zstandard-compressed TAR files")
    .argument("<folder>", "folder containing .vsix files")
    .option("--keep", "keep original .vsix files")
    .parse(process.argv);

  const createdArchivePaths = await convertVsixFolder(
    program.args[0],
    program.opts()
  );
  for (const createdArchivePath of createdArchivePaths) {
    console.log(createdArchivePath);
  }
  console.log(
    `Finished converting ${createdArchivePaths.length} VSIX archive(s).`
  );
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
