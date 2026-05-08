// ============================================================
// VOX · ngrok Tunnel
// ============================================================
const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const URL_FILE = path.join(__dirname, 'tunnel-url.txt');

async function startTunnel() {
    try {
        const url = await ngrok.connect(PORT);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  ✓ NGROK TUNNEL ATTIVO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  URL pubblico:  ' + url);
        console.log('  Mini App:      ' + url + '/tg.html');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Salva URL su file
        try { fs.writeFileSync(URL_FILE, url); } catch(e) {}

    } catch (err) {
        console.error('❌ Errore ngrok:', err.message);
        process.exit(1);
    }
}

console.log('🚀 Avvio ngrok tunnel...');
startTunnel();

// Mantieni il processo vivo
process.on('SIGINT', async () => {
    console.log('\n🛑 Chiusura tunnel...');
    await ngrok.disconnect();
    process.exit(0);
});
