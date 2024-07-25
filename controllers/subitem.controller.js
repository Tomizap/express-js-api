const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')

module.exports = {
    add: async (req, res) => {
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
    },
    extend: async (req, res) => {
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
    },
    remove: async (req, res) => {
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
    },
    delete: async (req, res) => {
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
    },
}