const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeController = {
    init: (req, res, next) => {
        try {
            req.stripe = stripe
            next()
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    crud: (req, res) => {
        try {
            res.status(200).json(response)
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
}

module.exports = stripeController