// ============================================================
// VOX · Tunnel HTTPS auto-reconnect
// ============================================================
const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const URL_FILE = path.join(__dirname, 'tunnel-url.txt');

let currentTunnel = null;
let reconnecting = false;

async function openTunnel() {
    if (reconnecting) return;
    reconnecting = true;
    try {
        // Niente subdomain custom — più affidabile (localtunnel li rifiuta a volte)
        const tunnel = await localtunnel({ port: PORT });
        currentTunnel = tunnel;
        const url = tunnel.url;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  ✓ TUNNEL ATTIVO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  URL pubblico:  ' + url);
        console.log('  Mini App:      ' + url + '/tg.html');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Scrivi l'URL su file (così altri processi possono leggerlo)
        try { fs.writeFileSync(URL_FILE, url); } catch(e) {}

        tunnel.on('close', () => {
            console.log('🔴 [' + new Date().toLocaleTimeString() + '] Tunnel chiuso — riconnetto in 3s...');
            currentTunnel = null;
            reconnecting = false;
            setTimeout(openTunnel, 3000);
        });

        tunnel.on('error', (err) => {
            console.error('⚠ [' + new Date().toLocaleTimeString() + '] Errore tunnel:', err.message);
        });

        // Health check ogni 30s — se il tunnel non risponde, riavvia
        startHealthCheck(url);

        reconnecting = false;
    } catch (e) {
        console.error('❌ Apertura tunnel fallita:', e.message);
        reconnecting = false;
        setTimeout(openTunnel, 5000); // retry tra 5s
    }
}

let healthInterval = null;
function startHealthCheck(url) {
    if (healthInterval) clearInterval(healthInterval);
    healthInterval = setInterval(async () => {
        try {
            // Check localhost direttamente, non il tunnel pubblico (è più affidabile)
            const r = await fetch('http://localhost:' + PORT + '/api/health', { signal: AbortSignal.timeout(5000) });
            if (!r.ok) {
                console.log('⚠ [' + new Date().toLocaleTimeString() + '] Health check failed: ' + r.status);
                // NON chiudere tunnel se il server va giù, mantieni il tunnel aperto
            }
        } catch (e) {
            // Server locale non risponde, ma mantieni il tunnel
            // (potrebbe essere un problema temporaneo)
        }
    }, 60000); // ogni 60 secondi, check meno frequente
}

console.log('\n🌐 VOX Tunnel · auto-reconnect attivo');
console.log('   PC server: localhost:' + PORT);
console.log('   Premi CTRL+C per chiudere.\n');

openTunnel();

process.on('SIGINT', () => {
    console.log('\n🛑 Chiusura...');
    if (healthInterval) clearInterval(healthInterval);
    if (currentTunnel) currentTunnel.close();
    process.exit(0);
});
