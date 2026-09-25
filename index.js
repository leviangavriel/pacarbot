const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const app = express();
const PORT = process.env.PORT || 8080;
let lastQR = '', sockReady = false, status = 'Starting...';

async function startBot() {
    try{
        const { state, saveCreds } = await useMultiFileAuthState('./auth');
        const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', async (up) => {
            const { qr, connection } = up;
            if(qr){ lastQR = qr; status = 'QR Ready - Silakan Scan'; console.log('QR BARU DIBUAT'); }
            if(connection === 'open'){ lastQR = 'READY'; sockReady = true; status = 'Connected!'; console.log('BOT CONNECT!'); }
            if(connection === 'close'){
                status = 'Reconnecting...'; lastQR=''; sockReady=false;
                setTimeout(startBot, 3000);
            }
        });
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0]; if(!msg.message || msg.key.fromMe) return;
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();
            if(text.includes('halo')||text.includes('hai')) await sock.sendMessage(msg.key.remoteJid, { text: 'Hai sayang 😘❤️ lagi apa? kangen nih' });
            else if(text) await sock.sendMessage(msg.key.remoteJid, { text: 'Iya sayangku ❤️ ada apa?' });
        });
    }catch(e){ status = 'Error: '+e.message; console.log(e); }
}
startBot();

app.get('/', async (req,res)=>{
    if(sockReady) return res.send('<h1>✅ CONNECTED 24 JAM ❤️</h1><p>Bot aktif! Chat "halo"</p>');
    if(lastQR && lastQR!=='READY'){
        const qrImg = await QRCode.toDataURL(lastQR);
        return res.send(`<h1>SCAN INI SEKARANG</h1><img src="${qrImg}" width="320"><p>${status}</p><script>setTimeout(()=>location.reload(),10000)</script>`);
    }
    res.send(`<h1>${status}</h1><p>⌛ Tunggu 15 detik, lalu refresh...<br>Jika masih loading, cek Railway Logs harus ada tulisan "QR BARU DIBUAT"</p><script>setTimeout(()=>location.reload(),5000)</script>`);
});
app.listen(PORT, ()=>console.log('jalan '+PORT));
