# 📱 VOX su Telegram — Setup in 5 minuti

Guida pratica per pubblicare VOX come **Mini App di Telegram** (l'app gira dentro Telegram, niente download).

---

## 🎯 Cosa otterrai

- Un **bot Telegram** (es. `@vox_voice_bot`) che apre VOX con un click
- L'app gira **dentro Telegram** (Apple/Android nativo)
- **Auth automatica** con account Telegram (no signup)
- **Distribuzione virale** tramite link `t.me/vox_voice_bot`

---

## ⚙️ Cosa serve

| Cosa | Dove |
|---|---|
| Telegram (account qualsiasi) | App ufficiale |
| URL HTTPS pubblico | ngrok (gratis) o Cloudflare Tunnel |
| Server VOX in funzione | Già pronto: `node vox-server.js` |

---

## 📋 Procedura (15 step in 5 minuti)

### STEP 1 · Crea il bot su Telegram

1. Apri Telegram → cerca **`@BotFather`**
2. `/newbot`
3. Nome del bot: `VOX Voice` (visibile)
4. Username: `vox_voice_bot` *(deve finire con `_bot`)*
5. **Copia il token** (es. `1234567890:ABC-DEF...`) — non condividerlo mai

### STEP 2 · Avvia il server VOX

```cmd
cd C:\Users\broke\Desktop\Kouverte-Voice
node vox-server.js
```
Conferma che giri su `localhost:8082`.

### STEP 3 · Avvia il tunnel HTTPS (ngrok)

Doppio click su `avvia-tunnel.bat` oppure:
```cmd
ngrok http 8082
```
Vedrai un URL tipo:
```
https://abcd-1234-5678.ngrok-free.app -> http://localhost:8082
```
**Copia quell'URL https**.

### STEP 4 · Registra la Mini App su BotFather

Torna a `@BotFather`:
1. `/newapp`
2. Seleziona il bot **`vox_voice_bot`**
3. Titolo: `VOX`
4. Descrizione: `Vanishing voice. La voce non mente.`
5. Foto: (qualsiasi 640×360 o salta con `/empty`)
6. GIF demo: `/empty`
7. **URL Web App**: `https://abcd-1234-5678.ngrok-free.app/tg.html`
8. Short name: `vox` (link diventa `t.me/vox_voice_bot/vox`)

### STEP 5 · Configura il bot launcher

Apri `avvia-bot-tg.bat` con Notepad e modifica le 3 righe:
```bat
set BOT_TOKEN=1234567890:ABC-DEF...        ← il token di BotFather
set BOT_USERNAME=vox_voice_bot              ← l'username che hai scelto
set WEBAPP_URL=https://abcd-1234.ngrok-free.app/tg.html  ← URL ngrok + /tg.html
```

### STEP 6 · Avvia il bot

Doppio click su `avvia-bot-tg.bat`.

Vedrai:
```
🤖 VOX Bot avviato
   WebApp URL: https://...
   Bot username: @vox_voice_bot
   Pronto.
```

### STEP 7 · TESTA

1. Apri Telegram
2. Cerca `@vox_voice_bot` (o il nome che hai scelto)
3. Premi **Start**
4. Tappa il bottone **🎙 Apri VOX** → si apre l'app dentro Telegram!

---

## 🚀 Comandi disponibili nel bot

- `/start` — Schermata di benvenuto + bottone apri app
- `/stanze` — Vai diretto alle stanze a tema
- `/about` — Info su VOX
- `/help` — Aiuto

---

## ⚠️ Limiti durante il test

### ngrok gratuito
- URL **cambia ogni volta** che riavvii ngrok
- Per ogni cambio URL devi:
  1. Aggiornare `WEBAPP_URL` in `avvia-bot-tg.bat`
  2. Aggiornare l'URL su `@BotFather` → `/myapps` → seleziona app → `Edit URL`

### Per produzione
Compra un dominio (`vox-app.com`) e usa **Cloudflare Tunnel** gratis → URL stabile.
Già hai pronto `nginx-kouverte.com.conf` per reverse proxy.

---

## 🔐 Sicurezza · validazione auth

Il server **valida l'`initData`** firmato da Telegram (HMAC-SHA256 + token bot) all'endpoint `POST /api/tg/auth`.

Solo se l'auth è genuina, l'utente viene marcato `verified: true`.

Per attivare la validazione, prima di avviare `vox-server.js`:
```cmd
set BOT_TOKEN=1234567890:ABC...
node vox-server.js
```

Senza il token, l'auth funziona ma `verified: false`.

---

## 🎁 Bonus · funzionalità Telegram-native attive

L'app `tg.html` usa il Telegram WebApp SDK e supporta:

| Feature | Come |
|---|---|
| **Tema dinamico** | Si adatta al tema Telegram (light/dark, accent color) |
| **Haptic feedback** | `tg.HapticFeedback.impactOccurred('medium')` su tap |
| **BackButton nativo** | Si attiva automaticamente nelle stanze |
| **Share invite** | Apre lo Telegram share sheet con il link bot |
| **Closing confirmation** | Chiede conferma prima di chiudere se sta registrando |
| **Auto-expand** | App in fullscreen al lancio |
| **User auto-login** | Da `tg.initDataUnsafe.user` |

---

## 📞 Test rapido senza Telegram

`tg.html` funziona **anche fuori da Telegram** (modalità ospite). Vai su:
```
http://localhost:8082/tg.html
```
Vedrai un banner che dice "Apri il bot per esperienza completa", ma puoi navigare per testare il design.

---

## ✅ Checklist finale

- [ ] Token bot da BotFather → in `avvia-bot-tg.bat`
- [ ] ngrok in esecuzione → URL HTTPS valido
- [ ] URL aggiornato su BotFather (`/myapps` → Edit URL)
- [ ] `vox-server.js` in esecuzione su 8082
- [ ] `tg-bot.js` in esecuzione
- [ ] Test su Telegram: `/start` → Apri VOX → funziona

Quando tutti i flag sono ✅, hai una **mini app Telegram funzionante**.

---

## 🔄 Quick start (se hai già configurato)

```cmd
:: Terminale 1 — Server VOX
node vox-server.js

:: Terminale 2 — Tunnel HTTPS
ngrok http 8082

:: Terminale 3 — Bot Telegram
node tg-bot.js
```

Oppure **3 doppi click**:
1. `start-vox.bat`
2. `avvia-tunnel.bat`
3. `avvia-bot-tg.bat`

Buon dating al buio. 🎙
