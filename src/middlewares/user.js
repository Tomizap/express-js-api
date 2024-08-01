const mongoose = require('mongoose')

module.exports.auth = async (req, res, next) => {
    try {

        const email = req.headers.email || req.cookies.email
        const token = req.headers.token || req.cookies.token
        const user = await mongoose.model('users').auth(email, token)
        res.cookie('token', token)
        res.cookie('email', email)
        req.user = user
        next()

    } catch (err) { res.error(err) }

}