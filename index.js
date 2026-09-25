const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const app = express();
let lastQR = null, isReady = false;

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ version, auth: state, logger: pino({level:'silent'}), printQRInTerminal:false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u)=>{
    if(u.qr){ lastQR = u.qr; console.log('QR SIAP'); }
    if(u.connection === 'open'){ lastQR = null; isReady = true; console.log('BOT AKTIF SUKSES'); }
    if(u.connection === 'close'){ isReady=false; console.log('PUTUS'); setTimeout(startBot,3000); }
  });
  sock.ev.on('messages.upsert', async ({messages})=>{
    try{
      const msg = messages[0];
      if(!msg ||!msg.message || msg.key.fromMe) return;
      const from = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      console.log('ADA PESAN: '+text);
      if(text){
        await new Promise(r=>setTimeout(r,1000));
        await sock.sendMessage(from, { text: 'sayang aku denger kamu bilang: '+text+' ❤️' });
        console.log('SUDAH DIBALES');
      }
    }catch(e){ console.log('ERROR: '+e); }
  });
}
startBot();
app.get('/', async (req,res)=>{
  if(isReady) return res.send('<h1>✅ BOT AKTIF</h1><p>Chat dari HP LAIN sekarang!</p>');
  if(lastQR){ const img = await QRCode.toDataURL(lastQR); return res.send(`<img src="${img}" width="300"><script>setTimeout(()=>location.reload(),10000)</script>`); }
  res.send('loading...');
});
app.listen(process.env.PORT||8080);
