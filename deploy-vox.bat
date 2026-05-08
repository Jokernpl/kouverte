@echo off
echo ===============================================
echo  VO✕ · Deploy su www.kouverte.com
echo ===============================================
echo.

REM Controlla seiamo nella cartella giusta
if not exist "vox-server.js" (
    echo ERRORE: Esegui questo script dalla cartella VO✕
    pause
    exit /b 1
)

REM Controlla Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRORE: Node.js non trovato!
    echo Scarica da: https://nodejs.org
    pause
    exit /b 1
)

REM Installa dipendenze se necessario
if not exist "node_modules" (
    echo Installazione dipendenze...
    call npm install express better-sqlite3 socket.io
    if errorlevel 1 (
        echo Errore installazione dipendenze
        pause
        exit /b 1
    )
)

REM Crea file .env per produzione
if not exist ".env" (
    echo Creazione file configurazione...
    echo PORT=8082 > .env
    echo HOST=0.0.0.0 >> .env
    echo NODE_ENV=production >> .env
    echo DOMAIN=www.kouverte.com >> .env
)

echo.
echo [VO✕] Avvio server in modalità produzione...
echo [VO✕] Dominio: www.kouverte.com
echo [VO✕] Porta: 8082
echo.
echo Premi CTRL+C per fermare il server
echo ===============================================
echo.

set NODE_ENV=production
node vox-server.js

pause
