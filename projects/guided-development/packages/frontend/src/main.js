import {createApp, h} from "vue";
import App from './App'

import vuetify from "./plugins/vuetify";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "./assets/css/globalStyles.css";
import "@sap-devx/inquirer-gui/dist/form.css";
import "./assets/css/codicon.css";

import Form from "@sap-devx/inquirer-gui";

let options = {};
const app = createApp({
  render: () => 
    h(App, {
    ref: 'appRef',
    
  }),
});
app.use(Form, options);
app.use(options.vuetify ?? vuetify);
app.config.productionTip = false;
export default app.mount('#app');
