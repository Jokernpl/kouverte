@echo off
chcp 65001 >nul
echo ================================================
echo  KOUVERTE · Cloudflare Tunnel Setup
echo ================================================
echo.

REM Controlla se cloudflared esiste
if not exist "cloudflared.exe" (
    echo ❌ ERRORE: cloudflared.exe non trovato!
    echo 1. Scarica da: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    echo 2. Salvalo in: C:\Users\broke\Desktop\Kouverte-Voice\
    pause
    exit /b 1
)

echo ✅ cloudflared.exe trovato!
echo.
echo [1/3] Login su Cloudflare...
cloudflared tunnel login
if errorlevel 1 (
    echo ❌ Errore login! RiProva.
    pause
    exit /b 1
)

echo.
echo [2/3] Creazione tunnel...
cloudflared tunnel create kouverte
if errorlevel 1 (
    echo ⚠️ Tunnel "kouverte" esiste già o errore. Continuo...
)

echo.
echo [3/3] Esegui tunnel (non chiudere questa finestra!)...
echo ================================================
echo  🎙  Il sito sarà online su: https://kouverte.com
echo ================================================
echo.
cloudflared tunnel run --url localhost:8080 kouverte

pause
