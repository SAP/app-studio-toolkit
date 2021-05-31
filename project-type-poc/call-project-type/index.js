const { resolve } = require("path");
const ProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/ProjectImpl")

async function main() {
    // const sampleProjectPath = resolve(__dirname, "../../../lcap/sample-workspace/openui5-sample-app");
    const sampleProjectPath = resolve(__dirname, "../../../lcap/sample-workspace/risk-management-example");
    const projectApi = new ProjectImpl.default(sampleProjectPath, true);
    try {
        const api = await projectApi.read(undefined);
        const x = 5;
    }
    catch (e) {
        console.error(e);
        process.exitCode = 666
    }
}

// main();

const { spawn } = require("child_process")
async function spawnCDS() {
    return new Promise((resolve, reject) => {
        const childProcess = spawn("cds", ["-v"]);
        let out = '';
        childProcess.stdout.on('data', data => {
            out += data;
        });
        childProcess.on('exit', () => resolve(out));
        childProcess.on('error', err => reject(err));
    });
}

async function main2() {
    try {
        const output = await spawnCDS();
        console.log(output);
    }
    catch (e) {
        console.log(e.message);
    }
}

main2();


