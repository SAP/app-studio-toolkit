# Historic Changelog

> This file contains the changelog history from the standalone [SAP/cloud-foundry-tools](https://github.com/SAP/cloud-foundry-tools) repository, prior to migration into this monorepo. New changes are recorded in this package's `CHANGELOG.md`.

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.1.2](https://github.com/SAP/cloud-foundry-tools/compare/v8.1.0...v8.1.2) (2026-06-21)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [8.1.1](https://github.com/SAP/cloud-foundry-tools/compare/v8.1.0...v8.1.1) (2026-06-21)

**Note:** Version bump only for package cloud-foundry-tools-frontend

# [8.1.0](https://github.com/SAP/cloud-foundry-tools/compare/v8.0.2...v8.1.0) (2026-02-11)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [8.0.2](https://github.com/SAP/cloud-foundry-tools/compare/v8.0.1...v8.0.2) (2025-12-09)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [8.0.1](https://github.com/SAP/cloud-foundry-tools/compare/v8.0.0...v8.0.1) (2025-08-24)

**Note:** Version bump only for package cloud-foundry-tools-frontend

# [8.0.0](https://github.com/SAP/cloud-foundry-tools/compare/v7.5.2...v8.0.0) (2025-08-20)

### Features

- package name and publisher are changed ([#304](https://github.com/SAP/cloud-foundry-tools/issues/304)) ([33e586d](https://github.com/SAP/cloud-foundry-tools/commit/33e586d67270602128d3c4c17179ac632a7c82a5))

### BREAKING CHANGES

- VS Code Marketplace Publishing Support

## [7.5.2](https://github.com/SAP/cloud-foundry-tools/compare/v7.5.1...v7.5.2) (2025-08-06)

### Bug Fixes

- organization dropdown wrapping ([5e69cf8](https://github.com/SAP/cloud-foundry-tools/commit/5e69cf8408cfa2f7eb45e5fc3ebaee38842568ef))
- sign in button disabled state ([208eb68](https://github.com/SAP/cloud-foundry-tools/commit/208eb680372ce54fd176eabcd88c49a8f97bafde))
- space dropdown wrapping ([b7e9f4f](https://github.com/SAP/cloud-foundry-tools/commit/b7e9f4fb6bf71ca50497b3e1f0d1daf702756674))

## [7.5.1](https://github.com/SAP/cloud-foundry-tools/compare/v7.5.0...v7.5.1) (2025-06-24)

### Bug Fixes

- `paste` is not happening in cloud foundry `sign in` page ([#301](https://github.com/SAP/cloud-foundry-tools/issues/301)) ([0385390](https://github.com/SAP/cloud-foundry-tools/commit/0385390328284840464673a665778c2e7a8511df))
- prevent webview default `contextmenu` ([#300](https://github.com/SAP/cloud-foundry-tools/issues/300)) ([e79a1cb](https://github.com/SAP/cloud-foundry-tools/commit/e79a1cbdb2702e060ada5909aff7d8e15675c3a1))

# [7.5.0](https://github.com/SAP/cloud-foundry-tools/compare/v7.4.5...v7.5.0) (2025-02-10)

### Bug Fixes

- adding back the missing clip icon in the passphrase input field ([63aa214](https://github.com/SAP/cloud-foundry-tools/commit/63aa21498c7778224f38d9b1a0c4954557b42c77))
- address live demo comments ([0ae1abb](https://github.com/SAP/cloud-foundry-tools/commit/0ae1abbb647a4c191afbdebbe3caecc78b49ed12))
- icon inside vscode-button added id for codicon link ([aa530e6](https://github.com/SAP/cloud-foundry-tools/commit/aa530e6601234449bf488c92dd46ac65725c3c96))
- reverting selection of first org in list ([a839de7](https://github.com/SAP/cloud-foundry-tools/commit/a839de7c2d9c426b684434b0490cc5f8615a55be))
- updating user facing messages ([8421d55](https://github.com/SAP/cloud-foundry-tools/commit/8421d55d7cfc32fd16d49992546673ab287d0458))

### Features

- devxcore-3010 cf missing next steps after signing in to cf adding org and space ([ae116e4](https://github.com/SAP/cloud-foundry-tools/commit/ae116e4e81bd4310c60e070d77c6052783f4f29f))
- migrate to vscode elements ([22547a5](https://github.com/SAP/cloud-foundry-tools/commit/22547a5a9e0c3425212c8220f17ee7ba0469bbce))

## [7.4.5](https://github.com/SAP/cloud-foundry-tools/compare/v7.4.4...v7.4.5) (2024-10-14)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [7.4.4](https://github.com/SAP/cloud-foundry-tools/compare/v7.4.3...v7.4.4) (2024-05-30)

### Bug Fixes

- failed to login to CF with SSO passcode starting with a hyphen ([#293](https://github.com/SAP/cloud-foundry-tools/issues/293)) ([9bb5e3a](https://github.com/SAP/cloud-foundry-tools/commit/9bb5e3adfef757238cf01c0d83190af957349b0e))

## [7.4.3](https://github.com/SAP/cloud-foundry-tools/compare/v7.4.2...v7.4.3) (2024-05-05)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [7.4.2](https://github.com/SAP/cloud-foundry-tools/compare/v7.4.1...v7.4.2) (2023-11-26)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [7.4.1](https://github.com/SAP/cloud-foundry-tools/compare/v7.4.0...v7.4.1) (2023-11-12)

### Bug Fixes

- sorted orgs and spaces + tests ([#277](https://github.com/SAP/cloud-foundry-tools/issues/277)) ([459801a](https://github.com/SAP/cloud-foundry-tools/commit/459801a3bd2a8bb796fef4a3e0fcb6a74d9ab9f6))

# [7.4.0](https://github.com/SAP/cloud-foundry-tools/compare/v7.3.4...v7.4.0) (2023-10-03)

### Features

- migrate to vite.js and upgrade deps ([#271](https://github.com/SAP/cloud-foundry-tools/issues/271)) ([6e4381c](https://github.com/SAP/cloud-foundry-tools/commit/6e4381cd889da81424da5ce0e11bd5b78b15121c))
- migrating to Vue3 ([#258](https://github.com/SAP/cloud-foundry-tools/issues/258)) ([1bbe976](https://github.com/SAP/cloud-foundry-tools/commit/1bbe9764f3af8989d15cd5ba48cb706fc97c83d3))

## [7.3.4](https://github.com/SAP/cloud-foundry-tools/compare/v7.3.3...v7.3.4) (2023-08-09)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [7.3.3](https://github.com/SAP/cloud-foundry-tools/compare/v7.3.2...v7.3.3) (2023-07-09)

### Bug Fixes

- validate CF endpoint URL for security ([#262](https://github.com/SAP/cloud-foundry-tools/issues/262)) ([c675000](https://github.com/SAP/cloud-foundry-tools/commit/c675000514ced213ff21f6c4534161435b2ce794))

## [7.3.2](https://github.com/SAP/cloud-foundry-tools/compare/v7.3.1...v7.3.2) (2023-07-06)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [7.3.1](https://github.com/SAP/cloud-foundry-tools/compare/v7.3.0...v7.3.1) (2023-07-04)

**Note:** Version bump only for package cloud-foundry-tools-frontend

# [7.3.0](https://github.com/SAP/cloud-foundry-tools/compare/v7.2.2...v7.3.0) (2023-07-04)

**Note:** Version bump only for package cloud-foundry-tools-frontend

## [7.2.2](https://github.com/SAP/cloud-foundry-tools/compare/v7.2.1...v7.2.2) (2023-06-29)

### Bug Fixes

- sign out button in fiori themes ([#259](https://github.com/SAP/cloud-foundry-tools/issues/259)) ([d4bfa2e](https://github.com/SAP/cloud-foundry-tools/commit/d4bfa2e4d8f0dd6e130ca7a8f1865fffd7ece3d5))

## [7.2.1](https://github.com/sap-staging/cloud-foundry-tools/compare/v7.2.0...v7.2.1) (2023-02-15)

**Note:** Version bump only for package cloud-foundry-tools-frontend

# [7.1.0](https://github.com/sap-staging/cloud-foundry-tools/compare/v7.0.4...v7.1.0) (2022-11-16)

### Bug Fixes

- [DEVXCORE-2589] fix type of endpoint control ([#245](https://github.com/sap-staging/cloud-foundry-tools/issues/245)) ([48ef31d](https://github.com/sap-staging/cloud-foundry-tools/commit/48ef31dc61478bd56190edfc14c3587111732a74))
- make dropdown control searchable ([#248](https://github.com/sap-staging/cloud-foundry-tools/issues/248)) ([126d27b](https://github.com/sap-staging/cloud-foundry-tools/commit/126d27b7c24da77fc91bf3fac7b59e771a9e5c74))

## [7.0.4](https://github.com/sap-staging/cloud-foundry-tools/compare/v7.0.1...v7.0.4) (2022-11-03)

### Bug Fixes

- [DEVXBUGS-10581] CF sign doesn't detect the last used API endpoint ([#243](https://github.com/sap-staging/cloud-foundry-tools/issues/243)) ([a2b7c93](https://github.com/sap-staging/cloud-foundry-tools/commit/a2b7c93b24db17bd292d6b30dfc3310f67680d47))
- adding tooltips to target ([e4f53e4](https://github.com/sap-staging/cloud-foundry-tools/commit/e4f53e4009971ef61f1b5305fcba4b784fb3d5dd))
- bugs ([dc5d257](https://github.com/sap-staging/cloud-foundry-tools/commit/dc5d2574c86d1f9b1bca01ea44983c1e97151988))
- remove the important from the style ([a426e5c](https://github.com/sap-staging/cloud-foundry-tools/commit/a426e5cb88df128c623c08dc4cedfcc98d9376a6))
- review fixes ([cb0361d](https://github.com/sap-staging/cloud-foundry-tools/commit/cb0361d25817a06fbe8379e583f9cbda6eb2fa05))

## [7.0.1](https://github.com/SAP/cloud-foundry-tools/compare/v7.0.0...v7.0.1) (2022-06-29)

### Bug Fixes

- leftovers ([#225](https://github.com/SAP/cloud-foundry-tools/issues/225)) ([c6cedcb](https://github.com/SAP/cloud-foundry-tools/commit/c6cedcb0a67f40f3040d258b442128cb19fc70cf))

# [7.0.0](https://github.com/SAP/cloud-foundry-tools/compare/v6.5.0...v7.0.0) (2022-06-28)

### Features

- support 2fa in the cf tools ui ([#224](https://github.com/SAP/cloud-foundry-tools/issues/224)) ([5ed4d20](https://github.com/SAP/cloud-foundry-tools/commit/5ed4d20a88b86df180cf98db3dbf615e5e20ddda))
