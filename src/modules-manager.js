// @ts-check

"use strict";

const path = require("path");
const _ = require("lodash");
const requireGlob = require("require-glob");
const { pascalCase, pascalCaseTransformMerge } = require("pascal-case");
const { camelCase, camelCaseTransformMerge } = require("camel-case");
const { paramCase } = require("param-case");

const { UpdateRootRouterInterface, RouterFactoryInterface } = require("./module-interfaces");

class ModulesManager {

	/**
	 * @readonly
	 * @type {string[]}
	 */
	#TYPES = [ "root", "public", "authentification", "private", "error" ];

	/**
	 * @type {string[]}
	 */
	#modulesPaths;

	/**
	 * @typedef {object} Module
	 * @property {string} type
	 * @property {string} instanceName
	 * @property {object} instance
	 * @property {string} apiPath
	 * @property {string} modulePath
	 */

	/**
	 * @type Module[]
	 */
	#modules = [];

	/**
	 * @param {object} params
	 * @param {string|string[]} params.modulesPaths
	 */
	constructor ({ modulesPaths }) {
		this.#modulesPaths = _.castArray(modulesPaths);
	}

	/**
	 * @param {object} params
	 * @param {string} params.context
	 * @returns {Promise<void>}
	 */
	async instantiate ({ context }) {
		await Promise.all(
			this.#modulesPaths.map(
				async (modulesPath) => await this.#instantiateModulesFromPath({
					modulesPath, context,
				}),
			),
		);

		const modules = {};
		this.#modules.forEach(({ instanceName, instance }) => {
			modules[instanceName] = instance;
		});

		await Promise.all(
			this.#modules.map(async ({ instance }) => {
				if (_.isFunction(instance.initialize)) {
					await instance.initialize({ context, modules });
				}
			}),
		);
	}

	/**
	 * @returns {Module[]}
	 */
	get modules () {
		return this.#modules;
	}

	/**
	 * @param {object}   params
	 * @param {object}   params.router
	 * @param {function} params.router.use
	 * @param {string}   params.type
	 * @returns {Promise<void>}
	 */
	async initializeRouterByType ({ router, type }) {
		await Promise.all(
			this.#modules
				.filter((module) => module.type === type)
				.map(
					async (module) => {
						if (module.instance instanceof UpdateRootRouterInterface) {
							return await module.instance.updateRootRouter(
								{ router, apiPath: module.apiPath },
							);
						}
						if (module.instance instanceof RouterFactoryInterface) {
							return router.use(
								`/${module.apiPath}`, await module.instance.routerFactory(),
							);
						}
						throw new Error(`module ${module.instance.constructor.name} is not a valid module`);
					},
				),
		);
	}

	/**
	 * @param {object} params
	 * @param {string} params.modulesPath
	 * @param {object} params.context
	 * @returns {Promise<void>}
	 */
	async #instantiateModulesFromPath ({ modulesPath, context }) {

		/**
		 * @type {object}
		 */
		const requireModules = await requireGlob("*/index.js", {
			cwd: modulesPath,
			keygen: (option, fileObj) => {
				const parsedPath = path.parse(fileObj.path.replace(fileObj.base, ""));
				return parsedPath.dir.split("/")
					.filter((value) => value !== "");
			},
		});

		/**
		 * @param {object} module
		 * @param {string} moduleName
		 */
		_.forEach(requireModules, (module, moduleName) => {
			const instanceName = camelCase(moduleName, { transform: camelCaseTransformMerge });
			const className = pascalCase(moduleName, { transform: pascalCaseTransformMerge });

			const instance = new module[className]({ context });

			const type = module[className].TYPE;
			if (!this.#TYPES.includes(type)) {
				throw new Error(`module '${instance.constructor.name}' has incorrect type '${type}'`);
			}

			this.#modules.push({
				type,
				instanceName,
				instance,
				apiPath: paramCase(instanceName),
				modulePath: path.join(modulesPath, moduleName),
			});
		});

	}
}

module.exports = { ModulesManager };
