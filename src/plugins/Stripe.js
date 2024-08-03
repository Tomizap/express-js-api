const express = require("express");
const router = express.Router();
const axios = require('axios')

const stripe = axios.create({
    baseURL: 'https://api.stripe.com/v1/',
    auth: { username: process.env.STRIPE_SECRET_KEY }
})

router.use(async (req, res) => {
    try {

        const data = await stripe({
            method: req.method,
            url: req.originalUrl,
            data: req.body
        })
        res.success({ data })

    } catch (error) { res.error(error) }
})

// ---------------------- error handler ---------------------------

router.use((err, req, res, next) => {
    if (!err.name) err.name = 'MongoError'
    res.error(err)
});

module.exports = router;