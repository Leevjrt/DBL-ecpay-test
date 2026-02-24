const ecpay_aio_nodejs = require('ecpay_aio_nodejs');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // 解析 Body，並加上防錯機制
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { items, price } = body;

        const options = {
            OperationMode: 'Test',
            MerchantID: '2000132',
            HashKey: '5294y06JbISpM5x9',
            HashIV: 'v77hoKGq4kWxJtNp',
        };

        // 核心修正：強制轉換為台灣時間格式 (YYYY/MM/DD HH:mm:ss)
        const now = new Date();
        const tpeTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 轉 TPE 時區
        const formattedDate = tpeTime.toISOString()
            .replace(/T/, ' ')
            .replace(/\..+/, '')
            .replace(/-/g, '/');

        const create = new ecpay_aio_nodejs(options);
        const base_param = {
            MerchantTradeNo: 'DBL' + Date.now(),
            MerchantTradeDate: formattedDate, 
            TotalAmount: (price || 1000).toString(),
            TradeDesc: 'Framer Test',
            ItemName: items || '測試商品',
            ReturnURL: 'https://webhook.site/test',
            OrderResultURL: 'https://designbylee.tw/',
            ChoosePayment: 'ALL',
            EncryptType: '1',
        };

        const html = create.payment_client.aio_check_out_all(base_param);
        res.status(200).json({ html });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
}
