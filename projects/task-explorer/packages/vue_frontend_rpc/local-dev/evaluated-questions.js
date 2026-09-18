module.exports = [
  {
    name: "label",
    message: "Label",
    type: "input",
    default: "test-deploy: task 1",
  },
  {
    name: "system",
    message: "System",
    type: "input",
    default: "default system",
  },
  {
    name: "transport",
    message: "Transport package",
    type: "input",
    default: "default transport package",
  },
  {
    name: "user",
    message: "User",
    type: "input",
    default: "default user",
  },
  {
    name: "password",
    message: "Password",
    type: "input",
    default: "",
    validate: function (value) {
      const pass = value.length > 2;
      if (pass) {
        return true;
      }

      return "invalid value";
    },
  },
];
