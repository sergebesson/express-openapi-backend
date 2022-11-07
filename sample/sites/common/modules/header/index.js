// @ts-check

// eslint-disable-next-line no-unused-vars
import { RootModuleType, Router } from "../../../../../src/index.js";

export class Header extends RootModuleType {

	/**
	 * @param {object} params
	 * @param {Router} params.router
	 */
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
