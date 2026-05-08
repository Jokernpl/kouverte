@echo off
chcp 65001 >nul
title VOX · Telegram Bot
echo.
echo ========================================
echo   VOX  ·  Telegram Bot Launcher
echo   Bot: @Kouverte_bot
echo ========================================
echo.

cd /d "%~dp0"

REM ===== CONFIGURAZIONE =====
set BOT_TOKEN=8782933185:AAEsR_3FfeSBlox5OPZb18WA-hcPDVq5oGU
set BOT_USERNAME=Kouverte_bot
REM Modifica questa riga ogni volta che ngrok ti dà un nuovo URL:
set WEBAPP_URL=https://INSERISCI-URL-NGROK.ngrok-free.app/tg.html

echo Token:    %BOT_TOKEN:~0,15%...
echo Username: @%BOT_USERNAME%
echo WebApp:   %WEBAPP_URL%
echo.

if "%WEBAPP_URL%"=="https://INSERISCI-URL-NGROK.ngrok-free.app/tg.html" (
    echo X URL MINI APP MANCANTE!
    echo.
    echo Per ottenerlo:
    echo  1. Avvia ngrok: doppio click su avvia-tunnel.bat
    echo  2. Copia l'URL https che ngrok mostra
    echo     ^(es: https://abcd-1234.ngrok-free.app^)
    echo  3. Modifica QUESTO file con Notepad
    echo  4. Riga 17: incolla URL aggiungendo /tg.html alla fine
    echo  5. Salva e riavvia questo bat
    echo.
    pause
    exit /b 1
)

REM ===== INSTALL DEPS SE MANCANTE =====
if not exist "node_modules\node-telegram-bot-api" (
    echo Installo node-telegram-bot-api...
    call npm install node-telegram-bot-api --no-audit --no-fund
    echo.
)

REM ===== AVVIO BOT =====
echo.
echo Bot in avvio... (CTRL+C per fermare)
echo.
node tg-bot.js

pause
