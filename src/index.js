// @ts-check

"use strict";

const { Router } = require("express");
const { Backend } = require("./backend");
const moduleTypes = require("./module-types");

module.exports = { Backend, ...moduleTypes, Router };
