const mongoose = require('mongoose')
const Router = require('../services/Router')
const setup = require('tz-mongoose-plugins')

// --------------------- routes ---------------------

const routes = [

    {
        path: '/user',
        auth: true,
        childrens: [
            {
                path: '/register',
                methods: 'post',
            },
            {
                path: '/login',
                methods: 'post',
                router: async (req, res) => {
                    try {

                        console.log('login');
                        const { email, password } = req.body
                        const { user, token } = await mongoose.model('users').login(email, password)
                        res.success({ data: token, user, message: 'Logged in !' });

                    } catch (err) { res.error(err) }
                }
            },
            {
                path: '/reset-password',
                methods: 'post',
                auth: true,
                router: async (req, res, next) => {
                    try {

                        const { oldPassword, newPassword } = req.body
                        await mongoose.model('users').resetPassword(req.item._id, oldPassword, newPassword)
                        res.success()

                    } catch (error) { res.error(error) }
                }
            },
            {
                path: '/me',
                methods: 'get',
                auth: true,
                router: async (req, res, next) => res.success()
            },
            {
                path: '/delete',
                methods: 'delete',
                auth: true,
                router: async (req, res, next) => {
                    try {

                        // await mongoose.model('users').delete(req.item._id,)
                        res.success()

                    } catch (error) { res.error(error) }
                }
            },
            {
                path: '/suspend',
                methods: 'post',
            },
            {
                path: '/reactive',
                methods: 'post',
            },
        ]
    },

]

// --------------------- exports ---------------------

module.exports = users = (app) => {

    // --------------------- mongoose plugins ---------------------

    setup('users')

    // --------------------- router ---------------------

    Router(app, routes)

}