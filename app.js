const express = require("express");
require("dotenv").config();
require('colors');
const setup = require('./services/setup.js')

// ---------------------- setup app ---------------------------

const app = express();
setup(app)