# VSCode Snippet Contributor Example

An example demonstrating how to implement a code snippet contribution
using the VSCode code snippet framework.

## Documentation

A code snippet contribution is a VSCode extension which:

1. Declares an `extensionDepedency` to `saposs.code-snippet-tool`:
   - ```json
     {
       "extensionDependencies": ["saposs.code-snippet-tool"]
     }
     ```
1. Returns an object from its `activate()` method which defines the
   snippet's behavior (GUI form definition / code generation or edit actions).
   - TODO: define API's interface in TypeScript.
1. Implements a **trigger** to use the code snippet.

- For example: a VSCode context menu command.

## Running the Extension

### pre-requisites

- pnpm 11.1.1 (pinned by the monorepo root)
- A [Long-Term Support version](https://nodejs.org/en/about/releases/) of node.js
- [VSCode](https://code.visualstudio.com/) compatible with the manifest's `^1.46.0` requirement.
- `saposs.code-snippet-tool` (framework) extension installed in your VSCode instance.

### Demo Flow

In your terminal:

1. Run `pnpm install` at the monorepo root.
1. Run `pnpm ci` at the monorepo root to build the framework and its workspace dependencies.
1. In this example directory, run `pnpm compile` after subsequent example-only changes.

In your "root" VSCode instance:

1. `File` Menu --> `Open Folder` --> <The folder containing this README.md>.
1. `Run` Menu --> `Start Debugging`.

This will open a **new VSCode instance** in which you should now:

1. `File` Menu --> `Open Folder` --> <the `dummy-scripts` folder (not included in this repo — create a folder with a `hello-world.js` file)>.
1. `View` --> `Command Palette` --> `Create Launch Configuration`.

This will open the snippet GUI in which you should now:

1. For `Type` dropdown --> choose "node".
1. For `Name` input field --> enter "foo".
1. For `Program` value --> use the file explorer to choose a `hello-world.js` file in the `dummy-scripts` folder.
1. Click the `Create` Button.
1. Approve the VSCode refactoring preview.

A `launch.json` file has now been created in the `.vscode` folder.
With the launch configuration you have defined.

You can now execute this launch configuration via the VSCode `Run and Debug` pane.

- https://code.visualstudio.com/Docs/editor/debugging
