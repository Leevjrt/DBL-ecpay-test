const ecpay_aio_nodejs = require('ecpay_aio_nodejs');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { items, price } = JSON.parse(req.body);
        const options = {
            OperationMode: 'Test',
            MerchantID: '2000132',
            HashKey: '5294y06JbISpM5x9',
            HashIV: 'v77hoKGq4kWxJtNp',
        };

        const create = new ecpay_aio_nodejs(options);
        const now = new Date();
        const formattedDate = now.getFullYear() + '/' + 
            ('0' + (now.getMonth() + 1)).slice(-2) + '/' + 
            ('0' + now.getDate()).slice(-2) + ' ' + 
            ('0' + now.getHours()).slice(-2) + ':' + 
            ('0' + now.getMinutes()).slice(-2) + ':' + 
            ('0' + now.getSeconds()).slice(-2);

        const base_param = {
            MerchantTradeNo: 'DBL' + Date.now(), 
            MerchantTradeDate: formattedDate,
            TotalAmount: price.toString(),
            TradeDesc: 'Framer電商測試',
            ItemName: items,
            ReturnURL: 'https://webhook.site/test',
            OrderResultURL: 'https://designbylee.tw/', 
            ChoosePayment: 'ALL',
            EncryptType: '1',
        };

        const html = create.payment_client.aio_check_out_all(base_param);
        res.status(200).json({ html });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
