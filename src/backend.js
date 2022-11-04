// @ts-check

"use strict";

const http = require("http");
const https = require("https");
const { setTimeout } = require("timers/promises");

const _ = require("lodash");
const express = require("express");
const fs = require("fs");

const { ModulesManager } = require("./modules-manager");
const { Openapi } = require("./openapi");


/**
 * @typedef {object} Configuration
 * @property {string}  host - host for listen server
 * @property {number}  port - port for listen server
 * @property {object}  [ssl] - Configuration ssl
 * @property {boolean}   ssl.enable - if set to true use of https (default false)
 * @property {string}    ssl.keyFile - key file for https
 * @property {string}    ssl.certFile - certificat file for https
 * @property {object}  [swaggerUiOption] - see https://www.npmjs.com/package/swagger-ui-express
 * @property {boolean} [validateResponses=true] - boolean default true,
 *                                         allows to control the responses by openapi validator
 */

class Backend {

	/** @type {Configuration} */
	#configuration;

	/** @type {express.Express} */
	#app = express();

	/** @type {http.Server | https.Server | null} */
	#server = null;

	/**
	 * @param {Configuration} configuration :
	 */
	constructor (configuration) {
		this.#configuration = configuration;
	}

	/**
	 * @returns {express.Express}
	 */
	get app () {
		return this.#app;
	}

	/**
	 * @param {object}              params
	 * @param {string}              params.apiSpecFile
	 * @param {string|string[]}     params.modulesPaths
	 * @param {object}              params.context
	 * @param {express.Router|null} params.beforeRouter
	 * @param {express.Router|null} params.afterRouter
	 * @returns {Promise<void>}
	 */
	async initializeSite ({
		apiSpecFile, modulesPaths, context, beforeRouter = null, afterRouter = null,
	}) {

		const modulesManager = new ModulesManager({ modulesPaths });
		await modulesManager.instantiate({ context });

		const openApi = new Openapi({
			apiSpecFile,
			apiSpecModulePaths: modulesManager.modules.map(({ modulePath }) => modulePath),
			swaggerUiOption: this.#configuration.swaggerUiOption,
			validateResponses: this.#configuration.validateResponses || true,
		});

		if (_.isFunction(beforeRouter) && beforeRouter.name === "router") {
			this.#app.use(openApi.sitePath, beforeRouter);
		}
		this.#app.use(
			openApi.sitePath, await Backend.#apiRouterFactory({ openApi, modulesManager }),
		);
		if (_.isFunction(afterRouter) && afterRouter.name === "router") {
			this.#app.use(openApi.sitePath, afterRouter);
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	async start () {
		this.#server = this.#configuration.ssl?.enable
			? https.createServer(
				{
					key: fs.readFileSync(this.#configuration.ssl.keyFile),
					cert: fs.readFileSync(this.#configuration.ssl.certFile),
				},
				this.#app,
			)
			: http.createServer(this.#app);

		return await new Promise((resolve, reject) => {
			this.#server?.on("error", (error) => reject(error));
			this.#server?.on("listening", () => resolve());
			this.#server?.listen({
				port: this.#configuration.port,
				host: this.#configuration.host,
			});
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async stop (timeout = 0) {
		if (!this.#server) {
			throw new Error("Server not running");
		}

		/**
		 * @type {Promise<void>}
		 */
		const stopServerPromise = new Promise((resolve, reject) => {
			this.#server?.on("error", (error) => reject(error));
			this.#server?.on("close", () => {
				this.#server = null;
				resolve();
			});
			this.#server?.close();
		});

		if (timeout > 0) {
			const result = await Promise.race([
				stopServerPromise,
				setTimeout(timeout * 1000, "timeout", { ref: false }),
			]);
			if (result === "timeout") {
				throw new Error("timeout");
			}
		} else {
			await stopServerPromise;
		}
	}

	/**
	 * @param {object}         params
	 * @param {Openapi}        params.openApi
	 * @param {ModulesManager} params.modulesManager
	 * @returns {Promise<express.Router>}
	 */
	static async #apiRouterFactory ({ openApi, modulesManager }) {
		// eslint-disable-next-line new-cap
		const router = express.Router();
		router.use(express.json());

		// root modules
		await modulesManager.initializeRouterByType({ router, type: "root" });

		await openApi.install({ router });

		// public modules
		await modulesManager.initializeRouterByType({ router, type: "public" });

		// authentification modules
		await modulesManager.initializeRouterByType({ router, type: "authentification" });

		// private module
		await modulesManager.initializeRouterByType({ router, type: "private" });

		router.use(Openapi.middlewareError());

		// error module
		await modulesManager.initializeRouterByType({ router, type: "error" });

		return router;
	}
}

module.exports = { Backend };
