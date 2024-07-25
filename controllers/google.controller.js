const { google } = require('googleapis');
const nodemailer = require("nodemailer");
const mongoose = require('mongoose')

// Définition du schéma d'événement
const eventSchema = new mongoose.Schema({
    summary: String,
    location: String,
    description: String,
    start: {
        dateTime: String,
        timeZone: String
    },
    end: {
        dateTime: String,
        timeZone: String
    },
    recurrence: [String],
    attendees: [{ email: String }],
    reminders: {
        useDefault: Boolean,
        overrides: [{
            method: String,
            minutes: Number
        }]
    },
    googleEventId: String // ID de l'événement sur Google Calendar
});
// const eventModel = mongoose.model('google_events', eventSchema);

const googleController = {
    init: async (req, res, next) => {
        req.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT,
            process.env.GOOGLE_SECRET,
            `http://localhost:3000/google/oauth/token`)
        try {
            if (!req.user.auth.google.refresh_token)
                return res.redirect('/google/oauth')
            req.oauth2Client.setCredentials({ refresh_token: req.user.auth.google.refresh_token });
            next()
        } catch (error) {
            res.status(500).json({ message: 'Error during google init: ' + error.message });
        }
    },
    proxy: async (req, res, next) => {
        try {
            const response = await req.oauth2Client.request(req.body);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Error during google init: ' + error.message });
        }
    },
    oauth: {
        redirect: async (req, res) => {
            try {
                if (!req.query.scopes)
                    req.query.scopes = "https://mail.google.com,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/calendar";
                const url = req.oauth2Client.generateAuthUrl({

                    access_type: "offline",
                    scope: req.query.scopes.split(","),
                });
                res.redirect(url);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        },
        getToken: async (req, res) => {
            try {
                const tokens = await req.oauth2Client.getToken(req.query.code).then(r => r.tokens)
                req.user.auth.google = tokens
                await req.user.save()
                res.json({ ok: true, tokens })
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
    },
    contacts: {
        get: async (req, res) => {
            try {
                const response = await req.oauth2Client.request({
                    url: 'https://people.googleapis.com/v1/people/me/connections',
                    params: {
                        // pageSize: 100,
                        personFields: 'names,emailAddresses,addresses,calendarUrls,phoneNumbers,urls,skills,organizations',
                    },
                });
                const contacts = response.data.connections || [];
                res.json({ ok: true, data: contacts })
            } catch (error) {

                res.json({ ok: false, message: 'Error fetching contacts:' + error.message })
            }

        }
    },
    spreadsheet: {
        get: async (req, res) => {
            const { id, sheetname, range = '1:1000' } = req.params
            try {
                const response = await req.oauth2Client.request({
                    url: `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${sheetname}!${range}`,
                });

                const rows = response.data.values || [];
                console.log('Data retrieved from spreadsheet:');
                rows.forEach((row) => {
                    console.log(row.join(', '));
                });
                res.json({ ok: true, data: rows })
            } catch (error) {
                res.json({ ok: false, message: 'Error fetching spreadsheet data:' + error.message })
            }
        }
    },
    calendar: {
        schedule: async (req, res) => {
            // const { id, sheetname, range = '1:1000' } = req.params
            try {

                const body = req.body
                const startDate = new Date((body.start && body.start.dateTime) ? body.start.dateTime : Date.now())
                const endDate = new Date((body.end && body.end.dateTime) ? body.end.dateTime : startDate.setMinutes(startDate.getMinutes() + 30))
                const attendees = (body.attendees || []).map(attendee => {
                    return {
                        "email": attendee.email,
                        "displayName": attendee.name,
                        "comment": 'Candidat',
                    }
                })
                attendees.push({
                    "email": req.user.email,
                    "displayName": req.user.name,
                    "comment": 'Organisateur',
                    "organizer": true,
                    "responseStatus": 'accepted'
                }, {
                    "email": 'alter.recrut@gmail.com',
                    "displayName": 'Alter Recrut',
                    "comment": 'Cabinet de recrutement',
                    "organizer": true,
                    "responseStatus": 'accepted'
                })
                const fileResponse = await req.oauth2Client.request({
                    url: `https://www.googleapis.com/drive/v3/files/173IIIdRa35-faYkgMjkgOUGatKlt0KQD`,
                    params: { fields: 'id, name, mimeType, webViewLink' }
                });
                fileMetadata = fileResponse.data
                console.log('fileMetadata', fileMetadata);
                const attachments = [
                    {
                        fileUrl: "https://alter-recrut.fr/wp-content/uploads/2024/07/Formation-Responsable-detablissement-Touristique-Option-HCR-1.pdf",
                        // fileId: fileMetadata.id,
                        title: "Bachelor RET",
                        // mimeType: "application/pdf"
                    }
                ]
                var event = {
                    // "status": string,
                    "summary": body.summary,
                    "description": body.description,
                    "location": (body.location || {}).address,
                    "colorId": body.colorId,
                    "creator": {
                        //   "id": string,
                        "email": req.user.email,
                        "displayName": req.user.name,
                        //   "self": boolean
                    },
                    "organizer": {
                        //   "id": string,
                        "email": "alter.recrut@gmail.com",
                        "displayName": 'Alter Recrut',
                        //   "self": boolean
                    },
                    "start": {
                        "dateTime": startDate.toISOString(),
                    },
                    "end": {
                        "dateTime": endDate.toISOString(),
                    },
                    // "endTimeUnspecified": boolean,
                    // "recurrence": [
                    //   string
                    // ],
                    // "recurringEventId": string,
                    "iCalUID": body.iCalUID,
                    "supportsAttachments": true,
                    "anyoneCanAddSelf": true,
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
                    // "reminders": {
                    //   "useDefault": boolean,
                    //   "overrides": [
                    //     {
                    //       "method": string,
                    //       "minutes": integer
                    //     }
                    //   ]
                    // },
                    "source": {
                        "url": "https://alter-recrut.fr/",
                        "title": "Alter Recrut"
                    },
                    // "workingLocationProperties": {
                    //   "type": string,
                    //   "homeOffice": (value),
                    //   "customLocation": {
                    //     "label": string
                    //   },
                    //   "officeLocation": {
                    //     "buildingId": string,
                    //     "floorId": string,
                    //     "floorSectionId": string,
                    //     "deskId": string,
                    //     "label": string
                    //   }
                    // },
                    // "outOfOfficeProperties": {
                    //   "autoDeclineMode": string,
                    //   "declineMessage": string
                    // },
                    // "focusTimeProperties": {
                    //   "autoDeclineMode": string,
                    //   "declineMessage": string,
                    //   "chatStatus": string
                    // },
                    attachments,
                }
                console.log('event', event);
                const response = await req.oauth2Client.request({
                    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
                    method: 'POST',
                    data: event,
                    params: { supportsAttachments: true }
                });

                // console.log('response', response);
                return res.json(response.data)

            } catch (error) {
                console.log(error);
                console.log(error.response.data.error.errors);
                return res.json({ ok: false, message: 'Error fetching spreadsheet data:' + error.message })
            }
            next()
        }
    }
}
module.exports = googleController