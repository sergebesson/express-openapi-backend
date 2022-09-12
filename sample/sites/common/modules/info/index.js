"use strict";

const express = require("express");

const { PublicModuleType } = require("../../../../..");

class Info extends PublicModuleType {

	#myInfo = "public information ";

	initialize ({ context: { version } }) {
		this.#myInfo += version;
	}

	// eslint-disable-next-line class-methods-use-this
	routerFactory () {
		// eslint-disable-next-line new-cap
		const router = express.Router();

		router.get("/", (request, response) => {
			response.status(200).json({ info: this.#myInfo });
		});

		return router;
	}
}

module.exports = { Info };
