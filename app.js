const express = require("express");
require("dotenv").config();
require('colors');
const plugins = require('./index.js')

const app = express();

plugins.setup(app, {

    name: "",

    db: {
        mode: 'mongo',
        name: process.env.MONGO_DB,
        authString: process.env.MONGO_URI
    },

    plugins: [

        {
            init: plugins.secure,
            config: {
                cors: {}
            }
        },
        {
            init: plugins.users,
            config: {}
        },
        {
            init: plugins.mongo,
            config: {}
        },
        {
            init: plugins.transactions,
            config: {}
        }

    ],

    routes: []

})