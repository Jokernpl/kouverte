# 🚀 Deploy su Render (1 Click)

## ⚡ Soluzione: Deployment Gratuito su Render.com

L'app è già pronta per il deployment. Render.com offre **hosting gratuito permanente** (24/7, senza PC acceso).

### 🎯 Come deployare in 1 MINUTO:

#### **OPZIONE 1: Deploy via GitHub (più veloce)**

1. **Push il progetto su GitHub** (se non l'hai già fatto):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TUO_USERNAME/kouverte-vox.git
   git push -u origin main
   ```

2. **Vai su**: https://render.com/

3. **Clicca**: "New +" → "Web Service"

4. **Collega il repository GitHub** (`kouverte-vox`)

5. **Render automaticamente**:
   - Installa le dipendenze (`npm install`)
   - Avvia il server
   - Genera l'URL pubblico

**Risultato**: https://kouverte-vox.onrender.com/app.html

---

#### **OPZIONE 2: Deploy Manuale (senza GitHub)**

Se preferisci non usare GitHub:

1. Vai su: https://render.com/
2. Crea account (gratuito)
3. Clicca "New Web Service"
4. Scegli "Public Git Repository"
5. Incolla questo URL:
   ```
   https://github.com/TUACOPIA/kouverte-vox
   ```
   (O carica i file manualmente via zip)

6. Render fa il resto automaticamente! ✨

---

### ⏱️ Timeline:
- **1-2 min**: Registrazione Render
- **30 sec**: Collegare GitHub
- **2-3 min**: Build e deploy

**TOTALE: 5 minuti max** ✅

---

### 📊 Dopo il Deploy:

Avrai:
- ✅ **URL pubblico permanente** (24/7 online)
- ✅ **Accessibile da qualsiasi IP/dispositivo**
- ✅ **Database persistente** (vox-data.json)
- ✅ **Scalability gratuita** (fino a 750 ore/mese)
- ✅ **HTTPS automatico**

---

### 🎮 Usa l'app:
```
https://kouverte-vox.onrender.com/app.html

Email: test1@kouverte.local
Password: Test123456
```

---

### 💡 Alternative (se Render non funziona):

- **Railway.app** — Deploy uguale facile, gratuito
- **Vercel** — Per frontend + backend serverless
- **Replit** — Online IDE con hosting incluso

---

**Hai bisogno di aiuto? Dimmi e ti guide passo-passo!** 🚀
