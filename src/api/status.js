export default function(app) {

    let totalReq = 0;

    app.use((req, res, next) => {
        totalReq++;
        next();
    });

    function runtime(seconds) {
        seconds = Number(seconds);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    }

    function listRoutes() {
        if (!app._router) return 0;
        return app._router.stack.filter(layer => layer.route).length - 1;
    }

    app.get('/api/status', async (req, res) => {
        try {
            res.status(200).json({
                status: true,
                result: {
                    status: 'Aktif',
                    totalrequest: String(totalReq),
                    totalfitur: String(listRoutes()),
                    runtime: runtime(process.uptime()),
                    domain: req.hostname
                }
            });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

}
