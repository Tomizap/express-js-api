const express = require('express')
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const axios = require('axios')
const mongoose = require('mongoose')
const Router = require('./Router')
const config = require('../src/config')

const Setup = (app) => {

    console.log();
    console.log('--- BEGIN SETUP ---');
    console.log();

    try {

        // ---------------------- mongo connect ---------------------------

        mongoose
            .connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
            .then(() => {

                console.log("-> connected to mongo database");

                // ---------------------- custom models ---------------------------

                const modelfiles = fs.readdirSync(path.join('./src/models'))
                console.log(`-> setup ${modelfiles.length} extra models`);
                modelfiles.forEach(file => {
                    if (path.extname(file) === '.js') {
                        console.log(`--> ${file}`);
                        require(path.join(__dirname, 'types', file));
                    }
                });

                // ---------------------- Security ---------------------------

                app.use(cors(config.cors));
                app.use(helmet());

                // ---------------------- app setup middlwares ---------------------------

                app.use(express.json());
                app.use(express.urlencoded({ extended: false }));
                app.use(morgan("dev"));
                app.use(bodyParser.json());
                app.use(cookieParser());

                // ---------------------- app logger ---------------------------

                app.use(async (req, res, next) => {

                    const logEntry = {
                        timestamp: new Date().toISOString(),
                        method: req.method,
                        url: req.url,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        cookies: req.cookies,
                        queryParams: req.query,
                        body: req.body
                    };

                    // Obtenir la localisation à partir de l'IP
                    try {
                        const response = await axios.get(`http://ip-api.com/json/${req.ip}`);
                        logEntry.location = response.data;
                    } catch (error) {
                        console.error('Erreur lors de l\'obtention de la localisation:', error);
                    }

                    // Lire les logs existants
                    const logFilePath = path.join(process.cwd(), '.logs', 'log.json')
                    fs.readFile(logFilePath, 'utf8', (err, data) => {
                        if (err && err.code !== 'ENOENT') {
                            console.error('Erreur lors de la lecture du fichier de logs:', err);
                            return next();
                        }

                        const logs = data ? JSON.parse(data) : [];

                        // Ajouter la nouvelle entrée de log
                        logs.push(logEntry);

                        // Écrire les logs mis à jour
                        fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), (err) => {
                            if (err) {
                                console.error('Erreur lors de l\'écriture dans le fichier de logs:', err);
                            }
                        });

                        next();

                    });

                });

                // ---------------------- uniform response ---------------------------

                app.use((req, res, next) => {

                    res.success = (success = {}) => {
                        const response = {
                            ok: true,
                            message: success.message || 'success'
                        }
                        for (const prop in success) response[prop] = success[prop]
                        if (!response.user) response.user = req.user
                        res.status(200).json(response);
                    };

                    res.error = (err = new Error()) => {

                        if (!err.name) err.name = 'HandleError'
                        console.error(err.name, ": ", err.message);
                        const response = {
                            name: err.name,
                            ok: false,
                            message: err.message || 'Service Unavailable. Please try again later.',
                            config: {
                                method: req.method,
                                path: req.originalUrl,
                                query: req.query,
                                headers: req.headers,
                                cookies: req.cookies,
                            },
                            user: req.user
                        }
                        if (req.method.toString() !== 'get') response.config.body
                        try {
                            res.status(code).json(response);
                        } catch (error) { res.status(500).json(response); }
                    };

                    next();

                });

                // ---------------------- public dir ---------------------------

                app.use(express.static(path.join('public')));

                // ---------------------- custom router ---------------------------

                console.log(`-> setup custom routes`);
                Router(app, require('../src/routes'))

                // ---------------------- plugins ---------------------------

                console.log(`-> setup ${config.plugins.length} app plugins`);
                for (const plugin of config.plugins) {
                    console.log(`--> ${plugin.name}()`);
                    plugin(app)
                }

                // ---------------------- app listening ---------------------------

                app.listen(process.env.SERVER_PORT, () => {
                    if (process.env.NODE_ENV === 'dev') {
                        console.log("-> (dev) running on http://localhost:" + process.env.SERVER_PORT);
                    } else {
                        console.log("-> (prop) running on port " + process.env.SERVER_PORT);
                    }

                    console.log();

                    console.log('Models: ', mongoose.modelNames().length);

                    console.log();
                    console.log('--- END SETUP ---');
                    console.log();

                });

            })

    } catch (error) { console.log('SetupError', error); }

}

// ---------------------- Router ---------------------------

module.exports = Setup