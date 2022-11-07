// @ts-check

import { PrivateModuleType, Router } from "../../../../../src/index.js";

export class PrivateInfo extends PrivateModuleType {

	#myPrivateInfo = "private information";

	/**
	 * @returns {Router}
	 */
	routerFactory () {
		// eslint-disable-next-line new-cap
		const router = Router();

		router.get("/", (request, response) => {
			response.status(200).json({ info: this.#myPrivateInfo, user: response.locals.user });
		});
		return router;
	}

}
