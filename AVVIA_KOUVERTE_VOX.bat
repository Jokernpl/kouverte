@echo off
REM ════════════════════════════════════════════════════════════════
REM KOUVERTE VOX - Avvia Server + Tunnel Stabile
REM ════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

echo.
echo 🚀 KOUVERTE VOX - AVVIO COMPLETO
echo ════════════════════════════════════════════════════════════════
echo.

REM Verifica se Node.js è installato
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js non è installato!
    echo Scarica da: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js trovato
echo.

REM Vai alla cartella del progetto
cd /d "%~dp0"

echo 📁 Cartella: %CD%
echo.

REM Avvia il server Node.js
echo 🔧 Avvio server Node.js sulla porta 8082...
start "Kouverte VOX Server" cmd /k "npm start"

REM Aspetta che il server sia pronto
timeout /t 3 /nobreak

REM Avvia il tunnel stabile
echo 🌐 Avvio tunnel stabile...
start "Kouverte VOX Tunnel" cmd /k "node start-stable-tunnel.js"

REM Aspetta che il tunnel si connetta
timeout /t 5 /nobreak

REM Mostra il file con i link
echo.
echo ════════════════════════════════════════════════════════════════
echo ✅ KOUVERTE VOX È ONLINE!
echo ════════════════════════════════════════════════════════════════
echo.
echo 📄 Link per gli amici salvati in:
echo    INVITI_AMICI\LINK_APP.txt
echo.
echo 📖 Contenuto del file:
echo ────────────────────────────────────────────────────────────────

type "INVITI_AMICI\LINK_APP.txt"

echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo 🎙️  Invia i link sopra ai tuoi amici!
echo.
echo 📊 Log del tunnel: tunnel-stable.log
echo 📊 Log del server: Vedi la finestra "Kouverte VOX Server"
echo.
echo 🛑 Per fermare: Chiudi entrambe le finestre
echo ════════════════════════════════════════════════════════════════
echo.

pause
