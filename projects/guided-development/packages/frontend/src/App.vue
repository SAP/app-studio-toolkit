<template>
  <v-app id="app" class="vld-parent">
    <loading
      :active="showBusyIndicator"
      :isFullPage="true"
      :height=64
      :width=64
      :color="isLoadingColor"
      backgroundColor="transparent"
      loader="spinner"
    ></loading>
    <div v-if="!messages.collectionadditionalinfo">
      <v-card-title>{{messages.title}}</v-card-title>
      <v-card-subtitle>{{messages.description}}</v-card-subtitle>
    </div>
    <div v-if="messages.collectionadditionalinfo">
      <v-card-title>{{messages.title}}
        <div v-if="messages.collectionadditionalinfo.iconName" border size="x-small" class="text-none rounded guide-icon">
          <span :class="'title_icon codicon codicon-'+messages.collectionadditionalinfo.iconName"></span>
          <span class="title_icon_text">{{messages.collectionadditionalinfo.iconLabel}}</span>
        </div>
      </v-card-title>
      <v-card-subtitle>
        <div class="d-flex" justify-start mb-6>
          <span class="ma-2 pa-2 subtitle_text">
            {{messages.collectionadditionalinfo.tool}}
          </span>
          <v-divider vertical class="guide-divider ma-2 pa-2"></v-divider>
          <span class="ma-2 pa-2 subtitle_text">
            <img class="subtitle_text_img" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjMiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAyMyAxOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuNTIgMS43Nkw3LjI0IDAuOTZIMTAuMjhMMTEgMS43NlYxOC4yNEwxMC4yOCAxOC45Nkg3LjI0TDYuNTIgMTguMjRWMS43NlpNOC4wNCAyLjQ4VjE3LjUySDkuNDhWMi40OEg4LjA0Wk0xMi43NiAzLjA0TDEzLjI0IDIuMDhMMTYuMDQgMS4wNEwxNyAxLjQ0TDIyLjYgMTYuOTZMMjIuMiAxNy45MkwxOS40IDE4Ljk2TDE4LjQ0IDE4LjU2TDEyLjc2IDMuMDRaTTE0LjQ0IDMuMkwxOS41NiAxNy4yOEwyMSAxNi44TDE1LjggMi43MkwxNC40NCAzLjJaTTAuNTIgMS43NkwxLjI0IDAuOTZINC4yOEw1IDEuNzZWMTguMjRMNC4yOCAxOC45NkgxLjI0TDAuNTIgMTguMjRWMS43NlpNMi4wNCAyLjQ4VjE3LjUySDMuNDhWMi40OEgyLjA0WiIgZmlsbD0idmFyKC0tdnNjb2RlLWlucHV0LWJhY2tncm91bmQpIi8+Cjwvc3ZnPg==" alt="Custom Icon" />{{messages.collectionadditionalinfo.estimatedTime}}
          </span>
          <v-divider v-if="messages.collectionadditionalinfo.projectName" vertical class="guide-divider ma-2 pa-2"></v-divider>
          <span v-if="messages.collectionadditionalinfo.projectName" class="ma-2 pa-2 subtitle_text">
            Project: {{messages.collectionadditionalinfo.projectName}}
          </span>
        </div>
        <v-card-text class="subtitle_text">{{messages.description}}</v-card-text>
        <v-card-text class="subtitle_text">
          <span v-html="messages.collectionadditionalinfo.longDescription"></span>
        </v-card-text>
      </v-card-subtitle>
    </div>
    <Collections
      v-if="collections && uiOptions && uiOptions.renderType"
      :collections="collections"
      :uiOptions="uiOptions"
      @action="onAction"
    />
  </v-app>
</template>

<script>
import Loading from "vue-loading-overlay";
import Collections from "./components/Collections.vue";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";

function initialState() {
  return {
    collections: [],
    rpc: Object,
    messages: {},
    showBusyIndicator: false,
    uiOptions: {},
  };
}

export default {
  name: "App",
  components: {
    Collections,
    Loading,
  },
  data() {
    return initialState();
  },
  computed: {
    isLoadingColor() {
      return (
        getComputedStyle(document.documentElement).getPropertyValue(
          "--vscode-progressBar-background"
        ) || "#0e70c0"
      );
    },
  },
  watch: {
  },
  methods: {
    async onAction(contextualItem, index) {
      const itemFqid = contextualItem?.item?.fqid;
      await this.rpc.invoke("performAction", [itemFqid, index, contextualItem.context]);
    },
    
    getItemByFqid(fqid) {
      let rootLevelItems = [];
      this.collections.forEach(col => {
        rootLevelItems.push(...col.items)
      });
      const flatten = [];
      while (rootLevelItems.length > 0) {
        let itemNode = rootLevelItems.shift();
        flatten.push(itemNode);
        if (Array.isArray(itemNode.items)) {
          rootLevelItems.push(...itemNode.items);
        }
      }
      return flatten.find(item => item.fqid === fqid);
    },

    async showCollections(collections, uiOptions) {
      this.uiOptions = uiOptions || {};
      window.vscode?.setState(this.uiOptions);
      let renderCollections = [];
      if (this.uiOptions && this.uiOptions.renderType) {
        collections.forEach(element => {
          if (this.uiOptions.renderType === "collection" && element.id === this.uiOptions.id) {
            renderCollections.push(element);
          }
        });
      } else {
        renderCollections = collections;
      }
      this.collections = renderCollections;
    },

    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    setupRpc() {
      /* istanbul ignore if */
      if (this.isInVsCode()) {
        // eslint-disable-next-line
        window.vscode = acquireVsCodeApi();
        this.rpc = new RpcBrowser(window, window.vscode);
        this.initRpc();
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8081");
        /* istanbul ignore next */
        ws.onopen = () => {
          this.rpc = new RpcBrowserWebSockets(ws);
          this.initRpc();
        };
      }
    },
    changeItemsState(stateChangedItems) {
      stateChangedItems.forEach(stateChangedItem => {
        const targetItemToOverwrite = this.getItemByFqid(stateChangedItem.fqid);
        if (!targetItemToOverwrite) {
          return;
        }
        Object.assign(targetItemToOverwrite, stateChangedItem);
      });
    },
    initRpc() {
      const functions = ["showCollections", "changeItemsState"];
      for (const funcName of functions) {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName
        });
      }

      this.rpcIsReady();
    },
    async rpcIsReady() {
      await this.setState();
      await this.rpc.invoke("onFrontendReady", []);
    },
    reload() {
      const dataObj = initialState();
      dataObj.rpc = this.rpc;
      Object.assign(this.$data, dataObj);

      this.rpcIsReady();
    },
    async setState() {
      this.messages = await this.rpc.invoke("getState");
    }
  },
  created() {
    this.setupRpc();
  },
};
</script>
<style scoped>
@import "./../node_modules/vue-loading-overlay/dist/css/index.css";
.left-col {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.main-row {
  height: calc(100% - 4rem);
}
.left-col,
.right-col,
.right-row,
#step-component-div,
.right-col {
  padding: 0 !important;
}
.bottom-buttons-col {
  border-top: 2px solid var(--vscode-editorWidget-background, #252526);
  padding-right: 25px;
}
.bottom-buttons-col > .v-btn:not(:last-child) {
    margin-right: 10px !important;
}
.v-card-title {
  color: var(--vscode-foreground, #cccccc);
  margin-bottom: 16px;
  font-size: 26px;
  padding: 16px;
  line-height: 2rem;
}
.v-card-subtitle {
  margin-left: 4px;
  border-bottom: 1px solid hsla(0,0%,53.3%,.45);
  margin-top: -16px;
  padding-bottom: 16px;
  opacity: unset;
}
.vld-parent {
  overflow-y: auto;
  margin: 0px;
  height: calc(100% - 4rem);
}
.guide-icon {
  margin-left:10px !important;
  height: 19px;
  background: var(--vscode-extensionButton-prominentBackground) !important;
  display: flex;
  padding: 1px 4px;
  align-items: center;
  gap: 3px;
}
.pa-2.guide-divider {
  border-color: var(--vscode-disabledForeground, #cccccc) !important;
  margin-top: 0px !important;
  padding-left: 0px !important;
  margin-left: 0px !important;
}
.subtitle_text {
  padding-left: 0px !important;
  padding-top: 0px !important;
  margin: 0px !important;
}
.pa-2.subtitle_text {
  padding-left: 0px !important;
  padding-top: 0px !important;
  margin: 0px !important;
}
.subtitle_text_img {
  -webkit-mask: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTcgOVY1SDhWOEwxMiA4VjlIN1oiIGZpbGw9IiM0MjQyNDIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDE1QzExLjg2NiAxNSAxNSAxMS44NjYgMTUgOEMxNSA0LjEzNDAxIDExLjg2NiAxIDggMUM0LjEzNDAxIDEgMSA0LjEzNDAxIDEgOEMxIDExLjg2NiA0LjEzNDAxIDE1IDggMTVaTTggMTRDMTEuMzEzNyAxNCAxNCAxMS4zMTM3IDE0IDhDMTQgNC42ODYyOSAxMS4zMTM3IDIgOCAyQzQuNjg2MjkgMiAyIDQuNjg2MjkgMiA4QzIgMTEuMzEzNyA0LjY4NjI5IDE0IDggMTRaIiBmaWxsPSIjNDI0MjQyIi8+Cjwvc3ZnPg==) 50% 50% /16px no-repeat;
  background: var(--vscode-input-foreground);
  vertical-align: middle;
  padding-right: 5px;
  margin-top: -2px;
}
.title_icon_text {
  color: var(--vscode-foreground);
  color: #eaecee;
  font-size: 14px;
}
.title_icon {
  color: var(--vscode-foreground);
  color: #eaecee;
}
</style>
