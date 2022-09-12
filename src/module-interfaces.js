/* eslint-disable max-classes-per-file */
"use strict";
const _ = require("lodash");

class UpdateRootRouterInterface {
	constructor () {
		if (!_.isFunction(this.updateRootRouter)) {
			throw new Error("You have to implement the method 'updateRootRouter'");
		}
	}
}

class RouterFactoryInterface {
	constructor () {
		if (!_.isFunction(this.routerFactory)) {
			throw new Error("You have to implement the method 'updateRootRouter'");
		}
	}
}

module.exports = {
	UpdateRootRouterInterface,
	RouterFactoryInterface,
};
