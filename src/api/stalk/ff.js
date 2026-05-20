const axios = require('axios');

async function ffstalk(userId) {
    const data = {
        "voucherPricePoint.id": 8050,
        "voucherPricePoint.price": "",
        "voucherPricePoint.variablePrice": "",
        "email": "",
        "n": "",
        "userVariablePrice": "",
        "order.data.profile": "",
        "user.userId": userId,
        "voucherTypeName": "FREEFIRE",
        "affiliateTrackingId": "",
        "impactClickId": "",
        "checkoutId": "",
        "tmwAccessToken": "",
        "shopLang": "in_ID"
    };

    const ff = await axios({
        headers: { "Content-Type": "application/json; charset=utf-8" },
        method: "POST",
        url: "https://order.codashop.com/id/initPayment.action",
        data
    });

    return {
        id: userId,
        nickname: ff.data["confirmationFields"]["roles"][0]["role"]
    };
}

module.exports = function(app) {

    app.get('/stalk/freefire', async (req, res) => {
        const { id } = req.query;
        if (!id) return res.status(400).json({ status: false, error: 'User ID is required' });
        try {
            const result = await ffstalk(id);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });

};