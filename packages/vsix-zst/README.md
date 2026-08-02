# vsix-zst

Convert all direct `*.vsix` files in a folder from zip to `tar.zstd` format.

```bash
vsix-zst <folder> [--keep]
```

By default, each original `.vsix` is deleted after `<name>.vsix.zst` is written. Use `--keep` to keep originals.
