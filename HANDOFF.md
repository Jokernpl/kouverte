# 🎭 KOUVERTE — Handoff per il prossimo Claude

**Ultimo update**: 2026-05-21
**Stato**: ✅ Production live · scroll fixed · PWA pronta · bot Telegram con `/installa`
**Ultimo commit**: `9559eb6` su branch `main`

---

## 🌐 URL E DEPLOY

| Componente | URL |
|---|---|
| **Sito produzione** | https://www.kouverte.com/app.html |
| **Backend Render** | service `kouverte-vox` (free plan, autoDeploy da `main`) |
| **Bot Telegram** | @Kouverte_bot |
| **Repo principale (live = Render)** | https://github.com/Jokernpl/kouverte.git |
| **Repo backup (origin)** | https://github.com/Jokernpl/kouverte-vox.git |

**Branch attivo**: `main` — push qui fa auto-deploy su Render in 2-5 min.

---

## 🚀 ARCHITETTURA

```
┌─────────────────────────────────────────────┐
│  Telegram WebApp / Browser / PWA installata │
└─────────┬───────────────────────────────────┘
          │ HTTPS + WebSocket
          ▼
┌─────────────────────────────────────────────┐
│  Render: vox-server.js (Express + Socket.io)│
│  - Serve app.html, manifest.json, sw.js     │
│  - API REST /api/auth/*, /api/kv/*          │
│  - Socket.io: chat real-time, voice/video   │
│  - Carica tg-bot.js in-process              │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  vox-data.json (DB JSON file-based)         │
│  - users, rooms, messages, payments...      │
└─────────────────────────────────────────────┘
```

### Stack
- **Frontend**: HTML/CSS/JS vanilla in `app.html` (~6700 righe, tutto inline, no build)
- **Backend**: Node.js 18+ · Express · Socket.io 4.8.3
- **DB**: JSON file `vox-data.json` (NO database, scrittura sincrona)
- **Bot**: `node-telegram-bot-api` (polling), caricato in-process da vox-server
- **PWA**: Service Worker + manifest per installazione mobile/desktop
- **Auth**: JWT, bcrypt password hash, 5 backup codes per recovery
- **Payments**: Telegram Stars + Bitcoin (verifica via blockstream.info)
- **WebRTC**: P2P 1:1, signaling Socket.io, STUN Google

### File principali

| File | Cosa fa |
|---|---|
| `app.html` | TUTTO il frontend (UI + JS + CSS inline) — ~6700 righe |
| `vox-server.js` | Server Express + Socket.io + API REST |
| `tg-bot.js` | Bot Telegram (comandi, pagamenti, callback) |
| `vox-data.json` | DB JSON (users, messages, rooms, balances) |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker (cache + update auto) |
| `icon.svg` | Icona app (mascot viola con cappuccio) |
| `kouverte-logo.svg` | Logo orizzontale (header) |
| `render.yaml` | Config Render deployment |
| `package.json` | Dependencies + scripts |

---

## 🔑 VARIABILI AMBIENTE (Render)

Configurate nel dashboard Render (NON nel repo):

| Var | Valore / Note |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | autogenerato da Render |
| `WEBAPP_URL` | `https://www.kouverte.com/app.html` |
| `BITCOIN_ADDRESS` | `bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00` |
| `BITCOIN_MIN_CONFIRMATIONS` | `4` |
| `BOT_TOKEN` | sync: false (settato manualmente in dashboard) |
| `BOT_USERNAME` | `Kouverte_bot` |
| `PORT` | gestito da Render |

Locale per testing: `BOT_DISABLED=1` per evitare conflitti polling con bot prod.

---

## ⚙️ FUNZIONALITÀ ATTIVE

### Frontend (app.html)

**Schermate principali**:
- `#splash` — splash screen 1.2s
- `#home` — lista 33 stanze + banner Telegram + stats live + feed live
- `#chat` — chat con video WebRTC, messaggi, lista utenti scrollabile
- `#profile` — profilo, monete, badge, cornici, livello, referral

**Sistema utenti**:
- Anonimo: ID `tg_XXX` o `anon_XXX`, nickname auto generato (genNick)
- Registrato: email + username + password (≥6 char) + 5 backup codes
- ⚠️ `user.name` SEMPRE = `user.username` se loggato (forzato in 3 punti per evitare overwrite da genNick)

**Stanze (33 totali in `const ROOMS` a riga ~1823)**:
- **Città**: Mondo, Italia, Roma, Milano, Napoli, Torino, Firenze, Venezia, Bologna, Palermo, Genova, Verona, Bari, Cagliari
- **Regioni**: Campania, Sicilia, Sardegna, Toscana, Lombardia, Veneto, Puglia, Calabria, Lazio, Piemonte, Liguria, Emilia-Romagna
- **Tematiche**: Amore 💕, Musica 🎵, Sport ⚽, Gaming 🎮, Cinema 🎬, Notte 🌙
- **Speciale**: Confessionale 🕯️ (1 messaggio anonimo al giorno)
- **Private**: create da utenti via codice 6 char

**WebRTC video chat**:
- `initWebRTC()` chiede `getUserMedia` (1280x720) all'avvio
- Click utente in lista → P2P signaling via Socket.io
- Eventi: `voice-offer`, `voice-answer`, `voice-ice`
- Bottoni mic/cam nel video frame

**Economia**:
- Monete `user.coins`
- Welcome pack 50 monete + cornice Gold 7gg + badge Welcome
- Daily login bonus + streak
- Wheel della fortuna (1 spin/giorno)
- 14 cornici (gratuite + premium con Stars o BTC)
- 20+ badge sbloccabili

**PWA installabile**:
- Manifest valido `/manifest.json`
- Service Worker `/sw.js` — network-first per HTML/JS/CSS, cache-first per icone
- Update automatici ogni 30s (check `reg.update()`)
- Banner viola "📲 Installa Kouverte" appare dopo 5s su Android Chrome

### Bot Telegram (tg-bot.js)

**Comandi registrati** (visibili nel menu "/" di Telegram):
```
/start    🚀 Avvia KOUVERTE
/menu     ⌨️ Menu rapido
/installa 📲 Installa app sul telefono
/stanze   🌍 Vedi le stanze attive
/crea     🔐 Crea stanza privata
/entra    🔑 Entra con codice
/video    📹 Info video chat
/profilo  🎭 Il tuo profilo
/cornici  🖼️ Le tue cornici
/invita   🔗 Invita amici
/premium  ⭐ Premium VIP
/sito     🌐 Apri sito web
/aiuto    ❓ Aiuto e supporto
```

Alias: `/install`, `/app` → `/installa`

**Menu keyboard persistent**:
```
🚀 Entra nella Chat  |  📹 Video Chat
🔐 Crea Stanza       |  🔑 Entra con Codice
🎭 Profilo           |  🖼️ Cornici
🔗 Invita & guadagna |  ⭐ Premium
📲 Installa App      |  🌐 Sito
❓ Aiuto
```

**Pagamenti dal bot**:
- Telegram Stars (`pre_checkout_query`, `successful_payment`)
- Bitcoin: bot mostra QR + indirizzo, server verifica conferme via blockstream.info

### Server (vox-server.js)

**Endpoint principali**:
- `GET /` `/app.html` `/sw.js` `/manifest.json` → **Cache-Control: no-cache** (forzato)
- `POST /api/auth/register` — email + username + password → JWT + 5 backup codes
- `POST /api/auth/login` — email/username + password → JWT
- `POST /api/auth/recover` — username + backup code → reset password
- `GET /api/auth/me` — verify JWT, return user + kvData
- `POST /api/kv/sync` — salva `user.kvData` (solo campi in `ALLOWED_FIELDS`)
- `GET /api/kv/sync` — recupera kvData
- `GET /api/users/list` — lista utenti per chiamate

**Socket.io events**:
- Chat: `chat-message`, `join-chat-room`, `leave-chat-room`, `chat-users`, `typing-start`, `typing-stop`
- WebRTC: `voice-offer`, `voice-answer`, `voice-ice`
- DM: `dm-register`, `dm-message`
- Rooms: `room-online`, `code-room-*`

---

## 🐛 BUG FIXATI (sessione corrente — commit `9559eb6`)

1. **Scroll non funziona + pagina si muove orizzontalmente**
   - Causa: `.screen{position:fixed}` su Telegram WebApp Android = bug noto WebView
   - Fix: `.screen{position:absolute}` su `body{position:relative;height:100%;overflow:hidden}`
   - + JS fallback `attachTouchScroll()` con inerzia per WebView buggati
   - File: `app.html` righe ~13-25, ~141

2. **Username sovrascritto dal genNick random ("GhostWalker"...)**
   - Causa: `Object.assign(user, kvData)` sovrascrive `user.name` col genNick salvato
   - Fix: dopo ogni `Object.assign`, forza `user.name = json.user.username`
   - 3 punti fixati: `tryAutoLogin` (~4385), login manuale (~4866), visibilitychange (~5287)
   - + `syncUserDataToServer()` forza `user.name = user.username` prima del POST

3. **Login bypass tramite X**
   - Causa: X dell'authmodal/loginwall chiudeva senza login
   - Fix: `closeAuthModalSafe()` riapre LoginWall se `!isLoggedIn`
   - LoginWall: X rimossa, solo bottoni espliciti (Accedi/Registrati/Ospite)

4. **Memory leak `chatRoomUsers`**
   - Causa: `leaveRoom()` non puliva `chatRoomUsers[roomId]`
   - Fix: `delete chatRoomUsers[room.id]` + reset `typingUsers` in `leaveRoom`

5. **Webcam ri-prompt ad ogni stanza**
   - Causa: `stopAllWebRTC()` chiudeva `localStream` su ogni `leaveRoom`
   - Fix: chiudi solo peer connections, `localStream` resta vivo

6. **`saveUser()` bloccava main thread**
   - Causa: 30 call sincrone a `setLS('kv4_user', user)`
   - Fix: debounce 300ms + `saveUserNow()` su `pagehide`/`beforeunload`

7. **Funzioni undefined da onclick** — `toggleStickerPicker()`, `buyFrame()` rimosse

8. **Funzioni non funzionanti rimosse** (richiesta utente)
   - Bottoni rimossi: 🌧️ pioggia, 🤖 bot, 🎵 musica, 🎙️ voice, 📍 radar, ⏱️ ephemeral, 😀 sticker
   - HTML rimosso: `music-widget`, `sticker-picker`, `chat-modes-bar`

9. **Effetti visivi pesanti / movimento percepito**
   - Rimossi: `card-glow infinite`, `shimmer 5s`, `roomLivePulse`, hover scale 1.02, particelle translateX(40px), `bgOrbs scale(1.1) rotate(180deg)`, glow interno alle card (`::before` con radial-gradient)
   - Risultato: home statica, pulita, niente movimento

10. **Server cache aggressiva su Telegram WebApp**
    - Middleware aggiunto: `Cache-Control: no-cache, no-store, must-revalidate` su `/app.html`, `/sw.js`, `/manifest.json`

11. **Bot Telegram senza comando installa**
    - Aggiunto: `/installa`, `/install`, `/app` → `sendInstall()` con istruzioni Android/iOS/Desktop
    - Bottone "📲 Installa App" nel menu keyboard
    - `setMyCommands` registra tutti i comandi ufficiali

### Sessioni precedenti
- `d4c9f45` — Fix bug Ricordami (resta loggato anche con server lento)
- `c468db8` — WOW FEATURES: chat effimera, effetti evento, bot, musica, voice
- `8037a34` — Shop + Match + LootBox + Achievements + FOMO

---

## 📁 STRUTTURA FILE

```
Kouverte-Voice/
├── app.html              ← Frontend completo (~6700 righe)
├── vox-server.js         ← Express + Socket.io + API
├── tg-bot.js             ← Bot Telegram
├── server.js             ← Alias entry (require ./vox-server.js)
├── vox-data.json         ← DB JSON
├── manifest.json         ← PWA manifest
├── sw.js                 ← Service Worker
├── icon.svg              ← Icona app (mascot viola)
├── kouverte-logo.svg     ← Logo orizzontale
├── render.yaml           ← Config Render
├── package.json          ← deps + scripts
├── HANDOFF.md            ← QUESTO FILE
└── .claude/
    ├── launch.json       ← Config preview locale
    └── worktrees/        ← Git worktree per testing
```

---

## 🔄 WORKFLOW UPDATE

```bash
# 1. Modifica file locali
# 2. Test locale (opzionale, con BOT_DISABLED=1)
# 3. Commit
git add app.html vox-server.js tg-bot.js
git commit -m "Descrizione fix"

# 4. Push sui due remoti
git push live main      # PRODUZIONE (Render auto-deploy)
git push origin main    # BACKUP

# 5. Aspetta 2-5 min → Render fa build + deploy
# 6. Bot Telegram riavviato automaticamente
```

**Per il client (PWA)**:
- Service Worker controlla update ogni 30s
- Browser fa fetch con `Cache-Control: no-cache` su app.html
- Utente vede sempre versione più recente al refresh

---

## ⚠️ ATTENZIONE / GOTCHA IMPORTANTI

1. **Worktree git**: c'è una worktree in `.claude/worktrees/gracious-shamir-44c642/` che il preview locale serve.
   Le modifiche nel main repo NON sono auto-sincronizzate con la worktree.
   **Per testare con preview locale**: dopo ogni edit copia manualmente:
   ```bash
   cp app.html .claude/worktrees/gracious-shamir-44c642/app.html
   ```

2. **`vox-data.json` ephemeral su Render free**: il file si **resetta ad ogni deploy** (free plan = storage non persistente). **Backup periodico consigliato** o migrare a DB esterno.
   `@upstash/redis` è già in package.json ma **non ancora usato** — sarebbe il prossimo step naturale.

3. **Bot polling conflitti**: solo UNA istanza per BOT_TOKEN. Se test locale + Render con stesso token → polling conflict (errori 409). Usa `BOT_DISABLED=1` in locale.

4. **getUserMedia errori in console preview**: il browser preview NON ha permesso webcam → log "Permission denied". NON è bug del codice, su Telegram reale chiede permesso correttamente.

5. **PWA su iPhone Safari**: NON mostra banner automatico. Utente deve fare manualmente "Condividi → Aggiungi a Home". Le istruzioni del bot `/installa` lo spiegano.

6. **WebRTC HTTPS-only**: in produzione (Render HTTPS) funziona. Locale serve `http://localhost` (auto-trusted) o cert SSL.

7. **`#home` CSS — non aggiungere `position:fixed/relative`**: causa il bug scroll su Telegram WebApp Android. Pattern corretto:
   ```css
   body{position:relative;height:100%;overflow:hidden}
   .screen{position:absolute;inset:0;display:flex;flex-direction:column}
   #home{overflow-y:scroll;overflow-x:hidden;touch-action:pan-y}
   ```

8. **3 punti `Object.assign(user, ...)` da proteggere**: ogni volta che si fa merge da server, SUBITO dopo `user.name = json.user.username || preserveName`. Altrimenti il genNick random ritorna.

---

## 🎯 TODO / IDEE FUTURE (priorità)

| Priorità | Task |
|---|---|
| 🔴 ALTA | Migrare DB JSON → **Upstash Redis** (già in deps, non usato). Render free resetta il file ad ogni deploy → utenti persi |
| 🟡 MEDIA | Implementare Push Notifications (Web Push API) per messaggi quando app chiusa |
| 🟡 MEDIA | Generare PNG 192/512 da `icon.svg` per compatibilità migliore (ora usa SVG ovunque) |
| 🟢 BASSA | Spotify embed nella chat (rimosso il musica fai-da-te) |
| 🟢 BASSA | Group video call (richiede mediasoup, ora P2P 1:1) |
| 🟢 BASSA | Screen sharing WebRTC |
| 🟢 BASSA | Compressione video bitrate adattiva per connessioni lente |

---

## 💬 NOTE SULL'UTENTE (chi parla con te)

- **Lingua**: Italiano. SEMPRE rispondi in italiano.
- **Stile**: vuole risposte concrete, azioni dirette. Niente filosofia, niente domande inutili.
- **Frustrazione**: se inventi fix senza testare, si arrabbia. **TESTA sempre programmaticamente** con `preview_eval` prima di rispondere "fixato".
- **Mobile**: fa screenshot solo se richiesto. Fidati ma verifica con `preview_resize preset:mobile`.
- **Controllo**: chiede sempre check-up dopo modifiche. Fai validazione JS + HTML balance + scroll + funzioni globali ad ogni round.
- **Pazienza**: bassa. Se dice "non va" 2 volte, c'è un VERO problema, non cache. Vai più a fondo.

---

## 🆘 RUNBOOK EMERGENZE

| Sintomo | Diagnostica | Soluzione |
|---|---|---|
| Sito 503 / down | dashboard.render.com → logs `kouverte-vox` | Check errori build / restart manuale |
| Bot non risponde | Render logs → cerca `[BOT]` | Verifica `BOT_TOKEN` env var + no conflitto polling |
| DB perso (utenti scomparsi) | Free plan = atteso ad ogni deploy | Migrare a Upstash Redis (priorità alta) |
| Scroll non funziona | Verifica CSS `.screen` e `#home` | NON usare `position:fixed/relative` su `#home`. Pattern in gotcha #7 |
| Username torna a "GhostWalker" | Cerca `Object.assign(user` nei log | Aggiungi `user.name = username` SUBITO dopo ogni assign |
| PWA non installabile | DevTools → Application → Manifest | Verifica manifest valido, HTTPS, sw.js raggiungibile |
| Webcam chiede permesso ogni volta | Log "[WebRTC] Errore getUserMedia" | Verifica `leaveRoom` non chiama `stopAllWebRTC` ma solo `closePeerConnection` |

---

**Last working commit**: `9559eb6` (pushato su `live` e `origin`)
**Sito live verificato**: https://www.kouverte.com/app.html
**Bot live verificato**: @Kouverte_bot con `/installa` funzionante

🎭 Buon lavoro al prossimo Claude.
