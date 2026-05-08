# VO✕ · Voice Stories Platform

Piattaforma completa di voice stories che svaniscono, chiamate WebRTC e shop integrato. Pronta per il deploy su www.kouverte.com.

## 📋 Cosa include

### Backend (vox-server.js)
- **Stories a scomparsa**: Le storie spariscono dopo 24 ore
- **Duelli vocali**: Due utenti si sfidano su un tema, la gente vota
- **Chiamate WebRTC**: Chiamate vocali in tempo reale tramite Socket.io
- **Shop integrato**: Sistema crediti, prodotti, transazioni
- **Admin Panel**: Gestione completa utenti, contenuti, statistiche
- **Sicurezza**: Headers di sicurezza, validazione input, transazioni atomiche

### Frontend
- **vox.html**: Interfaccia principale - registrazione, stories, duelli
- **call.html**: Chiamate vocali WebRTC
- **live.html**: Stanze vocali live (Kouverte Live)
- **room.html**: Interno stanza live
- **shop.html**: Negozio gadget e crediti
- **admin.html**: Pannello amministrazione completo

### Deploy
- **deploy-vox.bat**: Avvio rapido Windows
- **ecosystem.config.json**: Configurazione PM2 per produzione
- **nginx-kouverte.com.conf**: Configurazione Nginx con SSL
- **start-vox.bat**: Avvio semplificato

## 🚀 Installazione rapida

1. **Prerequisiti**: Node.js installato (https://nodejs.org)

2. **Installa dipendenze**:
   ```bash
   npm install express better-sqlite3 socket.io
   ```

3. **Avvio locale**:
   - Windows: doppio click su `start-vox.bat`
   - Manuale: `node vox-server.js`

4. **Apri nel browser**:
   - App: `http://localhost:8082/vox.html`
   - Admin: `http://localhost:8082/admin.html`
   - Live: `http://localhost:8082/live.html`

## 🌐 Deploy su www.kouverte.com

### 1. Prepara il server (VPS Linux consigliato)
```bash
# Connetti al tuo server
ssh root@tuo-server-ip

# Installa Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Installa Nginx
apt-get install -y nginx

# Installa PM2 per gestione processi
npm install -g pm2
```

### 2. Carica i file
```bash
# Crea cartella
mkdir -p /var/www/kouverte-voice
cd /var/www/kouverte-voice

# Carica tutti i file (via SCP, Git, o FTP)
# Assicurati che ci siano: vox-server.js, *.html, ecoystem.config.json
```

### 3. Configura Nginx
```bash
# Copia la configurazione
cp nginx-kouverte.com.conf /etc/nginx/sites-available/kouverte.com
ln -s /etc/nginx/sites-available/kouverte.com /etc/nginx/sites-enabled/

# Test configurazione
nginx -t

# Riavvia Nginx
systemctl restart nginx
```

### 4. SSL con Let's Encrypt
```bash
# Installa Certbot
apt-get install -y certbot python3-certbot-nginx

# Genera certificato (sostituisci con il tuo dominio)
certbot --nginx -d www.kouverte.com -d kouverte.com
```

### 5. Avvia con PM2
```bash
cd /var/www/kouverte-voice
pm2 start ecosystem.config.json
pm2 save
pm2 startup  # segui le istruzioni per avvio automatico
```

### 6. Punta il dominio
Nel pannello del tuo registrar (GoDaddy, Namecheap, ecc.):
- A Record: `www.kouverte.com` → IP del tuo server
- A Record: `kouverte.com` → IP del tuo server

## 📊 Struttura database

- **users**: Utenti registrati
- **stories**: Stories vocali (scadono in 24h)
- **reactions**: Reazioni alle stories
- **duels**: Duelli vocali
- **votes**: Voti nei duelli
- **shop_products**: Prodotti shop
- **user_inventory**: Inventario utenti
- **transactions**: Transazioni acquisti
- **user_credits**: Crediti utenti

## 🔧 API Endpoints

### Pubbliche
| Metodo | Percorso | Descrizione |
|--------|----------|-------------|
| GET | `/api/health` | Controllo salute server |
| POST | `/api/auth` | Login/registrazione |
| GET | `/api/stories` | Feed stories attive |
| POST | `/api/stories` | Pubblica storia |
| GET | `/api/stories/:id/audio` | Ottieni audio storia |
| POST | `/api/stories/:id/react` | Reagisci a storia |
| GET | `/api/duels` | Lista duelli attivi |
| POST | `/api/duels` | Crea duello |
| POST | `/api/duels/:id/join` | Unisciti a duello |
| POST | `/api/duels/:id/vote` | Vota duello |
| GET | `/api/shop/products` | Lista prodotti |
| POST | `/api/shop/buy` | Acquista prodotto |

### Admin
| Metodo | Percorso | Descrizione |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Statistiche generali |
| GET | `/api/admin/users` | Lista utenti |
| DELETE | `/api/admin/users/:id` | Elimina utente |
| GET | `/api/admin/stories` | Gestione stories |
| DELETE | `/api/admin/stories/:id` | Elimina storia |
| GET | `/api/admin/duels` | Gestione duelli |
| DELETE | `/api/admin/duels/:id` | Elimina duello |
| GET | `/api/admin/shop/stats` | Statistiche shop |
| POST | `/api/cleanup` | Pulisci scaduti |
| POST | `/api/admin/reset` | Reset database |

## 💰 Monetizzazione

- **Crediti system**: Gli utenti comprano crediti
- **VIP Subscription**: Stories che durano 7 giorni, badge esclusivi
- **Boost**: Storia in cima al feed per 2 ore
- **Temi cosmetici**: Personalizzazione profilo
- **Prossimi passi**: Integrazione Stripe/PayPal per pagamenti reali

## 🔒 Sicurezza

- Headers di sicurezza (HSTS, X-Frame-Options, ecc.)
- Validazione input su tutti gli endpoint
- Transazioni atomiche per operazioni critiche
- Rate limiting consigliato (da aggiungere con Nginx o middleware)
- HTTPS obbligatorio in produzione

## 📞 Supporto

Per problemi o modifiche:
- Controlla i log: `pm2 logs vox`
- Controlla errore Nginx: `tail -f /var/log/nginx/kouverte-error.log`
- Riavvia server: `pm2 restart vox`

## 📝 Note tecniche

- **Database**: SQLite (meglio per inizio, migrare a PostgreSQL per scale)
- **Audio storage**: Base64 nel DB (meglio spostare su S3/CDN per produzione)
- **WebRTC**: Funziona con STUN server pubblici (aggiungere TURN per produzione)
- **Socket.io**: Gestisce signaling WebRTC e stato utenti online

---

**VO✕ è pronto per il lancio su www.kouverte.com!** 🚀
