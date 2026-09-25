const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
let lastQR = '';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
    }
});

client.on('qr', qr => { lastQR = qr; console.log('QR DAPET'); });
client.on('ready', () => { lastQR = 'READY'; console.log('READY'); });
client.on('message', async msg => {
    const t = msg.body.toLowerCase();
    if(t.includes('halo')||t.includes('hai')) msg.reply('Hai sayang 😘 lagi apa?');
    if(t.includes('kangen')) msg.reply('Aku juga kangen banget 🥺❤️');
    if(t.includes('ngantuk')) msg.reply('Bobo ya sayang 🌙❤️');
});

app.get('/', (req,res) => {
    if(lastQR=='READY') return res.send('<h1>✅ BOT UDAH CONNECT ❤️</h1>');
    if(!lastQR) return res.send('<h1>⏳ Tunggu 20 detik lagi... refresh halaman ini</h1>');
    res.send(`<h1>SCAN QR INI</h1><img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(lastQR)}"><p>WA > Linked Devices > Link Device</p><p>Refresh kalo gak bisa</p>`);
});

app.listen(PORT, () => console.log('jalan '+PORT));
client.initialize();
