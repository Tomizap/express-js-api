const mongoose = require("mongoose");
require("dotenv").config();
const Router = require('../services/router.js')
const setup = require('tz-mongoose-plugins')


// ---------------------- Collection ---------------------------

const getCollections = async (req, res) => {
    const response = {}
    const collections = await mongoose.connection.listCollections()
    try {

        // Crée une liste de promesses pour récupérer les données de chaque collection
        const promises = collections
            .map(c => c.name)
            .filter(c => {
                if (['tokens'].includes(c)) return false

                if (!req.user.roles.includes('admin'))
                    if (adminRessources.includes(c)) return false

                return true
            })
            .map(async collection => {
                var data = []
                try {
                    data = await mongoose.model(collection).find().limit(9999);
                } catch (error) { error }
                return { collection, data };

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

}

const search = async (req, res) => {
    try {

        const { collection } = req.params
        const promises = []
        for (const type of ['recruiters', 'appliers', 'companies', 'schools', "jobs", 'degrees', 'users']) {
            if (!collection || (collection && type === collection))
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
}

const getCollection = async (req, res) => {
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
}

const postItem = async (req, res, next) => {
    try {
        const { collection } = req.params

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
                ''
            }
            if (['registrations', 'recruitments'].includes(item.context))
                for (const degreeId of item.degrees || []) {
                    const degreePresentation = await mongoose.model('files').findOne(
                        {
                            degrees: { $in: [degreeId.toString()] },
                            'source.context': { $in: ['presentation'] },
                        }
                    )
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
}

// ---------------------- Item ---------------------------

const updateItem = async (req, res) => {
    const { id, collection } = req.params;
    try {

        delete req.body._id
        const updating = await mongoose.model(collection).updateOne({ _id: id }, req.body)
        updating.message = `${req.item.name} has been updated`
        await mongoose.model("users").findByIdAndUpdate(req.user._id, { $inc: { points: 1 } })
        res.status(200).json(updating);

    } catch (err) { res.error(err) }
}

const deleteItem = async (req, res) => {
    const { id, collection } = req.params;
    try {

        const deleting = await mongoose.model(collection)
            .deleteOne({ _id: id });
        deleting.message = `${req.item.name} has been updated`
        res.status(200).json(deleting);

    } catch (err) { res.error(err) }
}

// ---------------------- SubtItems ---------------------------

const removeSubItem = async (req, res) => {
    const { property, subItemId } = req.params
    const item = req.item
    try {

        await item.removeSubItem({ type: property, _id: subItemId })
        res.status(200).json({ message: `${property} has been removed from ${item.name}`, item, ok: true })

    } catch (error) { res.error(error) }
}

const deleteSubItem = async (req, res) => {
    const { property, subItemId } = req.params
    const item = req.item
    try {

        await item.deleteSubItem({ type: property, _id: subItemId })
        res.success({ message: `${property} has been removed from ${item.name}`, data: item })

    } catch (error) { res.error(error) }
}

const extendSubItems = async (req, res) => {
    const { property } = req.params
    const item = req.item
    try {

        await item.extendSubItems(property)
        res.success({ data: item })

    } catch (error) { res.error(error) }
}

const addSubItem = async (req, res) => {
    const { property, subItemId } = req.params
    const item = req.item
    if (subItemId) req.body._id = subItemId
    if (!req.body.type) req.body.type = property

    try {

        const subItem = await item.addSubItem(req.body)
        res.success({ data: subItem })

    } catch (error) { res.error({ message: error.message }); }
}

const clearSubItems = async (req, res) => {
    const { property } = req.params
    const item = req.item
    try {

        await item.clearSubItems(property)
        res.success({ message: `all ${property} has been removed from ${item.name}`, data: item })

    } catch (error) { res.error(error) }

}

// ---------------------- Access ---------------------------

const adminRessources = ['users', 'files', 'transactions', 'tokens']
const lockAccess = (req, res, next) => {
    try {
        const { collection } = req.params

        // block non accessible ressources
        if (collection === 'tokens') throw new Error('you cannot do this')
        if (adminRessources.includes(collection) && !req.user.roles.includes('admin'))
            throw new Error('you cannot do this')

        next()

    } catch (error) { res.error(error) }
}

// ---------------------- routes ---------------------------

const routes = [
    {
        path: '/mongo',
        auth: true,
        childrens: [
            {
                path: '/collections',
                methods: 'get',
                router: getCollections
            },
            {
                path: '/search',
                methods: 'get',
                router: search
            },
            {
                path: '/:collection',
                methods: 'post',
                middlewares: [lockAccess],
                router: postItem
            },
            {
                path: '/:collection',
                methods: 'get',
                middlewares: [lockAccess],
                router: getCollection
            },
            {
                path: '/:collection',
                middlewares: [lockAccess, (req, res, next) => {
                    if (!mongoose.modelNames().includes(req.params.collection))
                        res.error({ code: 404, data: `${req.params.collection} is not a ressource type` })
                    next()
                }],
                childrens: [
                    {
                        path: '/search',
                        methods: 'get',
                        router: search
                    },
                    {
                        path: '/count',
                        methods: 'get',
                        router: async (req, res) => {
                            res.success({ data: await mongoose.model(req.params.collection).estimatedDocumentCount() })
                        }
                    },
                    {
                        path: '/:id',
                        middlewares: [async (req, res, next) => {
                            req.item = await mongoose.model(req.params.collection).findById(req.params.id);
                            if (req.item === null) res.error({ code: 404, data: `item ${req.params.id} not found` })
                            next()
                        }],
                        childrens: [
                            {
                                methods: 'get',
                                router: (req, res) => res.success({ data: req.item })
                            },
                            {
                                methods: 'put',
                                router: updateItem
                            },
                            {
                                methods: 'delete',
                                router: deleteItem
                            },
                            {
                                path: '/extend',
                                methods: 'get',
                                router: extendSubItems,
                            },
                            {
                                path: '/:property',
                                middleware: [(req, res, next) => {
                                    const { collection, property } = req.params
                                    if (!(new mongoose.model(collection)()).keys().includes(property))
                                        res.error({ message: 'invalid property' })
                                    next()
                                }],
                                childrens: [
                                    {
                                        path: '/extend',
                                        methods: 'get',
                                        router: extendSubItems,
                                    },
                                    {
                                        path: '/add',
                                        methods: 'post',
                                        router: addSubItem,
                                        childrens: [
                                            {
                                                path: ':subItemId',
                                                methods: 'post',
                                                router: addSubItem
                                            }
                                        ]
                                    },
                                    {
                                        path: '/remove',
                                        methods: 'delete',
                                        childrens: [
                                            {
                                                path: '/:subItemId',
                                                methods: 'delete',
                                                router: removeSubItem,
                                            }
                                        ]
                                    },
                                    {
                                        path: '/delete',
                                        methods: 'delete',
                                        childrens: [
                                            {
                                                path: '/:subItemId',
                                                methods: 'delete',
                                                router: deleteSubItem,
                                            }
                                        ]
                                    },
                                    {
                                        path: '/clear',
                                        methods: 'delete',
                                        router: clearSubItems,
                                    },
                                ]
                            },
                        ]

                    }
                ]
            }
        ]
    }
]

const mongo = (app) => {

    setup('base')
    Router(app, { routes })

}

module.exports = mongo;
