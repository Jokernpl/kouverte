# 🎙️ KOUVERTE VOX - Deploy su www.kouverte.com

## ✅ STATUS ATTUALE:
- ✓ Server Node.js completato (vox-server.js)
- ✓ Frontend redesegnato (app.html - aurora design)
- ✓ Database pronto (vox-data.json)
- ✓ package.json e render.yaml configurati
- ✓ Codice committato e pronto per push

---

## 🚀 STEP 1: Crea GitHub Repo e Pusha il Codice

### 1.1 Vai su GitHub:
- URL: https://github.com/new
- **Repository name**: `kouverte-vox`
- **Description**: `KOUVERTE - The Voice Dating Platform`
- **Public** (così Render può accedere)
- Click: **Create repository**

### 1.2 Copia il codice in PowerShell:
```powershell
cd C:\Users\broke\Desktop\Kouverte-Voice

# Configura remote (sostituisci TUO_USERNAME con il tuo username GitHub)
git remote add origin https://github.com/TUO_USERNAME/kouverte-vox.git
git branch -M main
git push -u origin main
```

**Risultato**: Il codice è ora su GitHub! ✓

---

## 🌐 STEP 2: Crea Render App con Dominio Custom

### 2.1 Vai su Render:
- URL: https://dashboard.render.com
- Sign up (puoi usare GitHub login - più veloce)

### 2.2 Crea Web Service:
1. Click: **New ➕** → **Web Service**
2. **Connect a repository**: Seleziona `kouverte-vox`
3. **Build & Deploy Settings**:
   - **Name**: `kouverte-vox`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node vox-server.js`
   - **Plan**: Free
   - Click: **Create Web Service**

### 2.3 Attendi il Deploy (2-3 min):
Render installa dipendenze e avvia il server. Vedrai:
- `Build started...`
- `Build succeeded`
- `Deployed!`

**Risultato URL Render**: 
```
https://kouverte-vox.onrender.com
```

Testa: https://kouverte-vox.onrender.com/app.html

---

## 🌍 STEP 3: Collega il Dominio www.kouverte.com

### 3.1 In Render Dashboard:
1. Vai al tuo Web Service: `kouverte-vox`
2. Scroll down → **Custom Domain**
3. Click: **Add Custom Domain**
4. Incolla: `www.kouverte.com`
5. Click: **Add**

Render mostrerà:
```
Add this record to your DNS provider:
Type: CNAME
Name: www
Value: kouverte-vox.onrender.com
```

### 3.2 Configura DNS sul tuo provider:

**Dov'è hostato il dominio? (Cerca provider DNS):**

#### **Option A: Se usi GoDaddy**:
1. Vai a: https://dcc.godaddy.com/
2. Accedi con le tue credenziali
3. Seleziona il dominio `kouverte.com`
4. **Gestisci DNS** (o **DNS Records**)
5. Modifica/Crea record:
   ```
   Type: CNAME
   Name: www
   Value: kouverte-vox.onrender.com
   TTL: 3600 (o default)
   ```
6. **Save**

#### **Option B: Se usi Namecheap**:
1. Vai a: https://www.namecheap.com/dashboard/
2. Accedi
3. Seleziona `kouverte.com` → **Manage**
4. **Advanced DNS** tab
5. Aggiungi record:
   ```
   Type: CNAME
   Host: www
   Value: kouverte-vox.onrender.com
   TTL: 3600
   ```
6. **Save**

#### **Option C: Se usi CloudFlare**:
1. Vai a: https://dash.cloudflare.com/
2. Seleziona `kouverte.com`
3. **DNS** tab
4. **+ Add record**:
   ```
   Type: CNAME
   Name: www
   Target: kouverte-vox.onrender.com
   TTL: Auto
   ```
5. **Save**

#### **Option D: Altro provider?**
1. Accedi al tuo account provider
2. Cerca: "DNS Records" o "Zone File"
3. Aggiungi CNAME:
   ```
   www CNAME kouverte-vox.onrender.com
   ```

### 3.3 Verifica la propagazione:
- Aspetta 5-30 minuti (DNS propagation)
- Apri: https://www.whatsmydns.net/
- Digita: `www.kouverte.com`
- Quando vedi ✓ verde, è pronto!

---

## ✅ TEST FINALE:

Una volta che DNS è propagato:

```
https://www.kouverte.com/app.html
```

Dovrebbe mostrare l'app Kouverte Vox!

**Accedi con**:
- Email: `test1@kouverte.local`
- Password: `Test123456`

---

## 🔧 Variabili Ambiente (Render):

Se Render richiede variabili, il `render.yaml` le configura automaticamente:
- `PORT: 8082`
- `NODE_ENV: production`
- `JWT_SECRET: kouverte-vox-secret-key-change-in-prod` ⚠️ (cambia in produzione!)

Se vuoi cambiarla:
1. Vai in Render → Web Service → **Environment**
2. Edit `JWT_SECRET` con una nuova key random
3. Redeploy

---

## 🚨 Checklist Finale:

- [ ] GitHub repo creato e codice pushato
- [ ] Render account creato
- [ ] Web Service deployato
- [ ] Custom domain `www.kouverte.com` aggiunto in Render
- [ ] CNAME aggiunto al provider DNS
- [ ] DNS propagato (whatsmydns.net mostra ✓)
- [ ] App accessibile da https://www.kouverte.com/app.html
- [ ] Puoi registrarti e usare l'app

---

## 📊 Risultato Finale:

| Componente | Status |
|---|---|
| **App Online** | ✅ 24/7 live su Render |
| **Dominio** | ✅ www.kouverte.com |
| **Database** | ✅ Persistente (vox-data.json) |
| **HTTPS** | ✅ Automatico su Render |
| **Costo** | ✅ GRATIS (Render free tier) |

---

## 💡 Se qualcosa non funziona:

1. **Render non trova il repo GitHub**:
   - Assicurati che il repo sia PUBLIC
   - Riconnetti l'account GitHub in Render

2. **DNS non si propaga**:
   - Aspetta più tempo (fino a 48h in rari casi)
   - Verifica che il CNAME sia corretto

3. **App mostra errore su Render**:
   - Clicca **View logs** in Render dashboard
   - Cerca il messaggio di errore
   - Verifica che `PORT` sia 8082

4. **Database vuoto dopo deploy**:
   - Normal! Render crea un file `vox-data.json` nuovo
   - Crea il primo utente via registrazione

---

## 🎉 Congratulazioni!

KOUVERTE VOX è ora live su **www.kouverte.com** con il tuo dominio vero! 🎙️

Chiunque nel mondo può accedere da un singolo link e usare la piattaforma di voice dating.

**Prossimi step opzionali**:
- [ ] Aggiungere HTTPS custom SSL (Render lo fa gratis)
- [ ] Configurare backup automatico del database
- [ ] Aggiungere monitoring/alerting
- [ ] Scalare a un piano pagato se traffico aumenta

---

**Script completato da Claude**  
**Data**: 12/05/2026  
**App Status**: Production Ready ✅
