"use strict";

const { AuthentificationModuleType } = require("../../../../..");

const jwt = require("jsonwebtoken");

class Token extends AuthentificationModuleType {

	static #secretKey = "à renseigner";
	static #getToken (user) {
		return jwt.sign({ user }, Token.#secretKey, { expiresIn: 60 * 60 });
	}

	// eslint-disable-next-line class-methods-use-this
	updateRootRouter ({ router, apiPath }) {

		// Token creation route
		router.post(`/${apiPath}`, (request, response) => this.#createMiddleware(request, response));

		// Check token
		router.use((request, response, next) => {
			const [ , token ] = request.headers.authorization?.split(" ") || [];
			try {
				response.locals.user = jwt.verify(token, Token.#secretKey).user;
			} catch {
				response.status(401).json({ status: 401, error_description: "Unauthorized" });
				return;
			}

			next();
		});
	}

	#createMiddleware (request, response) {
		const user = request.body.user || request.query.body;
		const password = request.body.password || request.query.password;
		if (!this.#validateUser({ user, password })) {
			response.status(403).json({
				status: 403,
				error_description: "Forbidden",
				errors: [ {
					errorCode: "badAuthentification",
					message: "the user or password is not valid",
				} ],
			});
			return;
		}
		response.status(200).json({ token: Token.#getToken(user) });
	}

	// eslint-disable-next-line class-methods-use-this
	#validateUser ({ user, password }) {
		// here put the validation code of the user identification

		// fake if user or password equal "bad", the user is not validate
		return user !== "bad" && password !== "bad";
	}
}

module.exports = { Token };
