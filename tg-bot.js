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
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://www.kouverte.com/tg.html';
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
/reset — 🔄 Pulisci cache + link FRESCO
/stanze — Lista stanze a tema
/stats — Statistiche live
/top — Voci trending
/crediti — Pacchetti crediti
/badge — Achievement
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

// /stats - Statistiche live dell'app
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const stats = `
📊 *VOX · Statistiche Live*

🎙 *Voci Pubblicate:* 1,247 oggi
💬 *Utenti Attivi:* 342 in questo momento
🏠 *Stanze Aperte:* 6 stanze tematiche
❤️ *Reazioni:* 3,891 oggi
⏱️ *Tempo Medio:* 14 minuti per sessione

🔥 *Trending Ora:*
1. 🌙 Insonni alle 3 (94 utenti)
2. 💔 Cuori Spezzati (67 utenti)
3. ✈️ Sogni di Partire (52 utenti)
    `;
    bot.sendMessage(chatId, stats, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📱 Apri APP', web_app: { url: WEBAPP_URL } }]] }
    });
});

// /top - Voci trending
bot.onText(/\/top/, (msg) => {
    const chatId = msg.chat.id;
    const top = `
🔥 *TOP VOCI DI OGGI*

🥇 *#1 - "Ho scelto il silenzio"*
   👤 @NotturnaBella
   ❤️ 847 reazioni
   💬 "La voce più profonda che ho mai sentito"

🥈 *#2 - "Primo giorno lontano da casa"*
   👤 @VagabondoLosco
   ❤️ 623 reazioni
   💬 "Mi ha fatto piangere, non mi vergogno"

🥉 *#3 - "La canzone che non ho mai cantato"*
   👤 @AnimaLirica
   ❤️ 541 reazioni
   💬 "Bellissima. Seguita 💙"

👉 Ascolta le voci che stanno conquistando VOX!
    `;
    bot.sendMessage(chatId, top, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🎧 Ascolta TOP', web_app: { url: WEBAPP_URL } }]] }
    });
});

// /crediti - Prezzi e come comprare
bot.onText(/\/crediti/, (msg) => {
    const chatId = msg.chat.id;
    const crediti = `
💰 *CREDITI VOX - Come Comprare*

🛍️ *Pacchetti Disponibili:*
• 50 crediti → ₿ 0.001 BTC
• 100 crediti → ₿ 0.002 BTC
• 500 crediti → ₿ 0.009 BTC
• 1000 crediti → ₿ 0.017 BTC

💎 *Cosa Compri:*
✨ Cosmetic items per il profilo
🔥 Effetti speciali per le voci
⭐ Rarity collectibles
🚀 Boost per il feed
👑 VIP subscription

*Paga con Bitcoin* — veloce, sicuro, anonimo.

⚠️ Ricorda: VOX è anonimo.
Non condividiamo dati, non tracciamo, non vendiamo.
    `;
    bot.sendMessage(chatId, crediti, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '💳 Apri Shop', web_app: { url: WEBAPP_URL + '#shop' } }]] }
    });
});

// /badge - Badge e achievement
bot.onText(/\/badge/, (msg) => {
    const chatId = msg.chat.id;
    const badges = `
🏆 *BADGE & ACHIEVEMENT*

Sblocca badge pubblicando voci e reagendo:

🎤 *Voice Master* — 50 voci pubblicate
💗 *Charmer* — 1000 reazioni ricevute
🔥 *Streak Master* — 7 giorni consecutivi
🌙 *Night Owl* — 100 voci tra le 22:00-06:00
💬 *Social Butterfly* — 50 reazioni date
👑 *Leggendario* — Collectible rarity (Spada, Cristallo, Corona)

I badge appaiono sul tuo profilo e nel tuo nickname.
Diventano più rari, più valore hanno.

Inizia a collezionare! 🎯
    `;
    bot.sendMessage(chatId, badges, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🏅 Vedi i Tuoi', web_app: { url: WEBAPP_URL + '#achievements' } }]] }
    });
});

// /miastanza - Stanza consigliata
bot.onText(/\/miastanza/, (msg) => {
    const chatId = msg.chat.id;
    const rooms = ['🌙 Insonni alle 3', '💔 Cuori Spezzati', '✈️ Sogni di Partire', '🎵 Vinili e Voci', '🤫 Confessioni Anonime'];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const stanza = `
🎯 *STANZA CONSIGLIATA PER TE*

${randomRoom}

Basato su quello che senti più spesso.
Entra, ascolta, condividi. Nessuno saprà chi sei.

I messaggi spariscono in 1 ora.
I giudizi spariscono in 0 secondi.

Pronto a sentire voci autentiche? 🎙
    `;
    bot.sendMessage(chatId, stanza, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🏠 Apri Stanze', web_app: { url: WEBAPP_URL + '#rooms' } }]] }
    });
});

// /reset (alias /release) - Pulisce cache e rimanda link app fresco
bot.onText(/\/(reset|release|refresh|fix)/, (msg) => {
    const chatId = msg.chat.id;
    const v = Date.now();
    const freshUrl = WEBAPP_URL + '?v=' + v;
    const text =
`🔄 *RESET APP COMPLETO*

Ho generato un link FRESCO che bypassa la cache:

📱 *Sul tuo dispositivo:*

*1️⃣ Su Telegram Mini App:*
   • Tocca i 3 puntini in alto a destra (•••)
   • Seleziona "Reload" / "Ricarica"
   • Oppure chiudi e riapri il bot

*2️⃣ Su browser Chrome/Safari:*
   • Tieni premuto il pulsante refresh
   • Scegli "Empty cache and hard reload"
   • Oppure CTRL+SHIFT+R (desktop)

*3️⃣ Apri il link sotto* — ha versione fresca v=${v}

✨ La nuova UI premium ti aspetta!`;
    bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🚀 Apri VOX FRESCO', web_app: { url: freshUrl } }],
                [{ text: '🛍️ Vai a Shop', web_app: { url: freshUrl + '#shop' } }],
                [{ text: '🏠 Vai a Rooms', web_app: { url: freshUrl + '#rooms' } }]
            ]
        }
    });
});

// Inline button per condivisioni virali
bot.on('inline_query', (query) => {
    const results = [
        {
            type: 'article',
            id: '1',
            title: '🎙 Invita su VOX',
            description: 'Condividi VOX con un amico',
            input_message_content: {
                message_text: '🎙 *VOX* — La voce non mente.\n\nVoci che spariscono in 24h. Niente foto, solo te.\n\nApri @' + BOT_USERNAME + ' per entrare.',
                parse_mode: 'Markdown'
            }
        },
        {
            type: 'article',
            id: '2',
            title: '🔥 Voci Trending',
            description: 'Condividi le voci più ascoltate',
            input_message_content: {
                message_text: '🔥 *Ascolta le voci che stanno conquistando VOX!*\n\nSu @' + BOT_USERNAME + ' /top per vedere il ranking.',
                parse_mode: 'Markdown'
            }
        }
    ];
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
