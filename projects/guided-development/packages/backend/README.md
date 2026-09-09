# Extension

## Running during development

Launch the _Run Dev Server_ launch configuration.

Or use the command line:

```sh
# compile the types package first (workspace dependency):
pnpm --filter "@sap_oss/guided-development-types" run compile
# compile server code to out directory:
pnpm run compile
# run the websocket server:
pnpm run ws:run
```
