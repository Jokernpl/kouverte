#!/usr/bin/env node
// ============================================================
// VOX · Tunnel (ngrok) - AFFIDABILE
// ============================================================
const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const URL_FILE = path.join(__dirname, 'TUNNEL_URL.txt');

async function start() {
    try {
        console.log('\n🔗 Apertura tunnel ngrok...');
        const url = await ngrok.connect(PORT);

        console.log('\n' + '═'.repeat(60));
        console.log('  ✅ TUNNEL ATTIVO (ngrok)');
        console.log('═'.repeat(60));
        console.log('  URL pubblico:  ' + url);
        console.log('  Mini App:      ' + url + '/tg.html');
        console.log('  Admin:         ' + url + '/admin.html');
        console.log('═'.repeat(60) + '\n');

        // Salva URL
        fs.writeFileSync(URL_FILE, url);
        console.log('📝 URL salvato in TUNNEL_URL.txt\n');

        // Mantieni tunnel aperto
        console.log('🟢 Tunnel attivo. Premi CTRL+C per chiudere.\n');

    } catch (err) {
        console.error('\n❌ Errore tunnel:', err.message);
        process.exit(1);
    }
}

// Shutdown graceful
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Chiusura tunnel...');
    await ngrok.disconnect();
    console.log('✓ Done.\n');
    process.exit(0);
});

start();
