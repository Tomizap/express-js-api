const Router = require("../services/router");
const setup = require("tz-mongoose-plugins");

// --------------------- routes ---------------------

const routes = [];

// --------------------- exports ---------------------

const twilio = (app, config = {}) => {

    // --------------------- mongoose plugins ---------------------



    // --------------------- router ---------------------

    Router(app, { routes });

};
module.exports = twilio

// const express = require("express");
// const router = express.Router();
// const twilio = require('twilio');
// require("dotenv").config();

// const accountSid = process.env.TWILIO_ACCOUNTSID;
// const authToken = process.env.TWILIO_TOKEN;
// const twilioClient = new twilio(accountSid, authToken);

// router.post('/submit', (req, res) => {

//     const { name, phone } = req.body;

//     // Numéro de téléphone du commercial
//     const salesRepPhone = '+33665774180';

//     twilioClient.calls.create({
//         url: 'https://api.alter-recrut.fr/twilio/twiml',  // URL pour le TwiML
//         to: salesRepPhone,
//         from: '+12512458852',
//         method: 'GET',
//     }).then(call => {
//         res.json({ success: true });
//     }).catch(error => {
//         console.error(error);
//         res.json({ success: false });
//     });

// })

// router.get('/twiml', (req, res) => {
//     const twiml = new twilio.twiml.VoiceResponse();

//     twiml.say('Un nouveau formulaire de lead a été soumis.');
//     twiml.gather({
//         action: '/twilio/connect',
//         numDigits: '1'
//     }).say('Appuyez sur 1 pour être mis en relation avec la personne qui a soumis le formulaire.');

//     res.type('text/xml');
//     res.send(twiml.toString());
// })

// router.post('/connect', (req, res) => {
//     const twiml = new twilio.twiml.VoiceResponse();

//     // Numéro de téléphone du lead
//     const leadPhone = '+33647027542';  // Remplacez par le numéro de téléphone du lead reçu dans le formulaire

//     twiml.dial(leadPhone);

//     res.type('text/xml');
//     res.send(twiml.toString());
// })

// // ---------------------- error handler ---------------------------

// router.use((err, req, res, next) => {
//     if (!err.name) err.name = 'MongoError'
//     res.error(err)
// });

// module.exports = router;