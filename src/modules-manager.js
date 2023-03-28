// @ts-check

import path from "node:path";

import _ from "lodash";
import { camelCase, camelCaseTransformMerge } from "camel-case";
import { pascalCase, pascalCaseTransformMerge } from "pascal-case";
import { paramCase } from "param-case";
import fastGlob from "fast-glob";

import { RouterFactoryInterface, UpdateRootRouterInterface } from "./module-interfaces.js";

export class ModulesManager {

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
								{ router },
							);
						}
						if (module.instance instanceof RouterFactoryInterface) {
							return router.use(
								`/${module.instance.apiPath}`, await module.instance.routerFactory(),
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
		 * @type {Object.<string, UpdateRootRouterInterface|RouterFactoryInterface>}
		 */
		const requireModules = await ModulesManager.#importModules(modulesPath);

		/**
		 * @param {UpdateRootRouterInterface|RouterFactoryInterface} module
		 * @param {string} moduleName
		 */
		_.forEach(requireModules, (module, moduleName) => {
			const instanceName = camelCase(moduleName, { transform: camelCaseTransformMerge });
			const className = pascalCase(moduleName, { transform: pascalCaseTransformMerge });

			/**
			 * @type {UpdateRootRouterInterface|RouterFactoryInterface}
			 */
			const instance = new module[className]({ context });
			instance.apiPath = paramCase(instanceName);

			/**
			 * @type {string}
			 */
			const type = module[className].TYPE;
			if (!this.#TYPES.includes(type)) {
				throw new Error(`module '${instance.constructor.name}' has incorrect type '${type}'`);
			}

			this.#modules.push({
				type,
				instanceName,
				instance,
				modulePath: path.join(modulesPath, moduleName),
			});
		});
	}

	/**
	 * @param {string} cwd
	 * @returns {Promise<Object.<string, UpdateRootRouterInterface|RouterFactoryInterface>>}
	 */
	static async #importModules (cwd) {
		const filesIndex = await fastGlob("*/index.js", { cwd });

		/**
		 * @type {[string, UpdateRootRouterInterface|RouterFactoryInterface][]}
		 */
		const imports = await Promise.all(filesIndex.map(async (fileIndex) => {
			const moduleName = path.dirname(fileIndex);
			return [ moduleName, await import(path.join(cwd, fileIndex)) ];
		}));
		return _.fromPairs(imports);
	}
}
