#!/usr/bin/env node

import { convertVsixFolder } from "./index";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const keep = args.includes("--keep");
  const folders = args.filter((arg) => arg !== "--keep");

  if (folders.length !== 1) {
    throw new Error("Usage: vsix-zst <folder> [--keep]");
  }

  const outputs = await convertVsixFolder(folders[0], { keep });
  for (const output of outputs) {
    console.log(output);
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
