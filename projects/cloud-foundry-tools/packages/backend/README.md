# Cloud Foundry Tools

This VS Code extension provides tools for easy application development with Cloud Foundry.

## Features

- Login to Cloud Foundry
- Create, bind, and unbind services
- Adds a new View-Container in VS Code titled **Cloud Foundry**
- Provides commands for Cloud Foundry development and management

---

## Table of Contents

- [Features](#features)
- [Prerequisite Dependencies](#prerequisite-dependencies)
- [How to Run Locally](#how-to-run-locally)
- [Logger Preferences](#logger-preferences)
- [Known Issues](#known-issues)
- [Contributing](#contributing)

---

## Prerequisite Dependencies

- [cf-cli v8.7.4](https://github.com/cloudfoundry/cli/releases/tag/v8.7.4)
- [cf-cli targets plugin](https://github.com/guidowb/cf-targets-plugin)
- `cf-service-info` (cf plugin for resource binding functionality):

  ```sh
  npm install -g '@sap/cf-tools-local'
  ```

---

## How to Run Locally

1. Clone the repository
2. Open it in VS Code
3. Run `pnpm install` at the monorepo root, then `pnpm ci:artifacts_only` in `projects/cloud-foundry-tools/packages/backend`
4. Launch the extension using the 'Run Extension' launch configuration
5. Access available commands via the Command Palette (prefix: `CF`)

---

## Logger Preferences

You can configure logger preferences in the extension settings:

![Screenshot showing the settings of the Cloud Foundry Tools extension](https://raw.githubusercontent.com/SAP/app-studio-toolkit/main/projects/cloud-foundry-tools/packages/backend/media/settings.png)

---

## Known Issues

- Improved failure handling and cancellation options for long-running steps are needed.

---

## Contributing

See [CONTRIBUTING.md](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md) for contribution guidelines.
