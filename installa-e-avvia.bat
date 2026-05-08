@echo off
chcp 65001 >nul
echo ================================================
echo  VO✕ · Installazione e Avvio Automatico
echo ================================================
echo.

REM === 1. Controlla Node.js ===
echo [1/4] Controllo Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRORE: Node.js non trovato!
    echo Scarica da: https://nodejs.org
    pause
    exit /b 1
)
echo    ✅ Node.js trovato: 
node --version

REM === 2. Rimuovi node_modules vecchio ===
echo.
echo [2/4] Pulizia moduli precedenti...
if exist "node_modules" (
    rmdir /s /q node_modules 2>nul
    echo    ✅ Cartella node_modules rimossa
)

REM === 3. Installa SOLO i moduli necessari ===
echo.
echo [3/4] Installazione express e socket.io...
npm install express socket.io
if %errorlevel% neq 0 (
    echo ❌ Errore installazione!
    pause
    exit /b 1
)
echo    ✅ Moduli installati correttamente

REM === 4. Avvia server ===
echo.
echo [4/4] Avvio server VO✕...
echo ================================================
echo.
node vox-server.js

pause
