// @ts-check

/* eslint-disable no-console */

import path from "node:path";
import url from "node:url";

// eslint-disable-next-line node/no-unpublished-import
import compression from "compression";

import { Backend, Router } from "../src/index.js";
import { Version } from "./services/version.js";

/**
 * @constant
 * @type {string}
 */
const DIRNAME = path.dirname(url.fileURLToPath(import.meta.url));


/**
 * @param {Backend} server
 * @returns {NodeJS.BeforeExitListener}
 */
function handleExitSignal (server) {
	return () => {
		console.log();
		console.log("Server stopping ...");
		server.stop()
			.then(() => {
				console.log("Server stopped");
				process.exitCode = 0;
			})
			.catch((error) => {
				console.log(`unable to stop server : ${error.message}`);
				// eslint-disable-next-line no-process-exit
				process.exit(1);
			});
	};
}

/**
 * @type {string}
 */
const homePage = `
<html>
	<header><title>express openapi backend</title></header>
	<body>
		<a href="v1">version 1</a>
		<br />
		<a href="v2">version 2</a>
	</body>
</html>
`;

/**
 * @returns {Router}
 */
function getBeforeRouter () {
	// eslint-disable-next-line new-cap
	const beforeRouter = Router();
	beforeRouter.use(compression());
	beforeRouter.use((request, response, next) => {
		response.set({
			"x-beforeRouter-header": "test beforeRouter",
		});
		next();
	});
	return beforeRouter;
}

/**
 * @returns {Promise<void>}
 */
// eslint-disable-next-line max-lines-per-function
async function run () {

	console.log();
	console.log("Server starting ...");

	/**
	 * @type {import("../src/backend.js").Configuration}
	 */
	const configuration = {
		host: "localhost",
		port: 8080,
		swaggerUiOption: {
			swaggerOptions: {
				defaultModelRendering: "model",
				displayRequestDuration: true,
				docExpansion: "none",
				filter: true,
				showCommonExtensions: true,
				tryItOutEnabled: true,
			},
			customCss: ".swagger-ui .topbar { display: none }",
		},
	};
	const backend = new Backend(configuration);
	backend.app.get("/", (request, response) => {
		response.status(200).send(homePage);
	});

	await backend.initializeSite({
		apiSpecFile: path.join(DIRNAME, "sites", "v1", "openapi.yml"),
		modulesPaths: [
			path.join(DIRNAME, "sites", "common", "modules"),
			path.join(DIRNAME, "sites", "v1", "modules"),
		],
		context: { version: new Version(1) },
		beforeRouter: getBeforeRouter(),
	});
	await backend.initializeSite({
		apiSpecFile: path.join(DIRNAME, "sites", "v2", "openapi.yml"),
		modulesPaths: [
			path.join(DIRNAME, "sites", "common", "modules"),
			path.join(DIRNAME, "sites", "v2", "modules"),
		],
		context: { version: new Version(2) },
	});
	await backend.start();
	process.on("SIGINT", handleExitSignal(backend));
	process.on("SIGTERM", handleExitSignal(backend));

	console.log(`Server started to http${configuration.ssl?.enable ? "s" : ""}://${configuration.host}:${configuration.port}`);
}

run().catch((error) => console.log(`unable to start server : ${error.stack}`));
