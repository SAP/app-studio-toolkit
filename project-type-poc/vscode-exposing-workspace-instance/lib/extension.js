'use strict';
const { extensions, window } = require("vscode")

async function activate(context) {
	const basToolkitAPI = extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;
	const workspaceAPI = basToolkitAPI.workspaceAPI;

	const outputChannel = window.createOutputChannel(context.extension.id);
	const rootProjectApi = await workspaceAPI.getProjects();
	const rootProjectDs = await rootProjectApi[0].readItems();
	const rootProjectText = JSON.stringify(rootProjectDs, null, "\t");
	outputChannel.appendLine(rootProjectText)
}

module.exports = {
	activate
}
