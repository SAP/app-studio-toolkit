[![Coverage Status](https://coveralls.io/repos/github/SAP/feature-toggle-node/badge.svg?branch=master)](https://coveralls.io/github/SAP/feature-toggle-node?branch=master)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/SAP/feature-toggle-node.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/SAP/feature-toggle-node/context:javascript)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![dependentbot](https://api.dependabot.com/badges/status?host=github&repo=SAP/feature-toggle-node)](https://dependabot.com/)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/feature-toggle-node)](https://api.reuse.software/info/github.com/SAP/feature-toggle-node)

# feature-toggle-node 
A Node.js module for enabling or disabling Node.js-based SAP Business Application Studio features.

## Description
This module used to inquire if an SAP Business Application Studio feature toggle enabled or disabled.

This module should be used if your SAP Business Application Studio extension written in Node.js or TypeScript and you want to control the extension features via feature toggle.


## Requirements

- ES2017 or higher



## Download and Installation

Install the feature-toggle-node as a dependency. 

1. Import the extension into your SAP Business Application Studio. 

2. Open the command prompt at the root of your extension.

3. Add the feature-toggle-node to the dependency section of your 'package.json' file by entering the following in the command prompt:

	```
	$ npm install @sap-devx/feature-toggle-node --save
	```


### Configuration
To run the feature-toggle-node **locally**, you need to provide the following environment variables:

#### Mandatory:

- `WORKSPACE_ID` - ID of the workspace (mandatory)
- `LANDSCAPE_ENVIRONMENT` - (mandatory)
- `LANDSCAPE_NAME` - (mandatory)

#### Optional:

- `USER_NAME` - Name of the user logged into SAP Business Application Studio (optional)
- `TENANT_ID` - (optional)
- `TENANT_NAME` - (optional)
- `FTM_HOST` - Feature toggle server host (optional)
- `LANDSCAPE_INFRASTRUCTURE` - (optional)
- `SHOW_LOG` - If true, displays console logs (optional)

Environment variables example:

```
"FTM_HOST": "http://localhost:8080",
"USER_NAME": "user@hotmail.com",
"TENANT_ID" : "b5c05535-9495-4050-9d68-4356d0d34136",
"TENANT_NAME": "cfsubaccount" // subaccount,
"WORKSPACE_ID": "workspaces-ws-x66m6",
"SHOW_LOG": "true",
```

## Usage
Use the feature-toggle-node as follows:

```
import { isFeatureEnabled } from "@sap-devx/feature-toggle-node";

(async () => {  
  if (await isFeatureEnabled("EXTENSION_NAME", "FEATURE_TOGGLE_NAME")) {
    console.log(`Feature is Enabled`);
  } else {
    console.log(`Feature is Disabled`);
  }
})();
```

## How to obtain support
Open an issue within this GitHub repository.

## Licensing

Please see our [LICENSE](https://github.com/SAP/feature-toggle-node/LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available via the [REUSE tool](https://api.reuse.software/info/github.com/SAP/feature-toggle-node).
