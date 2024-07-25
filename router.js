const express = require("express");

const router = express.Router();
const crudController = require('./controllers/crud.controller.js')
const subItemController = require('./controllers/subitem.controller.js')
const exportController = require('./controllers/export.controller.js')
const importController = require('./controllers/import.controller.js')
const emailController = require('./controllers/email.controller.js')
const googleController = require('./controllers/google.controller.js')
const capabilityController = require('./controllers/capability.controller.js');
const userController = require("./controllers/user.controller.js");
const utilController = require("./controllers/util.controller.js");
// const twilioController = require("./controllers/twilio.controller.js");
// const SpiderController = require('./controllers/spider.controller.js')

// google
router.get("/google/oauth", googleController.oauth.redirect)
router.get("/google/oauth/token", googleController.oauth.getToken)
router.get("/google/contacts", googleController.contacts.get)
router.get("/google/spreadsheet/:id/:sheetname", googleController.spreadsheet.get)
router.get("/google/spreadsheet/:id/:sheetname/:range", googleController.spreadsheet.get)
router.post("/google/calendar/schedule", googleController.calendar.schedule)
// router.get("/google/spreadsheet/:id", googleController.oauth.getToken)

// stripe
// router.use("/stripe", require('./controllers/stripe.controller.js'))    

// twilio
// router.post("/twilio_submit", twilioController.submit)
// router.get("/twilio_twiml", twilioController.twiml)
// router.post("/twilio_connect", twilioController.connect)

// search items in collection
router.get("/collections", crudController.collections)
router.get("/search", crudController.search)

// get collection
router.get('/:collection', async (req, res) => res.json(await crudController.read(req, res)));

// spiders
// router.put('/spiders/:id/play', SpiderController.play)
// router.get('/spiders/:id/pause', SpiderController.pause)
// router.get('/spiders/:id/stop', SpiderController.stop)

// import spreadsheet
// router.get('/:collection/import/googleSpreadsheet', importController.spreadsheet);
// router.get('/:collection/import/json', importController.json);
// router.get('/:collection/import/csv', importController.csv);

// import spreadsheet
// router.get('/:collection/exports/googleContacts', importController.spreadsheet);

// export
router.get('/:collection/export/spreadsheet', exportController.spreadsheet);
router.get('/:collection/export/csv', exportController.csv);
router.get('/:collection/export/json', exportController.json);

// export
router.post('/:collection/report', userController.report);
// router.get('/:collection/export/csv', exportController.csv);
// router.get('/:collection/export/json', exportController.json);

// create a item
router.post("/:collection", crudController.create, async (req, res) => {
    res.json({ item: req.item, message: `${req.params.collection} ${req.item.name} has been created.`, ok: true })
});

// search items in collection
router.get("/:collection/search", crudController.search)

// search items in count
router.get("/:collection/count", crudController.count)

// middleware
router.use("/:collection/:id", crudController.readOne)

// get item
router.get("/:collection/:id", crudController.convert, (req, res) => res.json(req.item));

// update a item
router.put("/:collection/:id", crudController.update);

// item emailing
router.post("/:collection/:id/email/send", emailController.send, async (req, res) => {
    res.json({
        ok: true,
        emailing: await req.emailingResponse,
        message: "An email as been sent from " + req.user.email
    })
});

// subItem
router.get("/:collection/:id/extend", subItemController.extend);
router.get("/:collection/:id/extend/:type", subItemController.extend);
router.put("/:collection/:id/add/:type", subItemController.add);
router.put("/:collection/:id/add/:type/:subItemId", subItemController.add);
router.delete("/:collection/:id/remove/:type/:subItemId", subItemController.remove);
router.delete("/:collection/:id/delete/:type/:subItemId", subItemController.delete);

// item permissions

// share item

// delete a item
router.delete("/:collection/:id", crudController.delete);

module.exports = router;
