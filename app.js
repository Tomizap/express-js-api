const express = require("express");
const mongoose = require('mongoose')
require("dotenv").config();
require('colors');

// ---------------------- mongo connect ---------------------------

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to mongo database !");
  }).catch((err) => {
    // console.log("MongoError: ", err);
    throw "MongoError: " + err
  });

// ---------------------- setup app ---------------------------

const app = express();
require('./src/services/setup.js')(app)

// ---------------------- use router ---------------------------

app.use(require('./src/routers/index'))

// ---------------------- handle error ---------------------------

app.use((err, req, res, next) => {
  if (!err.name) err.name = 'MongoError'
  res.error(err)
});

// ---------------------- app listen server ---------------------------
app.listen(process.env.SERVER_PORT, () => {
  if (process.env.NODE_ENV === 'dev') {
    console.log("Dev Server is running on http://localhost:" + process.env.SERVER_PORT);
  } else {
    console.log("Prod Server is running on port " + process.env.SERVER_PORT);
  }
});
