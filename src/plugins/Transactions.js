const Router = require('../services/Router')
const setup = require('tz-mongoose-plugins')
const UserPlugin = require('./User')

// --------------------- routes ---------------------

const routes = [
    {
        path: '/pay'
    }
]

// --------------------- exports ---------------------

const transactions = (app) => {

    // --------------------- mongoose plugins ---------------------

    setup('transactions')

    // --------------------- load others plugins ---------------------

    UserPlugin(app)

    // --------------------- router ---------------------

    Router(app, routes)

}
module.exports = transactions