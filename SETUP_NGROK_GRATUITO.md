# 🚀 Setup ngrok Gratuito - 2 minuti

## Passo 1: Signup Gratuito (1 minuto)
1. Apri: https://ngrok.com/signup
2. Registrati con Google o email
3. Verifica email
4. **Copia il tuo authtoken** (che riceverai)

## Passo 2: Configura ngrok (30 secondi)
Apri PowerShell/CMD nella cartella del progetto e esegui:

```powershell
ngrok config add-authtoken YOUR_TOKEN_HERE
```

Sostituisci `YOUR_TOKEN_HERE` con il token che hai copiato.

## Passo 3: Avvia ngrok (30 secondi)
```powershell
ngrok http 8082
```

Vedrai qualcosa come:
```
Forwarding     https://abc123def-456.ngrok.io -> http://localhost:8082
```

**Copia il link**: `https://abc123def-456.ngrok.io/app.html`

## Passo 4: Testa da remoto
1. Apri il link su **qualsiasi browser da qualsiasi IP**
2. **Accedi con:**
   - Email: test1@kouverte.local
   - Password: Test123456
3. Oppure **crea un account nuovo**

---

## ✅ VANTAGGI

- ✅ URL **pubblico e stabile** finché ngrok è in esecuzione
- ✅ Funziona da **qualsiasi IP/dispositivo**
- ✅ **Gratuito forever** (tier free illimitato)
- ✅ Niente problemi di SSH o firewall
- ✅ **Altre persone possono accedere facilmente**

---

## 🎯 RISULTATO FINALE

Dopo 2 minuti avrai un URL come:
```
https://abc123def-456.ngrok.io/app.html
```

E **tutte le persone dal mondo possono accedervi!**

---

## 📝 Note

- L'URL è **PUBBLICO** - chiunque con il link può accedere
- Il link è **STABILE** finché ngrok è in esecuzione
- Se il tuo PC si spegne, il link smette di funzionare
- Per URL **permanente** (24/7 senza PC), usa Render.com (vedi SETUP_COMPLETO.md)

---

**Se ngrok non funziona, avvisami e facciamo un Render deployment permanente!**
