module.exports = {
    check: async (req, res, next) => {
        try {
            const method = req.method.toLowerCase()
            const capabilities = req.item.capabilities

            // if (req.user.capabilities.admin !== true)
            if (capabilities[method] && !capabilities[method].includes(req.user._id)) {
                return res.status(500).json({ message: `You havn't capability to ${method} this ${req.params.collection}` });
            }

            console.log(`${method.toUpperCase()} capabilities checked !`);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: `Error during capabilities checking: ${error.message}` });
        }
        next()
    },
}