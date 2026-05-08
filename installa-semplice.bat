@echo off
chcp 65001 >nul
echo ================================
echo  VO✕ · Installazione Semplice
echo ================================
echo.

REM Rimuovi vecchi file
echo [1/4] Pulizia vecchi file...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del /q package-lock.json
echo     ✅ Pulizia completata

REM Crea nuovo package.json senza better-sqlite3
echo [2/4] Creazione package.json...
(
echo {
echo   "name": "kouverte-voice",
echo   "version": "1.0.0",
echo   "description": "VOX Voice Stories",
echo   "main": "vox-server.js",
echo   "scripts": {
echo     "start": "node vox-server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.0",
echo     "socket.io": "^4.7.0"
echo   }
echo }
) > package.json
echo     ✅ package.json creato

REM Installa dipendenze
echo [3/4] Installazione express e socket.io...
call npm install
if errorlevel 1 (
    echo     ❌ Errore installazione
    pause
    exit /b 1
)
echo     ✅ Dipendenze installate

REM Avvia server
echo [4/4] Avvio server...
echo ================================
echo  ✅ PRONTO! Server in avvio...
echo ================================
node vox-server.js

pause
