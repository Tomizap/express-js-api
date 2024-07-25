const mongoose = require('mongoose')

module.exports = {
    send: async (req, res, next) => {
        try {

            console.log('sending email ..');

            // return res.status(200).json({ message: 'Email envoyé' });
            const { collection, id } = req.params
            const { subject = "", template = 'email', context = { message: '' } } = await req.body

            // get item
            const item = req.item
            if (!item.email || item.email === '') return res.status(500).json({ message: collection + ' item hasn\'t email' });
            const to = item.email

            // send email
            context.user = req.user
            context.item = item
            const emailing = await req.emailing.send({
                from: `"${req.user.name}" <${req.user.email}>`,
                to,
                subject,
                template,
                context
            })
            console.log('emailing', emailing);
            req.emailingResponse = emailing

            // add event
            await item.addEvent({
                name: `Email sent from ${req.user.email} to ${item.email}`
            })

            // save item
            item.lastEmailAt = new Date(Date.now())
            await item.save()
            console.log(`Email sent from ${req.user.email} to ${item.email}`);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: error.message });
        }
        next()
    },
}