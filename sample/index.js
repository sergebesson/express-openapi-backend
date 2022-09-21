/* eslint-disable no-console */
"use strict";

const path = require("path");
const compression = require("compression");

const { Backend, Router } = require("../src");
const { Version } = require("./services/version");

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
				process.exit(1);
			});
	};
}

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

async function run () {

	console.log();
	console.log("Server starting ...");
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
		apiSpecFile: path.join(__dirname, "sites", "v1", "openapi.yml"),
		modulesPaths: [
			path.join(__dirname, "sites", "common", "modules"),
			path.join(__dirname, "sites", "v1", "modules"),
		],
		context: { version: new Version(1) },
		beforeRouter: getBeforeRouter(),
	});
	await backend.initializeSite({
		apiSpecFile: path.join(__dirname, "sites", "v2", "openapi.yml"),
		modulesPaths: [
			path.join(__dirname, "sites", "common", "modules"),
			path.join(__dirname, "sites", "v2", "modules"),
		],
		context: { version: new Version(2) },
	});
	await backend.start();
	process.on("SIGINT", handleExitSignal(backend));
	process.on("SIGTERM", handleExitSignal(backend));

	console.log(`Server started to http${configuration.ssl?.enable ? "s" : ""}://${configuration.host}:${configuration.port}`);
}

run().catch((error) => console.log(`unable to start server : ${error.stack}`));
