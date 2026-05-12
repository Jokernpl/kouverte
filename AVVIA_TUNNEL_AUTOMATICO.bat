@echo off
chcp 65001 >nul
title Kouverte VOX - Tunnel Setup Automatico

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo  🎙️ KOUVERTE VOX - GENERAZIONE LINK PUBBLICO
echo ════════════════════════════════════════════════════════════════
echo.

REM Verifica che il server sia in esecuzione
echo ⏳ Verifico che il server sia online...
timeout /t 2 /nobreak > nul

REM Tenta di ottenere la URL da ngrok se già configurato
echo.
echo 🔍 Controllando se ngrok è già configurato...

REM Prova ad avviare ngrok
npx ngrok http 8082 > ngrok_output.txt 2>&1 &
set NGROK_PID=%ERRORLEVEL%

echo.
echo ⏳ Avvio ngrok (aspetta 5 secondi)...
timeout /t 5 /nobreak

REM Controlla l'output di ngrok per errori
findstr /i "authentication failed" ngrok_output.txt > nul
if errorlevel 1 (
    REM Nessun errore di auth, il tunnel potrebbe essere attivo
    echo ✅ ngrok avviato!
    echo.
    echo Apri questa finestra per vedere il link:
    echo   Dovrebbe mostrare: "Forwarding https://...ngrok.io"
    echo.
    echo Nel frattempo, prova ad accedere da un'altra finestra:
    echo   http://localhost:8082/app.html
    echo.
    echo Per ottenere il link pubblico, guarda la finestra ngrok!
    echo.
    pause
) else (
    REM Errore di autenticazione
    cls
    echo.
    echo ❌ ERROR: ngrok richiede un token di autenticazione
    echo.
    echo SOLUZIONE VELOCE (2 minuti):
    echo ════════════════════════════════════════════════════════════════
    echo.
    echo STEP 1: Apri questo link nel browser
    echo         https://dashboard.ngrok.com/signup
    echo.
    echo STEP 2: Registrati con Google (bottone Google in alto)
    echo.
    echo STEP 3: Copia il token da:
    echo         https://dashboard.ngrok.com/get-started/your-authtoken
    echo.
    echo STEP 4: Incolla il comando qui (apri CMD/PowerShell):
    echo         ngrok config add-authtoken [TOKEN]
    echo.
    echo STEP 5: Poi esegui di nuovo questo file (.bat)
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo.
    pause
    exit /b 1
)
