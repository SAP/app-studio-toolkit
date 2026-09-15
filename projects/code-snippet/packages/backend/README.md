# Code Snippet Tool VSCode Extension

## Preview

![Form GUI Screenshot](https://raw.githubusercontent.com/SAP/code-snippet/master/packages/backend/resources/preview.png)

## Overview

This package is the VSCode extension for the Code Snippet Tool. It enables:

- Loading code snippet contributions (plugins) for extensibility.
- Rendering a dynamic code snippet form GUI in a [VSCode webview](https://code.visualstudio.com/api/extension-guides/webview) to present relevant questions to users. The form GUI is developed as a separate sub-package.
- Bridging between the frontend GUI and snippet contributions/plugins, including:
  - Invoking custom validation logic.
  - Sending user-provided answers back to the respective contribution/plugin.

This architecture supports interactive, extensible code snippet generation in VSCode, combining custom logic with a modern user interface.
