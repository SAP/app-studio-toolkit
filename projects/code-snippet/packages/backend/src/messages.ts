export default {
  channelName: "Snippets",
  title: "Code Snippet",
  description: `code-snippet description.`,
  applyButton: "Apply",
  noResponse: "No response received.",
  snippetMustExist: "Snippet must exist",
  couldNotInitialize: "Could not initialize code-snippet webview",
  couldNotUpdate: (
    methodName: string,
    questionName: string,
    namespace: string
  ): string =>
    `Could not update method '${methodName}' in '${questionName}' question in generator '${namespace}'`,
};
