const express = require("express");
const router = express.Router();
const uuid = require('uuid').v4
const mongoose = require("mongoose");
require("dotenv").config();

// ---------------------- collections actions ---------------------------

// backup

// load all database (caching)
router.get("/collections", async (req, res) => {
    const response = {}
    const collections = await mongoose.connection.listCollections()
    console.log(collections);
    try {

        // Crée une liste de promesses pour récupérer les données de chaque collection
        const promises = collections
            .map(c => c.name)
            .filter(c => {
                if (['tokens'].includes(c)) return false
                if (req.user.state.admin !== true) {
                    if (['users'].includes(c)) return false
                }
                return true
            })
            .map(async collection => {
                var data = []
                try {
                    data = await mongoose.model(collection).find().limit(9999);
                } catch (error) {
                    // console.log(error);
                } finally {
                    return { collection, data };
                }
            });

        // Attend que toutes les promesses soient résolues
        const results = await Promise.all(promises);

        // Remplit l'objet response avec les résultats
        results.forEach(result => {
            response[result.collection] = result.data;
        });

        // Envoie la réponse
        res.success({ data: response });

    } catch (err) { res.error(err) }

})

// search data in collection
router.get("/search", async (req, res) => {
    try {

        const promises = []
        for (const type of ['recruiters', 'appliers', 'companies', 'schools', "jobs", 'degrees', 'users']) {
            promises.push(await mongoose.model(type).search(req.query.q))
        }
        const data = []
        await Promise.all(promises).then(dataTypes => {
            for (const dataType of dataTypes) {
                for (const item of dataType) {
                    data.push(item)
                }
            }
        })
        res.success({ data });

    } catch (err) { res.error(err) }
})

// ---------------------- specific collection actions ---------------------------

// search items in count
router.get("/:collection/count", async (req, res) => {
    const { collection } = req.params
    try {

        const count = await mongoose.model(collection).estimatedDocumentCount()
        res.success({ data: count })

    } catch (err) { res.error(err) }
})

// middleware collection
router.use("/:collection", (req, res, next) => {
    try {
        const { collection } = req.params

        // block non accessible ressources
        const stop = () => { throw new Error('you cannot do this') }
        if (collection === 'tokens') stop()
        if (req.user.state.admin !== true) {
            if (collection === 'users') stop()
        }

        const col = mongoose.model(collection)
        console.log(col);
        next()

    } catch (error) { res.error(error) }
})

// export

// bulk import

// search items in collection
router.get("/:collection/search", async (req, res) => {
    try {

        const data = await mongoose.model(req.params.collection).search(req.query.q)
        res.success({ data })

    } catch (err) { res.error(err) }
})

// create a item
router.post("/:collection", async (req, res, next) => {
    try {
        const { collection } = req.params
        console.log(`crud.create(${collection})`);

        if (!req.body.type) req.body.type = collection
        if (!req.body.users) req.body.users = []
        if (!req.body.users.includes(req.user._id)) req.body.users.push(req.user._id)
        // if (!req.body.name || req.body.name === '') throw new Error('name is required')
        if (!req.body.role || req.body.role === '') req.body.role = 'general'

        if (['recruiters', 'companies', 'appliers'].includes(collection)) {
            if (!req.body.phone || req.body.phone === '') {
                throw new Error('Phone number is required')
            }
            if (!req.body.email || req.body.email === '') {
                throw new Error('Email Address is required')
            }
            if ((await mongoose.model(collection).exists({ phone: req.body.phone })) !== null) {
                return res.status(500).json({ ok: false, message: `this phone number already for ${collection}` })
            }
        }

        if (['recruiters', 'companies', 'appliers', 'schools', 'jobs'].includes(collection)) {
            if (!req.body.location || !req.body.location.county || req.body.location.county === '') {
                throw new Error('Valid location is required')
            }
        }

        if (collection === 'registrations') {
            if (!req.body.appliers || req.body.appliers.length === 0) {
                throw new Error('Registration need 1 applier')
            }
            if (!req.body.schools || req.body.schools.length === 0) {
                throw new Error('Registration need 1 school')
            }
            if (!req.body.degrees || req.body.degrees.length === 0) {
                throw new Error('Registration need 1 degree')
            }
        }

        if (collection === 'recruitments') {
            if (!req.body.appliers || req.body.appliers.length === 0) {
                throw new Error('Registration need 1 applier')
            }
            if (!req.body.companies || req.body.companies.length === 0) {
                throw new Error('Registration need 1 school')
            }
            if (!req.body.degrees || req.body.degrees.length === 0) {
                throw new Error('Registration need 1 degree')
            }
        }

        if (collection === 'appointments') {
            if (!req.body.startedAt) {
                req.body.startedAt = new Date(Date.now())
            }
        }

        if (collection === 'files') {
            // if (!req.body.source || !req.body.source.url) {
            //     throw new Error('Files need a source url.')
            // }
            // if (!req.body.context || !req.body.context.url) {
            //     throw new Error('Files need a source context.')
            // }
            // if (!req.body.context)
        }

        // create item
        req.body.type = collection
        var item = new mongoose.model(collection)(req.body)
        console.log('item', item);
        item = await item.save()

        if (collection === 'appointments') {

            const startDate = new Date(item.startedAt)
            const endDate = new Date(item.endedAt ? item.endedAt : startDate.setMinutes(startDate.getMinutes() + 30))

            const attachments = []
            const attendees = [{
                "email": 'alter.recrut@gmail.com',
                "displayName": 'Alter Recrut',
                "comment": 'Cabinet de recrutement',
                "organizer": true,
                "responseStatus": 'accepted'
            }]
            for (const userId of item.users || []) {
                const user = await mongoose.model('users').findById(userId)
                attendees.push({
                    "email": user.email,
                    "displayName": user.name,
                    "comment": 'Organisateur',
                    "organizer": true,
                    "responseStatus": 'accepted'
                })
            }

            if (item.context === 'registrations') {

            }
            if (['registrations', 'recruitments'].includes(item.context))
                for (const degreeId of item.degrees || []) {
                    const degreePresentation = await mongoose.model('files').findOne(
                        {
                            degrees: { $in: [degreeId.toString()] },
                            'source.context': { $in: ['presentation'] },
                        }
                    )
                    console.log('degreePresentation', degreePresentation);
                    if (degreePresentation !== null) attachments.push({
                        fileUrl: degreePresentation.source.url,
                        mimeType: degreePresentation.source.mimeType,
                        title: degreePresentation.name,
                    })
                }
            if (['registrations', 'recruitments'].includes(item.context)) {
                for (const applierId of item.appliers || []) {
                    const applier = await mongoose.model('appliers').findById(applierId)
                    attendees.push({
                        "email": applier.email,
                        "displayName": applier.name,
                        "comment": 'Candidat',
                    })
                    const applierCV = await mongoose.model('files').findOne(
                        {
                            appliers: { $in: [applierId.toString()] },
                            context: { $in: ['presentation', 'cv'] },
                        }
                    )
                    if (applierCV !== null) attachments.push({
                        fileUrl: applierCV.links.website,
                        mimeType: applierCV.mimeType,
                        title: applierCV.name,
                    })
                }
            }
            if (['registrations', 'recruitments'].includes(item.context)) {
                for (const schoolId of item.schools || []) {
                    const school = await mongoose.model('schools').findById(schoolId)
                    attendees.push({
                        "email": school.email,
                        "displayName": school.name,
                        "comment": 'Candidat',
                    })
                    const schoolPresentation = await mongoose.model('files').findOne(
                        {
                            schools: { $in: [schoolId.toString()] },
                            context: { $in: ['presentation'] },
                        }
                    )
                    if (schoolPresentation !== null) attachments.push({
                        fileUrl: schoolPresentation.links.website,
                        mimeType: schoolPresentation.mimeType,
                        title: schoolPresentation.name,
                    })
                }
            }

            var googleEvent = {
                "summary": item.name,
                "description": item.description,
                "location": (item.location || {}).address,
                // "colorId": item.colorId,
                "creator": {
                    "email": req.user.email,
                    "displayName": req.user.name,
                },
                "organizer": {
                    "email": "alter.recrut@gmail.com",
                    "displayName": 'Alter Recrut',
                },
                "start": {
                    "dateTime": startDate.toISOString(),
                },
                "end": {
                    "dateTime": endDate.toISOString(),
                },
                // "iCalUID": body.iCalUID,
                attendees,
                // "hangoutLink": string,
                // "conferenceData": {
                //   "createRequest": {
                //     "requestId": string,
                //     "conferenceSolutionKey": {
                //       "type": string
                //     },
                //     "status": {
                //       "statusCode": string
                //     }
                //   },
                //   "entryPoints": [
                //     {
                //       "entryPointType": string,
                //       "uri": string,
                //       "label": string,
                //       "pin": string,
                //       "accessCode": string,
                //       "meetingCode": string,
                //       "passcode": string,
                //       "password": string
                //     }
                //   ],
                //   "conferenceSolution": {
                //     "key": {
                //       "type": string
                //     },
                //     "name": string,
                //     "iconUri": string
                //   },
                //   "conferenceId": string,
                //   "signature": string,
                //   "notes": string,
                // },
                "anyoneCanAddSelf": true,
                "guestsCanInviteOthers": true,
                "guestsCanModify": true,
                "guestsCanSeeOtherGuests": true,
                "locked": false,
                "source": {
                    "url": "https://alter-recrut.fr/",
                    "title": "Alter Recrut"
                },
                attachments,
            }
            console.log('googleEvent', googleEvent);

            const response = await req.oauth2Client.request({
                url: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
                method: 'POST',
                data: googleEvent,
                params: { supportsAttachments: true }
            });

            item.googleEventId = response.data.id
            item = await item.save()
        }

        // Increment user points
        await mongoose.model("users").findByIdAndUpdate(req.user._id, { $inc: { points: 50 } })

        // return
        req.item = item
        next()

    } catch (err) { res.error(err) }
});

// get collection
router.get('/:collection', async (req, res) => {
    const { collection } = req.params
    try {

        // create selector
        const selector = req.query

        // find
        const items = await mongoose.model(collection).find(selector)
            .limit(req.headers.limit || 100)
            .skip(req.headers.skip || 0);

        // return
        res.success({ data: items })

    } catch (err) { res.error(err) }
});

// ---------------------- crud item ---------------------------

// middleware
router.use("/:collection/:id", async (req, res, next) => {
    const { collection, id } = req.params;
    try {

        req.item = await mongoose.model(collection).findById(id);
        if (req.item === null) throw new Error(`Item ${id} not found`)
        next()

    } catch (err) { res.error(err) }
})

// get item
router.get("/:collection/:id", (req, res) => res.success({ data: req.item }));

// update a item
router.put("/:collection/:id", async (req, res) => {
    const { id, collection } = req.params;
    try {

        delete req.body._id
        const updating = await mongoose.model(collection).updateOne({ _id: id }, req.body)
        updating.message = `${req.item.name} has been updated`
        await mongoose.model("users").findByIdAndUpdate(req.user._id, { $inc: { points: 1 } })
        console.log(updating.message);
        res.status(200).json(updating);

    } catch (err) { res.error(err) }
});

// delete a item
router.delete("/:collection/:id", async (req, res) => {

    const { id, collection } = req.params;
    try {

        const deleting = await mongoose.model(collection)
            .deleteOne({ _id: id });
        deleting.message = `${req.item.name} has been updated`
        res.status(200).json(deleting);

    } catch (err) { res.error(err) }
});

// ---------------------- item actions ---------------------------

// emailing

// sharing

// ---------------------- subItems ---------------------------

// extend subitems
const extend = async (req, res) => {
    const { type } = req.params
    const item = req.item
    console.log(`subItem.extend(${item.type}, ${item.id}, ${type})`);
    try {
        var response = {}

        // get subItems
        const collections = ['recruiters', 'schools', 'jobs', 'events', 'appliers', 'degrees', 'companies', 'appointments', 'registrations', 'recruitments', 'companies', 'users']
        for (const collection of collections) {
            response[collection] = []
            if (type && type !== collection) { continue }
            const items = []
            if (!item[collection]) item[collection] = []
            item[collection] = [...new Set(item[collection].map(id => id.toString()))]
            for (const subItemId of item[collection]) {
                const subItem = await mongoose.model(collection).findById(subItemId)
                if (subItem === null) {
                    console.log('unfound', collection, subItemId);
                    await item.removeSubItem(collection, subItemId)
                } else {
                    items.push(subItem)
                }
            }
            response[collection] = items
        }

        await item.save()

        // return
        response.ok = true
        res.json(response)

    } catch (error) {
        console.log((`subItem.extend(${item.type}, ${item.id}, ${type})`).red);
        res.status(500).json({ message: 'Error during extend: ' + error.message });
    }
}
router.get("/:collection/:id/extend", extend);
router.get("/:collection/:id/extend/:type", extend);

// middleware checking subItems type / actions
const checkingSubtItemMiddleware = async (req, res, next) => {

    const { collection, action, type, subItemId } = req.params

    // checking action
    if (!['add', 'remove', 'delete'].includes(action)) throw new Error(`action ${action} doesn't exist`)

    // checking action
    if (!(new mongoose.model(collection)()).keys().includes(type)) throw new Error(`${type} is not a property of ${collection}`)

    // checking subitem id
    if (subItemId)
        if ((await mongoose.model(type).findById(subItemId)) === null)
            throw new Error(`${type} ${subItemId} is not found`)

}
router.use("/:collection/:id/:action/:type", checkingSubtItemMiddleware);
router.use("/:collection/:id/:action/:type/:subItemId", checkingSubtItemMiddleware);

// add subitem
router.put("/:collection/:id/add/:type/:subItemId", async (req, res) => {
    const { collection, type, subItemId } = req.params
    console.log(`subItem.addSubItem(${type} (${subItemId}) => ${collection})`);
    try {
        const item = req.item

        // addSubItem
        if (subItemId) req.body._id = new ObjectId(subItemId)
        req.body.type = type
        if (req.body.name) req.body.name = 'new ' + type
        const subItem = await item.addSubItem(type, req.body)

        // save subItem
        await subItem.save()

        // save item
        await item.save()

        // add event
        await item.addEvent({
            name: `${subItem.name} has been added to ${item.name}`,
            users: [req.user._id],
            [collection]: [item._id]
        })

        // Increment user points
        await mongoose.model("users").findByIdAndUpdate(req.user._id, { $inc: { points: 50 } })

        // return
        res.status(200).json({ message: `${subItem.name} has been added to ${item.name}.`, item: subItem, ok: true })

    } catch (error) {
        console.log((`subItem.addSubItem(${type} (${subItemId}) => ${collection})`).red);
        res.status(500).json({ message: 'Error during addSubItem: ' + error.message });
    }
});

// add remove
router.delete("/:collection/:id/remove/:type/:subItemId", async (req, res) => {
    const { type, subItemId } = req.params
    const item = req.item
    console.log(`subItem.remove(${item.type}, ${item.id}, ${type}, ${subItemId})`);
    try {

        // addSubItem
        await item.removeSubItem(type, subItemId)

        // // save item
        await item.save()

        // addSubItem
        res.status(200).json({ message: `${type} has been removed from ${item.name}`, item, ok: true })

    } catch (error) {
        console.log(`subItem.remove(${item.type}, ${item.id}, ${type}, ${subItemId})`.red);
        res.status(500).json({ message: error.message });
    }
});

// add delete
router.delete("/:collection/:id/delete/:type/:subItemId", async (req, res) => {
    const { type, subItemId } = req.params
    const item = req.item
    console.log(`subItem.delete(${item.type}, ${item.id}, ${type}, ${subItemId})`);
    try {

        // addSubItem
        await item.deleteSubItem(type, subItemId)

        // save item
        await item.save()

        // addSubItem
        res.status(200).json({ message: `${type} has been removed from ${item.name}`, ok: true })

    } catch (error) {
        console.log(`subItem.delete(${item.type}, ${item.id}, ${type}, ${subItemId})`.red);
        res.status(500).json({ message: error.message });
    }
});

// ---------------------- error handler ---------------------------

router.use((err, req, res, next) => {
    if (!err.name) err.name = 'MongoError'
    res.error(err)
});

module.exports = router;
