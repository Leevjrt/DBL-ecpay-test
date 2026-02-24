const crypto = require('crypto');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { items, price } = body;

        // 1. 準備基礎參數
        const params = {
            ChoosePayment: 'ALL',
            EncryptType: '1',
            ItemName: (items || 'TestItem').substring(0, 20), // 限制長度
            MerchantID: '2000132',
            MerchantTradeDate: new Date(new Date().getTime() + 28800000).toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '/'),
            MerchantTradeNo: 'DBL' + Date.now(),
            OrderResultURL: 'https://designbylee.tw/',
            PaymentType: 'aio',
            ReturnURL: 'https://webhook.site/test',
            TotalAmount: (price || 1000).toString(),
            TradeDesc: 'FramerTest'
        };

        // 2. 鏈式計算 CheckMacValue (完全不使用變數，避免 ReferenceError)
        const sortedKeys = Object.keys(params).sort();
        const checkMacValue = crypto.createHash('sha256').update(
            encodeURIComponent(
                `HashKey=5294y06JbISpM5x9&` + 
                sortedKeys.map(key => `${key}=${params[key]}`).join('&') + 
                `&HashIV=v77hoKGq4kWxJtNp`
            ).toLowerCase()
            .replace(/%20/g, '+')
            .replace(/%2d/g, '-')
            .replace(/%5f/g, '_')
            .replace(/%2e/g, '.')
            .replace(/%21/g, '!')
            .replace(/%2a/g, '*')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
        ).digest('hex').toUpperCase();

        // 3. 輸出 HTML 表單
        const html = `
            <form id="_ecpay_form" method="post" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">
                ${Object.keys(params).map(key => `<input type="hidden" name="${key}" value="${params[key]}" />`).join('')}
                <input type="hidden" name="CheckMacValue" value="${checkMacValue}" />
                <script>document.getElementById("_ecpay_form").submit();</script>
            </form>
        `;

        res.status(200).json({ html });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
