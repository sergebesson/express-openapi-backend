// @ts-check

export class Version {
	#version = 0;

	/**
	 * @param {number} version
	 */
	constructor (version) {
		this.#version = version;
	}

	/**
	 * @returns {string}
	 */
	toString () {
		return `version ${this.#version}`;
	}
}
