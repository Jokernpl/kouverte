#!/usr/bin/env node
/**
 * Mantiene il tunnel localtunnel sempre attivo
 * Se si disconnette, riconne tte automaticamente
 *
 * USO: node start-stable-tunnel.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const LOG_FILE = path.join(__dirname, 'tunnel-stable.log');
let tunnelProcess = null;
let currentUrl = null;

function log(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}`;
  console.log(logMsg);
  fs.appendFileSync(LOG_FILE, logMsg + '\n');
}

function startTunnel() {
  log(`🔄 Avvio tunnel sulla porta ${PORT}...`);

  tunnelProcess = spawn('npx', ['localtunnel', '--port', PORT], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  let urlFound = false;

  tunnelProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    fs.appendFileSync(LOG_FILE, output);

    // Estrai URL
    const match = output.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
    if (match && !urlFound) {
      currentUrl = match[0];
      urlFound = true;
      log(`✅ TUNNEL ATTIVO: ${currentUrl}`);

      // Salva il link
      updateLinkFile(currentUrl);
    }
  });

  tunnelProcess.stderr.on('data', (data) => {
    console.error(data.toString());
    fs.appendFileSync(LOG_FILE, 'ERROR: ' + data.toString());
  });

  tunnelProcess.on('close', (code) => {
    log(`⚠️ Tunnel disconnesso (exit code: ${code})`);
    log(`🔄 Riconne zione in 5 secondi...`);
    setTimeout(startTunnel, 5000);
  });

  tunnelProcess.on('error', (err) => {
    log(`❌ Errore: ${err.message}`);
    log(`🔄 Riconne zione in 5 secondi...`);
    setTimeout(startTunnel, 5000);
  });
}

function updateLinkFile(url) {
  const linkFile = path.join(__dirname, 'INVITI_AMICI', 'LINK_APP.txt');
  const content = `🎙️ KOUVERTE VOX - LINK PER GLI AMICI
====================================

📱 ACCEDI ALL'APP QUI:
${url}/app.html

🎬 GUARDA IL VIDEO DEMO:
${url}/demo.html

🌐 LANDING PAGE:
${url}/splash.html

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COME INIZIARE:

1. Clicca su uno dei link sopra
2. Clicca "Registrati Gratis"
3. Inserisci: Email + Password + Username
4. Accedi
5. Registra la tua voce
6. Scopri altri utenti
7. Swipa per trovare match
8. Chiatta in real-time!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 VUOI TESTARE PRIMA?

Email: test1@kouverte.local
Password: Test123456

⏰ Aggiornato: ${new Date().toLocaleString('it-IT')}
`;

  fs.writeFileSync(linkFile, content);
  log(`📄 File link aggiornato: INVITI_AMICI/LINK_APP.txt`);
}

// Gestisci interruzione
process.on('SIGINT', () => {
  log('🛑 Chiusura tunnel...');
  if (tunnelProcess) {
    tunnelProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 Chiusura tunnel...');
  if (tunnelProcess) {
    tunnelProcess.kill();
  }
  process.exit(0);
});

// Avvia
log('🚀 STABLE TUNNEL MANAGER AVVIATO');
log(`📝 Log: ${LOG_FILE}`);
startTunnel();

// Status ogni 30 secondi
setInterval(() => {
  if (currentUrl) {
    log(`✅ TUNNEL STABILE: ${currentUrl}`);
  } else {
    log(`⏳ In attesa di tunnel...`);
  }
}, 30000);
