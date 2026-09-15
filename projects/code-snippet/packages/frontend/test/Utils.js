import { mount, shallowMount } from "@vue/test-utils";
import { createApp } from "vue";
import Form from "@sap-devx/inquirer-gui";

export function initComponent(component, propsData, isMount) {
  const app = createApp({}); // Create a Vue 3 app instance

  const options = {};
  app.use(Form, options);

  const initFunction = isMount === true ? mount : shallowMount;

  const props = {
    propsData: {
      ...propsData,
    },
  };

  return initFunction.call(this, component, props);
}

export function destroy(wrapper) {
  if (wrapper && wrapper.unmount) {
    wrapper.unmount(); // In Vue 3, use `unmount` instead of `destroy`
  }
}
