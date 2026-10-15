[![REUSE status](https://api.reuse.software/badge/github.com/SAP/app-studio-toolkit)](https://api.reuse.software/info/github.com/SAP/app-studio-toolkit)

# @sap/cf-tools

This package provides a set of APIs to help you develop applications in Cloud Foundry. You can use these APIs to manage apps, service instances, orgs, spaces, and users in your environment. Mostly, this is a wrapper of the CF command line client, which runs a particular command and parses the output to the suitable JSON file. Many operations reject with an Error on failure; cfLogin returns "OK" on success, or the raw CF CLI output string on failure (may be empty if the CLI produced no output).

## Prerequisite

Make sure you have installed the CF CLI [v8](https://github.com/cloudfoundry/cli#downloads) tool in your environment.

## Examples of usage

Example 1

```typescript
const result = await cfLogin({
  endpoint: "https://api.cf.....com",
  user: "user",
  password: "password",
});
if (result === "OK") {
  // successful
} else {
  // display or/and log error: result contains the failure message
}
```

Example 2

```typescript
try {
  const spaces = await cfGetAvailableSpaces("organization-guid");
  for (const space of spaces) {
    console.log("Space label is " + space.label + " guid is " + space.guid);
  }
} catch (e) {
  // display or/and log error
}
```

## Contributing

Contributions are welcome. See the monorepo [CONTRIBUTING](https://github.com/SAP/app-studio-toolkit/blob/main/CONTRIBUTING.md) guide.
