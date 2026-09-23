import { createApp } from "vue";
import CFSignIn from "./App.vue";
import "./styles/tooltip.css";
import tooltip from "./directives/tooltip.js";

const app = createApp(CFSignIn);

// register all directives
app.directive("tooltip", tooltip);

app.mount("#app");
