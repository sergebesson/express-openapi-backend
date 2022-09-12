"use strict";

const express = require("express");

const { PrivateModuleType } = require("../../../../..");

class PrivateInfo extends PrivateModuleType {

	#myPrivateInfo = "private information";

	routerFactory () {
		// eslint-disable-next-line new-cap
		const router = express.Router();

		router.get("/", (request, response) => {
			response.status(200).json({ info: this.#myPrivateInfo, user: response.locals.user });
		});
		return router;
	}

}

module.exports = { PrivateInfo };
