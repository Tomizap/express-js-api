const mongoose = require('mongoose')
const uuid = require('uuid').v7
const ExcelJS = require('exceljs');

module.exports = {
    login: async (req, res) => {
        const credentials = req.body
        console.log(`user.login(${credentials.email}, ${credentials.email})`);
        try {
            if (!credentials.email) { return res.status(500).json({ message: 'missing email' }); }
            if (!credentials.auth || !credentials.auth.password) { return res.status(500).json({ message: 'missing password' }); }
            const token = uuid()
            const user = await mongoose.model('users').findOne({ email: credentials.email, 'auth.password': credentials.auth.password })
            if (user === null) { return res.status(500).json({ message: 'auth failed' }); }
            if (!user.auth.token || user.auth.token === '') {
                user.auth.token = token
                user.save()
            }
            // console.log('login ok !');
            res.status(200).json({ user, ok: true, message: 'Logged in !' });
        } catch (error) {
            res.status(500).json({ ok: false, message: 'Error during login: ' + error.message });
        }
    },
    auth: async (req, res, next) => {
        const token = req.headers.token || req.query.token || req.cookies.token || null
        console.log(`user.auth(${token})`);
        try {
            if (token === null) { return res.status(500).json({ message: 'missing credentials' }); }
            delete req.query.token
            const user = await mongoose.model('users').findOne({ 'auth.token': token })
            if (user === null) { return res.status(500).json({ message: 'auth failed' }); }
            res.cookie('token', user.auth.token)
            req.user = user
            // console.log('auth ok !');
            next()
        } catch (error) {
            res.status(500).json({ ok: false, message: 'Error during auth: ' + error.message });
        }
    },
    register: async (req, res) => {
        // console.log('user.register()');
        try {
            res.status(200).json({});
        } catch (error) {
            res.status(500).json({ ok: false, message: 'Error during register: ' + error.message });
        }
    },
    report: async (req, res) => {
        const { collection } = req.params
        console.log(`user.report(${collection})`);
        try {

            const items = await mongoose.model(collection).find();

            // Créer un nouveau classeur Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Data');

            // Ajouter des en-têtes de colonne
            // worksheet.columns = [
            //     { header: 'Name', key: 'name', width: 30 },
            //     { header: 'Email', key: 'email', width: 30 },
            //     { header: 'Age', key: 'age', width: 10 }
            // ];
            worksheet.columns = Object.keys(items[0]).map(key => {
                return {
                    header: key, key: key, width: 30
                }
            })

            // Ajouter des lignes de données
            items.forEach(user => {
                worksheet.addRow(user);
            });

            // Écrire le classeur dans un fichier buffer
            const buffer = await workbook.xlsx.writeBuffer();

            // const transporter = nodemailer.createTransport({
            //     service: 'gmail',
            //     auth: {
            //         user: 'your-email@gmail.com',
            //         pass: 'your-email-password'
            //     }
            // });

            const mailOptions = {
                from: req.user.email,
                to: 'zaptom.pro@gmail.com',
                subject: 'Excel File',
                text: 'Please find the attached Excel file.',
                attachments: [
                    {
                        filename: 'users.xlsx',
                        content: buffer,
                        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                ]
            };

            req.emailing.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Email could not be sent.');
                } else {
                    console.log('Email sent: ' + info.response);
                    return res.send('Email sent successfully.');
                }
            });

        } catch (error) {
            console.log((`crud.report(${collection})`).red);
            res.status(500).json({ message: 'Error during report: ' + error.message })
        }
    }
}