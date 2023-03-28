// @ts-check

/* eslint-disable require-await */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { Router } from "express";
import _ from "lodash";

export class UpdateRootRouterInterface {

	/** @type {string} */
	apiPath;

	/**
	 * @abstract
	 * @param {object} params
	 * @param {object} params.router
	 * @param {string} [params.apiPath]
	 * @returns {Promise<void>|void}
	 */
	updateRootRouter ({ router, apiPath }) {
		throw new Error("You have to implement the method 'updateRootRouter'");
	}
}

export class RouterFactoryInterface {

	/** @type {string} */
	apiPath;

	/**
	 * @abstract
	 * @returns {Promise<Router>|Router}
	 */
	routerFactory () {
		throw new Error("You have to implement the method 'updateRootRouter'");
	}
}
