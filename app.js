const express = require("express");
require("dotenv").config();
require('colors');
const setup = require('./src/services/Setup.js')

// ---------------------- config ---------------------------

const config = {

    // -------------------- app infos --------------------------

    name: '',

    // -------------------- security --------------------------

    cors: {},

    // -------------------- plugins --------------------------

    plugins: [
        // require('./src/plugins/Base'),
        require('./src/plugins/User'),
        require('./src/plugins/Smtp'),

        require('./src/plugins/Transactions'),

        // require('./src/plugins/MongoCrud'),
        require('./src/plugins/Mongo'),
    ]

}

// ---------------------- setup app ---------------------------

const app = express();
setup(app, config)