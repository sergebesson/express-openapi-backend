// @ts-check

/* eslint-disable require-await */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
"use strict";
const _ = require("lodash");

class UpdateRootRouterInterface {

	/**
	 * @abstract
	 * @param {object} params
	 * @param {object} params.router
	 * @param {string} params.apiPath
	 * @returns {Promise<void>}
	 */
	async updateRootRouter ({ router, apiPath }) {
		throw new Error("You have to implement the method 'updateRootRouter'");
	}
}

class RouterFactoryInterface {

	/**
	 * @abstract
	 * @returns {Promise<void>}
	 */
	async routerFactory () {
		throw new Error("You have to implement the method 'updateRootRouter'");
	}
}

module.exports = {
	UpdateRootRouterInterface,
	RouterFactoryInterface,
};
