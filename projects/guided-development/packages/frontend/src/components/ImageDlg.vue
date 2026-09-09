<template>
  <div id="image-component">
    <v-img style="cursor:pointer" :src="image.image" max-width="100%" @click="imageDialog = true">
      <v-icon style="position:absolute;bottom:0px;right:0px" @click="imageDialog = true">search</v-icon>
    </v-img>
    <v-card-text
      v-if="!image.noPrefix"
      align="left"
      class="mt-4 pb-0"
      style="font-size: 14px; padding-left: 0px"
      ><b>Note</b></v-card-text
    >
    <v-card-text
      align="left"
      class="pa-0 ma-0"
      style="font-size: 12px; padding-left: 0px"
      >
      <span v-html="image.note"></span>
    </v-card-text>
    <v-dialog
      v-model="imageDialog"
      max-width="70%"
    >
      <v-card align="center" height="100%">
        <v-img
          :src="image.image"
          alt=""
          width="100%"
          height="100%"
          @click.stop="imageDialog = false"
        >
          <v-icon
            style="position: absolute; top: 0px; right: 0px"
            @click.stop="imageDialog = false"
            >clear</v-icon
          >
        </v-img>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: "ImageDlg",
  data() {
    return {
      imageDialog: false
    };
  },
  props: ["image"],
  methods: {
  },
  computed: {
  },
  watch: {
  },
};
</script>

<style>
.v-expansion-panel .v-icon {
  color: var(--vscode-foreground, #cccccc) !important;
}
.v-icon--link.material-icons.theme--light {
  color: var(--vscode-foreground, #cccccc) !important;
}
</style>
