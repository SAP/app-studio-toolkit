# Cloud Foundry Tools — Compatibility Wrapper

> **This extension is a backward-compatibility shim and contains no functionality of its own.**

## Purpose

The Cloud Foundry Tools extension was republished under a new publisher ID:

|                        | Extension ID               |
| ---------------------- | -------------------------- |
| Old (this extension)   | `SAP.vscode-wing-cf-tools` |
| New (active extension) | `saposs.vscode-cf-tools`   |

Because VS Code treats publisher-qualified IDs as distinct extensions, existing users who had `SAP.vscode-wing-cf-tools` installed would not automatically receive the renamed extension.

This wrapper solves that: it declares [`saposs.vscode-cf-tools`](https://marketplace.visualstudio.com/items?itemName=saposs.vscode-cf-tools) as an `extensionDependency`, so VS Code automatically installs the new extension for anyone who already has this one. No user action required.

## What happens on your machine

1. VS Code loads this wrapper (via your existing install).
2. VS Code sees the `extensionDependencies` entry and installs `saposs.vscode-cf-tools` if not already present.
3. All Cloud Foundry Tools functionality comes from `saposs.vscode-cf-tools`.
4. You can safely uninstall this wrapper once `saposs.vscode-cf-tools` is installed.

## New installations

Install [`saposs.vscode-cf-tools`](https://marketplace.visualstudio.com/items?itemName=saposs.vscode-cf-tools) directly — there is no reason to install this wrapper.
