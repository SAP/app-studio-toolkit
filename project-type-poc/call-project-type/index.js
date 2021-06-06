const { resolve } = require("path");
const ProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/ProjectImpl")

async function main() {
    // const sampleProjectPath = resolve(__dirname, "../../../lcap/sample-workspace/openui5-sample-app");
    const sampleProjectPath = resolve(__dirname, "../../../lcap/sample-workspace/risk-management-example");
    const projectApi = new ProjectImpl.default(sampleProjectPath, true);
    try {
        const items = await projectApi.readItems(undefined);
        const project = await projectApi.read(undefined);
        const x = 5;
    }
    catch (e) {
        console.error(e);
        process.exitCode = 666
    }
}

main();


