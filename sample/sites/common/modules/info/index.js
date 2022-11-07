// @ts-check

import { PublicModuleType, Router } from "../../../../../src/index.js";

export class Info extends PublicModuleType {

	#myInfo = "public information ";

	/**
	 * @param {object} params
	 * @param {object} params.context
	 * @param {string} params.context.version
	 */
	initialize ({ context: { version } }) {
		this.#myInfo += version;
	}

	/**
	 * @returns {Router}
	 */
	// eslint-disable-next-line class-methods-use-this
	routerFactory () {
		// eslint-disable-next-line new-cap
		const router = Router();

		router.get("/", (request, response) => {
			response.status(200).json({ info: this.#myInfo });
		});

		return router;
	}
}
