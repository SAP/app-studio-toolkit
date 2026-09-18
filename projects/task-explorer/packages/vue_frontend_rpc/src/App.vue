<template>
  <v-app id="app">
    <Editor ref="editor" :editor="editor" :rpc="rpc" />
  </v-app>
</template>

<script>
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import Editor from "./components/Editor.vue";

function initialState() {
  return {
    rpc: Object,
    editor: true,
  };
}

export default {
  name: "app",
  components: {
    Editor,
  },
  data() {
    return initialState();
  },

  created() {
    this.setupRpc();
  },

  mounted() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  },

  methods: {
    setupRpc() {
      if (this.isInVsCode()) {
        this.setupVSCodeRpc();
      } else {
        // Local Development Flow
        // Assumes a WS server is already up and waiting.
        this.setupWsRPC(8081);
      }
    },

    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },

    setupVSCodeRpc: /* istanbul ignore next  */ function () {
      // `acquireVsCodeApi()` can only be invoked once, so we are "saving" it's result
      // on the `window` object in case we will need it again.
      window.vscode = acquireVsCodeApi();
      this.rpc = new RpcBrowser(window, window.vscode);
      this.initRpc();
    },

    /**
     * This method may be called directly from tests with a **custom** port.
     *  We are invoking the rpc setup logic directly so we can:
     *  - Use a custom port.
     *  - Enable awaiting for the initialization logic as it seems
     *    we cannot "await" for Vue life-cycle methods (e.g created) in tests.
     */
    async setupWsRPC(port) {
      const ws = new window.WebSocket(`ws://127.0.0.1:${port}`);
      return new Promise((resolve, reject) => {
        ws.onopen = async () => {
          try {
            this.rpc = new RpcBrowserWebSockets(ws);
            await this.initRpc();
            resolve();
          } catch (e) {
            // istanbul ignore next - No functional/product value in testing the promise rejection
            reject(e);
          }
        };
      });
    },

    async initRpc() {
      const functions = ["setTask", "setTasks"];
      functions.forEach((funcName) => {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName,
        });
      });
      await this.rpc.invoke("onFrontendReady");
    },

    async setTask(task) {
      this.$refs.editor.setTask(task);
      this.editor = true;
    },
  },
};
</script>
