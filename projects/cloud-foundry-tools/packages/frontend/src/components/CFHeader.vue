<template>
  <div>
    <h1 wrapping-type="Normal">Cloud Foundry Sign In and Targets</h1>
    <span class="subtitle-field">
      Provide your credentials to sign in to the Cloud Foundry environment and then select the target org and
      space.</span
    >
    <br />
    <br />
    <vscode-divider role="separator" />
    <br />
  </div>
</template>
<script>
export default {
  name: "CFHeader",
  props: [],
};
</script>

<style scoped>
.subtitle-field {
  color: var(--vscode-descriptionForeground, #717171);
  margin-bottom: 16px;
}
</style>
