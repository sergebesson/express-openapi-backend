// @ts-check

// eslint-disable-next-line no-unused-vars
import express from "express";
// eslint-disable-next-line node/no-unpublished-import
import jwt from "jsonwebtoken";

// eslint-disable-next-line no-unused-vars
import { AuthentificationModuleType, Router } from "../../../../../src/index.js";

export class Token extends AuthentificationModuleType {

	static #secretKey = "à renseigner";
	static #getToken (user) {
		return jwt.sign({ user }, Token.#secretKey, { expiresIn: 60 * 60 });
	}

	/**
	 * @param {object} params
	 * @param {Router} params.router
	 */
	// eslint-disable-next-line class-methods-use-this
	updateRootRouter ({ router }) {

		// Token creation route
		router.post(`/${this.apiPath}`, (request, response) => this.#createMiddleware(request, response));

		// Check token
		router.use((request, response, next) => {
			const [ , token ] = request.headers.authorization?.split(" ") || [];
			try {
				const decoded = jwt.verify(token, Token.#secretKey);
				if (typeof decoded === "string") {
					throw new Error(`Error decoded token - ${decoded}`);
				}
				response.locals.user = decoded.user;
			} catch (error) {
				response.status(401).json({ status: 401, error_description: "Unauthorized" });
				return;
			}

			next();
		});
	}

	/**
	 *
	 * @param {express.Request} request
	 * @param {express.Response} response
	 */
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

	/**
	 *
	 * @param {object} params
	 * @param {string} params.user
	 * @param {string} params.password
	 * @returns {boolean}
	 */
	// eslint-disable-next-line class-methods-use-this
	#validateUser ({ user, password }) {
		// here put the validation code of the user identification

		// fake if user or password equal "bad", the user is not validate
		return user !== "bad" && password !== "bad";
	}
}
