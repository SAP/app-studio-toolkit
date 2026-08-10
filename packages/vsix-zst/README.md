# vsix-zst

Repackage VSIX archives as Zstandard-compressed TAR files.

`vsix-zst` converts each direct `*.vsix` file in a folder from ZIP format to a `.vsix.zst` file containing a TAR archive compressed with Zstandard.

## Requirements

- Node.js `>=22.15`

## Usage

```bash
vsix-zst <folder> [--keep]
```

## Arguments

| Argument   | Required | Description                                           |
| ---------- | -------- | ----------------------------------------------------- |
| `<folder>` | Yes      | Folder containing direct `*.vsix` files to repackage. |

## Options

| Option   | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `--keep` | Keep the original `.vsix` files after writing the `.vsix.zst` outputs. |

## Behavior

- Only direct `*.vsix` files in `<folder>` are converted; subfolders are not scanned.
- Each output is written next to the input as `<name>.vsix.zst`.
- By default, the original `.vsix` file is deleted after its `.vsix.zst` output is written.
- The CLI prints each created output path.
