# VS Code MTA Tools Extension Wiki

Generated from commit `ce936ed29d0ff296a6742019765d9ee0c11d6060`.

## Overview & Architecture

| Page                                                                                               | Importance | Relevant Source Files                                                                            |
| -------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| [Extension Overview & Activation](sections/overview-architecture/extension-overview-activation.md) | high       | `src/extension.ts`, `package.json`, `tsconfig.json`, `webpack.config.js`, `src/i18n/messages.ts` |
| [Build & Packaging Pipeline](sections/overview-architecture/build-packaging-pipeline.md)           | medium     | `webpack.config.js`, `tsconfig.json`, `package.json`, `nyc.config.js`, `scripts/package-vsix.js` |

## Commands

| Page                                                            | Importance | Relevant Source Files                                                                                                                                       |
| --------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [MTA Build Command](sections/commands/mta-build-command.md)     | high       | `src/commands/mtaBuildCommand.ts`, `src/utils/utils.ts`, `src/utils/selectionItem.ts`, `src/i18n/messages.ts`, `tests/commands/mtaBuildCommand.spec.ts`     |
| [MTAR Deploy Command](sections/commands/mtar-deploy-command.md) | high       | `src/commands/mtarDeployCommand.ts`, `src/utils/utils.ts`, `src/utils/selectionItem.ts`, `src/i18n/messages.ts`, `tests/commands/mtarDeployCommand.spec.ts` |
| [Add Module Command](sections/commands/add-module-command.md)   | medium     | `src/commands/addModuleCommand.ts`, `src/utils/utils.ts`, `src/i18n/messages.ts`, `src/utils/swa.ts`, `tests/commands/addModuleCommand.spec.ts`             |

## Task Providers

| Page                                                                                                          | Importance | Relevant Source Files                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Build Task Provider](sections/task-providers/build-task-provider.md)                                         | high       | `src/task-providers/task-build/buildTask.ts`, `src/task-providers/task-build/buildValidator.ts`, `src/task-providers/definitions.ts`, `src/task-providers/utils/common.ts`, `tests/task-providers/task-build/buildTask.spec.ts`, `tests/task-providers/task-build/buildValidator.spec.ts`         |
| [Deploy Task Provider](sections/task-providers/deploy-task-provider.md)                                       | high       | `src/task-providers/task-deploy/deployTask.ts`, `src/task-providers/task-deploy/deployValidator.ts`, `src/task-providers/definitions.ts`, `src/task-providers/utils/cfutil.ts`, `tests/task-providers/task-deploy/deployTask.spec.ts`, `tests/task-providers/task-deploy/deployValidator.spec.ts` |
| [Task Provider Utilities & CF Integration](sections/task-providers/task-provider-utilities-cf-integration.md) | medium     | `src/task-providers/utils/common.ts`, `src/task-providers/utils/cfutil.ts`, `src/task-providers/definitions.ts`, `tests/task-providers/utils/common.spec.ts`, `tests/task-providers/utils/cfutil.spec.ts`                                                                                         |

## Validation & Diagnostics

| Page                                                                                                        | Importance | Relevant Source Files                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [MTA Validation & Diagnostics System](sections/validation-diagnostics/mta-validation-diagnostics-system.md) | high       | `src/validations/validations.ts`, `src/validations/mta/mtaValidations.ts`, `src/validations/mta/mtaDiagnostic.ts`, `tests/validations/mta/mtaValidations.spec.ts`, `tests/validations/mta/mtaDiagnostic.spec.ts` |

## Infrastructure

| Page                                                                                     | Importance | Relevant Source Files                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Logging System](sections/infrastructure/logging-system.md)                              | medium     | `src/logger/logger-wrapper.ts`, `src/logger/settings.ts`, `src/logger/settings-changes-handler.ts`, `src/logger/empty-logger.ts`, `src/i18n/messages.ts`         |
| [Utilities, SWA Tracking & i18n](sections/infrastructure/utilities-swa-tracking-i18n.md) | medium     | `src/utils/utils.ts`, `src/utils/selectionItem.ts`, `src/utils/swa.ts`, `src/i18n/messages.ts`, `tests/utils/utils.spec.ts`, `tests/utils/selectionItem.spec.ts` |
