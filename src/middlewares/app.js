
const axios = require('axios')
const path = require('path')
const fs = require('fs')

module.exports.setupResponse = (req, res, next) => {

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

}

module.exports.setupLogs = async (req, res, next) => {

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
    const logFilePath = process.cwd() + 'log.json'
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

}

