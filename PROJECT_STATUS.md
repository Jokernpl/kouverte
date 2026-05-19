# KOUVERTE — Stato Completo del Progetto
**Ultimo aggiornamento:** 2026-05-19  
**A cura di:** Claude Sonnet 4.6 (assistente AI)  
**Proprietario:** Broker (@losangelesbroker)

---

## 🎯 Cos'è KOUVERTE

**KOUVERTE** è una **chat anonima globale** come Telegram Mini App.

- Nessuna registrazione, nessun profilo, nessuna foto
- 100% anonimo — solo una maschera emoji + colore neon assegnato automaticamente
- Stanze di chat per Italia (regioni), Europa, Mondo e per mood (Gaming, Musica, ecc.)
- **Paywall: 100 messaggi gratuiti → poi 1€/mese** via Telegram Stars
- Guadagno tramite cornici (frame) avatar acquistabili con Telegram Stars
- Badge & Achievement da sbloccare

**Slogan:** *Chatta. Conosci. Condividi. Senza essere chi sei.*

---

## 🌐 Dove è online

| Cosa | URL |
|------|-----|
| **App principale** | https://kouverte-vox.onrender.com/app.html |
| **Sito marketing** | https://www.kouverte.com/app.html |
| **Admin panel** | https://kouverte-vox.onrender.com/admin.html |
| **Bot Telegram** | @Kouverte_bot |
| **GitHub repo (principale)** | https://github.com/Jokernpl/kouverte-vox |
| **GitHub repo (live/secondario)** | https://github.com/Jokernpl/kouverte |

---

## 📁 File principali

| File | Descrizione |
|------|-------------|
| `vox-server.js` | Server Node.js principale (~2800 righe). Express + Socket.io + API REST |
| `app.html` | Frontend Telegram Mini App (tutto in un file HTML) |
| `tg-bot.js` | Bot Telegram (@Kouverte_bot). Polling mode. |
| `admin.html` | Pannello admin (statistiche, utenti, BTC confirm) |
| `bitcoin-service.js` | Verifica conferme on-chain Bitcoin |
| `lightning-service.js` | Scaffold Lightning Network (LNbits + Coinos) |
| `package.json` | Dipendenze npm |
| `render.yaml` | Config deploy Render.com |
| `vox-data.json` | Database JSON (creato automaticamente al primo avvio) |
| `kouverte-bot.json` | Database JSON del bot (utenti, frame posseduti, referral) |
| `SECURITY_AUDIT.md` | Audit vulnerabilità npm (0 critical, 0 high, 4 moderate accettate) |

---

## 🏗️ Architettura tecnica

```
Render.com (free tier)
  └── vox-server.js  ← processo unico
        ├── Express HTTP server  (porta 8082 / env PORT)
        ├── Socket.io  ← chat real-time in ogni stanza
        ├── REST API  /api/*
        └── tg-bot.js  ← richiamato in-process dopo server.listen()
```

**Database:** file JSON (`vox-data.json`) con scritture atomiche tramite `markDirty()` + `setInterval`.  
**Auth:** JWT token (7 giorni). In produzione richiede `JWT_SECRET` env var.  
**No SQLite, no PostgreSQL** — tutto in memoria + file JSON.

---

## 🔑 Variabili d'ambiente (Render)

| Variabile | Valore attuale | Note |
|-----------|----------------|------|
| `NODE_ENV` | `production` | |
| `JWT_SECRET` | (generato da Render) | Non modificare |
| `WEBAPP_URL` | `https://www.kouverte.com/app.html` | URL Mini App Telegram |
| `BITCOIN_ADDRESS` | `bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00` | Wallet BTC del proprietario |
| `BITCOIN_MIN_CONFIRMATIONS` | `4` | |
| `BOT_TOKEN` | ⚠️ **HARDCODED in tg-bot.js** | `8782933185:AAF1NkjD1HQzwwBRCFBjK2ez0sjHyn5RujU` — deve essere spostato in env Render |
| `BOT_USERNAME` | `Kouverte_bot` | |

> **⚠️ AZIONE RICHIESTA:** Il token del bot è temporaneamente hardcoded in `tg-bot.js` riga 18.  
> Bisogna: 1) Impostare `BOT_TOKEN` corretto in Render env vars → 2) Rimuovere la riga hardcoded.

---

## 💰 Sistema di monetizzazione

### Paywall messaggi
- **100 messaggi gratuiti** per utente (contati in localStorage)
- Alla fine: modale che propone abbonamento **1€/mese = 100 Telegram Stars**
- `/api/create-invoice` → crea invoice Telegram Stars via Bot API
- Il bot riceve `successful_payment` in polling → attiva premium nel suo DB

### Cornici (frame) avatar
Ogni utente ha un avatar mascherato con cornice colorata in chat:

| Cornice | Stars | Premium |
|---------|-------|---------|
| Nessuna | Gratis | No |
| Silver 🥈 | Gratis | No |
| Viola 💜 | Gratis | No |
| Gold 🥇 | 30★ | Sì (inclusa in Premium) |
| Fiamma 🔥 | 40★ | Sì (inclusa in Premium) |
| Diamond 💎 | 50★ | Sì (inclusa in Premium) |

`/api/buy-frame` → crea invoice Stars per cornice singola.

### Referral (già nel bot)
- Ogni utente ha un link `t.me/Kouverte_bot?start=ref_CHATID`
- Gli inviti scalano premi automatici (vedi `REFERRAL_REWARDS` in tg-bot.js)

---

## 🗺️ Stanze di chat (17 totali)

### 🇮🇹 Italia
- `it-generale` — Italia generale
- `it-nord` — Nord Italia
- `it-centro` — Centro Italia
- `it-sud` — Sud Italia
- `it-sicilia` — Sicilia & Sardegna

### 🇪🇺 Europa
- `eu-generale` — Europa generale
- `eu-est` — Est Europa
- `eu-ovest` — Ovest Europa

### 🌍 Mondo
- `w-generale` — Chat Mondiale
- `w-americhe` — Americhe
- `w-asia` — Asia & Oceania
- `w-africa` — Africa & Medio Oriente

### 💬 Mood (globali)
- `chiacchiere`, `gaming`, `musica`, `notte-fonda`, `divertimento`, `amicizia`

---

## 🔌 API REST principali

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/create-invoice` | POST | Crea invoice Telegram Stars per Premium (100★) |
| `/api/buy-frame` | POST | Crea invoice Stars per cornice singola |
| `/api/admin/stats` | GET | Statistiche (richiede header `x-admin-password`) |
| `/api/admin/users` | GET | Lista utenti |
| `/api/admin/btc-confirm` | POST | Conferma manuale pagamento BTC |
| `/api/bot/status` | GET | Test live token bot contro Telegram |
| `/api/notifications/pending` | GET | Notifiche pendenti per il bot (internal) |

---

## 🔄 Socket.io — eventi chat rooms

| Evento (emit) | Descrizione |
|---------------|-------------|
| `join-chat-room` | Entra in una stanza |
| `leave-chat-room` | Esci da una stanza |
| `chat-message` | Invia messaggio nella stanza |
| `chat-typing` | Indica che stai scrivendo |
| `chat-stop-typing` | Smetti di scrivere |

| Evento (on) | Descrizione |
|-------------|-------------|
| `chat-history` | Ultimi 50 messaggi della stanza |
| `chat-message` | Nuovo messaggio in arrivo |
| `room-online` | Contatore online aggiornato |
| `global-online` | Totale utenti online |

---

## 🚀 Deploy

**Render.com** — free tier (può sleeparsi dopo inattività)  
- Auto-deploy attivo su push al branch `main`
- Due repo GitHub remoti:
  - `origin` → `github.com/Jokernpl/kouverte-vox` (principale)
  - `live` → `github.com/Jokernpl/kouverte` (collegato a Render)
- Per fare deploy: `git push origin main && git push live main`

**Comandi locali:**
```bash
# Avvia server locale
node vox-server.js

# Solo bot (test)
node tg-bot.js

# Aggiorna dipendenze
npm install

# Audit sicurezza
npm audit --audit-level=high   # deve restituire exit 0
```

---

## 🐛 Bug noti / TODO

| Priorità | Problema | Soluzione |
|----------|----------|-----------|
| 🔴 Alta | Token bot hardcoded in `tg-bot.js` riga 18 | Impostare `BOT_TOKEN` in Render env vars, poi rimuovere riga hardcoded |
| 🟡 Media | Premium solo in localStorage client | Aggiungere verifica server-side `/api/user/premium-status` |
| 🟡 Media | Storia chat persa al restart server | Persistere `chatRoomHistory` in `vox-data.json` |
| 🟢 Bassa | Migrazione da `telegraf` (più moderna di `node-telegram-bot-api`) | 2 giorni di refactor tg-bot.js |

---

## 📊 Stato sicurezza npm

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | ✅ |
| High | 0 | ✅ |
| Moderate | 4 | ⚠️ Risk accepted (tutte nella catena `request` → Telegram bot, URL fisso) |

Dettagli in `SECURITY_AUDIT.md`.

---

## 🎨 Design & Brand

- **Colori:** Sfondo `#06020f` (nero viola scuro), accenti neon: viola `#a855f7`, rosa `#ec4899`, cyan `#06b6d4`, verde `#10b981`
- **Font:** System UI (-apple-system, BlinkMacSystemFont)
- **Stile:** Dark neon cyberpunk — ispirato al volantino promozionale fornito dal proprietario
- **Ogni utente** ha un colore neon unico (generato da hash dello userId) e una maschera emoji
- **Cornici** animate sui messaggi in chat (silver, gold, diamond, flame)

---

## 📝 Git history (ultimi commit significativi)

```
576da76  Stanze geografiche + paywall 100msg + cornici + Telegram Stars
ac93885  Redesign completo: app rooms-only chat anonima stile neon
dcca8da  Rimuovi tutti gli utenti fake/seed: solo utenti reali
6fa8b81  Fix bot: token hardcoded (Render env ha token vecchio revocato)
bae40c7  /api/bot/status diagnostico live
814d020  Onboarding + Block/Report + Privacy/Terms + WebRTC 1:1 calls
```

---

## 👤 Contatti proprietario

- Telegram: @losangelesbroker
- Bot: @Kouverte_bot

---

*Documento generato automaticamente. Aggiornare dopo ogni sessione di lavoro significativa.*
