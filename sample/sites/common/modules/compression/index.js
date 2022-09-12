"use strict";

const { RootModuleType } = require("../../../../..");
const compression = require("compression");

class Compression extends RootModuleType {
	// eslint-disable-next-line class-methods-use-this
	updateRootRouter ({ router }) {
		router.use(compression());
	}
}

module.exports = { Compression };
