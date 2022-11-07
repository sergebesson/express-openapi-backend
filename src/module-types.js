// @ts-check

/* eslint-disable class-methods-use-this, no-unused-vars, max-classes-per-file */

import { RouterFactoryInterface, UpdateRootRouterInterface } from "./module-interfaces.js";

export class RootModuleType extends UpdateRootRouterInterface {
	static get TYPE () {
		return "root";
	}
}

export class PublicModuleType extends RouterFactoryInterface {
	static get TYPE () {
		return "public";
	}
}

export class AuthentificationModuleType extends UpdateRootRouterInterface {
	static get TYPE () {
		return "authentification";
	}
}

export class PrivateModuleType extends RouterFactoryInterface {
	static get TYPE () {
		return "private";
	}
}

export class ErrorModuleType extends UpdateRootRouterInterface {
	static get TYPE () {
		return "error";
	}
}
