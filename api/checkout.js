const crypto = require('crypto');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { items, price } = body;

        // 綠界測試參數
        const MerchantID = '2000132';
        const HashKey = '5294y06JbISpM5x9';
        const HashIV = 'v77hoKGq4kWxJtNp';

        // 格式化時間 YYYY/MM/DD HH:mm:ss
        const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
        const formattedDate = now.toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '/');

        // 1. 準備原始參數
        const params = {
            MerchantID,
            MerchantTradeNo: 'DBL' + Date.now(),
            MerchantTradeDate: formattedDate,
            PaymentType: 'aio',
            TotalAmount: (price || 1000).toString(),
            TradeDesc: 'FramerTest',
            ItemName: items || '測試商品',
            ReturnURL: 'https://webhook.site/test',
            ChoosePayment: 'ALL',
            EncryptType: '1',
            OrderResultURL: 'https://designbylee.tw/'
        };

        // 2. 計算 CheckMacValue (綠界加密流程)
        const sortedKeys = Object.keys(params).sort();
        let rawString = `HashKey=${HashKey}&` + sortedKeys.map(key => `${key}=${params[key]}`).join('&') + `&HashIV=${HashIV}`;
        rawString = encodeURIComponent(rawString).toLowerCase()
            .replace(/%2d/g, '-')
            .replace(/%5f/g, '_')
            .replace(/%2e/g, '.')
            .replace(/%21/g, '!')
            .replace(/%2a/g, '*')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')');
        
        const checkMacValue = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase();

        // 3. 產生自動提交表單
        const html = `
            <form id="_ecpay_form" method="post" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">
                ${Object.keys(params).map(key => `<input type="hidden" name="${key}" value="${params[key]}" />`).join('')}
                <input type="hidden" name="CheckMacValue" value="${checkMacValue}" />
            </form>
        `;

        res.status(200).json({ html });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
