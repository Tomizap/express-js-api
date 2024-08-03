const helmet = require("helmet");
const cors = require("cors");

const secure = (app, config = {}) => {

    app.use(cors(config.cors));
    app.use(helmet());

};
module.exports = secure