const mongoose = require('mongoose')

const routes = [

    // -------------------- public routes -----------------------

    // docs
    {
        path: '/docs',
        router: (req, res) => res.send("docs api")
    },

    // app status
    {
        path: '/status',
        router: (req, res) => res.success()
    },

    // -------------------- user services -----------------------

    // login
    {
        path: '/login',
        router: async (req, res) => {
            try {

                const { email, password } = req.body
                const { user, token } = await mongoose.model('users').login(email, password)
                res.success({ data: token, user, message: 'Logged in !' });

            } catch (err) { res.error(err) }
        }
    },

    // register
    {
        path: '/register',
        methods: ['post'],
        router: async (req, res, next) => {
            try {

                const password = req.body.password
                delete req.body.password

                const user = await mongoose.model('users').register(req.body, password)

                res.success({ data: user, 'message': 'user has been created' })

            } catch (error) { res.error(error) }
        }
    },

    // reset password
    {
        path: '/reset-password',
        auth: true,
        methods: ['post'],
        router: async (req, res, next) => {
            try {

                const { oldPassword, newPassword } = req.body
                await mongoose.model('users').resetPassword(req.item._id, oldPassword, newPassword)
                res.success()

            } catch (error) { res.error(error) }
        }
    },

    // delete
    {
        path: '/user',
        methods: ['delete'],
        auth: true,
        router: async (req, res, next) => {
            try {

                await mongoose.model('users').resetPassword(req.item._id,)
                res.success()

            } catch (error) { res.error(error) }
        }
    },

    // get user
    {
        path: '/me',
        auth: true,
        router: async (req, res, next) => {
            try {

                res.success()

            } catch (error) { res.error(error) }
        }
    },

    // -------------------- mongo -----------------------

    {
        path: '/mongo',
        auth: true,
        router: require("../controllers/mongo")
    },

    // -------------------- smtp -----------------------





]

// -------------------- thrid party proxies -----------------------

// // smtp
// if (process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD)
//     router.use('/smtp', require('./smtp.js'))

// // twilio
// if (process.env.TWILIO_ACCOUNTSID && process.env.TWILIO_TOKEN)
//     router.use('/twilio', require('./twilio.js'))

// // stripe 
// if (process.env.STRIPE_SECRET)
//     router.use('/stripe', require('./stripe.js'))

// // google 
// if (process.env.GOOGLE_CLIENT && process.env.GOOGLE_SECRET)
//     router.use('/google', require('./google.js'))

module.exports = routes