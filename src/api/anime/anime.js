const axios = require('axios');

const baseURL = 'https://www.sankavollerei.com/anime';

async function fetchJson(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        // buang field creator/source, ambil data aja
        const { creator, source, author, credit, ...clean } = data;
        return clean;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

module.exports = function(app) {

    app.get('/anime/home', async (req, res) => {
        try {
            const result = await fetchJson(`${baseURL}/home`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/schedule', async (req, res) => {
        try {
            const result = await fetchJson(`${baseURL}/schedule`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/detail', async (req, res) => {
        const { slug } = req.query;
        if (!slug) return res.status(400).json({ status: false, error: 'Slug is required' });
        try {
            const result = await fetchJson(`${baseURL}/anime/${slug}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/completed', async (req, res) => {
        const page = req.query.page || 1;
        try {
            const result = await fetchJson(`${baseURL}/complete-anime?page=${page}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/ongoing', async (req, res) => {
        const page = req.query.page || 1;
        try {
            const result = await fetchJson(`${baseURL}/ongoing-anime?page=${page}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/genres', async (req, res) => {
        try {
            const result = await fetchJson(`${baseURL}/genre`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/genre', async (req, res) => {
        const { slug, page = 1 } = req.query;
        if (!slug) return res.status(400).json({ status: false, error: 'Slug is required' });
        try {
            const result = await fetchJson(`${baseURL}/genre/${slug}?page=${page}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/search', async (req, res) => {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ status: false, error: 'Keyword is required' });
        try {
            const result = await fetchJson(`${baseURL}/search/${keyword}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/episode', async (req, res) => {
        const { slug } = req.query;
        if (!slug) return res.status(400).json({ status: false, error: 'Slug is required' });
        try {
            const result = await fetchJson(`${baseURL}/episode/${slug}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

    app.get('/anime/batch', async (req, res) => {
        const { slug } = req.query;
        if (!slug) return res.status(400).json({ status: false, error: 'Slug is required' });
        try {
            const result = await fetchJson(`${baseURL}/batch/${slug}`);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

};
