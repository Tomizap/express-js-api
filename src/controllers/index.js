const express = require('express')
const router = express.Router()
require('dotenv').config

// mongo
router.use("/mongo", require("./mongo.js"));

// smtp
if (process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD)
    router.use('/smtp', require('./smtp.js'))

// twilio
if (process.env.TWILIO_ACCOUNTSID && process.env.TWILIO_TOKEN)
    router.use('/twilio', require('./twilio.js'))

// stripe 
if (process.env.STRIPE_SECRET)
    router.use('/stripe', require('./stripe.js'))

// google 
if (process.env.GOOGLE_CLIENT && process.env.GOOGLE_SECRET)
    router.use('/google', require('./google.js'))

// spiders 

// axios 
router.get('/axios', (req, res) => {
    try {

        const config = req.body.config
        const response = axios(config)
        res.success(response.data)

    } catch (error) { res.error(error) }

})

// wp 
// if (process.env.WP_USERNAME && process.env.WP_PASSWORD)

// sql 

// ---------------------- handle error ---------------------------

app.use((err, req, res, next) => {
    if (!err.name) err.name = 'ProxiesError'
    res.error(err)
});

module.exports = router