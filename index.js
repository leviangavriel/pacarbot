const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

const PACAR = '628xxxxxxxxxx@c.us'; // GANTI NOMOR PACAR KAMU

client.on('qr', qr => {
    console.log('SCAN QR INI:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => console.log('BOT PACAR SIAP ❤️'));
client.on('message', async msg => {
    if(msg.from === PACAR && msg.body.toLowerCase().includes('ngantuk')){
        msg.reply('Bobo ya cantik 🌙 mimpiin aku ya ❤️');
    }
});

client.initialize();
const app = express();
app.get('/', (req,res)=>res.send('bot jalan'));
app.listen(3000);
