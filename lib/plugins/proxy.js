const Router = require("../services/router");
const setup = require("tz-mongoose-plugins");

// --------------------- routes ---------------------

const routes = [];

// --------------------- exports ---------------------

const proxy = (app, config = {}) => {

    // --------------------- mongoose plugins ---------------------



    // --------------------- router ---------------------

    Router(app, { routes });

};
module.exports = proxy