# 📦 KOUVERTE — PACCHETTO COMPLETO

**Versione**: 2026-05-18
**Tagline**: ⚡ Voice Dating on Bitcoin
**Repo**: https://github.com/Jokernpl/kouverte-vox
**Sito live**: https://www.kouverte.com
**Hosting**: Render.com (auto-deploy da `main`)

---

## 1. SITO WEB (Telegram Mini App + Web)

### URL pubblici
| URL | Cosa fa |
|---|---|
| `https://www.kouverte.com/` | Landing page (index.html) |
| `https://www.kouverte.com/app.html` | App principale (Mini App Telegram) |
| `https://www.kouverte.com/privacy.html` | GDPR Privacy Policy |
| `https://www.kouverte.com/terms.html` | Termini di servizio (18+, BTC non rimborsabile) |
| `https://www.kouverte.com/tg.html` | Redirect a app.html (compatibilità vecchi link) |

### Funzionalità del sito (app.html)
**Tab principali nella bottom nav:**
1. **🏠 Home** — Storie vocali, profili trending, nuovi profili
2. **🔍 Esplora** — Feed di profili con voce + sistema like (con cap giornaliero)
3. **🎙 Stanze** — Chat vocali pubbliche WebRTC
4. **⚔️ Arena** — Voice Battles 1v1 con boost in sats (NUOVO!)
5. **💬 Chat** — Conversazioni private con i match
6. **👑 Premium** — Piani Pro/Elite/Infinity, cornici BTC, frames colorate
7. **👤 Profilo** — Avatar, cornice, post vocali, link privacy/terms

**Feature trasversali:**
- ✅ Registrazione + login (email/password con bcrypt)
- ✅ Forgot/reset password via Telegram bot
- ✅ Auth via Telegram (auto-login da Mini App)
- ✅ Onboarding 3-step (welcome 18+, record voce, ready)
- ✅ Block/Report utenti
- ✅ Chiamate WebRTC 1:1 con i match (mute, timer, ringtone)
- ✅ Pagamenti Bitcoin con verifica blockchain (4 conferme)
- ✅ Notifiche Telegram per like/match/messaggi/battle
- ✅ Match (like reciproco) + chat testuale

### 🎯 ARENA (Voice Battles) — feature flagship
- 2 utenti si sfidano live per **3 minuti**
- **Audio WebRTC live**: i 2 sfidanti parlano in tempo reale, spettatori ascoltano (mesh con STUN)
- Spettatori boostano con **sats** (10/50/200 a tier)
- Barra HP centrale si sposta in tempo reale
- **Distribuzione pot**: 70% vincitore, 20% perdente, 10% piattaforma
- Pareggio → rimborso 50/50
- Notifica TG al vincitore con sats accreditati
- **👑 Champion badge** sul vincitore per 24h (mostrato in battle view e profilo)
- **W/L tracking**: ogni battle aggiorna `battle_wins`/`battle_losses` sul profilo
- **Anti-whale**: max 5.000 sats di boost per utente per battle
- **Notifiche realtime in-app** (socket) + Telegram per inviti sfida

**Ricarica sats:**
- **Da Crediti interni**: 1 credito = 5.000 sats (immediato)
- **Da Bitcoin**: pack 1k/5k/25k sats con QR + verifica on-chain
- Tap sul chip balance → modal topup

---

## 2. BOT TELEGRAM

**Username**: `@Kouverte_bot`
**Token**: variabile `TELEGRAM_BOT_TOKEN` su Render
**File**: `tg-bot.js` (avvio separato: `node tg-bot.js`)

### Comandi disponibili
| Comando | Cosa fa |
|---|---|
| `/start` | Welcome + apri Mini App, supporta `?start=ref_XXX` per referral |
| `/menu` | Menu inline con scorciatoie ai comandi |
| `/profilo` | Mostra profilo Telegram dell'utente con foto |
| `/cornici` | Listino cornici (prezzi EUR + BTC equivalenti live) |
| `/premium` | Piani Pro/Elite/Infinity con prezzi |
| `/bitcoin` | Info indirizzo BTC + come pagare |
| `/stanze` | Lista stanze vocali attive |
| `/invita` | Genera card di invito con link referral |
| `/guadagni` | Mostra guadagni referral (placeholder) |
| `/aiuto` o `/help` | Lista completa comandi |
| `/reset` | Cache-bust forza il browser a ricaricare |

### Notifiche automatiche inviate dal bot
- 💖 Nuovo like ricevuto
- 🎉 Match (entrambe le direzioni)
- 💬 Nuovo messaggio privato (con preview 80 char)
- ⚔️ Sfida battle ricevuta
- 👑 Vincita battle (+sats)
- ⚡ Topup sats confermato
- 🔐 Reset password (token valido 60 min)

### Avvio del bot
**In locale (Windows):**
```
node tg-bot.js
```
**Su Render**: serve secondo Web Service che esegue `node tg-bot.js` (oppure usa `npm run bot`).

---

## 3. PANNELLO ADMIN

✅ **UI admin disponibile**: vai su `https://www.kouverte.com/admin.html` e accedi con un account che ha `is_admin: true`. La pagina è indicizzata `noindex,nofollow`.

### Come diventare admin
Modifica manualmente `vox-data.json` sul server e imposta `is_admin: true` sul tuo utente, poi riavvia il server. Esempio:
```json
{ "id": "u_xxx", "email": "tua@email.it", "is_admin": true, ... }
```

### Endpoint admin disponibili
Tutti richiedono header `Authorization: Bearer <token>` con utente admin.

| Endpoint | Metodo | Cosa fa |
|---|---|---|
| `/api/admin/stats` | GET | Stats globali: utenti, storie, reazioni, battles attive |
| `/api/admin/users` | GET | Lista tutti gli utenti (senza password_hash) |
| `/api/admin/stories` | GET | Lista storie (max 100) |
| `/api/admin/battles` | GET | Lista battles (max 50) |
| `/api/admin/users/:id` | DELETE | Elimina utente + cascade (storie, reazioni, battles, crediti, inventario, txn) |
| `/api/admin/stories/:id` | DELETE | Elimina storia + reazioni |
| `/api/admin/battles/:id` | DELETE | Elimina battle |
| `/api/admin/bitcoin-confirm` | POST | Conferma manuale pagamento BTC dopo 4 conferme on-chain |
| `/api/admin/fix-credits` | POST | Ripara crediti orfani |

### TODO admin (da fare)
- [ ] Creare `admin.html` con form login + dashboard
- [ ] Tabella users con bottone "ban" / "promote admin"
- [ ] Vista live battles in corso
- [ ] Conferma pagamenti BTC con un click

---

## 4. STACK TECNICO

| Componente | Tecnologia |
|---|---|
| Backend | Node.js + Express |
| Real-time | Socket.io 4.5 (WebRTC signaling + battle events) |
| DB | JSON file (`vox-data.json`) + backup automatico (`vox-data.bak.json`) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Payment | Bitcoin on-chain (verifica blockchain via mempool.space) |
| Bot | node-telegram-bot-api 0.66 |
| Frontend | Vanilla JS + CSS (no framework, single file `app.html` ~4900 righe) |
| Telegram | telegram-web-app.js (Mini App SDK) |
| Voice | WebRTC P2P + Socket.io signaling |
| Hosting | Render.com |

---

## 5. VARIABILI D'AMBIENTE (.env)

```bash
# Server
PORT=8082
HOST=0.0.0.0
JWT_SECRET=<lunga-stringa-random>

# Bitcoin
BITCOIN_ADDRESS=bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00
BITCOIN_MIN_CONFIRMATIONS=4

# Telegram
TELEGRAM_BOT_TOKEN=<token-da-BotFather>
BOT_USERNAME=Kouverte_bot
WEBAPP_URL=https://www.kouverte.com/app.html
PUBLIC_URL=https://www.kouverte.com

# Lightning Network (opzionale) — supporta 2 provider

# OPZIONE A: Coinos (raccomandato, no-KYC, no setup)
LIGHTNING_ENABLED=1
LIGHTNING_PROVIDER=coinos
COINOS_TOKEN=<Bearer JWT da Settings/API del tuo account Coinos>

# OPZIONE B: LNbits (self-hosted o istanza pubblica)
LIGHTNING_ENABLED=1
LIGHTNING_PROVIDER=lnbits
LNBITS_URL=https://legend.lnbits.com
LNBITS_INVOICE_KEY=<chiave invoice/admin>
```

### Setup Lightning con Coinos (più rapido, raccomandato)
1. Registrati su https://coinos.io (no KYC, gratis)
2. **Cambia password** dopo il primo login
3. Vai su Settings → API → copia il Bearer token JWT
4. Su Render dashboard imposta:
   - `LIGHTNING_ENABLED=1`
   - `LIGHTNING_PROVIDER=coinos`
   - `COINOS_TOKEN=<il-tuo-jwt>`
5. Redeploy → tab "⚡ Lightning" in Topup Sats diventa attiva
6. Pagamenti accreditati in <5 secondi anziché 30+ min on-chain

### Setup alternativo con LNbits
1. Crea wallet su LNbits (legend.lnbits.com o self-hosted)
2. Copia "Invoice/read key" dalle API Info
3. Imposta `LIGHTNING_PROVIDER=lnbits` + `LNBITS_URL` + `LNBITS_INVOICE_KEY`

---

## 6. STRUTTURA FILE

```
Kouverte-Voice/
├── vox-server.js       ← Backend principale (~2030 righe)
├── server.js           ← Alias che richiama vox-server.js
├── tg-bot.js           ← Bot Telegram
├── app.html            ← Mini App principale (~4900 righe)
├── index.html          ← Landing page
├── privacy.html        ← GDPR
├── terms.html          ← Termini 18+
├── tg.html             ← Redirect a app.html
├── package.json        ← npm start = vox-server, npm run bot = tg-bot
├── vox-data.json       ← DB (auto-creato al primo avvio)
├── vox-data.bak.json   ← Backup automatico DB
├── bitcoin-service.js  ← Verifica blockchain
└── _archive/           ← File vecchi NON usati (escluso da git)
```

---

## 7. PIANI PREZZI ATTUALI

### Cornici Avatar (EUR + BTC live)
| Cornice | Prezzo EUR |
|---|---|
| Ivory | Gratis |
| Gold | €3 |
| Emerald / Ruby | €5 |
| Sapphire / Amethyst | €8 |
| Topaz | €12 |
| Onyx | €15 |
| Platinum | €20 |
| Diamond | €50 |

### Piani Premium
| Piano | EUR/mese | Cosa include |
|---|---|---|
| Pro | €5 | Storie 14 giorni, +20% XP |
| Elite | €10 | Storie 30 giorni, +50% XP, boost illimitato |
| Infinity | €20 | Tutto + badge esclusivo |

### Pack Sats (Arena)
| Pack | Sats | BTC |
|---|---|---|
| Starter | 1.000 | 0.00001050 |
| Combat | 5.000 | 0.00005250 |
| Champion | 25.000 | 0.00026250 |

---

## 8. PROSSIMI PASSI POSSIBILI

**Quick wins:**
- ✅ ~~Audio WebRTC live nella battle~~
- ✅ ~~Champion badge + cronologia W/L sul profilo~~
- ✅ ~~Notifica in-app real-time per inviti battle~~
- ✅ ~~Form reset password nel frontend~~
- ✅ ~~Pannello admin UI (admin.html)~~
- ✅ ~~Cancel battle + spectator mute toggle~~
- ✅ ~~Onboarding lazy + 10 voice prompts guidati~~
- ✅ ~~Match reveal animato (avatar pulse + heart rain + auto-call)~~
- ✅ ~~30 profili seed italiani + città nel feed~~
- ✅ ~~Effetti boost (particelle + screen shake + floating number)~~
- ✅ ~~Filtri distanza GPS (≤10/50/200km)~~
- ✅ ~~Lightning Network (LNbits) per topup istantaneo~~
- TURN server per WebRTC NAT simmetrico (coturn esterno o servizio gestito)
- Multi-lingua (EN/ES/PT)
- AI moderation voice clip
- Referral con sats reali

**Monetizzazione:**
- Super Like / Boost profilo
- "Chi mi ha messo like" (premium)
- Frame stagionali a tempo limitato

**Safety:**
- Verifica voce (frase casuale anti-bot)
- Auto-mute parole offensive

---

## 9. ULTIMI COMMIT IMPORTANTI

| Commit | Cosa |
|---|---|
| `5344799` | Champion badge + W/L stats + Anti-cheat boost cap |
| `77a4139` | Audio live nelle battle: WebRTC mesh per Arena |
| `d4a8e06` | Setup completo: admin panel + reset password UI + invite realtime |
| `46d0d31` | Cleanup: rimosso /api/duels legacy + IP hardcoded |
| `1040696` | Sats topup: convert da crediti + acquisto BTC |
| `193f1a2` | Voice Battles (Arena): TikTok-style 1v1 |
| `1477f78` | Rebrand: KOUVERTE ⚡ Voice Dating on Bitcoin |
| `2459488` | Forgot/reset password via Telegram |
| `814d020` | Onboarding + Block/Report + WebRTC + Privacy/Terms |

---

## 10. COMANDI UTILI

```bash
# Avvio locale server
npm start

# Avvio bot Telegram
npm run bot

# Verifica sintassi
node -c vox-server.js

# Deploy live (push su main → Render auto-redeploy)
git push origin main

# Reset DB locale (ATTENZIONE: cancella tutto)
rm vox-data.json && npm start
```

---

**Per qualsiasi aggiunta, apri una nuova sessione con Claude Code in questo repo.**
