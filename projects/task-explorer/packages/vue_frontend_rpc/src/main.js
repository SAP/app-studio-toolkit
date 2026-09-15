import { createApp, h } from "vue";
import App from "./App.vue";

// Material Design Icons CSS
import "material-design-icons-iconfont/dist/material-design-icons.css";

// Global Styles CSS
import "./assets/css/globalStyles.css";

// Inquirer GUI CSS
import "@sap-devx/inquirer-gui/dist/form.css";
import "@sap-devx/inquirer-gui-label-plugin/dist/labelPlugin.css";

// Other Modules
import vuetify from "./plugins/vuetify";
import FileBrowserPlugin from "@sap-devx/inquirer-gui-file-browser-plugin";
import FolderBrowserPlugin from "@sap-devx/inquirer-gui-folder-browser-plugin";
import LabelPlugin from "@sap-devx/inquirer-gui-label-plugin";
import Form from "@sap-devx/inquirer-gui";

const plugins = [];

const app = createApp({
  render: () =>
    h(App, {
      ref: "appRef",
    }),
  data() {
    return {};
  },
  methods: {
    registerFormPlugins(formPlugins) {
      if (Array.isArray(formPlugins)) {
        formPlugins.forEach((formPlugin) => {
          this.$refs.appRef.$refs.editor.$refs.form.registerPlugin(formPlugin);
        });
      }
    },
  },
  mounted() {
    this.registerFormPlugins(plugins);
  },
});

let options = {};
app.use(FileBrowserPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(FolderBrowserPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(LabelPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(Form, options);
app.use(options.vuetify ?? vuetify);
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith("ui5-");
export default app.mount("#app");
