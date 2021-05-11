const {  } = require("fs");
const { resolve } = require("path");
const ProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/ProjectImpl")

async function main() {
    // const sampleProjectPath = resolve(__dirname, "../../../lcap/sample-workspace/openui5-sample-app");
    const sampleProjectPath = resolve(__dirname, "../../../lcap/sample-workspace/risk-management-example");
    const projectApi = new ProjectImpl.default(sampleProjectPath, true);
    const api = await projectApi.read(undefined);
    const x = 5;
}

main()
