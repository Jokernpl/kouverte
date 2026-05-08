@echo off
echo ================================================
echo  VOX · Voice Stories Platform
echo  Avvio server produzione
echo ================================================
echo.

REM Controlla se Node.js è installato
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRORE: Node.js non trovato!
    echo Scarica da: https://nodejs.org
    pause
    exit /b 1
)

REM Controlla se le dipendenze sono installate
if not exist "node_modules" (
    echo Installazione dipendenze...
    call npm install express better-sqlite3
)

REM Imposta variabili ambiente
set NODE_ENV=production
set PORT=8082

echo.
echo [VOX] Avvio server su porta %PORT%...
echo [VOX] Premi CTRL+C per fermare
echo.

node vox-server.js
pause
