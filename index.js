const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const app = express();
const PORT = process.env.PORT || 8080;
let lastQR = '', sockReady = false, statusMsg = 'Starting...';

async function startBot(){
  try{
    if(!fs.existsSync('./auth')) fs.mkdirSync('./auth');
    console.log('Mulai bot...');
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), browser: ['PacarBot','Chrome','1.0'] });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (up)=>{
      if(up.qr){ lastQR = up.qr; statusMsg='QR Ready'; console.log('QR BARU DIBUAT - BUKA LINK SEKARANG'); }
      if(up.connection==='open'){ lastQR='READY'; sockReady=true; console.log('BOT CONNECTED!'); }
      if(up.connection==='close'){ console.log('Reconnect...'); setTimeout(startBot,3000); }
    });
    sock.ev.on('messages.upsert', async ({messages})=>{
      const m=messages[0]; if(!m.message||m.key.fromMe) return;
      const txt=(m.message.conversation||m.message.extendedTextMessage?.text||'').toLowerCase();
      if(txt.includes('halo')||txt.includes('hai')) await sock.sendMessage(m.key.remoteJid,{text:'Hai sayang 😘❤️'});
    });
  }catch(e){ console.log('ERROR BOT: '+e.message); statusMsg='Error: '+e.message; }
}
startBot();

app.get('/', async (req,res)=>{
  if(sockReady) return res.send('<h1>✅ CONNECTED ❤️</h1>');
  if(lastQR){ const img=await QRCode.toDataURL(lastQR); return res.send(`<h1>SCAN QR INI</h1><img src="${img}" width="300"><p>${statusMsg}</p>`); }
  res.send(`<h1>${statusMsg}</h1><p>Tunggu 10 detik lalu refresh. Cek Deploy Logs harus ada "Mulai bot..."</p><script>setTimeout(()=>location.reload(),5000)</script>`);
});
app.listen(PORT, ()=>console.log('jalan '+PORT));
