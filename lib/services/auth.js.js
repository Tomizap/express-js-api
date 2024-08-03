const mongoose = require("mongoose");

const auth = (app, config = {}) => {

    app.use(async (req, res, next) => {
        if (mongoose.modelNames().includes('users'))
            try {
                if (!req.user) {
                    const email = req.headers.email || req.cookies.email;
                    const token = req.headers.token || req.cookies.token;
                    const user = await mongoose.model("users").auth(email, token);
                    if (user.suspended === true) throw new Error("this account is suspended");
                    res.cookie("token", token);
                    res.cookie("email", email);
                    req.user = user;
                }
            } catch (err) {
                return res.error(err);
            }
        next();
    })

}

module.exports = auth