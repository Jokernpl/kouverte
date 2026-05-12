# Script per configurare ngrok e avviare il tunnel automaticamente
# Salva questo file e esegui: powershell -ExecutionPolicy Bypass -File CONFIGURA_NGROK_E_AVVIA.ps1

Clear-Host
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎙️ KOUVERTE VOX - SETUP NGROK" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Chiedi l'authtoken all'utente
Write-Host "Hai un token ngrok?" -ForegroundColor Yellow
Write-Host ""
Write-Host "Se no, registrati GRATIS in 30 secondi:" -ForegroundColor White
Write-Host "  1. Apri: https://dashboard.ngrok.com/signup" -ForegroundColor Gray
Write-Host "  2. Registrati con Google o email" -ForegroundColor Gray
Write-Host "  3. Copia il token da: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Incolla il tuo authtoken qui"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host ""
    Write-Host "❌ Token non fornito. Uscita." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚙️ Configurando ngrok..." -ForegroundColor Cyan

# Configura ngrok con il token
& ngrok config add-authtoken $token

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Token configurato!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Avvio tunnel ngrok..." -ForegroundColor Cyan
    Write-Host ""

    # Avvia ngrok in una nuova finestra
    Start-Process -FilePath "ngrok" -ArgumentList "http 8082" -PassThru | Out-Null

    Start-Sleep -Seconds 3

    # Prova a ottenere l'URL
    $tunnels = $null
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing -ErrorAction SilentlyContinue
        $publicUrl = $tunnels.tunnels[0].public_url
    } catch {}

    if ($publicUrl) {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ KOUVERTE VOX - ONLINE GLOBALE!" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 LINK PUBBLICO:" -ForegroundColor Yellow
        Write-Host "$publicUrl/app.html" -ForegroundColor Cyan -BackgroundColor Black
        Write-Host ""
        Write-Host "📋 Accedi con:" -ForegroundColor Yellow
        Write-Host "   Email: test1@kouverte.local" -ForegroundColor White
        Write-Host "   Password: Test123456" -ForegroundColor White
        Write-Host ""
        Write-Host "✅ Copia il link e condividilo con i tuoi amici!" -ForegroundColor Green
        Write-Host "   Loro potranno accedere da QUALSIASI IP/dispositivo" -ForegroundColor White
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green

        # Salva l'URL in un file
        $publicUrl | Out-File -FilePath "NGROK_LINK_ATTIVO.txt" -Encoding UTF8 -Force
        Write-Host ""
        Write-Host "💾 Link salvato in: NGROK_LINK_ATTIVO.txt" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "⏳ ngrok si sta avviando, guarda la finestra di ngrok per il link!" -ForegroundColor Yellow
        Write-Host "   Dovrebbe apparire: 'Forwarding https://...ngrok.io → http://localhost:8082'" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "❌ Errore nella configurazione di ngrok" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Premi un tasto per mantenere questa finestra aperta..." -ForegroundColor Gray
[System.Console]::ReadKey() | Out-Null
