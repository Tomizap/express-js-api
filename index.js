module.exports = {
    setup: require('./lib/services/setup'),
    router: require('./lib/services/router'),
    plugins: require('./lib/services/plugins'),
    secure: require('./lib/services/secure'),

    users: require('./lib/plugins/users'),
    mongo: require('./lib/plugins/mongo'),
    transactions: require('./lib/plugins/transactions'),
    stripe: require('./lib/plugins/stripe'),
    smtp: require('./lib/plugins/smtp'),
    // google: require('./plugins/google'),
    // twilio: require('./plugins/twilio'),
    // tchat: require('./plugins/tchat'),
    // proxy: require('./lib/plugins/proxy'),
    // docs: require('./lib/plugins/docs'),
}