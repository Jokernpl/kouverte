# 🕯️ Kouverte

> _Il velo non si rompe. Si depone._

Piattaforma social premium con stanze vocali, cornici personalizzabili acquistabili in Bitcoin, sistema referral e bot Telegram integrato.

## 📁 Struttura del progetto

```
.
├── app.html            # App web (frontend completo)
├── index.html          # Landing → redirect a /app.html
├── vox-server.js       # Backend Express + Socket.io
├── bitcoin-service.js  # Verifica pagamenti BTC (blockchain)
├── tg-bot.js           # Bot Telegram (@Kouverte_bot)
├── vox-data.json       # DB JSON (utenti, stanze, transazioni)
├── package.json        # Dipendenze Node
├── render.yaml         # Config deploy Render
└── README.md
```

## 🚀 Avvio in locale

```bash
npm install
npm start            # avvia il server su http://localhost:8082
npm run bot          # in altro terminale: avvia il bot Telegram
```

## 🌐 Deploy

Hostato su **Render.com** con auto-deploy da `main`.
Push su GitHub → Render builda → kouverte.com aggiornato in ~1 min.

Env vars richieste (vedi `render.yaml`):
- `BOT_TOKEN` — Telegram bot token
- `JWT_SECRET` — chiave firma JWT
- `BITCOIN_ADDRESS` — indirizzo wallet
- `WEBAPP_URL` — URL pubblico (es. `https://www.kouverte.com/app.html`)

## ✨ Feature principali

**Sito (app.html)**
- 6 sezioni: Home · Esplora · Stanze · Chat · Premium · Profilo
- Storie + Trending + Nuovi profili
- 7 stanze vocali tematiche
- Profilo con cover foto + avatar circolare + categorie
- **10 cornici premium** (Avorio · Oro · Smeraldo · Rubino · Zaffiro · Ametista · Topazio · Onice · Platino · Diamante)
- Upload foto profilo (drag & save)
- **Pagamenti Bitcoin** con QR code + conversione sats↔€ live
- Design: nero + oro · Playfair Display + Inter

**Bot Telegram (@Kouverte_bot)**
- `/start` con foto profilo Telegram
- `/cornici` `/stanze` `/profilo` `/premium` `/bitcoin`
- **`/invita`** + **`/guadagni`**: sistema referral
- **9 tier reward**: 1 invito = Avorio · 3 = Smeraldo · 100 = Diamante 💎
- DB persistente JSON

## 🔐 Sicurezza & Pagamenti

- JWT auth · bcrypt password
- Rate limiting per IP
- Bitcoin: 4 conferme blockchain minime via `bitcoin-service.js`

## 📜 Licenza

Proprietario. © Kouverte 2026.
