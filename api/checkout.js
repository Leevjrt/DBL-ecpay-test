const crypto = require('crypto');

export default async function handler(req, res) {
    // 1. 強制開啟所有 CORS 權限
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 處理瀏覽器的預檢請求 (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { items, price } = body;

        const HashKey = '5294y06JbISpM5x9';
        const HashIV = 'v77hoKGq4kWxJtNp';

        // 台灣時間 YYYY/MM/DD HH:mm:ss
        const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
        const formattedDate = now.toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '/');

        // 準備參數 (按字母 A-Z 排序)
        const params = {
            ChoosePayment: 'ALL',
            EncryptType: '1',
            ItemName: (items || 'TestItem').substring(0, 20), 
            MerchantID: '2000132',
            MerchantTradeDate: formattedDate,
            MerchantTradeNo: 'DBL' + Date.now(),
            OrderResultURL: 'https://designbylee.tw/',
            PaymentType: 'aio',
            ReturnURL: 'https://webhook.site/test',
            TotalAmount: (price || 1000).toString(),
            TradeDesc: 'FramerTest'
        };

        // 3. 計算 CheckMacValue (關鍵修正點)
        const sortedKeys = Object.keys(params).sort();
        
        // 確保先定義 rawString 變數再使用
        let rawString = `HashKey=${HashKey}&` + sortedKeys.map(key => `${key}=${params[key]}`).join('&') + `&HashIV=${HashIV}`;

        // 綠界專用 URL Encode 規範
        rawString = encodeURIComponent(rawString).toLowerCase()
            .replace(/%20/g, '+')
            .replace(/%2d/g, '-')
            .replace(/%5f/g, '_')
            .replace(/%2e/g, '.')
            .replace(/%21/g, '!')
            .replace(/%2a/g, '*')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')');

        const checkMacValue = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase();

        // 4. 回傳自動跳轉表單
        const html = `
            <form id="_ecpay_form" method="post" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">
                ${Object.keys(params).map(key => `<input type="hidden" name="${key}" value="${params[key]}" />`).join('')}
                <input type="hidden" name="CheckMacValue" value="${checkMacValue}" />
                <script>document.getElementById("_ecpay_form").submit();</script>
            </form>
        `;

        res.status(200).json({ html });
    } catch (err) {
        console.error("Debug Error:", err.message);
        res.status(500).json({ error: err.message });
    }
}
