const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const app = express();
let lastQR = null, isReady = false;

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    auth: state,
    logger: pino({level:'silent'}),
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u)=>{
    if(u.qr){ lastQR = u.qr; console.log('QR SIAP'); }
    if(u.connection === 'open'){ lastQR = null; isReady = true; console.log('BOT CONNECTED SUKSES'); }
    if(u.connection === 'close'){ isReady=false; console.log('PUTUS, COBA LAGI...'); setTimeout(startBot,3000); }
  });

  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0];
    if(!msg ||!msg.message) return;
    const from = msg.key.remoteJid;
    if(from.includes('@g.us')) return;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    console.log('PESAN MASUK: '+text+' dari '+from);
    try{
      await sock.sendMessage(from, { text: 'Aku di sini sayang ❤️ kamu bilang: '+text });
      console.log('BERHASIL BALES');
    }catch(e){ console.log('GAGAL BALES: '+e.message); }
  });
}

startBot();

app.get('/', async (req,res)=>{
  if(isReady) return res.send('<h1>✅ BOT AKTIF 24 JAM</h1><p>Coba chat dari HP LAIN</p>');
  if(lastQR){ const img = await QRCode.toDataURL(lastQR); return res.send(`<h1>SCAN CEPAT - 15 detik ganti</h1><img src="${img}" width="300"><script>setTimeout(()=>location.reload(),15000)</script>`); }
  res.send('<h1>Tunggu... 10 detik lagi</h1><script>setTimeout(()=>location.reload(),3000)</script>');
});

app.listen(process.env.PORT||8080, ()=>console.log('jalan'));
