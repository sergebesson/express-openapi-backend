// @ts-check

"use strict";

const _ = require("lodash");
const path = require("path");
const requireYml = require("require-yml");
const traverse = require("traverse");
const swaggerParser = require("swagger-parser");
const swaggerUiExpress = require("swagger-ui-express");
const expressOpenapiValidator = require("express-openapi-validator");

class Openapi {

	/**
	 * @type {object}
	 */
	#apiSpec;

	/**
	 * @type {string}
	 */
	#apiSpecDir;


	/**
	 * @type {string[]}
	 */
	#apiSpecModulePaths;

	/**
	 * @type {swaggerUiExpress.SwaggerUiOptions}
	 */
	#swaggerUiOption;

	/**
	 * @type {boolean}
	 */
	#validateResponses;

	static middlewareError () {
		return (error, request, response, next) => {
			error.isOpenapiError = error instanceof expressOpenapiValidator.error.BadRequest ||
				error instanceof expressOpenapiValidator.error.Forbidden ||
				error instanceof expressOpenapiValidator.error.MethodNotAllowed ||
				error instanceof expressOpenapiValidator.error.NotAcceptable ||
				error instanceof expressOpenapiValidator.error.NotFound ||
				error instanceof expressOpenapiValidator.error.RequestEntityTooLarge ||
				error instanceof expressOpenapiValidator.error.Unauthorized ||
				error instanceof expressOpenapiValidator.error.UnsupportedMediaType ||
				error instanceof expressOpenapiValidator.error.InternalServerError;

			next(error);
		};
	}

	/**
	 * @param {object}                            params
	 * @param {string}                            params.apiSpecFile
	 * @param {string[]}                          params.apiSpecModulePaths
	 * @param {boolean}                           params.validateResponses
	 * @param {swaggerUiExpress.SwaggerUiOptions} params.swaggerUiOption
	 */
	constructor ({ apiSpecFile, apiSpecModulePaths, validateResponses, swaggerUiOption }) {
		this.#apiSpec = requireYml({ targets: apiSpecFile });
		this.#apiSpecDir = path.dirname(apiSpecFile);
		this.#apiSpecModulePaths = apiSpecModulePaths;
		this.#swaggerUiOption = swaggerUiOption || {};
		this.#validateResponses = validateResponses || true;
	}

	/**
	 * @returns {string}
	 */
	get sitePath () {
		return new URL(this.#apiSpec.servers[0]?.url, "http://host").pathname;
	}

	/**
	 * @param {object}   params
	 * @param {object}   params.router
	 * @param {function} params.router.use
	 * @param {function} params.router.get
	 * @returns {Promise<void>}
	 */
	async install ({ router }) {

		const apiSpec = await this.#getApiSpec();

		router.use("/", swaggerUiExpress.serveFiles(apiSpec, this.#swaggerUiOption));
		// eslint-disable-next-line no-undefined
		router.get("/", swaggerUiExpress.setup(undefined, this.#swaggerUiOption));

		router.use(expressOpenapiValidator.middleware({
			apiSpec,
			validateRequests: true,
			validateResponses: this.#validateResponses,
		}));
	}

	/**
	 * @returns {Promise<object>}
	 */
	async #getApiSpec () {
		const apiSpecDir = this.#apiSpecDir;
		traverse(this.#apiSpec).forEach(function updateRef (value) {
			/* eslint-disable no-invalid-this */
			if (this.key === "$ref" && !value.startsWith("#")) {
				this.update(path.join(apiSpecDir, value));
			}
			/* eslint-enable no-invalid-this */
		});


		this.#apiSpecModulePaths.forEach((modulePath) => {
			this.#updateApiSpecFromModulePath({ modulePath });
		});

		this.#sortPaths();

		const apiSpec = await swaggerParser.validate(this.#apiSpec);
		return apiSpec;
	}

	/**
	 * @param {object} params
	 * @param {string} params.modulePath
	 */
	#updateApiSpecFromModulePath ({ modulePath }) {
		try {
			const openapiPath = path.join(modulePath, "openapi");
			const openapiSpec = requireYml(path.join(openapiPath, "openapi.yml"));
			traverse(openapiSpec).forEach(function updateRef (value) {
				/* eslint-disable no-invalid-this */
				if (this.key === "$ref" && !value.startsWith("#")) {
					this.update(path.join(openapiPath, value));
				}
				/* eslint-enable no-invalid-this */
			});
			const moduleName = path.basename(modulePath);
			this.#apiSpec.tags = [ ...this.#apiSpec.tags, ...openapiSpec.tags ];
			this.#apiSpec.paths = {
				...this.#apiSpec.paths,
				..._.mapKeys(
					openapiSpec.paths,
					(value, urlPath) => _.trimEnd(`/${moduleName}${urlPath}`, "/"),
				),
			};
		} catch (error) {

			/*
			 * If the yml file does not exist, we go to the next one
			 * ENOENT : no such file or directory
			 */
			if (error.code !== "ENOENT") {
				throw error;
			}
		}
	}

	#sortPaths () {
		this.#apiSpec.paths = _.chain(this.#apiSpec.paths)
			.keys()
			.sort()
			.reduce((result, urlPath) => {
				result[urlPath] = this.#apiSpec.paths[urlPath];
				return result;
			}, {})
			.value();
	}
}

module.exports = { Openapi };
