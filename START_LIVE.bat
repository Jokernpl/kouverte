@echo off
echo.
echo ====================================================
echo  KOUVERTE VOX - AVVIO LIVE
echo ====================================================
echo.

REM Kill any existing processes
taskkill /F /IM node.exe >/dev/null 2>&1

echo Starting Node.js server on port 8082...
start "Kouverte VOX Server" npm start

timeout /t 4 /nobreak

echo.
echo Starting public tunnel...
start "Kouverte VOX Tunnel" npx localtunnel --port 8082 --subdomain kouverte-vox 2>&1

timeout /t 6 /nobreak

echo.
echo ====================================================
echo  APP LIVE - Link pubblico creato!
echo ====================================================
echo.
echo Share this link with friends:
echo https://kouverte-vox.loca.lt/app.html
echo.
echo Keep these windows open to keep the app online.
echo.
pause
