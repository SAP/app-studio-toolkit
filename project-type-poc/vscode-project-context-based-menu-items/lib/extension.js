'use strict';

const { registerCommands } = require('./commands');

async function activate(context) {
	registerCommands(context.subscriptions);
}

module.exports = {
	activate
}
