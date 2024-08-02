
const routes = [

    // -------------------- public routes -----------------------

    // docs
    {
        path: '/docs',
        methods: 'get',
        router: (req, res) => res.send("docs api")
    },

    // app status
    {
        path: '/status',
        methods: 'get',
        router: (req, res) => res.success()
    },

    // -------------------- custom -----------------------

]

module.exports = routes