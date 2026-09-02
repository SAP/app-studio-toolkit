<template>
  <v-container id="collections-component">
    <v-row v-if="false">
      <v-col :cols="4" v-for="(label, index) in labels" :key=index>
        <v-select
          hide-details="auto"
          outlined
          :label="label[0]"
          :value="Array.from(label[1].values())[0]"
          :items="Array.from(label[1].values())"
          @change="onFilter"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div v-for="(collection, index) in collections" :key="index"><br>
          <v-card-title v-if="!uiOptions || !uiOptions.renderType" class="prompt-title">{{collection.title}}</v-card-title>
          <v-card-subtitle v-if="!uiOptions || !uiOptions.renderType" class="prompt-subtitle">{{collection.description}}</v-card-subtitle>
          <Items
            v-if="collection.items"
            :items="collection.items"
            :filter="filter"
            :bColorFlag="true"
            :mode="collection.mode"
            @action="onAction"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Items from "./Items.vue";

const FILTER_ALL = "__all";

export default {
  components: {
    Items
  },
  name: "Collections",
  data() {
    return {
      initialValue: {},
      labels: new Map(),
      filter: new Map()
    }
  },
  props: ["collections", "uiOptions"],
  watch: {
    "collections": {
      handler: function() {
        this.normalizeLabels();
        // reapply the filter to trigger watch in Items.vue
        this.filter = new Map(this.filter);
      },
      immediate: true
    }
  },
  methods: {
    onAction(contextualItem, index) {
      // fire 'action' event
      this.$emit("action", contextualItem, index);
    },
    onFilter(e) {
      const labelObj = JSON.parse(e);
      this.filter.set(labelObj.key, labelObj.value);
      // cloning is required to trigger watch in Items.vue:
      this.filter = new Map(this.filter);
    },
    /**
     * This method is required for the filter by label feature:
     *   We want to show the user a list of label-keys. For each key the user can choose a single value.
     *   The items shown to the user will match that value.
     *   That list should include a unique list of keys, and per key a unique list of possible values.
     */
    normalizeLabels() {
      this.labels = new Map();
      if (this.collections) {
        for (const collection of this.collections) {
          if (collection.items){
            for (const item of collection.items) {
              if (item.labels) {
                for (const labelObj of item.labels) {
                  const key = Object.keys(labelObj)[0];
                  const val = Object.values(labelObj)[0];
                  let label = this.labels.get(key);
                  if (label) {
                    label.set(val, {text:val, value:JSON.stringify({key:key,value:val})});
                  } else {
                    label = new Map();
                    label.set(FILTER_ALL, {text:"<All>", value:JSON.stringify({key:key,value:FILTER_ALL})});
                    label.set(val, {text:val, value:JSON.stringify({key:key,value:val})});
                    this.labels.set(key, label);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</script>

<style>
.v-container {
  margin-right: 0px !important;
  margin-left: 0px !important;
}
.v-card-title {
  margin-bottom:8px;
  font-size:20px
}
.v-card-subtitle {
  margin-left:-16px;
  font-size:14px;
}
</style>
