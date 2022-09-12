"use strict";

const http = require("http");
const https = require("https");
const { setTimeout } = require("timers/promises");

const express = require("express");
const fs = require("fs");

const { ModulesManager } = require("./modules-manager");
const { Openapi } = require("./openapi");

class Backend {

	#configuration = null;
	#app = express();
	#server = null;

	/**
	 * @param {object} configuration :
	 * {
	 *   host, // host for listen server
	 *   port, // port for listen server
	 *   ssl: {
	 *     enable, // if set to true use of https (default false)
	 *     keyFile, // key file for https
	 *     certFile, // certificat file for https
	 *   },
	 *   swaggerUiOption, // see https://www.npmjs.com/package/swagger-ui-express
	 *   validateResponses, boolean default true,
	 *                      allows to control the responses by openapi validator
	 * }
	 */
	constructor (configuration) {
		this.#configuration = configuration;
	}

	get app () {
		return this.#app;
	}

	async initializeSite ({ apiSpecFile, modulesPaths, context }) {

		const modulesManager = new ModulesManager({ modulesPaths });
		await modulesManager.instantiate({ context });

		const openApi = new Openapi({
			apiSpecFile,
			apiSpecModulePaths: modulesManager.modules.map(({ modulePath }) => modulePath),
			swaggerUiOption: this.#configuration.swaggerUiOption,
			validateResponses: this.#configuration.validateResponses || true,
		});
		this.#app.use(
			openApi.sitePath, await Backend.#apiRouterFactory({ openApi, modulesManager }),
		);
	}

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
			this.#server.on("error", (error) => reject(error));
			this.#server.on("listening", () => resolve());
			this.#server.listen({
				port: this.#configuration.port,
				host: this.#configuration.host,
			});
		});
	}

	async stop (timeout = 0) {
		if (!this.#server) {
			throw new Error("Server not running");
		}

		const stopServerPromise = new Promise((resolve, reject) => {
			this.#server.on("error", (error) => reject(error));
			this.#server.on("close", () => {
				this.#server = null;
				resolve();
			});
			this.#server.close();
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
