const Router = require('../services/router')

const routes = [
    {
        path: '/pay'
    }
]

const transactions = (app, config = {}) => {

    Router(app, { routes })

}
module.exports = transactions