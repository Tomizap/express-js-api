const config = {

    // -------------------- app infos --------------------------

    name: '',

    // -------------------- security --------------------------

    cors: {},

    // -------------------- plugins --------------------------

    plugins: [
        // require('../plugins/Base'),
        require('../plugins/User'),
        require('../plugins/Smtp'),

        require('../plugins/Transactions'),

        // require('../plugins/MongoCrud'),
        require('../plugins/Mongo'),
    ]

}

module.exports = config
