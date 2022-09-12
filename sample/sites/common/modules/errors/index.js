/* eslint-disable no-console */
"use strict";

const { ErrorModuleType } = require("../../../../..");

class Errors extends ErrorModuleType {
	// eslint-disable-next-line class-methods-use-this
	updateRootRouter ({ router }) {

		router.use((request, response) => response.status(404).json({
			status: 404, error_description: "Not Found",
		}));

		// eslint-disable-next-line no-unused-vars
		router.use((error, request, response, next) => {
			// Route d'erreur de json parser
			if (error.type === "entity.parse.failed") {
				return response.status(400).json({ status: 400,
					error_description: "Bad Request",
					errors: [ { errorCode: "type.body_parse.bad_json", message: "body is not json" } ] });
			}

			if (error.isOpenapiError) {
				const responseJson = {
					status: error.status,
					error_description: error.name,
				};
				// eslint-disable-next-line default-case
				switch (error.name) {
				case "Bad Request":
					responseJson.errors = error.errors;
					break;
				case "Internal Server Error":
					console.error(`openapi validator path ${error.path}`);
					console.error("openapi validator errors", error.errors);
					console.error(error.stack);
					break;
				}
				return response.status(error.status).json(responseJson);
			}

			console.error("Internal Server Error", error.stack);
			return response.status(500).json({
				status: 500, error_description: "Internal Server Error",
			});
		});

	}
}
module.exports = { Errors };
