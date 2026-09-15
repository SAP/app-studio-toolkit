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

- [Yarn](https://yarnpkg.com/lang/en/docs/install/) >= 1.4.2
- A [Long-Term Support version](https://nodejs.org/en/about/releases/) of node.js
- [VSCode](https://code.visualstudio.com/) 1.39.2 or higher or [Theia](https://www.theia-ide.org/) 0.12 or higher.
- `saposs.code-snippet` (framework) extension installed in your VSCode instance.
  - Available on [github releases](https://github.com/SAP/code-snippet/releases).

### Demo Flow

In your terminal:

1. `yarn` (install/update dependencies)
1. `yarn compile`

In your "root" VSCode instance:

1. `File` Menu --> `Open Folder` --> <The folder containing this README.md>.
1. `Run` Menu --> `Start Debugging`.

This will open a **new VSCode instance** in which you should now:

1. `File` Menu --> `Open Folder` --> <the [`dummy-scripts`](../dummy-scripts) folder>.
1. `View` --> `Command Palette` --> `Create Launch Configuration`.

This will open the snippet GUI in which you should now:

1. For `Type` dropdown --> choose "node".
1. For `Name` input field --> enter "foo".
1. For `Program` value --> use the file explorer to choose the [hello-world.js](../dummy-scripts/hello-world.js).
1. Click the `Create` Button.
1. Approve the VSCode refactoring preview.

A `launch.json` file has now been created in the `.vscode` folder.
With the launch configuration you have defined.

You can now execute this launch configuration via the VSCode `Run and Debug` pane.

- https://code.visualstudio.com/Docs/editor/debugging
