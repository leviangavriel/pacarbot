const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
let lastQR = '';

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
    }
});

client.on('qr', qr => { lastQR = qr; console.log('QR BARU'); });
client.on('ready', () => { lastQR = 'READY'; console.log('READY'); console.log('BOT PACAR SIAP!'); });

client.on('message', async msg => {
    try {
        if(msg.fromMe) return;
        const t = msg.body.toLowerCase();
        console.log('Pesan masuk: '+t);
        if(t.includes('halo') || t.includes('hai')) await msg.reply('Hai sayang 😘❤️ lagi apa? kangen nih');
        else if(t.includes('kangen')) await msg.reply('Aku juga kangen banget sayang 🥺❤️ sini peluk');
        else if(t.includes('ngantuk')) await msg.reply('Bobo ya sayangku 🌙❤️ jangan begadang, mimpiin aku ya');
        else if(t.includes('sayang')) await msg.reply('Iya sayangku ❤️ ada apa?');
        else await msg.reply('Iya sayang? ❤️ maaf tadi aku lagi mikirin kamu 😘');
    } catch(e){ console.log('Error balas: '+e.message); }
});

app.get('/', (req,res) => {
    if(lastQR=='READY') return res.send('<h1>✅ BOT UDAH CONNECT 24 JAM ❤️</h1><p>Bot siap bales chat! Coba chat "halo" dari nomor lain</p>');
    if(!lastQR) return res.send('<h1>⏳ Loading... refresh 15 detik lagi</h1>');
    res.send(`<h1>SCAN QR</h1><img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(lastQR)}">`);
});

app.listen(PORT, () => console.log('jalan '+PORT));
client.initialize();
