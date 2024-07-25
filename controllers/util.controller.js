module.exports = {
    response: (req, res) => {
        res.json(req.response || {
            ok: req.ok || true,
            message: req.message,
            items: req.items,
            data: req.data,
        })
    }
}