const axios = require('axios');
const cheerio = require('cheerio');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const randomIP = () =>
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://deep-seek.ai',
        'Referer': 'https://deep-seek.ai/',
        'X-Forwarded-For': randomIP(),
        'X-Real-IP': randomIP(),
        'Client-IP': randomIP()
    }
}));

async function Deepseek(prompt) {
    try {
        const landing = await client.get('https://deep-seek.ai/');
        const $ = cheerio.load(landing.data);
        let csrfToken = $('meta[name="csrf-token"]').attr('content') || $('input[name="_token"]').val();
        if (!csrfToken) throw new Error('Gagal mendapatkan CSRF Token.');

        const response = await client.post(
            'https://deep-seek.ai/api/chat',
            {
                model: 'deepseek/deepseek-chat-v3.1',
                messages: [{ role: 'user', content: prompt }],
                stream: true
            },
            {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'X-Forwarded-For': randomIP()
                },
                responseType: 'stream'
            }
        );

        return await new Promise((resolve, reject) => {
            let result = '';
            response.data.on('data', chunk => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    const cleanLine = line.trim();
                    if (cleanLine.startsWith('data: ') && !cleanLine.includes('[DONE]')) {
                        try {
                            const json = JSON.parse(cleanLine.substring(6));
                            const content = json.choices?.[0]?.delta?.content;
                            if (content) result += content;
                        } catch (e) {}
                    }
                }
            });
            response.data.on('end', () => resolve(result));
            response.data.on('error', err => reject(err));
        });
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function(app) {

    app.get('/ai/deepseek', async (req, res) => {
        const { text } = req.query;
        if (!text) return res.status(400).json({ status: false, error: 'Text is required' });
        try {
            const result = await Deepseek(text);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

};
