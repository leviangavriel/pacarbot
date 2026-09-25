const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const app = express();
const PORT = process.env.PORT || 8080;
let lastQR = '', sockReady = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (up) => {
        const { qr, connection, lastDisconnect } = up;
        if(qr){ lastQR = qr; sockReady = false; console.log('QR BARU'); }
        if(connection === 'open'){ lastQR = 'READY'; sockReady = true; console.log('READY - BOT CONNECT'); }
        if(connection === 'close'){
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        }
    });
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if(!msg.message || msg.key.fromMe) return;
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();
            console.log('Masuk: '+text);
            let reply = '';
            if(text.includes('halo')||text.includes('hai')) reply='Hai sayang 😘❤️ lagi apa? kangen nih';
            else if(text.includes('kangen')) reply='Aku juga kangen banget sayang 🥺❤️ sini peluk virtual dulu';
            else if(text.includes('ngantuk')) reply='Bobo ya sayangku 🌙❤️ mimpiin aku ya';
            else if(text.includes('sayang')) reply='Iya sayangku ❤️ ada apa? aku disini kok';
            if(reply) await sock.sendMessage(msg.key.remoteJid, { text: reply });
        } catch(e){ console.log(e); }
    });
}
startBot();

app.get('/', async (req,res)=>{
    if(sockReady) return res.send('<h1>✅ BOT UDAH CONNECT 24 JAM ❤️</h1><p>Coba chat "halo" dari nomor lain</p>');
    if(!lastQR) return res.send('<h1>⏳ Loading QR... refresh 10 detik</h1>');
    const qrImg = await QRCode.toDataURL(lastQR);
    res.send(`<h1>SCAN QR INI</h1><img src="${qrImg}" width="300"><p>WA > Linked Devices > Link Device</p><script>setTimeout(()=>location.reload(),15000)</script>`);
});
app.listen(PORT, ()=>console.log('jalan '+PORT));
