"use strict";

const { RootModuleType } = require("../../../../..");

class Header extends RootModuleType {
	// eslint-disable-next-line class-methods-use-this
	updateRootRouter ({ router }) {
		router.use((request, response, next) => {
			response.set({
				"Access-Control-Allow-Origin": "*",
				"x-my-header": "example api",
			});
			next();
		});
	}
}

module.exports = { Header };
