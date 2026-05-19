# KOUVERTE — Handoff per il prossimo agente AI

**Ultimo aggiornamento:** 2026-05-19
**Owner:** Broker (@losangelesbroker)
**Stato:** produzione attiva su Render, bot funzionante, pagamenti BTC live

> Questo file è la fonte di verità per chiunque continui il lavoro. Leggilo PRIMA di toccare qualsiasi cosa. Aggiornalo se modifichi l'architettura.

---

## 1. Cos'è KOUVERTE

Telegram Mini App di **chat anonima**. Niente nome, niente foto, solo:
- Una maschera emoji + colore neon assegnato automaticamente
- Un nickname procedurale (es. `DarkWave`, `MidnightFlame`, `GhostWalker`)
- Un livello che cresce coi messaggi (`lvl 1 → lvl 18+`)

**Modello business:** 100 messaggi gratuiti → Premium **5€/mese pagato in Bitcoin diretto** (no Telegram Stars, niente intermediari).

---

## 2. URLs / Risorse live

| Cosa | URL |
|------|-----|
| App | https://kouverte-voice.onrender.com/app.html |
| App via dominio | https://www.kouverte.com/app.html |
| Bot Telegram | https://t.me/Kouverte_bot |
| API status bot | https://kouverte-voice.onrender.com/api/bot/status |
| Repo principale | https://github.com/Jokernpl/kouverte-vox |
| Repo live (connessa a Render) | https://github.com/Jokernpl/kouverte |
| Dashboard Render | https://dashboard.render.com → servizio `kouverte-voice` |
| Dashboard Upstash | https://console.upstash.com |

**Importante:** il servizio Render si chiama `kouverte-voice` (NON `kouverte-vox` come potrebbe suggerire il repo).

---

## 3. Stack tecnico

- **Backend:** Node.js + Express + Socket.io (singolo processo)
- **Frontend:** un singolo file `app.html` (~1500 righe, inline CSS/JS)
- **Bot Telegram:** `node-telegram-bot-api` in polling mode, avviato in-process da `vox-server.js`
- **DB principale:** `vox-data.json` (file JSON, in-memory + flush periodico)
- **DB bot (referral, premium, frame):** Upstash Redis quando env presenti, fallback su `kouverte-bot.json`
- **Pagamenti:** Bitcoin on-chain via mempool.space API (`bitcoin-service.js`), invoice con amount univoco

**Hosting:** Render free tier. ⚠️ Il filesystem **viene resettato ad ogni deploy** — qualunque scrittura su file non sopravvive a un `git push`. Per questo i referral usano Upstash Redis.

---

## 4. Stanze attive (intentionally piccole)

| ID | Nome | Colore |
|----|------|--------|
| `mondo` | 🌍 Mondo | viola |
| `italia` | 🇮🇹 Italia | verde |
| `roma` | Roma | giallo |
| `milano` | Milano | azzurro |
| `campania` | Campania | rosso |
| `calabria` | Calabria | arancio |

Definite in `app.html` nell'array `ROOMS`. Niente filtri categoria, niente segrete, niente eventi a tempo (erano stati provati, poi semplificati per partire concentrati).

---

## 5. File principali

| File | Cosa fa | Quando toccarlo |
|------|---------|-----------------|
| `vox-server.js` | Server Express + Socket.io + tutte le API REST. ~2900 righe. | Per nuovi endpoint API, fix chat realtime, payment logic |
| `app.html` | Frontend completo (Mini App Telegram). Tutto in un file. | Per cambi UI, animazioni, comportamento client |
| `tg-bot.js` | Bot Telegram in polling. Referral, premium, comandi `/start /menu /profilo /stanze /cornici /invita /premium /aiuto /bitcoin`. | Per cambi comandi bot, nuove notifiche |
| `bitcoin-service.js` | Verifica conferme on-chain via mempool.space | Solo se cambi provider blockchain |
| `vox-data.json` | DB principale (utenti app, payments BTC, chat history) | Mai a mano in produzione; viene scritto dal server |
| `kouverte-bot.json` | DB bot (fallback se Upstash non c'è). Schema: `{users: {<chatId>: {invitedBy, invitedUsers, ownedFrames, isPremium, premiumExpiry}}}` | Solo per debug locale |
| `package.json` | Dipendenze npm. `main: vox-server.js`, `start: node vox-server.js` | Per aggiungere dipendenze |
| `bitcoin-service.js` | Mempool.space wrapper | Mai cambiare API senza testare |
| `admin.html` | Pannello admin (statistiche, conferma BTC manuale) | Per nuove feature admin |
| `render.yaml` | Config deploy Render | Quasi mai |
| `HANDOFF.md` | Questo file | Ogni cambio architettura |
| `PROJECT_STATUS.md` | Documentazione storica più dettagliata | Read-only di riferimento |

**File da NON toccare** senza un motivo molto forte:
- `simulation-users.js` — vecchio sistema dating, deprecato
- `lightning-service.js` — scaffold Lightning, non in uso
- `vox-data.bak.json` — backup automatico, non modificare a mano

---

## 6. Env variables (su Render)

| Key | Necessario | Cosa fa |
|-----|------------|---------|
| `BOT_TOKEN` | ✅ critico | Token Telegram del bot. Senza, il bot non parte. |
| `JWT_SECRET` | ✅ critico in prod | JWT signing. Generato automaticamente da Render. **Non modificare.** |
| `NODE_ENV` | ✅ | `production` |
| `PORT` | auto | Render imposta automaticamente |
| `WEBAPP_URL` | consigliato | URL della mini-app per i bottoni del bot. Default: `https://kouverte-voice.onrender.com/app.html` |
| `BOT_USERNAME` | consigliato | `Kouverte_bot` |
| `BITCOIN_ADDRESS` | ✅ | `bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00` (wallet del proprietario) |
| `BITCOIN_MIN_CONFIRMATIONS` | opzionale | Default `4` |
| `UPSTASH_REDIS_REST_URL` | ✅ se vuoi persistere referral | URL REST API Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ se vuoi persistere referral | Token Upstash |
| `ALLOWED_ORIGINS` | opzionale | CORS allowlist |
| `BOT_DISABLED` | opzionale | Setta `1` per disabilitare il bot (utile in test) |

---

## 7. Cosa è stato fatto in questa sessione (cronologia)

1. **Removal utenti fake** — eliminati `u_test1/2/3`, `MidnightMuse/StarGazer/DreamWalker` (preview finti nelle card stanze), `voice_rooms` con `users_count` hardcoded.
2. **Migrazione pagamenti** — da Telegram Stars (`sendInvoice` con currency XTR) a Bitcoin on-chain via mempool.space. Premium €5/mese, cornici premium incluse, niente acquisto singolo cornici.
3. **Bot Telegram riscritto** — comandi allineati al sito, rimosso vecchio menu voice-dating (Lounge Velluto, Jazz After Dark, etc), Bitcoin info.
4. **Token bot bonificato** — vecchio token hardcoded revocato dall'utente, ora solo via `BOT_TOKEN` env.
5. **Live FX UI**:
   - Nickname procedurali (prefisso + suffisso): `Ghost`, `Night`, `Shadow`, ... + `Walker`, `Talker`, `Whisper`, ...
   - Livelli log-scale: `lvl = 1 + floor(log2(msgCount+1) * 2.2)`
   - Badge `🔥 HOT` su stanze con ≥5 online
   - Glow ring + bump animation quando entra qualcuno
   - Aura ring rotante per utenti premium / lvl ≥10
   - Typing indicator scalabile: "X sta scrivendo" → "X e Y" → "N persone stanno scrivendo"
   - Avatar+nick+lvl anche sui PROPRI messaggi (stile WhatsApp)
6. **Stanze ridotte a 6** — Mondo, Italia, Roma, Milano, Campania, Calabria.
7. **Referral fix completo**:
   - Bug 1: filesystem Render wipe ad ogni deploy → migrato bot DB su **Upstash Redis** (con fallback file)
   - Bug 2: refLink usava `tg_<id>` se l'app era fuori da Telegram → ora usa SEMPRE `user.tgId` (chatId puro)
   - Bug 3: app non mostrava conteggio amici → nuovo endpoint `/api/bot/user-stats?chatId=X` + UI nel profilo
8. **Fix critici UI**:
   - Bottom nav copriva il textarea chat → nascosta quando si è in chat
   - Bolle messaggi spezzavano `ciao` in `ci/ao` → fix `max-width` su wrapper + `overflow-wrap`
   - Box "Type anonymously..." finto sulle card stanze → sostituito con hint "Tap per entrare →"
9. **Socket.io domain fix** — script da CDN, backend URL esplicito `kouverte-voice.onrender.com` (non `kouverte-vox` che era il vecchio nome errato).

---

## 8. Pitfalls noti (lezioni della sessione)

### 8.1 Worktree vs main repo
Lavorando in un git worktree (`.claude/worktrees/...`), gli edit di file fatti al PARENT path (`C:\Users\broke\Desktop\Kouverte-Voice\`) **non si propagano automaticamente** al worktree. Il preview server gira dal worktree, quindi se modifichi i file nel parent senza copiare nel worktree, il server serve la versione vecchia.

**Soluzione:** dopo ogni edit a `app.html`/`vox-server.js`/`tg-bot.js` nel parent path, eseguire:
```bash
cp -v "C:\Users\broke\Desktop\Kouverte-Voice\<file>" "C:\Users\broke\Desktop\Kouverte-Voice\.claude\worktrees\gracious-shamir-44c642\<file>"
```

### 8.2 Render free tier wipe
Render Free Plan **resetta il filesystem ad ogni deploy**. Quindi:
- `vox-data.json` viene perso → utenti app/payments BTC persi tra deploy (accettabile per ora perché tutto è effimero/anonimo)
- `kouverte-bot.json` viene perso → referral persi (per questo c'è Upstash)

Soluzioni durevoli quando vorrai:
- Render Persistent Disk ($1/mese) per il filesystem
- O passare anche `vox-data.json` su Upstash

### 8.3 Push su due remote
Il deploy Render legge da `github.com/Jokernpl/kouverte` (remote `live`). Quindi per ogni cambio fare:
```bash
git push origin main && git push live main
```

### 8.4 Pagamenti BTC e fee di rete
A €5/mese ≈ 5500 sat, le fee on-chain (500-2000 sat) sono accettabili. Sotto €5 le fee divorano l'importo: per questo le cornici singole NON si vendono in BTC, solo via Premium o referral.

Ogni invoice ha un suffisso unico di 0-499 sat per identificare il pagatore (non c'è address-derivation BIP32 implementata).

### 8.5 Telegram WebApp keyboard
Su mobile Telegram, la bottom nav fixed può coprire l'input. **Risolto** nascondendo `.bnav` quando lo screen attivo è `chat`. Se aggiungi nuovi schermi con input, fai la stessa cosa.

### 8.6 Nickname procedurali sono deterministici da userId
Il nickname dipende dall'hash di `user.id`. Se cambi `genNick()` o gli array `NICK_PREFIX`/`NICK_SUFFIX`, tutti gli utenti esistenti riceveranno nick diversi al prossimo login (il loro `user.name` è cached in localStorage finché non lo cancellano).

---

## 9. Come testare in locale

```bash
# 1. Installa deps
npm install

# 2. Avvia server (bot disabilitato senza BOT_TOKEN)
node vox-server.js

# 3. Apri http://localhost:8082/app.html
```

Per testare il bot in locale serve un token valido in env:
```bash
BOT_TOKEN=<vero_token> node vox-server.js
```

Per testare Upstash:
```bash
UPSTASH_REDIS_REST_URL=<url> UPSTASH_REDIS_REST_TOKEN=<token> node vox-server.js
```

---

## 10. Endpoint API principali

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/btc/quote-premium` | POST | Genera invoice BTC. Body: `{userId}`. Risponde: `{id, address, sats, btc, eur, expiresAt}` |
| `/api/btc/check-status` | POST | Verifica pagamento. Body: `{id}`. Risponde: `{status: paid/pending/expired, confirmations}` |
| `/api/me/premium-status` | GET | `?userId=X`. Risponde: `{premium: bool, expiresAt}` |
| `/api/bot/user-stats` | GET | `?chatId=X`. Risponde: `{invited, isPremium, ownedFrames}` da DB bot |
| `/api/bot/status` | GET | Diagnostica: token valido, telegram raggiungibile |
| `/api/admin/stats` | GET | Header `x-admin-password`. Statistiche aggregate. |
| `/api/admin/btc-confirm` | POST | Conferma manuale pagamento BTC |
| `/api/notifications/pending` | GET | Notifiche pendenti per il bot (internal, header `x-bot-secret`) |

Endpoint legacy ancora montati (vecchio sistema voice-dating, NON usare per nuove feature):
- `/api/auth/*`, `/api/bitcoin/verify` (vecchio JWT-based), `/api/me/items`

---

## 11. Socket.io eventi chat

| Client emit | Cosa fa |
|-------------|---------|
| `join-chat-room` | `{roomId, user}` — entra nella stanza |
| `leave-chat-room` | `{roomId}` |
| `chat-message` | `{roomId, msg}` — invia messaggio (broadcast a tutti gli altri) |
| `chat-typing` | `{roomId, user}` |
| `chat-stop-typing` | `{roomId, userId}` |

| Client on | Cosa riceve |
|-----------|-------------|
| `chat-history` | Ultimi 50 messaggi al join |
| `chat-message` | Nuovo messaggio (i miei non rimbalzano indietro) |
| `room-online` | Count aggiornato della stanza |
| `global-online` | Count totale utenti online |
| `chat-typing` / `chat-stop-typing` | Altri utenti che scrivono |

**Stato server:** `chatRoomHistory[roomId]` (max 100 msg), `chatRoomUsers[roomId]` (Map<socketId, user>). Entrambi in memoria, persi al restart server.

---

## 12. Regole da rispettare (decisioni del proprietario)

1. **100% anonimo** — niente nome reale, niente foto, niente login. Solo emoji + colore + nickname procedurale.
2. **Pagamenti SOLO in Bitcoin diretto.** Niente Stars, niente Stripe, niente PayPal. Il wallet `bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00` è del proprietario.
3. **Premium 5€/mese** = 30gg + tutte le cornici premium. Cornici singole NON si vendono.
4. **Cornici premium si sbloccano**: pagando Premium, oppure invitando amici (tier referral).
5. **Niente utenti fake/seed** sul live. Solo utenti reali.
6. **Bot ha solo i comandi listati** in `tg-bot.js`. Niente vecchio menu voice-dating.
7. **Marketing/comunicazione in italiano** — lo slogan è "Chatta. Conosci. Condividi. Senza essere chi sei."

---

## 13. Cosa NON è stato implementato (TODO se richiesto)

- **Stanze segrete con password** (era stato fatto poi rimosso quando si è semplificato a 6 stanze) — se serve, ripristinare logica `tier:'secret'` + prompt codice
- **Stanze evento a tempo** (es. "Ore 02:00 Caos totale") — rimosse, riattivare con filtro orario
- **Audio ambience** — l'utente lo aveva chiesto, sconsigliato per autoplay block + UX. Eventualmente farlo opzionale dal profilo
- **Sistema badge dinamico server-side** — i badge ora sono client-only in localStorage
- **Persistenza vox-data.json** — gli utenti dell'app sono ancora effimeri su Render
- **Lightning Network** — scaffold in `lightning-service.js` ma non collegato
- **Migrazione a `telegraf`** — bot ora usa `node-telegram-bot-api`, considerarla in futuro
- **Stanze custom create dagli utenti** — non c'è nulla

---

## 14. Sicurezza

- ✅ JWT in env, non hardcoded
- ✅ BOT_TOKEN in env
- ⚠️ Upstash token è stato scambiato in chat — il proprietario sa che deve ruotarlo da Upstash dashboard quando vuole
- ✅ Path traversal bloccato (`BLOCKED_PATHS` in vox-server.js)
- ✅ Input messaggi sanitizzati (max 800 char, escape HTML lato render)
- ✅ Frame IDs validati server-side (`FRAME_PRICES_EUR` come fonte di verità)

---

## 15. Come continuare se sei un altro agente AI

1. Leggi tutto questo file
2. Leggi `PROJECT_STATUS.md` se vuoi più contesto storico
3. Prima di toccare codice: `git status` e `git log --oneline -10`
4. Lavora in branch separato o conferma con l'utente
5. **Aggiorna QUESTO file** se cambi architettura o aggiungi feature significative
6. Push su entrambi i remote: `git push origin main && git push live main`
7. Verifica deploy: `curl https://kouverte-voice.onrender.com/api/bot/status`

**Conflitti di scope?** Chiedi all'utente. Non fare assunzioni su prezzi, design, o feature business. Per modifiche UI puoi essere autonomo. Per cambi a pagamenti / business logic / sicurezza, conferma prima.

---

*Documento mantenuto da Claude (Anthropic). Aggiornamenti benvenuti.*
