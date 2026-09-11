[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# @sap-devx/feature-toggle-node

A Node.js module for enabling or disabling Node.js-based SAP Business Application Studio features.

## Description

This module is used to inquire whether an SAP Business Application Studio feature toggle is enabled or disabled.

Use it if your SAP Business Application Studio extension is written in Node.js or TypeScript and you want to control the extension's features via a feature toggle.

## Requirements

- ES2017 or higher

## Download and Installation

Install `@sap-devx/feature-toggle-node` as a dependency:

```
npm install @sap-devx/feature-toggle-node --save
```

### Configuration

To run `feature-toggle-node` **locally**, provide the following environment variables:

#### Mandatory:

- `WORKSPACE_ID` - ID of the workspace
- `LANDSCAPE_ENVIRONMENT`
- `LANDSCAPE_NAME`

#### Optional:

- `USER_NAME` - Name of the user logged into SAP Business Application Studio
- `TENANT_ID`
- `TENANT_NAME`
- `FTM_HOST` - Feature toggle server host
- `LANDSCAPE_INFRASTRUCTURE`
- `SHOW_LOG` - If `true`, displays console logs

Environment variables example:

```
"FTM_HOST": "http://localhost:8080",
"USER_NAME": "user@hotmail.com",
"TENANT_ID" : "b5c05535-9495-4050-9d68-4356d0d34136",
"TENANT_NAME": "cfsubaccount",
"WORKSPACE_ID": "workspaces-ws-x66m6",
"SHOW_LOG": "true"
```

## Usage

Use `feature-toggle-node` as follows:

```typescript
import { isFeatureEnabled } from "@sap-devx/feature-toggle-node";

(async () => {
  if (await isFeatureEnabled("EXTENSION_NAME", "FEATURE_TOGGLE_NAME")) {
    console.log(`Feature is Enabled`);
  } else {
    console.log(`Feature is Disabled`);
  }
})();
```

## Support

To get more help, support, and information please open a GitHub
[issue](https://github.com/SAP/app-studio-toolkit/issues/new).

## Contributing

Contributions are welcome. See the monorepo [CONTRIBUTING](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md) guide.
