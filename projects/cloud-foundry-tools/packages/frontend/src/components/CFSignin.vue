<!-- eslint-disable vue/v-on-event-hyphenation -->
<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<template>
  <div>
    <div class="cloud-foundry-title">Cloud Foundry Sign In</div>
    <div :style="{ display: loggedInVisibility }" class="logged-in-visibility">
      <div style="display: flex">
        <span className="codicon codicon-pass signin-icon" />
        {{ "You are signed in to Cloud Foundry." + (orgAndSpaceSet ? "" : " You can now set the Org and Space.") }}
      </div>
    </div>
    <br /><br />

    <div :style="{ display: loggedInVisibility }">
      <span class="subtitle-color-field">Cloud Foundry Endpoint</span>
      <br />
      <div class="mt-8">
        {{ endpoint }}
      </div>
      <br /><br />
      <vscode-button @click="SignoutClicked"> Sign Out </vscode-button>
    </div>

    <!-- authentication area -->
    <div id="authenticationDiv" :style="{ display: notLoggedInVisibility }">
      <br />
      <span class="subtitle-color-field">Enter Cloud Foundry Endpoint </span><span class="text-danger">*</span>
      <br />
      <vscode-textfield
        id="cfEndpointInput"
        ref="cfendpointInput"
        :value="endpoint"
        class="pt-8"
        :class="{ 'invalid-input-field': !isCFEndpointValid }"
        size="50"
        type="url"
        @input="setEndpoint"
        @keyup="btnStatus"
      />
      <div v-if="!isCFEndpointValid" class="error-container">
        <div class="invalid-endpoint-error">You must provide a valid URL</div>
      </div>
      <br /><br />
      <div style="display: flex">
        <span class="subtitle-color-field">Select authentication method </span>
        <span
          v-tooltip="{
            text:
              'Single sign-on (SSO) is a token-based authentication method in which an SSO token is passed in an HTTP header or cookie.',
            theme: {
              placement: 'right',
              width: '300px',
            },
          }"
          class="tooltip sso-info-icon"
        >
          <span className="codicon codicon-question" />
        </span>
      </div>

      <vscode-radio-group orientation="horizontal" :value="ssoOrCredentials" @change="setSSO">
        <vscode-radio id="radioCredentials" value="Credentials" :checked="ssoOrCredentials === 'Credentials'">
          Credentials
        </vscode-radio>
        <vscode-radio id="radioSSO" value="SSO" :checked="ssoOrCredentials === 'SSO'"> SSO Passcode </vscode-radio>
      </vscode-radio-group>

      <div id="sso-div" :style="{ display: ssoVisibility }">
        <div style="display: flex; margin-top: 16px">
          <a @click="openPasscodeLink"> Open a new browser page to generate your SSO passcode </a>
          <span
            v-tooltip="{
              text:
                'Your SSO passcode is generated in a seperate browser page. Copy it and paste it back in SAP Business Application Studio.',
              theme: {
                placement: 'right',
                width: '300px',
              },
            }"
            class="tooltip"
          >
            <span className="codicon codicon-question sso-icon" />
          </span>
        </div>

        <br /><br /><br />

        <span class="subtitle-color-field">Enter your SSO Passcode </span><span class="text-danger">*</span>
        <br />

        <vscode-textfield
          ref="psc"
          :value="passcode"
          class="pt-8"
          size="47"
          placeholder="Enter your passcode"
          @keyup="btnStatus"
          @input="onPasscodeInput"
        >
          <span
            slot="content-after"
            v-tooltip="{
              text: 'Paste the generated passcode',
              theme: {
                placement: 'right',
                width: '155px',
              },
            }"
            class="tooltip"
          >
            <div class="clippy-button" @click="paste">
              <span class="codicon codicon-clippy"></span>
            </div>
          </span>
        </vscode-textfield>
      </div>
      <br />

      <div id="credentials-div" :style="{ display: credentialsVisibility }">
        <span class="subtitle-color-field">Enter your username </span><span class="text-danger">*</span>
        <br />
        <vscode-textfield
          v-model="username"
          class="pt-8"
          size="50"
          placeholder="User ID"
          @keyup="btnStatus"
          @input="(u) => (username = u.target.value)"
        />
        <br /><br />

        <span class="subtitle-color-field">Enter your password </span><span class="text-danger">*</span>
        <br />
        <vscode-textfield
          v-model="password"
          class="pt-8"
          type="password"
          size="50"
          @keyup="btnStatus"
          @input="(p) => (password = p.target.value)"
        />
      </div>
      <br />
      <span :style="{ display: authFailedVisibility }" style="color: var(--vscode-errorForeground, #b80000)">
        <div style="display: flex">
          <span className="codicon codicon-error signinerror-icon" /> Authentication failed. Please try again.
        </div>
        <br />
      </span>
      <br />
      <vscode-button :disabled="disableButton" @click="SigninClicked"> Sign in </vscode-button>
    </div>

    <br /><br />
  </div>
</template>
<script>
export default {
  name: "CFSignin",
  props: {
    target: {
      type: Object,
      required: true,
    },
    rpc: {
      type: Object,
      required: true,
    },
    orgAndSpaceSet: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["updateIsLoggedIn"],
  data() {
    return {
      disableButton: true,
      isLoggedIn: "",
      authFailed: "",
      ssoOrCredentials: "SSO",
      endpoint: this.target.defaultEndpoint ?? "", // Initially set the endpoint to the defaultEndpoint
      passcode: "",
      username: "",
      password: "",
      isCFEndpointValid: true,
    };
  },
  computed: {
    authFailedVisibility() {
      return !this.authFailed ? "none" : "";
    },
    loggedInVisibility() {
      return !this.isLoggedIn ? "none" : "";
    },
    notLoggedInVisibility() {
      return this.isLoggedIn ? "none" : "";
    },
    ssoVisibility() {
      /* c8 ignore next */
      return this.ssoOrCredentials === "SSO" ? "" : "none";
    },
    credentialsVisibility() {
      /* c8 ignore next */
      return this.ssoOrCredentials === "Credentials" ? "" : "none";
    },
  },
  watch: {
    isLoggedIn(newVal) {
      this.$emit("updateIsLoggedIn", newVal);
    },
  },
  updated() {
    this.isLoggedIn === "" ? (this.isLoggedIn = this.target.isLoggedIn) : "";
    this.endpoint === "" ? (this.endpoint = this.target.defaultEndpoint) : "";
  },
  methods: {
    btnStatus() {
      if (this.endpoint && this.isCFEndpointValid) {
        if (this.ssoOrCredentials == "Credentials" && this.username != "" && this.password != "") {
          this.disableButton = false;
        } else if (this.ssoOrCredentials == "SSO" && this.passcode != "") {
          this.disableButton = false;
        } else {
          this.disableButton = true;
        }
      } else {
        this.disableButton = true;
      }
    },
    setEndpoint(val) {
      this.endpoint = val.target.value.replace(/ /g, "").replace(/\/$/, "");
      this.isCFEndpointValid = this.endpoint !== "" && this.$refs?.cfendpointInput?.validity?.valid;
    },
    paste() {
      navigator.clipboard.readText().then((clipText) => {
        this.passcode = clipText;
        this.btnStatus();
      });
    },
    onPasscodeInput(val) {
      this.passcode = val.target.value;
      this.btnStatus();
    },
    setSSO(val) {
      this.ssoOrCredentials = val.target.value;
      this.btnStatus();
    },
    SigninClicked() {
      let payload = {};
      payload.endpoint = this.endpoint !== "" ? this.endpoint : this.target.defaultEndpoint;
      if (this.ssoOrCredentials === "SSO") {
        payload.ssoPasscode = `"${this.passcode}"`;
      } else {
        payload.user = this.username;
        payload.password = this.password;
      }

      this.rpc.invoke("loginClick", [payload]).then((res) => {
        if (res) {
          this.authFailed = "";
          this.isLoggedIn = true;
        } else {
          this.authFailed = true;
        }
      });
    },
    SignoutClicked() {
      let payload = {};
      this.rpc.invoke("logoutClick", [payload]).then((res) => {
        if (res) {
          this.isLoggedIn = false;
        }
      });
    },
    openPasscodeLink() {
      this.rpc.invoke("openPasscodeLink", [this.endpoint]).then(() => {
        console.log("opening passcode url");
      });
    },
  },
};
</script>

<style scoped>
a {
  color: var(--vscode-textLink-foreground, #3794ff); /* VS Code link color */
  text-decoration: none; /* Remove underline */
  cursor: pointer;
}
a:hover {
  text-decoration: underline; /* Show underline on hover */
  color: var(--vscode-textLink-activeForeground, #1e50a2); /* Active link color */
}
.signinerror-icon {
  padding-top: 1px;
  padding-right: 5px;
}
.signin-icon {
  padding-right: 5px;
  padding-top: 2px;
  color: var(--vscode-notebookStatusSuccessIcon-foreground, #388a34);
}
.sso-icon {
  padding-top: 3px;
  color: var(--vscode-textLink-foreground, #006ab1);
}
.sso-info-icon {
  padding-top: 2px;
  color: var(--vscode-textLink-foreground, #006ab1);
}
.clippy-button {
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  border-radius: 5px;
  color: currentcolor;
  cursor: pointer;
  padding: 2px;
  display: flex;
}
.clippy-button:hover {
  background-color: var(--vscode-toolbar-hoverBackground, rgba(184, 184, 184, 0.31));
}
.tooltip {
  display: flex;
  align-items: center;
  padding-left: 5px;
}
.mt-8 {
  margin-top: 8px;
}
.cloud-foundry-title {
  font-weight: bold;
  float: left;
  padding-right: 16px;
}
.logged-in-visibility {
  float: left;
}
.text-danger {
  color: red;
}
.subtitle-color-field {
  color: var(--vscode-descriptionForeground, #717171);
}
.tooltip .tooltip-inner {
  width: auto;
  background-color: black;
  color: white;
  font-size: 10px !important;
  padding: 8px 8px 8px 8px;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.22) 5px 5px 5px;
  opacity: 1 !important;
}
.pt-8 {
  margin-top: 8px;
}
.pt-8::part(control)::placeholder {
  font-style: italic;
}

#cfEndpointInput:invalid {
  border: 1px solid var(--vscode-inputValidation-errorBorder, red);
}
.error-container {
  margin-top: 4px;
}
.invalid-endpoint-error {
  color: var(--vscode-inputValidation-errorBorder, red);
  font-size: 13px;
  font-family: var(--vscode-font-family, Arial, Helvetica, sans-serif);
}
.invalid-input-field {
  border: 1px solid var(--vscode-inputValidation-errorBorder, red);
}
</style>
