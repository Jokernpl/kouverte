@echo off
chcp 65001 >/dev/null
echo.
echo ════════════════════════════════════════════════════════
echo  🎙️ KOUVERTE VOX - AVVIO LIVE CON NGROK
echo ════════════════════════════════════════════════════════
echo.

REM Kill any existing node processes
taskkill /F /IM node.exe >/dev/null 2>&1

echo ✅ Avvio Server Node.js su porta 8082...
cd /d "%~dp0"
start "Kouverte VOX Server" cmd /k npm start

timeout /t 5 /nobreak

echo.
echo 🌐 Avvio tunnel ngrok...
start "Kouverte VOX Tunnel" cmd /k "ngrok http 8082 --log=stdout"

timeout /t 8 /nobreak

echo.
echo ════════════════════════════════════════════════════════
echo  ⏳ ASPETTA! Copia il link dalla finestra di ngrok
echo ════════════════════════════════════════════════════════
echo.
echo Vedrai un link tipo: https://xxxxx-xxxxx-xxx.ngrok.io
echo.
echo Condividi: https://xxxxx-xxxxx-xxx.ngrok.io/app.html
echo.
echo I tuoi amici potranno accedere da qualsiasi IP/device!
echo.
pause
