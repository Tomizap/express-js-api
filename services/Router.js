const mongoose = require('mongoose')

const auth = async (req, res, next) => {
    try {

        const email = req.headers.email || req.cookies.email
        const token = req.headers.token || req.cookies.token
        const user = await mongoose.model('users').auth(email, token)
        if (user.suspended === true) throw new Error('this account is suspended')
        res.cookie('token', token)
        res.cookie('email', email)
        req.user = user
        next()

    } catch (err) { res.error(err) }

}

var Router = (app, routes, base = "") => {

    for (const route of routes) {

        // path
        if (!route.path) route.path = ''
        const path = base + route.path

        // methods
        var methods = route.methods || []
        if (methods.length === 0) methods = ['use']

        // middlewares
        if (route.auth === true) app.use(auth)
        for (const middleware of route.middlewares || []) app[methods](path, middleware)

        if (route.router) {

            // routing routes
            app[methods](path, route.router)

            // log
            console.log(`endpoint [${methods}] ${path}`.gray);

        }

        // children routes
        Router(app, route.childrens || [], path)

    }

}

module.exports = Router