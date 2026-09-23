<template>
  <v-main id="editor-component" v-if="editor">
    <v-row class="main-row ma-0 pa-0">
      <v-col class="main-col ma-0 pa-0">
        <v-card class="main-card mr-16 pb-2">
          <v-card-title class="task-intro">
            <v-img v-show="false" class="task-icon" :src="task.taskImage"></v-img>
            <div class="task-label">{{ task.label }}</div>
            <v-spacer></v-spacer>
            <div>
              <v-divider vertical inset></v-divider>
              <v-btn variant="text" id="exec" tile @click="onExec" :disabled="!isExecuteEnabled">
                <div class="exec-title">{{ task.taskIntent }}</div>
                <div
                  :style="{
                    maskImage: `url(${task.taskExecutionImage})`,
                    webkitMaskImage: `url(${task.taskExecutionImage})`,
                  }"
                  class="exec-icon"
                ></div>
              </v-btn>
            </div>
          </v-card-title>
          <v-divider></v-divider>
          <v-list id="myListGroup">
            <v-list-item @click="showConnectivityInfo = !showConnectivityInfo" class="pa-0">
              <v-list-item-title class="main-list-item-title">
                <v-icon>{{ showConnectivityInfo ? "mdi-chevron-up" : "mdi-chevron-down" }}</v-icon>
                General Properties
              </v-list-item-title>
            </v-list-item>
            <v-list-item class="pl-8 mt-0" v-show="showConnectivityInfo">
              <Form id="form" ref="form" :questions="questions" @answered="onAnswered" />
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-divider class="mr-16"></v-divider>
    <v-row style="height: 4rem" class="mr-16" v-if="editor" sm="auto">
      <v-col class="bottom-buttons-col" style="display: flex; align-items: center">
        <v-btn id="save" :disabled="!state.saveEnabled" @click="onSave"> Save </v-btn>
      </v-col>
    </v-row>
  </v-main>
</template>

<script>
const FUNCTION = "__Function";

export default {
  // eslint-disable-next-line vue/multi-word-component-names -- TODO: to fix this
  name: "Editor",
  props: ["editor", "rpc"],
  data() {
    return {
      task: Object,
      questions: [],
      state: {
        saveEnabled: false,
        firstRender: true,
        inputValid: false,
      },
      showConnectivityInfo: true,
    };
  },
  computed: {
    isExecuteEnabled() {
      return this.state.inputValid && !this.state.saveEnabled;
    },
  },
  methods: {
    setTask(task) {
      this.prepareTask(task);
    },
    async onExec() {
      await this.rpc.invoke("executeTask");
    },
    async onSave() {
      // disable save button once saved
      this.state.saveEnabled = false;
      await this.rpc.invoke("saveTask");
    },
    prepareTask(task) {
      this.task = task;
      const questions = [...task.content];
      for (const question of questions) {
        for (const prop in question) {
          if (question[prop] === FUNCTION) {
            var that = this;
            question[prop] = (...args) => {
              return that.rpc.invoke("evaluateMethod", [args, question.name, prop]);
            };
          }
        }
      }
      this.questions = questions;
    },
    async onAnswered(answers, issues) {
      this.state.inputValid = issues === undefined;
      this.state.saveEnabled = !this.state.firstRender && this.state.inputValid;
      if (!this.state.firstRender) {
        await this.rpc.invoke("setAnswers", [{ answers: answers }]);
        this.task.label = answers.label;
      }

      this.state.firstRender = false;
    },
  },
};
</script>
