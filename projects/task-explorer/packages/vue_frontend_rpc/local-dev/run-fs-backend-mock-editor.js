const { readFileSync } = require("fs");
const { resolve } = require("path");
const { isEmpty, find, get } = require("lodash");
const { BackendMock } = require("./backend-mock");
const evaluatedQuestions = require("./evaluated-questions");

const taskFilePath = resolve(__dirname, "./task-details.json");

/**
 * Websocket Backend mock using a real file (`./task-details.json`)
 * This is used as a playground during local development to enable fast feedback loops.
 */

new BackendMock({
  onFrontendReady: async function () {
    const taskFileText = readFileSync(taskFilePath, "utf-8");
    const taskObject = JSON.parse(taskFileText);
    await this.rpc.invoke("setTask", [taskObject]);
  },
  evaluateMethod: async function (params, questionName, methodName) {
    if (!isEmpty(evaluatedQuestions)) {
      const relevantQuestion = find(evaluatedQuestions, (question) => {
        return get(question, "name") === questionName;
      });
      if (relevantQuestion) {
        return await relevantQuestion[methodName].apply(null, params);
      }
    }
  },
  saveTask: async function () {
    console.log("content saved");
  },
  setAnswers: async function (state) {
    console.log("content set, answers are: ", state.answers);
  },
});
