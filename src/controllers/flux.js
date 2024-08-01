const express = require("express");
const router = express.Router();

router.post('/start', () => {
    const body = req.body || {}
    const source = body.source
    const dest = body.dest

    // get data from source


    // upload data to dest

})

module.exports = router