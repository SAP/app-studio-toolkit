const WebSocket = require("ws");
const { defaults } = require("lodash");

const { RpcExtensionWebSockets } = require("@sap-devx/webview-rpc/out.ext/rpc-extension-ws");

const ASYNC_NOOP = async () => {};

/**
 * A Backend mock using WebSockets.
 * Note that this class does not include the RPC end points logic.
 * Those can be passed via the constructors `opts` to implement different types of backend mocks, e.g:
 * - In Memory mock for testing.
 * - Mock using a real (hard-coded path) file for local "playground".
 */
class BackendMock {
  /**
   * @param [opts] {object}
   * @param [opts.port] {number}
   * @param [opts.saveTask] {Function}
   * @param [opts.onFrontendReady] {Function}
   * @param [opts.evaluateMethod] {Function}
   * @param [opts.setAnswers] {Function}
   * @param [opts.executeTask] {Function}
   * @param [opts.setSelectedTask] {Function}
   */
  constructor(opts) {
    const actualOpts = defaults(opts, {
      port: 8081,
      saveTask: ASYNC_NOOP,
      onFrontendReady: ASYNC_NOOP,
      evaluateMethod: ASYNC_NOOP,
      setAnswers: ASYNC_NOOP,
      executeTask: ASYNC_NOOP,
      setSelectedTask: ASYNC_NOOP,
    });

    this.wss = new WebSocket.Server({ port: actualOpts.port }, () => {
      console.log("started websocket server");
    });

    this.wss.on("listening", () => {
      console.log(`listening to websocket on port ${actualOpts.port}`);
    });

    this.wss.on("error", (error) => {
      console.error(error);
    });

    this.wss.on("connection", (ws, req) => {
      const remoteAddress = req.socket.remoteAddress;
      console.log(`new ws connection from: ${remoteAddress}`);
      this.rpc = new RpcExtensionWebSockets(ws);
      this.rpc.registerMethod({
        name: "onFrontendReady",
        func: async () => {
          console.log(`Frontend is ready!`);
          return actualOpts.onFrontendReady.call(this);
        },
        thisArg: null,
      });

      this.rpc.registerMethod({
        name: "evaluateMethod",
        func: async (params, questionName, methodName) => {
          console.log(`Evaluate method!`);
          return actualOpts.evaluateMethod(params, questionName, methodName);
        },
        thisArg: null,
      });

      this.rpc.registerMethod({
        name: "setAnswers",
        func: async (state) => {
          console.log(`Set updated contents!`);
          return actualOpts.setAnswers(state);
        },
        thisArg: null,
      });

      this.rpc.registerMethod({
        name: "saveTask",
        func: async () => {
          console.log(`Saving updated contents!`);
          return actualOpts.saveTask.call(this);
        },
        thisArg: null,
      });

      this.rpc.registerMethod({
        name: "executeTask",
        func: async () => {
          console.log(`Execute task`);
          return actualOpts.executeTask.call(this);
        },
        thisArg: null,
      });

      this.rpc.registerMethod({
        name: "setSelectedTask",
        func: async (selectedTask) => {
          console.log(`Selected task has been set`);
          return actualOpts.setSelectedTask.call(selectedTask);
        },
        thisArg: null,
      });
    });
  }

  shutdown() {
    this.wss.close();
  }
}

module.exports = {
  BackendMock,
};
