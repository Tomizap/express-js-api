const mongoose = require("mongoose");
const { ObjectId } = require('mongodb')

module.exports = {
    collections: async (req, res) => {
        console.log(`crud.collection()`);
        try {
            const response = {}
            const collections = [
                'users', 'schools', 'degrees', 'registrations', 'appliers'
            ]

            // Crée une liste de promesses pour récupérer les données de chaque collection
            const promises = collections.map(async collection => {
                const data = await mongoose.model(collection).find().limit(9999);
                return { collection, data };
            });

            // Attend que toutes les promesses soient résolues
            const results = await Promise.all(promises);

            // Remplit l'objet response avec les résultats
            results.forEach(result => {
                response[result.collection] = result.data;
            });

            // Envoie la réponse
            res.json(response);
        } catch (error) {
            console.log(`crud.collection()`.red);
            res.status(500).json({ message: 'Error during crud collection: ' + error.message });
        }
    },
    count: async (req, res) => {
        const { collection } = req.params
        console.log(`crud.count(${collection})`);
        try {
            const count = await mongoose.model(collection).estimatedDocumentCount()
            res.json({ count })
        } catch (error) {
            console.log((`crud.count(${collection}, ${id})`).red);
            res.status(500).json({ message: 'Error during read: ' + error.message })
        }
    },
    read: async (req, res) => {
        const { collection, type } = req.params
        console.log(`crud.read(${collection})`);
        try {
            const limit = req.query.limit || 100
            delete req.query.limit
            const skip = req.query.skip || 0
            delete req.query.skip
            console.log('req.query', req.query);
            const selector = req.query
            for (const prop in selector)
                if (selector[prop].$in) {
                    const array = []
                    for (const subItemsId of selector[prop].$in) {
                        try {
                            if (subItemsId === 'null') {
                                array.push(null)
                            } else {
                                array.push(subItemsId)
                            }
                        } catch (error) { continue }
                    }
                    selector[prop].$in = array
                }
            console.log('read() selector', selector);

            const items = await mongoose.model(collection).find(selector).limit(limit).skip(skip);
            // res.status(200).json(items);
            return items
        } catch (error) {
            console.log((`crud.readOne(${collection})`).red);
            res.status(500).json({ message: 'Error during read: ' + error.message })
        }
    },
    readOne: async (req, res, next) => {
        const { collection, id } = req.params;
        console.log(`crud.readOne(${collection}, ${id})`);
        try {
            // console.log(id);
            req.item = await mongoose.model(collection).findById(id);
            if (req.item === null) {
                return res.status(404).json({ message: `Item ${id} not found` });
            }
            req.item.type = collection
            next()
        } catch (error) {
            console.log((`crud.readOne(${collection}, ${id})`).red);
            return res.status(404).json({ message: 'Error during readOne: ' + error.message, });
        }
    },
    create: async (req, res, next) => {
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

        } catch (error) { return res.status(500).json({ message: 'Error during creating: ' + error.message }); }
    },
    update: async (req, res) => {
        const { id, collection } = req.params;
        console.log(`crud.update(${collection}, ${id})`);
        try {
            delete req.body._id
            const updating = await mongoose.model(collection).updateOne({ _id: id }, req.body)
            updating.ok = true
            updating.message = `${req.item.name} has been updated`
            await mongoose.model("users").findByIdAndUpdate(req.user._id, { $inc: { points: 1 } })
            console.log(updating.message);
            res.status(200).json(updating);
        } catch (error) {
            console.log((`crud.update(${collection}, ${id})`).red);
            res.status(500).json({ message: 'Error during update: ' + error.message });
        }
    },
    delete: async (req, res) => {
        const { id, collection } = req.params;
        console.log(`crud.delete(${collection}, ${id})`);
        try {
            const deleting = await mongoose.model(collection)
                .deleteOne({ _id: id });
            res.status(200).json(deleting);
        } catch (error) {
            console.log((`crud.delete(${collection}, ${id})`).red);
            res.status(500).json({ message: 'Error during deleting' + error.message });
        }
    },
    search: async (req, res) => {
        const { collection = null } = req.params
        const { q } = req.query
        console.log(`crud.search(${collection}, ${q})`);
        try {
            const selector = { $or: [] }
            for (const fieldName of ['name', 'email', 'phone', 'shortName']) {
                selector.$or.push({ [fieldName]: new RegExp(q, 'i') })
            }
            // console.log(selector);
            if (collection !== null) {
                const items = await mongoose.model(collection).find(selector)
                res.status(200).json(items);
            } else {
                const promises = []
                for (const type of ['recruiters', 'appliers', 'companies', 'schools', "jobs", 'degrees', 'users']) {
                    promises.push(await mongoose.model(type).find(selector))
                }
                const items = []
                await Promise.all(promises).then(itemsTypes => {
                    for (const itemsType of itemsTypes) {
                        for (const item of itemsType) {
                            items.push(item)
                        }
                    }
                })
                res.status(200).json(items);
            }
        } catch (error) {
            console.log((`crud.search(${collection})`).red);
            res.status(500).json({ message: 'Error during searching' + error.message });
        }
    },
    convert: async (req, res, next) => {
        const { collection, id } = req.params;
        console.log(`crud.convert(${collection}, ${id})`);
        try {
            var newStatus = req.item.status

            if (req.item.type === 'companies') {
                if (req.item.status === 'lead') {
                    const itemCondition = await mongoose.model(req.item.type).findOne({
                        _id: req.item._id,
                        email: {
                            $ne: '',
                            $exists: true
                        },
                        phone: {
                            $ne: '',
                            $exists: true
                        },
                        'location.city': {
                            $ne: '',
                            $exists: true
                        },
                        recruiters: {
                            $ne: [],
                            $exists: true
                        },
                        jobs: {
                            $ne: [],
                            $exists: true
                        },
                    })
                    // console.log(itemCondition);
                    if (itemCondition !== null) {
                        newStatus = 'prospect'
                        req.item.priority = 'urgent'
                    }
                } else if (req.item.status === 'prospect') {
                    if (
                        null !== (await mongoose.model('jobs').exists({
                            [req.item.type]: { $in: [req.item._id] },
                            status: 'hired',
                        }))) {
                        newStatus = 'partner'
                    }
                }
            } else if (req.item.type === 'appliers') {
                if (req.item.status === 'lead') {
                    const registration = await mongoose.model('registrations').exists({
                        [req.item.type]: { $in: [req.item._id.toString()] }
                    })
                    if (registration !== null) {
                        newStatus = 'registration'
                    }
                } else if (req.item.status === 'registration') {
                    const registration = await mongoose.model('registrations').findOne({
                        [req.item.type]: { $in: [req.item._id.toString()] }
                    })
                    if (null === registration) {
                        newStatus = 'lead'
                    } else if (null !== (await mongoose.model('registrations').exists({
                        [req.item.type]: { $in: [req.item._id.toString()] },
                        status: 'confirmed'
                    }))) {
                        newStatus = 'registered'
                        req.item.priority = 'urgent'
                    }
                } else if (req.item.status === 'registered') {
                    if (null === (await mongoose.model('registrations').exists({
                        [req.item.type]: { $in: [req.item._id.toString()] },
                        status: 'confirmed'
                    }))) {
                        newStatus = 'registration'
                    } else if (null !== (await mongoose.model('recruitments').exists({
                        [req.item.type]: { $in: [req.item._id.toString()] },
                        status: 'confirmed'
                    }))) {
                        newStatus = 'hired'
                    }
                } else if (req.item.status === 'hired') {
                    if (null === (await mongoose.model('recruitments').exists({
                        [req.item.type]: { $in: [req.item._id.toString()] },
                        status: 'confirmed'
                    }))) {
                        newStatus = 'registered'
                    }
                }
            }

            if (newStatus !== req.item.status) {
                // console.log('conversion ..');
                req.item.status = newStatus
                req.item.convertedAt = new Date(Date.now())
                // console.log('addEvent');
                await req.item.addEvent({
                    name: `Status has been change to ${req.item.status}`
                })
                // console.log('req.item', req.item);
                // console.log('addEvent');
                await req.item.save()

                // Increment user points
                await mongoose.model("users").findByIdAndUpdate(req.user._id, {
                    $inc: { points: 100 },
                    status: newStatus,
                    convertedAt: new Date(Date.now())
                })
                console.log(req.item.type, req.item.name, 'has beeb converted to', newStatus, '!');
            } else {
                // console.log('Item cannot be converted');
            }

        } catch (error) {
            console.log((`crud.convert(${collection}, ${id})`).red);
            return res.status(500).json({ ok: false, message: 'Error during converting: ' + error.message })
        }
        next()

    },
}