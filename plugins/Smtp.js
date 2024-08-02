Router = require('../services/Router')

// --------------------- routes ---------------------

const routes = [
    {
        path: '/user/confirm-email',
        auth: true,
        methods: 'post',
        router: (req, res) => res.success()
    },
    {
        path: '/smtp',
        auth: true,
        childrens: [
            {
                path: '/send',
                methods: 'post',
                router: (req, res) => res.success()
            },
        ]

    },
]

// --------------------- exports ---------------------

module.exports = smtp = (app) => {

    Router(app, routes)

}