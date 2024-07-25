const mongoose = require("mongoose");

module.exports = {
    spreadsheet: async (req, res) => {
        try {
            // get data
            console.log('get data');
            const { collection, id, sheetname } = req.query;
            const rows = await req.googleClients.sheets.spreadsheets.values.get({
                spreadsheetId: id,
                range: sheetname,
            });
            const headers = rows.data.values[0]
            const data = await rows.data.values.slice(1).map(row => {
                const item = {}
                for (let index = 0; index < headers.length; index++) {
                    item[headers[index]] = row[index]
                }
                return item
            })

            // mapping
            console.log('mapping');
            const items = await data.map(item => {
                return {
                    name: item['Nom'],
                    phone: item['Téléphone'],
                    email: item['Email'],
                    'location.address': item['Adresse'],
                    'location.postcode': item['Code Postal'],
                    'location.county': item['Département'],
                    'location.city': item['Ville'],
                    'location.country': item['Région'],
                    'location.state': item['Pays'],
                    'links.website': item['Site internet'],
                    sector: item['Secteur'],
                    status: item['Statut'],
                    comment: item['Commentaire'],
                }
            })

            // import data
            console.log('creating bulkOps');
            const bulkOps = []
            for (const item of items) {
                if (item.phone !== '' && item.name !== "") {
                    bulkOps.push({
                        updateOne: {
                            filter: { phone: item.phone },
                            update: { $set: item }
                        }
                    })
                }
            }

            // importing
            console.log(`importing ${bulkOps.length} ${collection}`);
            const bulkWrite = await mongoose.model(collection).bulkWrite(bulkOps)
            res.status(200).json(bulkWrite);

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },
    json: () => { }
}