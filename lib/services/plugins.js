const mongoosePlugins = require('tz-mongoose-plugins')

const plugins = (app, config = {}) => {

    const plugins = config.plugins || []
    for (const plugin of plugins) {
        const name = config.name || plugin.init.name
        console.log();
        console.log(`-> ${name} plugin`);
        console.log();
        mongoosePlugins(name)
        plugin.init(app, plugin.config || {})
    }

};
module.exports = plugins