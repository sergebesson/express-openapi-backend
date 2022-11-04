// @ts-check

/* eslint-disable class-methods-use-this, no-unused-vars, max-classes-per-file */
"use strict";

const { UpdateRootRouterInterface, RouterFactoryInterface } = require("./module-interfaces");

class RootModuleType extends UpdateRootRouterInterface {
	static get TYPE () {
		return "root";
	}
}

class PublicModuleType extends RouterFactoryInterface {
	static get TYPE () {
		return "public";
	}
}

class AuthentificationModuleType extends UpdateRootRouterInterface {
	static get TYPE () {
		return "authentification";
	}
}

class PrivateModuleType extends RouterFactoryInterface {
	static get TYPE () {
		return "private";
	}
}

class ErrorModuleType extends UpdateRootRouterInterface {
	static get TYPE () {
		return "error";
	}
}

module.exports = {
	RootModuleType,
	PublicModuleType,
	AuthentificationModuleType,
	PrivateModuleType,
	ErrorModuleType,
};
