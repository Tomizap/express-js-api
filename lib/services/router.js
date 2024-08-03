const auth = require('./auth.js')

var router = (app, config = {}) => {

    if (!config.routes) config.routes = []
    if (!config.base) config.base = ''

    for (const route of config.routes) {
        // path
        if (!route.path) route.path = "";
        const path = config.base + route.path;

        // methods
        var methods = route.methods || [];
        if (methods.length === 0) methods = ["use"];

        // middlewares
        if (route.auth === true) auth(app)
        if (route.admin === true) app.use((req, res, next) => {
            if (!req.user || !req.user.roles.includes('admin'))
                return res.error({ message: 'you cannot do this' })
            next()
        })
        for (const middleware of route.middlewares || [])
            app[methods](path, middleware);

        if (route.router) {

            // routing routes
            app[methods](path, route.router);

            // log
            console.log(`endpoint [${methods}] ${path}`.gray);

        }

        // children routes
        router(app, { routes: route.childrens, base: path });

    }
};

module.exports = router;
