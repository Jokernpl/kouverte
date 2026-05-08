// ============================================================
// VOX · Telegram Bot
// ============================================================
// Setup:
//   1. Crea il bot su @BotFather → /newbot → ricevi TOKEN
//   2. Imposta il token in .env oppure come variabile d'ambiente:
//        BOT_TOKEN=1234567890:ABC...
//   3. Imposta l'URL HTTPS della Mini App (ngrok, cloudflare tunnel, ecc):
//        WEBAPP_URL=https://xxx.ngrok.io/tg.html
//   4. Su BotFather: /newapp → seleziona il bot → URL = WEBAPP_URL
//   5. Avvia: node tg-bot.js
//
// Dipendenza: npm i node-telegram-bot-api
// ============================================================

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN || '8782933185:AAEsR_3FfeSBlox5OPZb18WA-hcPDVq5oGU';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://09ef98234a760f.lhr.life/tg.html';
const BOT_USERNAME = process.env.BOT_USERNAME || 'Kouverte_bot';

if (BOT_TOKEN.startsWith('INSERISCI')) {
    console.error('\n❌ TOKEN BOT MANCANTE\n');
    console.error('   1. Vai su Telegram → @BotFather → /newbot');
    console.error('   2. Copia il token e mettilo in .env oppure:');
    console.error('      set BOT_TOKEN=1234567890:ABC...   (Windows)');
    console.error('      export BOT_TOKEN=...               (Linux/Mac)\n');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 VOX Bot avviato');
console.log('   WebApp URL: ' + WEBAPP_URL);
console.log('   Bot username: @' + BOT_USERNAME);
console.log('   Pronto. Scrivi /start al bot per testare.\n');

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'amico';
    bot.sendMessage(chatId,
`🎙 *Benvenuto su VOX, ${firstName}!*

Vanishing Voice · La voce non mente.

Tocca il pulsante qui sotto per aprire l'app — niente download, niente registrazione complicata. Sei già dentro.

Puoi:
• 🎙 Pubblicare voci che spariscono in 24h
• 💬 Entrare in stanze a tema
• ❤️ Reagire alle voci di altri
• 🌙 Scoprire chi sente come te

Pronto?`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎙 Apri VOX', web_app: { url: WEBAPP_URL } }],
                    [{ text: 'Invita un amico', switch_inline_query: 'Senti questa voce 🎙 t.me/' + BOT_USERNAME }]
                ]
            }
        }
    );
});

// /help
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
`*Come usare VOX:*

/start — Apri l'app
/stanze — Lista stanze a tema
/about — Cos'è VOX
/help — Questo messaggio

*Comandi rapidi nell'app:*
• Tocca il microfono al centro per registrare (max 60s)
• Scrolla verticalmente per il feed delle voci
• Tocca una stanza per chattare a tema
• Tocca il cuore per reagire

Le voci spariscono in 24h. I messaggi nelle stanze in 1h. Niente è per sempre, e va bene così.`,
        { parse_mode: 'Markdown' }
    );
});

// /stanze
bot.onText(/\/stanze/, (msg) => {
    bot.sendMessage(msg.chat.id,
`🏠 *Le 6 stanze pubbliche:*

🎬 Cinema d'autore
🌙 Insonni alle 3
💔 Cuori spezzati
✈️ Sogni di partire
🎵 Vinili e voci
🤫 Confessioni anonime

Tutti i messaggi spariscono dopo 1 ora.`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🏠 Apri stanze', web_app: { url: WEBAPP_URL + '#rooms' } }]] }
        }
    );
});

// /about
bot.onText(/\/about/, (msg) => {
    bot.sendMessage(msg.chat.id,
`*VOX · Vanishing Voice*

L'unica app dove condividi la tua voce, non la tua faccia.
Tutto sparisce in 24 ore.
Niente foto, niente fake.

La voce non mente.

— Made in Italy 🇮🇹`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🎙 Apri VOX', web_app: { url: WEBAPP_URL } }]] }
        }
    );
});

// Web App data callback (quando l'utente preme MainButton dentro l'app)
bot.on('web_app_data', (msg) => {
    const data = msg.web_app_data.data;
    bot.sendMessage(msg.chat.id, `Ricevuto da WebApp: ${data}`);
});

// Inline button per condivisioni virali
bot.on('inline_query', (query) => {
    const results = [{
        type: 'article',
        id: '1',
        title: '🎙 Invita su VOX',
        description: 'Condividi VOX con un amico',
        input_message_content: {
            message_text: '🎙 *VOX* — La voce non mente.\n\nVoci che spariscono in 24h. Niente foto, solo te.\n\nApri @' + BOT_USERNAME + ' per entrare.',
            parse_mode: 'Markdown'
        }
    }];
    bot.answerInlineQuery(query.id, results);
});

bot.on('polling_error', (err) => {
    console.error('[POLLING ERROR]', err.code, err.message);
});

// Cleanup al exit
process.on('SIGINT', () => {
    console.log('\n🛑 Bot stopped');
    bot.stopPolling();
    process.exit(0);
});
