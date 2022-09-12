"use strict";

class Version {
	#version = 0;
	constructor (version) {
		this.#version = version;
	}

	toString () {
		return `version ${this.#version}`;
	}
}

module.exports = { Version };
