module.exports.Router = (app, routes) => {

    for (const route of routes) {

        // methods
        var methods = route.methods || []
        if (methods.length === 0) methods = ['use']

        // middlewares
        const middlewares = []
        if (route.auth === true) middlewares.push(require('../middlewares/user').auth)
        for (const middleware of route.middlewares || []) middlewares.push(middleware)

        // routing routes
        app[methods](route.path, middlewares, route.router)

    }

}