# Sample Action Emitter

Can perform action immediately or schedule an action to run.

## Project setup

```
pnpm install
```

### Build

```
pnpm ci
```

## Performing Actions

There are 2 alternatives for performing an action **immediately**:

- Using events:
  1. Expose an API
  1. Have the action-broker extension listen to this event
  1. Fire the event
- Directly performing the action (using a library function)

When **scheduling** an action to run later:

1. _This_ extension uses a library function that adds the action to the `settings.json` workspace file.
1. The `action-broker` extension reads from the settings file on startup, performs the actions, and clears the relevant section from the settings file.

## Limitations

Actions of type `EXECUTE` cannot be scheduled to run, as the `performAction()` method is not serialized in the `settings.json` file.
