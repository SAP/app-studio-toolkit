import { mount, shallowMount } from '@vue/test-utils'
import {createApp, h} from "vue";
import App from '../../src/App.vue';
const app = createApp({
    render: () => 
      h(App, {
      ref: 'appRef',
      
    }),
  });
import { createVuetify } from "vuetify";
const Vuetify = new createVuetify({
  });
import Form from "@sap-devx/inquirer-gui";
app.use(Vuetify);

export function initComponent(component, propsData, isMount) {
    const vuetify = Vuetify;
    const options = { vuetify };
    app.use(Form, options);
    
    const initFunction = (isMount === true ? mount : shallowMount);
    const props = {
        vuetify,
        propsData: {
            ...propsData
        }
    };
    return initFunction.call(this, component, props);
}

export function destroy(wrapper) {
    if (wrapper && wrapper.destroy) {
        wrapper.destroy();
    }
}