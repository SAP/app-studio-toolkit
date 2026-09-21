<template>
  <div id="targetDiv" class="loggedIn">
    <br />
    <div class="cloud-foundry-target">Cloud Foundry Target</div>
    <div :style="{ display: orgAndSpaceSetVisibility }" class="org-and-space-visibility">
      <span className="codicon codicon-pass signin-icon-target" />
      Target is set to: {{ currentOrg }} org and {{ currentSpace }} space.
    </div>
    <div v-if="orgMissing || spaceMissing" class="org-and-space-absence">
      <span className="codicon codicon-warning org-and-space-absence-icon" />
      {{
        orgMissing
          ? "There is no Org defined for this landscape."
          : "There is no Space defined for the org you selected."
      }}
    </div>
    <br /><br />
    <template v-if="!orgMissing">
      <span class="subtitle-color-field">Select Cloud Foundry Organization </span><span class="text-danger">*</span
      ><br />
      <vscode-single-select
        ref="orgSelect"
        :value="selectedOrg.label"
        class="cf-drop-down mt-8"
        @change="updateSelectedOrg"
      >
        <vscode-option disabled value=""></vscode-option>
        <vscode-option v-for="org in optOrganizations" :key="org.guid" :value="org.label" :selected="org.selected">{{
          org.label
        }}</vscode-option>
      </vscode-single-select>
      <br /><br />
      <span class="subtitle-color-field">Select Cloud Foundry Space </span><span class="text-danger">*</span><br />
      <vscode-single-select
        ref="spaceSelect"
        :disabled="!optSpaces.length"
        :value="selectedSpace.label"
        class="cf-drop-down mt-8"
        @change="updateSelectedSpace"
      >
        <vscode-option disabled value=""></vscode-option>
        <vscode-option v-for="space in optSpaces" :key="space.guid" :value="space.label" :selected="space.selected">{{
          space.label
        }}</vscode-option>
      </vscode-single-select>
      <br /><br />
      <vscode-button class="mt-8" :disabled="isApplyButtonDisabled" @click="setTarget"> Apply </vscode-button>
    </template>
  </div>
</template>

<script>
import * as _ from "lodash";
export default {
  name: "CFTarget",
  props: {
    target: {
      type: Object,
      required: true,
    },
    rpc: {
      type: Object,
      required: true,
    },
    isLoggedIn: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["orgAndSpaceSet"],
  data() {
    return {
      areOrgAndSpaceSet: "",
      orgMissing: false,
      spaceMissing: false,
      orgs: [],
      spaces: [],
      selectedOrg: {},
      selectedSpace: {},
      currentOrg: "",
      currentSpace: "",
    };
  },
  computed: {
    loggedInVisibility() {
      return !this.isLoggedIn ? "none" : "";
    },
    orgAndSpaceSetVisibility() {
      return this.areOrgAndSpaceSet || (this.target?.currentOrg && this.target?.currentSpace) ? "" : "none";
    },
    isApplyButtonDisabled() {
      return (
        this.selectedOrg.label === undefined ||
        this.selectedSpace.label === undefined ||
        (this.selectedOrg.label === this.currentOrg && this.selectedSpace.label === this.currentSpace)
      );
    },
    optOrganizations() {
      return this.orgs;
    },
    optSpaces() {
      return this.spaces;
    },
  },
  watch: {
    isLoggedIn(newVal) {
      if (newVal) {
        this.getOrgAndSpace();
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.injectOptionStyle(this.$refs.orgSelect, "org");
      this.injectOptionStyle(this.$refs.spaceSelect, "space");
    });
  },
  updated() {
    if (this.currentOrg === "") {
      this.currentOrg = this.target?.currentOrg;
    }
    if (this.currentSpace === "") {
      this.currentSpace = this.target?.currentSpace;
    }
    this.$emit("orgAndSpaceSet", this.isApplyButtonDisabled);
  },
  methods: {
    injectOptionStyle(ref, type) {
      if (ref && ref.shadowRoot && !ref.shadowRoot.querySelector(`style[data-${type}-option-style]`)) {
        const style = document.createElement("style");
        style.setAttribute(`data-${type}-option-style`, "true");
        style.textContent = `
          li.option {
            height: auto;
          }
        `;
        ref.shadowRoot.appendChild(style);
      }
    },
    updateSelectedOrg(newOrg) {
      this.selectedOrg = _.find(this.orgs, (org) => org.label === newOrg.target.value);
      this.selectSpace(undefined);
    },
    updateSelectedSpace(newSpace) {
      this.selectedSpace = _.find(this.spaces, (space) => space.label === newSpace.target.value);
    },
    getOrgAndSpace() {
      this.rpc.invoke("getSelectedTarget").then((target) => {
        this.rpc.invoke("getOrgs").then((orgs) => {
          const orgsWithSelected = orgs.map((org) => {
            if (org.label === target.org) {
              this.selectedOrg = {
                label: org.label,
                guid: org.guid,
                selected: true,
              };
            }
            return {
              guid: org.guid,
              label: org.label,
              selected: org.label === target.org,
            };
          });
          this.orgs = _.sortBy(orgsWithSelected, (item) => item.label.toLowerCase());

          // If no org could be selected from the current target, set it to the first org if exists
          if (!this.selectedOrg?.label && this.orgs.length === 1) {
            this.selectedOrg = {
              label: this.orgs[0].label,
              guid: this.orgs[0].guid,
            };
          }

          // If some org is selected - select a space with the current target information
          if (this.selectedOrg && this.selectedOrg.label) {
            this.selectSpace(target.space);
          }
          this.orgMissing = this.orgs.length === 0;
        });
      });
    },
    selectSpace(targetSpace) {
      this.rpc.invoke("getSpaces", [this.selectedOrg.guid]).then((spaces) => {
        const spacesWithSelected = spaces.map((space) => {
          return {
            guid: space.guid,
            label: space.label,
            selected: targetSpace ? space.label === targetSpace : false,
          };
        });
        this.spaces = _.sortBy(spacesWithSelected, (item) => item.label.toLowerCase());
        // If a specific space should be selected - choose it, otherwise take the first if exists and is the only one, otherwise fallback to an empty selection object.
        this.selectedSpace =
          this.spaces.length === 1 ? this.spaces[0] : _.find(this.spaces, (space) => space.selected === true) ?? {};
        this.spaceMissing = this.spaces.length === 0;
      });
    },
    setTarget() {
      const org = this.selectedOrg.label;
      const space = this.selectedSpace.label;

      this.rpc.invoke("applyTarget", [org, space]).then(() => {
        this.areOrgAndSpaceSet = true;
        this.currentOrg = org;
        this.currentSpace = space;
      });
    },
  },
};
</script>

<style scoped>
.signin-icon-target,
.org-and-space-absence-icon {
  padding-right: 5px;
  padding-top: 2px;
}
.signin-icon-target {
  color: var(--vscode-notebookStatusSuccessIcon-foreground, #388a34);
}
.org-and-space-absence-icon {
  color: var(--vscode-notificationsWarningIcon-foreground, #bf8803);
}
.subtitle-color-field {
  color: var(--vscode-descriptionForeground, #717171);
}
.mt-8 {
  margin-top: 8px;
}
.cloud-foundry-target {
  font-weight: bold;
  padding-right: 16px;
  float: left;
}
.org-and-space-visibility,
.org-and-space-absence {
  float: left;
  display: flex;
}
.text-danger {
  color: red;
}
.cf-drop-down {
  min-width: 400px;
  max-width: 400px;
  width: fit-content;
  padding: 0px 0px 2px 0px;
}
</style>
