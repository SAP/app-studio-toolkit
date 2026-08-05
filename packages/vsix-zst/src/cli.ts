#!/usr/bin/env node

import { Command } from "commander";
import { convertVsixFolder } from "./index";

async function main(): Promise<void> {
  const program = new Command()
    .name("vsix-zst")
    .description("Convert VSIX files from zip to tar.zstd")
    .argument("<folder>", "folder containing .vsix files")
    .option("--keep", "keep original .vsix files")
    .parse(process.argv);

  const outputs = await convertVsixFolder(program.args[0], program.opts());
  for (const output of outputs) {
    console.log(output);
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
