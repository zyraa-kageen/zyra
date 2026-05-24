import axios from 'axios';

export default function(app) {

    app.get('/ai/gemini', async (req, res) => {
        const { prompt, sessionId } = req.query;
        if (!prompt) return res.status(400).json({ status: false, error: 'Prompt is required' });

        try {
            const params = { prompt };
            if (sessionId) params.sessionId = sessionId;

            const { data } = await axios.get('https://v2.api-varhad.my.id/ai/gemini', {
                params,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!data?.status) return res.status(500).json({ status: false, error: 'Failed to get response' });

            res.status(200).json({
                status: true,
                result: {
                    text: data.result?.text || '',
                    sessionId: data.result?.sessionId || null
                }
            });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

}