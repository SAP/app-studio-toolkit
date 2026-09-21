<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <div id="app">
    <CFHeader class="app" />

    <vscode-progress-ring class="progress-ring" :style="{ display: progressVisibility }" />

    <div class="app" :style="{ display: formVisibility }">
      <div style="visibility: none">
        <CFSignin
          :target="initialTarget"
          :orgAndSpaceSet="orgAndSpaceSet"
          :rpc="rpc"
          @updateIsLoggedIn="updateIsLoggedIn"
        />

        <div :style="{ display: targetVisibility }">
          <CFTarget
            :target="initialTarget"
            :rpc="rpc"
            :isLoggedIn="isLoggedIn"
            @orgAndSpaceSet="updateOrgAndSpaceSet"
          />
        </div>
      </div>
    </div>
    <!-- end progress -->
  </div>
</template>

<script>
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import * as _ from "lodash";
import CFHeader from "./components/CFHeader.vue";
import CFSignin from "./components/CFSignin.vue";
import CFTarget from "./components/CFTarget.vue";

import "@vscode-elements/elements/dist/vscode-button/index.js";
import "@vscode-elements/elements/dist/vscode-progress-ring/index.js";
import "@vscode-elements/elements/dist/vscode-single-select/index.js";
import "@vscode-elements/elements/dist/vscode-divider/index.js";
import "@vscode-elements/elements/dist/vscode-textfield/index.js";
import "@vscode-elements/elements/dist/vscode-radio-group/index.js";
import "@vscode-elements/elements/dist/vscode-radio/index.js";
import "@vscode-elements/elements/dist/vscode-option/index.js";

function initialState() {
  return {
    rpc: Object,
    showBusyIndicator: "",
    initialTarget: Object,
    isLoggedIn: false,
    curretOrg: "",
    currentSpace: "",
    orgAndSpaceSet: false,
  };
}
export default {
  name: "App",
  components: {
    CFHeader,
    CFSignin,
    CFTarget,
  },
  data() {
    return initialState();
  },
  computed: {
    targetVisibility() {
      return this.isLoggedIn ? "" : "none";
    },
    progressVisibility() {
      return !this.showBusyIndicator ? "none" : "";
    },
    formVisibility() {
      return this.showBusyIndicator ? "none" : "";
    },
    isLoadingColor() {
      return true;
    },
  },
  async created() {
    await this.setupRpc();
  },
  mounted() {
    this.init();
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  },
  methods: {
    updateOrgAndSpaceSet(val) {
      this.orgAndSpaceSet = val;
    },
    updateIsLoggedIn(val) {
      this.isLoggedIn = val;
    },
    setBusyIndicator(value) {
      this.showBusyIndicator = value;
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    /* c8 ignore start */
    async setupRpc() {
      if (this.isInVsCode()) {
        // eslint-disable-next-line no-undef
        window.vscode = acquireVsCodeApi();
        this.rpc = new RpcBrowser(window, window.vscode);
        this.initRpc();
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8081");
        return new Promise((resolve, reject) => {
          ws.onopen = async () => {
            try {
              this.rpc = new RpcBrowserWebSockets(ws);
              this.initRpc();
              resolve();
            } catch (e) {
              reject(e);
            }
          };
        });
      }
    },
    initRpc() {
      const functions = ["setBusyIndicator"];
      _.forEach(functions, (funcName) => {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName,
        });
      });
    },
    /* c8 ignore stop */
    init() {
      this.rpc.invoke("init").then((target) => {
        this.initialTarget = target;
      });
    },
  },
};
</script>
<style scoped>
.app {
  padding-left: 16px;
}
.progress-ring {
  margin-top: 25%;
  margin-left: 50%;
}
</style>
