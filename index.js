const express = require("express");
const mongoose = require("mongoose");
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
var cors = require("cors");
var cookieParser = require("cookie-parser");
const twilioController = require("./controllers/twilio.controller.js");
const emailing = require('tz-emailing')
// const { google } = require('googleapis')
require("dotenv").config();
require('tz-mongoose-schemas')
require('tz-toolbox')
require('colors');

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use((req, res, next) => {
  req.emailing = emailing.init({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  })
  next()
})

// twilio
app.post("/twilio/submit", twilioController.submit)
app.get("/twilio/twiml", twilioController.twiml)
app.post("/twilio/connect", twilioController.connect)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to database!");

    // login and register
    app.post('/login', require('./controllers/user.controller.js').login)
    app.post('/register', require('./controllers/user.controller.js').register)

    // auth
    app.use(require('./controllers/user.controller.js').auth)

    // init
    app.use(require('./controllers/google.controller.js').init)

    // get user
    app.get('/me', (req, res) => { res.json(req.user) })

    // routes
    app.use(require("./router.js"));

    // listening
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });

  }).catch((err) => {
    console.log("MongoError: ", err);
  });
