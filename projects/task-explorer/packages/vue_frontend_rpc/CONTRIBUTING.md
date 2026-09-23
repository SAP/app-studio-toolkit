# Contribution Guide

Please see the top-level [Contribution Guide](../../CONTRIBUTING.md) for the project setup and all development flows.

## Local Development Playground

To run the Frontend locally to enable fast development feedback loops:

- navigate to this folder in your terminal.
- execute `yarn backend:mock` and leave the process running.
- navigate to this folder in another terminal.
- execute `yarn serve`

## Testing

Testing is implemented using:

- `@vue/test-utils`
- `vue-cli-service`
- `@vue/cli-plugin-unit-mocha`
- `chai`

Vue testing is often implemented using [Jest](https://jestjs.io) rather than [Mocha](https://mochajs.org).
However, This project is using Mocha to avoid dealing with **multiple** test runner libraries in a **single** monorepo.

### Functional Flows

Virtually full end to end functional flows can be reproduced in the testing environment.
This is accomplished by running an alternative websocket RPC backend server, which means
the frontend code executes (virtually) the same code and flows as it would have in productive flows.

This methodology helps achieve:

- Fast testing of true productive end to end functional flows.
- Higher code coverage.
- Reduced need for mocking frontend code during tests.

## Building & Bundling the project

- navigate to this folder in your terminal.
- execute `yarn build` and leave the process running.

The build results can be found in the [./dist](./dist) folder.
