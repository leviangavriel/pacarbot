const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const app = express();
let lastQR = null, isReady = false, globalSock = null;

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ version, auth: state, logger: pino({level:'silent'}), printQRInTerminal:false, markOnlineOnConnect:true });
  globalSock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u)=>{
    if(u.qr){ lastQR = u.qr; console.log('QR SIAP'); }
    if(u.connection === 'open'){ lastQR = null; isReady = true; console.log('BOT AKTIF SUKSES'); }
    if(u.connection === 'close'){ isReady=false; setTimeout(startBot,3000); }
  });
  sock.ev.on('messages.upsert', async ({messages, type})=>{
    if(type!== 'notify') return;
    const msg = messages[0];
    if(!msg || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    if(from.includes('@g.us') || from.includes('status@broadcast')) return;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if(!text.trim()) return;
    console.log('CHAT: '+text);
    try{
      await sock.sendMessage(from, { text: `sayang aku denger: ${text} ❤️` });
      console.log('TERKIRIM KE '+from);
    }catch(e){ console.log('GAGAL: '+e); }
  });
}
startBot();

app.get('/', async (req,res)=>{
  if(isReady) return res.send('<h1>✅ BOT AKTIF</h1><p>Tes kirim: /kirim?no=628xxxx&pesan=halo</p>');
  if(lastQR){ const img = await QRCode.toDataURL(lastQR); return res.send(`<img src="${img}" width="300">`); }
  res.send('loading...');
});

app.get('/kirim', async (req,res)=>{
  const no = req.query.no; const pesan = req.query.pesan || 'tes bot aktif';
  if(!globalSock) return res.send('bot belum siap');
  try{
    const jid = no.includes('@s.whatsapp.net')? no : no + '@s.whatsapp.net';
    await globalSock.sendMessage(jid, { text: pesan });
    res.send('✅ BERHASIL KIRIM KE '+no+' -> cek WA nya');
    console.log('MANUAL KIRIM SUKSES KE '+no);
  }catch(e){ res.send('GAGAL: '+e.message); }
});

app.listen(process.env.PORT||8080);
