@echo off
chcp 65001 >nul
echo ================================================
echo  VO✕ · Configurazione Completa Server
echo  IP Pubblico: 72.14.201.82
echo ================================================
echo.

REM === 1. Apri porta firewall Windows ===
echo [1/4] Configurazione Windows Firewall...
netsh advfirewall firewall add rule name="VOX Server" dir=in action=allow protocol=TCP localport=8082 >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✅ Firewall: Porta 8082 aperta
) else (
    echo     ⚠️  Firewall: Potrebbe servire conferma manuale
)

REM === 2. Controlla se Node.js è installato ===
echo [2/4] Controllo Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo     ❌ ERRORE: Node.js non trovato!
    echo     Scarica da: https://nodejs.org
    pause
    exit /b 1
)
echo     ✅ Node.js trovato

REM === 3. Installa dipendenze se necessario ===
echo [3/4] Controllo dipendenze...
if not exist "node_modules" (
    echo     Installazione dipendenze (express, better-sqlite3, socket.io)...
    call npm install express better-sqlite3 socket.io
    if errorlevel 1 (
        echo     ❌ Errore installazione dipendenze
        pause
        exit /b 1
    )
    echo     ✅ Dipendenze installate
) else (
    echo     ✅ Dipendenze già presenti
)

REM === 4. Crea file .env per produzione ===
echo [4/4] Creazione file configurazione...
echo PORT=8082 > .env
echo HOST=0.0.0.0 >> .env
echo NODE_ENV=production >> .env
echo DOMAIN=www.kouverte.com >> .env
echo     ✅ File .env creato

echo.
echo ================================================
echo  ✅ CONFIGURAZIONE COMPLETATA!
echo ================================================
echo.
echo PROSSIMI PASSI:
echo.
echo 1. Cloudflare DNS:
echo    - Tipo: A
echo    - Nome: kouverte.com
echo    - Contenuto: 72.14.201.82
echo    - Proxy: 🟠 (arancione)
echo.
echo    - Tipo: A
echo    - Nome: www
echo    - Contenuto: 72.14.201.82
echo    - Proxy: 🟠 (arancione)
echo.
echo 2. Avvia server:
echo    - Doppio click su: start-vox.bat
echo    - OPPURE comando: node vox-server.js
echo.
echo 3. Testa nel browser:
echo    - http://www.kouverte.com:8082/vox.html
echo    - http://72.14.201.82:8082/vox.html
echo.
echo ================================================
echo  🎙 VO✕ è pronto per il lancio!
echo ================================================
echo.
pause
