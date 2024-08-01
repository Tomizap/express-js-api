// index.js - index file of Router

const express = require('express')
const router = express.Router()
const { Router } = require('../services/Router')
const routes = require('./routes')

// ---------------------- home route ---------------------------

router.get('/', (req, res) => res.send("Welcome to api"))

// ---------------------- routing ---------------------------

Router(router, routes)

// ---------------------- ahndle error ---------------------------

router.use((err, req, res, next) => {
    if (!err.name) err.name = 'RouterError'
    res.error(err)
});

module.exports = router