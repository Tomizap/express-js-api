const Router = require("../services/router");
const setup = require("tz-mongoose-plugins");

// --------------------- routes ---------------------

const routes = [];

// --------------------- exports ---------------------

const google = (app, config = {}) => {

    // --------------------- mongoose plugins ---------------------



    // --------------------- router ---------------------

    Router(app, { routes });

};
module.exports = google

// const express = require("express");
// const router = express.Router();
// const axios = require('axios');
// const mongoose = require("mongoose");

// // ---------------------- setup ---------------------------

// // googelEventSchema
// const googelEventSchema = new mongoose.Schema({
//     summary: String,
//     location: String,
//     description: String,
//     start: {
//         dateTime: String,
//         timeZone: String
//     },
//     end: {
//         dateTime: String,
//         timeZone: String
//     },
//     recurrence: [String],
//     attendees: [{ email: String }],
//     reminders: {
//         useDefault: Boolean,
//         overrides: [{
//             method: String,
//             minutes: Number
//         }]
//     },
//     googleEventId: String // ID de l'événement sur Google Calendar
// });

// // create oauth2Client
// const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT,
//     process.env.GOOGLE_SECRET,
//     `http://localhost:3000/google/oauth/token`)

// // ---------------------- oauth handler ---------------------------

// router.get('/oauth', async (req, res) => {

//     try {
//         if (!req.query.scopes)
//             req.query.scopes = "https://mail.google.com,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/calendar";
//         const url = req.oauth2Client.generateAuthUrl({

//             access_type: "offline",
//             scope: req.query.scopes.split(","),
//         });
//         res.redirect(url);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }

// })

// router.get('/oauth/token', async (req, res) => {

//     try {
//         const tokens = await req.oauth2Client.getToken(req.query.code).then(r => r.tokens)
//         req.user.auth.google = tokens
//         await req.user.save()
//         res.json({ ok: true, tokens })
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }

// })

// // ---------------------- proxy request ---------------------------

// // auth client
// router.use(async (req, res, next) => {
//     const refresh_token = req.headers.refresh_token
//     await oauth2Client.setCredentials({ refresh_token });
//     next()
// })

// // proxy request
// router.use(async (req, res) => {
//     try {

//         const data = await oauth2Client.request(req.body.config)
//         res.success({ data })

//     } catch (error) { res.error(error) }
// })

// // ---------------------- error handler ---------------------------

// router.use((err, req, res, next) => {
//     if (!err.name) err.name = 'MongoError'
//     res.error(err)
// });

// module.exports = router;