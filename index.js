  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0];
    if(!msg ||!msg.message) return;
    const from = msg.key.remoteJid;
    if(from.includes('@g.us')) return; // skip grup
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    console.log('PESAN MASUK: '+text+' dari '+from);
    try{
      await sock.sendMessage(from, { text: 'Aku di sini sayang ❤️ kamu bilang: '+text });
      console.log('BERHASIL BALES');
    }catch(e){ console.log('GAGAL BALES: '+e.message); }
  });
