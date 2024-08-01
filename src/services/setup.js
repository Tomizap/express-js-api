const express = require('express')
const { setupResponse, setupLogs } = require('../middlewares/app');
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const mongoosePlugins = require('tz-mongoose-plugins')

// mongoose plugins
mongoosePlugins.base()
mongoosePlugins.users()

// custom models
fs.readdirSync(path.join('./src/models')).forEach(file => {
    if (path.extname(file) === '.js') {
        require(path.join(__dirname, 'types', file));
    }
});

const Setup = (app) => {

    // security
    const corsConfig = {}
    app.use(cors());
    app.use(helmet());

    // setup app
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(morgan("dev"));
    app.use(bodyParser.json());
    app.use(cookieParser());

    // app loger
    // app.use(setupLogs);

    // uniform response
    app.use(setupResponse);

}

module.exports = Setup