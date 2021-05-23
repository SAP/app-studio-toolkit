export enum ActionType {
    Execute = "EXECUTE",
    Command = "COMMAND",
    Task = "TASK",
    File = "FILE",
    Snippet = "SNIPPET"
}

export enum ActionJsonKey {
    ActionType = "actionType",
    CommandName = "commandName",
    CommandParams = "commandParams",
    Uri = "uri"
}
