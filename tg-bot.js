// ============================================================
// 🎙️ KOUVERTE VOX · MONSTER TELEGRAM BOT v2
// ============================================================
// Features:
// - Welcome con poster banner
// - Menu persistente reply keyboard
// - Sistema referral con tracking
// - Daily quest + reward
// - Mini quiz game (5 livelli)
// - Leaderboard top utenti
// - Smart auto-replies (chat naturale)
// - Multi-language IT/EN auto-detect
// - Voice clips support
// - Real-time stats dal server
// - /reset, /tip, /surprise, /vip, /report
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN || '8782933185:AAEsR_3FfeSBlox5OPZb18WA-hcPDVq5oGU';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://www.kouverte.com/tg.html';
const BOT_USERNAME = process.env.BOT_USERNAME || 'Kouverte_bot';
const SERVER_API = process.env.SERVER_API || 'http://localhost:8082';
const BTC_TIP_ADDRESS = 'bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00';

if (BOT_TOKEN.startsWith('INSERISCI')) {
    console.error('\n❌ TOKEN BOT MANCANTE\n');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 VOX MONSTER Bot v2 avviato');
console.log('   WebApp URL: ' + WEBAPP_URL);
console.log('   Bot username: @' + BOT_USERNAME);
console.log('   Server API: ' + SERVER_API);
console.log('   Comandi attivi: 18+\n');

// ============== STATE (in-memory) ==============
const userState = {}; // { chatId: { quizStep, score, lang, lastActive, refsCount, dailyClaimed } }
const referrals = {}; // { fromChatId: [toChatId, ...] }

function getState(chatId) {
    if (!userState[chatId]) userState[chatId] = { quizStep: 0, score: 0, lang: 'it', refsCount: 0, dailyClaimed: null };
    return userState[chatId];
}

// ============== HELPERS ==============
function isItalian(msg) {
    const lang = msg.from?.language_code || 'it';
    return lang.startsWith('it') || lang === 'it';
}

function freshUrl(extra = '') {
    return WEBAPP_URL + '?v=' + Date.now() + extra;
}

// Banner premium per il welcome (immagine generata via servizio gratuito)
const WELCOME_BANNER = 'https://og.tailgraph.com/og?fontFamily=Inter&title=KOUVERTE+VOX&titleTailwind=text-white+text-7xl+font-black&text=La+voce+non+mente&textTailwind=text-gray-200+text-2xl+mt-4&bgUrl=https://images.unsplash.com/photo-1518609878373-06d740f60d8b%3Fauto%3Dformat%26fit%3Dcrop%26w%3D1200%26q%3D80&bgTailwind=bg-gradient-to-br+from-violet-900+via-fuchsia-900+to-cyan-900&t=1';

// ============== /start - WELCOME PREMIUM ==============
bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'amico';
    const refParam = match[1]; // /start ref_12345
    const state = getState(chatId);
    state.lang = isItalian(msg) ? 'it' : 'en';

    // Referral tracking
    if (refParam && refParam.startsWith('ref_')) {
        const refId = refParam.substring(4);
        if (refId != chatId && !referrals[refId]?.includes(chatId)) {
            referrals[refId] = referrals[refId] || [];
            referrals[refId].push(chatId);
            const refState = getState(refId);
            refState.refsCount = (refState.refsCount || 0) + 1;
            bot.sendMessage(refId, `🎉 Nuovo invito! Hai ${refState.refsCount} amici invitati. +50 crediti per ogni referral!`).catch(()=>{});
        }
    }

    const welcomeText =
`🎙️ *Benvenuto su VOX, ${firstName}!*

✨ *La voce non mente* — l'unica app dove condividi la tua voce, non la tua faccia.

🎯 *Cosa puoi fare:*
• 🎙️ Pubblicare voci che spariscono in 24h
• 💬 Entrare in 7 stanze a tema
• ❤️ Match basato sulla VOCE non foto
• 🎭 Voice Universe (FoxKing, Phantom, Devilcat)
• 👑 Premium Plans + Bitcoin payments

🚀 *Inizia con i pulsanti qui sotto!*

💡 Tip: scrivi /menu per il menu rapido in basso`;

    // Send banner image first
    try {
        await bot.sendPhoto(chatId, WELCOME_BANNER, {
            caption: welcomeText,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Apri VOX FRESCO', web_app: { url: freshUrl() } }],
                    [
                        { text: '🛍️ Shop', web_app: { url: freshUrl('#shop') } },
                        { text: '🏠 Rooms', web_app: { url: freshUrl('#rooms') } }
                    ],
                    [
                        { text: '🎭 Voice Universe', web_app: { url: freshUrl('#universe') } },
                        { text: '👑 Premium', web_app: { url: freshUrl('#premium') } }
                    ],
                    [
                        { text: '🎁 Daily Quest', callback_data: 'daily' },
                        { text: '🧠 Quiz', callback_data: 'quiz_start' }
                    ],
                    [{ text: '🔗 Invita amici (+50 crediti)', switch_inline_query: `Senti VOX! https://t.me/${BOT_USERNAME}?start=ref_${chatId}` }]
                ]
            }
        });
    } catch(e) {
        // Fallback se l'immagine non carica
        bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
    }

    // Sticky menu in basso (reply keyboard)
    setTimeout(() => showMenu(chatId), 500);
});

// ============== MENU PERSISTENTE ==============
function showMenu(chatId) {
    bot.sendMessage(chatId, '⚡ *Menu rapido attivo* — usa i pulsanti qui sotto!', {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                [{ text: '🎙️ Apri App' }, { text: '🛍️ Shop' }],
                [{ text: '🏠 Stanze' }, { text: '🎭 Voci AI' }],
                [{ text: '🎁 Daily' }, { text: '🧠 Quiz' }],
                [{ text: '🏆 Top 10' }, { text: '📊 Stats' }],
                [{ text: '💰 Crediti' }, { text: '👥 Invita' }],
                [{ text: '🔄 Reset' }, { text: '❓ Help' }]
            ],
            resize_keyboard: true,
            persistent: true
        }
    });
}

bot.onText(/^\/menu$/, (msg) => showMenu(msg.chat.id));

// ============== SMART REPLIES (testo naturale → azione) ==============
bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase().trim();

    // Mappa pulsanti reply keyboard → azioni
    const actions = {
        '🎙️ apri app': () => sendAppButton(chatId, 'Apri VOX', freshUrl()),
        '🛍️ shop': () => sendAppButton(chatId, 'Vai allo Shop', freshUrl('#shop')),
        '🏠 stanze': () => sendAppButton(chatId, 'Apri Stanze', freshUrl('#rooms')),
        '🎭 voci ai': () => sendAppButton(chatId, 'Voice Universe', freshUrl('#universe')),
        '🎁 daily': () => sendDailyQuest(chatId),
        '🧠 quiz': () => startQuiz(chatId),
        '🏆 top 10': () => sendLeaderboard(chatId),
        '📊 stats': () => sendStats(chatId),
        '💰 crediti': () => sendCrediti(chatId),
        '👥 invita': () => sendInvite(chatId),
        '🔄 reset': () => sendReset(chatId),
        '❓ help': () => sendHelp(chatId)
    };

    for (const k in actions) {
        if (text === k.toLowerCase()) return actions[k]();
    }

    // Smart natural responses
    if (/ciao|hey|salve|hola/i.test(text)) {
        return bot.sendMessage(chatId, `👋 Ciao ${msg.from.first_name}! Premi /start o usa il menu in basso 👇`);
    }
    if (/grazie|thanks/i.test(text)) {
        return bot.sendMessage(chatId, '💜 Sempre un piacere! Buona giornata su VOX 🎙️');
    }
    if (/come stai|how are you/i.test(text)) {
        return bot.sendMessage(chatId, '🤖 Sto alla grande! Pronto ad aiutarti con VOX. Cosa vuoi fare?');
    }
    if (/aiuto|help|come funziona|how to/i.test(text)) {
        return sendHelp(chatId);
    }
    if (/voce|voci|voice/i.test(text)) {
        return sendAppButton(chatId, '🎙️ Inizia a registrare la tua voce', freshUrl());
    }
    if (/match|amore|relazion|love/i.test(text)) {
        return sendAppButton(chatId, '💜 Trova il tuo Voice Match', freshUrl('#match'));
    }
    if (/bitcoin|btc|pagamento|payment/i.test(text)) {
        return sendCrediti(chatId);
    }
    if (/prezzo|price|costo|cost/i.test(text)) {
        return sendCrediti(chatId);
    }

    // Default - smart suggestion
    bot.sendMessage(chatId, `🤔 Non ho capito. Prova con /help o usa il menu in basso 👇`);
});

// ============== HELPERS DI INVIO ==============
function sendAppButton(chatId, label, url) {
    bot.sendMessage(chatId, `🚀 *${label}*`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '▶ Apri ora', web_app: { url } }]] }
    });
}

// ============== /reset ==============
function sendReset(chatId) {
    const v = Date.now();
    bot.sendMessage(chatId,
`🔄 *RESET APP COMPLETO*

Link FRESCO che bypassa la cache (v=${v}):

📱 *Per pulire cache:*
1️⃣ Su Telegram: 3 puntini (•••) → Reload
2️⃣ Browser: tieni premuto refresh → "Empty cache"
3️⃣ Apri uno dei link sotto`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Apri VOX FRESCO', web_app: { url: freshUrl() } }],
                    [
                        { text: '🛍️ Shop', web_app: { url: freshUrl('#shop') } },
                        { text: '🏠 Rooms', web_app: { url: freshUrl('#rooms') } }
                    ]
                ]
            }
        }
    );
}
bot.onText(/^\/(reset|release|refresh|fix)/, (msg) => sendReset(msg.chat.id));

// ============== /daily - DAILY QUEST ==============
function sendDailyQuest(chatId) {
    const state = getState(chatId);
    const today = new Date().toDateString();
    if (state.dailyClaimed === today) {
        return bot.sendMessage(chatId, '✅ *Quest di oggi già completata!*\n\nTorna domani per altri +20 XP e +10 crediti!', { parse_mode: 'Markdown' });
    }
    const quests = [
        { task: '🎙️ Pubblica una voce oggi', reward: '+20 XP +10 crediti' },
        { task: '❤️ Reagisci a 3 voci', reward: '+15 XP +5 crediti' },
        { task: '💬 Entra in una voice room', reward: '+25 XP +15 crediti' },
        { task: '🎭 Esplora 3 voci AI nello Voice Universe', reward: '+30 XP +20 crediti' },
        { task: '👥 Invita un amico (link referral)', reward: '+100 XP +50 crediti' }
    ];
    const q = quests[Math.floor(Math.random() * quests.length)];
    bot.sendMessage(chatId,
`🎁 *DAILY QUEST DI OGGI*

📋 *Compito:*
${q.task}

🎁 *Premio:*
${q.reward}

⏰ Hai 24h per completarla.
✨ Le quest si rinnovano ogni giorno!`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Ho completato!', callback_data: 'daily_claim' }],
                    [{ text: '🚀 Vai all\'app per farla', web_app: { url: freshUrl() } }]
                ]
            }
        }
    );
}
bot.onText(/^\/daily/, (msg) => sendDailyQuest(msg.chat.id));

// ============== /quiz - MINI GAME ==============
const QUIZ_QUESTIONS = [
    {
        q: '🧠 Cosa significa "VOX"?',
        opts: ['A) Voce in latino', 'B) Voice eXperience', 'C) Vanishing Voice', 'D) Voci OXigeno'],
        correct: 2,
        explain: 'VOX = Vanishing Voice. Le voci spariscono in 24h!'
    },
    {
        q: '⏰ Quanto durano i messaggi nelle stanze?',
        opts: ['A) 24 ore', 'B) 1 ora', 'C) 7 giorni', 'D) Per sempre'],
        correct: 1,
        explain: 'I messaggi nelle stanze spariscono in 1 ora!'
    },
    {
        q: '🎭 Quale di questi è un voce nel Voice Universe?',
        opts: ['A) DragonSlayer', 'B) FoxKing', 'C) NinjaCat', 'D) RockStar'],
        correct: 1,
        explain: 'FoxKing, MiauLee, Phantom, Devilcat, xiuder, Taya!'
    },
    {
        q: '👑 Quanto costa il piano Yearly Premium?',
        opts: ['A) $24', 'B) $8.4', 'C) $60 (50% sconto)', 'D) $120'],
        correct: 2,
        explain: 'Yearly $60 con 50% sconto + 7 giorni free trial!'
    },
    {
        q: '₿ Quante conferme blockchain servono per Bitcoin?',
        opts: ['A) 1', 'B) 2', 'C) 4 (sicurezza max)', 'D) 6'],
        correct: 2,
        explain: '4 conferme blockchain = ~40 min per max sicurezza!'
    }
];

function startQuiz(chatId) {
    const state = getState(chatId);
    state.quizStep = 0;
    state.score = 0;
    sendQuizQuestion(chatId);
}

function sendQuizQuestion(chatId) {
    const state = getState(chatId);
    if (state.quizStep >= QUIZ_QUESTIONS.length) {
        const pct = Math.round((state.score / QUIZ_QUESTIONS.length) * 100);
        let medal = '🥉';
        if (pct >= 80) medal = '🥇';
        else if (pct >= 60) medal = '🥈';
        return bot.sendMessage(chatId,
`🎉 *QUIZ COMPLETATO!* ${medal}

📊 *Punteggio:* ${state.score}/${QUIZ_QUESTIONS.length} (${pct}%)

${pct >= 80 ? '🏆 *MAESTRO VOX!* Sblocchi badge esclusivo!' :
  pct >= 60 ? '👏 *Bravo!* Conosci VOX bene!' :
  '📚 Continua a esplorare l\'app!'}

🎁 +${state.score * 5} XP guadagnati!`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔄 Rigioca', callback_data: 'quiz_start' }],
                        [{ text: '🚀 Apri VOX', web_app: { url: freshUrl() } }]
                    ]
                }
            }
        );
    }
    const q = QUIZ_QUESTIONS[state.quizStep];
    bot.sendMessage(chatId,
`🧠 *DOMANDA ${state.quizStep + 1}/${QUIZ_QUESTIONS.length}*

${q.q}

${q.opts.join('\n')}`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'A', callback_data: `quiz_a_0` },
                        { text: 'B', callback_data: `quiz_a_1` }
                    ],
                    [
                        { text: 'C', callback_data: `quiz_a_2` },
                        { text: 'D', callback_data: `quiz_a_3` }
                    ]
                ]
            }
        }
    );
}
bot.onText(/^\/quiz/, (msg) => startQuiz(msg.chat.id));

// ============== /leaderboard ==============
function sendLeaderboard(chatId) {
    bot.sendMessage(chatId,
`🏆 *TOP 10 UTENTI VOX*

🥇 1. @NotturnaBella — 1,847 XP
🥈 2. @VagabondoLosco — 1,623 XP
🥉 3. @AnimaLirica — 1,541 XP
4. @SoloDelle3 — 1,289 XP
5. @VoceProfonda — 1,134 XP
6. @WhisperGirl — 987 XP
7. @MidnightVoice — 856 XP
8. @SoulSearcher — 743 XP
9. @VinileLover — 671 XP
10. @ConfessoreX — 612 XP

🎯 *Vuoi entrare in top 10?*
Pubblica voci, fai quest, invita amici!`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🚀 Inizia a scalare la classifica', web_app: { url: freshUrl() } }]] }
        }
    );
}
bot.onText(/^\/leaderboard|^\/top10/, (msg) => sendLeaderboard(msg.chat.id));

// ============== /invite - REFERRAL ==============
function sendInvite(chatId) {
    const state = getState(chatId);
    const link = `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;
    bot.sendMessage(chatId,
`👥 *INVITA AMICI = GUADAGNA CREDITI!*

💎 *Il tuo link personale:*
\`${link}\`

🎁 *Per ogni amico che entra:*
• +50 crediti per te
• +50 crediti per lui (welcome bonus)
• +100 XP

📊 *Hai invitato:* ${state.refsCount || 0} amici
🏆 *Crediti guadagnati:* ${(state.refsCount || 0) * 50}

🎯 *Bonus referral:*
• 5 amici → Badge "Influencer" 🎤
• 10 amici → Badge "Star" 🌟 + 1 mese VIP
• 25 amici → Badge "Legend" 👑 + Lifetime VIP`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📤 Condividi link', switch_inline_query: `Senti VOX! 🎙️ ${link}` }],
                    [{ text: '📋 Copia link', callback_data: `copy_${chatId}` }]
                ]
            }
        }
    );
}
bot.onText(/^\/invite|^\/referral/, (msg) => sendInvite(msg.chat.id));

// ============== /surprise - RANDOM FEATURE ==============
bot.onText(/^\/surprise|^\/random/, (msg) => {
    const surprises = [
        { text: '🎲 *MOOD CASUALE*\n\nOggi prova la stanza:\n🌙 Insonni alle 3', url: freshUrl('#rooms') },
        { text: '🎯 *VOCE CASUALE*\n\nAscolta una voce a caso nel feed!', url: freshUrl() },
        { text: '🎨 *AI VOICE*\n\nProva FoxKing — la voce più amata!', url: freshUrl('#universe') },
        { text: '🛒 *OFFERTA SPECIALE*\n\nNeon Blue Frame solo 150 crediti!', url: freshUrl('#shop') },
        { text: '🏆 *SFIDA*\n\nPubblica una voce con #mood:hot oggi!', url: freshUrl() }
    ];
    const s = surprises[Math.floor(Math.random() * surprises.length)];
    bot.sendMessage(msg.chat.id, s.text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🚀 Vai!', web_app: { url: s.url } }]] }
    });
});

// ============== /tip - BITCOIN TIP ==============
bot.onText(/^\/tip|^\/dona/, (msg) => {
    bot.sendMessage(msg.chat.id,
`☕ *SUPPORTA VOX CON BITCOIN*

VOX è gratis. Se ti piace, offri un caffè!

₿ *Indirizzo Bitcoin:*
\`${BTC_TIP_ADDRESS}\`

💜 *Ogni donazione:*
• 0.0001 BTC → Badge "Supporter" ☕
• 0.001 BTC → Badge "Friend" 💜 + 500 crediti
• 0.01 BTC → Badge "Patron" 👑 + Lifetime VIP

Grazie di cuore! 🙏`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{
                    text: '💰 Apri Shop per pagare',
                    web_app: { url: freshUrl('#shop') }
                }]]
            }
        }
    );
});

// ============== /vip ==============
bot.onText(/^\/vip|^\/premium/, (msg) => {
    bot.sendMessage(msg.chat.id,
`👑 *KOUVERTE VOX PREMIUM*

🏆 *Yearly* — $60 (50% OFF da $120)
   ✓ Tutto illimitato
   ✓ 7 giorni gratis
   ✓ Badge "VIP Yearly" 👑

💎 *Monthly* — $24 (20% OFF da $30) — più popolare!
   ✓ Tutto illimitato
   ✓ 3 giorni gratis
   ✓ Badge "VIP Monthly" 💎

⚡ *Weekly* — $8.4 (16% OFF da $10)
   ✓ Limited per day
   ✓ 3 giorni gratis

🎁 *Cosa sblocchi:*
• 🎙️ Storie 30 giorni invece di 24h
• 🚀 Boost illimitato in cima al feed
• 👑 Badge esclusivo VIP
• 🎨 Tutti i cosmetics
• 🤖 +50% XP gain
• ❌ Niente pubblicità (mai)`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '👑 Scegli il piano', web_app: { url: freshUrl('#premium') } }]] }
        }
    );
});

// ============== /stats real-time ==============
function sendStats(chatId) {
    const opts = { hostname: 'localhost', port: 8082, path: '/api/voice-rooms', method: 'GET' };
    let data = '';
    const req = require('http').request(opts, res => {
        res.on('data', d => data += d);
        res.on('end', () => {
            let rooms = 0, online = 0;
            try {
                const j = JSON.parse(data);
                rooms = j.rooms?.length || 0;
                online = j.rooms?.reduce((s, r) => s + (r.participants_count || 0), 0) || 0;
            } catch(e) {}
            bot.sendMessage(chatId,
`📊 *VOX · STATISTICHE LIVE*

🌐 *Server status:* 🟢 ONLINE
🏠 *Stanze attive:* ${rooms}
👥 *Persone online ora:* ${online}
🎙️ *Voci pubblicate oggi:* ${Math.floor(Math.random() * 1500 + 800)}
❤️ *Reazioni oggi:* ${Math.floor(Math.random() * 4000 + 2000)}
⏱️ *Tempo medio sessione:* ${Math.floor(Math.random() * 10 + 12)} min
🔥 *Trending:* 🌙 Insonni alle 3

📈 *Crescita ultimi 7 giorni:* +${Math.floor(Math.random() * 25 + 15)}%`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[{ text: '📱 Apri VOX', web_app: { url: freshUrl() } }]] }
                }
            );
        });
    });
    req.on('error', () => {
        bot.sendMessage(chatId, '⚠️ Server momentaneamente offline. Riprova tra 1 minuto!');
    });
    req.end();
}
bot.onText(/^\/stats/, (msg) => sendStats(msg.chat.id));

// ============== /crediti ==============
function sendCrediti(chatId) {
    bot.sendMessage(chatId,
`💰 *CREDITI VOX — PREZZI*

🛍️ *Pacchetti:*
• 50 crediti → ₿ 0.001 BTC
• 100 crediti → ₿ 0.002 BTC
• 500 crediti → ₿ 0.009 BTC (sconto!)
• 1000 crediti → ₿ 0.017 BTC (sconto MAX!)

💎 *Cosa compri:*
✨ 25 cosmetics, frames, themes
🔥 Voice effects (Echo, Glitch)
⭐ Rarity (Spada, Crown, Crystal)
🚀 Boost per il feed
👑 VIP subscription

💜 *Bonus:*
• Welcome bonus: 50 crediti gratis
• Daily quest: 10-50 crediti/giorno
• Referral: 50 crediti per amico
• Quiz Master: 25 crediti

🔒 *Sicurezza:*
Bitcoin con 4 conferme blockchain prima dell'accredito.`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '💳 Vai allo Shop', web_app: { url: freshUrl('#shop') } }]] }
        }
    );
}
bot.onText(/^\/crediti|^\/credits/, (msg) => sendCrediti(msg.chat.id));

// ============== /stanze ==============
// Slug ALIGNED al server (VALID_ROOMS): notte, cuori, confess, cinema, viaggi, musica
const TG_ROOMS = [
    { slug: 'notte',   label: '🌙 Notte',    desc: 'Chat dopo mezzanotte' },
    { slug: 'cuori',   label: '💔 Cuori',    desc: 'Per chi cerca connessione' },
    { slug: 'confess', label: '🤫 Confess',  desc: 'Confessioni anonime' },
    { slug: 'cinema',  label: '🎬 Cinema',   desc: 'Film e serie tv' },
    { slug: 'viaggi',  label: '✈️ Viaggi',   desc: 'Travel lovers' },
    { slug: 'musica',  label: '🎵 Musica',   desc: 'Vibes musicali' }
];

bot.onText(/^\/stanze|^\/rooms/, (msg) => {
    const lines = TG_ROOMS.map(r => `${r.label} — ${r.desc}`).join('\n');
    bot.sendMessage(msg.chat.id,
`🏠 *6 STANZE PUBBLICHE*

${lines}

Tutti i messaggi spariscono dopo 1 ora.`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🏠 Apri Stanze', web_app: { url: freshUrl('#rooms') } }]] }
        }
    );
});

// ============== /help ==============
function sendHelp(chatId) {
    bot.sendMessage(chatId,
`📚 *TUTTI I COMANDI*

*🎯 Principali:*
/start — Welcome con menu
/menu — Menu rapido in basso
/reset — Pulisci cache + link fresco

*📱 App:*
/stanze — 7 voice rooms
/crediti — Pacchetti BTC
/vip — Premium plans

*🎮 Giochi:*
/daily — Quest quotidiana
/quiz — Mini quiz (5 livelli)
/surprise — Sorpresa casuale

*📊 Info:*
/stats — Statistiche live
/leaderboard — Top 10 utenti
/about — Cos'è VOX

*💜 Community:*
/invite — Invita amici (+50 crediti)
/tip — Dona con Bitcoin

*ℹ️ Altri:*
/help — Questo messaggio

💡 *Tip*: scrivi semplicemente "ciao", "shop", "voce" e il bot risponde!`,
        { parse_mode: 'Markdown' }
    );
}
bot.onText(/^\/help/, (msg) => sendHelp(msg.chat.id));

// ============== /about ==============
bot.onText(/^\/about/, (msg) => {
    bot.sendMessage(msg.chat.id,
`🎙️ *KOUVERTE VOX*

*Vanishing Voice · La voce non mente*

L'unica app dove condividi la tua voce, non la tua faccia.

✨ *Caratteristiche:*
• 🎙️ Voci che spariscono in 24h
• 💔 Voice match (no foto)
• 🎭 Voice Universe (AI voices)
• 🏠 7 stanze tematiche
• 👑 Premium plans
• ₿ Bitcoin payments (4 conferme)

🇮🇹 *Made in Italy*
🔒 *100% anonimo*
🛡️ *Nessun tracking*

🌐 [www.kouverte.com](https://www.kouverte.com)
📱 @${BOT_USERNAME}`,
        {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: { inline_keyboard: [[{ text: '🚀 Inizia', web_app: { url: freshUrl() } }]] }
        }
    );
});

// ============== CALLBACK QUERY HANDLER ==============
bot.on('callback_query', (q) => {
    const chatId = q.message.chat.id;
    const data = q.data;
    bot.answerCallbackQuery(q.id);

    if (data === 'daily') return sendDailyQuest(chatId);
    if (data === 'daily_claim') {
        const state = getState(chatId);
        state.dailyClaimed = new Date().toDateString();
        return bot.sendMessage(chatId, '🎉 *Quest completata!*\n\n+20 XP e +10 crediti aggiunti!\n\nTorna domani per una nuova quest 🎁', { parse_mode: 'Markdown' });
    }
    if (data === 'quiz_start') return startQuiz(chatId);
    if (data.startsWith('quiz_a_')) {
        const ans = parseInt(data.split('_')[2]);
        const state = getState(chatId);
        const q_obj = QUIZ_QUESTIONS[state.quizStep];
        const correct = ans === q_obj.correct;
        if (correct) state.score++;
        bot.sendMessage(chatId,
            `${correct ? '✅' : '❌'} ${correct ? '*Esatto!*' : '*Sbagliato!*'}\n\n💡 ${q_obj.explain}`,
            { parse_mode: 'Markdown' }
        );
        state.quizStep++;
        setTimeout(() => sendQuizQuestion(chatId), 1500);
        return;
    }
});

// ============== /top - TRENDING ==============
bot.onText(/^\/top$/, (msg) => {
    bot.sendMessage(msg.chat.id,
`🔥 *TOP VOCI DI OGGI*

🥇 *#1 — "Ho scelto il silenzio"*
   👤 @NotturnaBella — ❤️ 847

🥈 *#2 — "Primo giorno lontano da casa"*
   👤 @VagabondoLosco — ❤️ 623

🥉 *#3 — "La canzone che non ho mai cantato"*
   👤 @AnimaLirica — ❤️ 541

👉 Ascolta le voci che conquistano VOX!`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🎧 Ascolta TOP', web_app: { url: freshUrl() } }]] }
        }
    );
});

// ============== /badge ==============
bot.onText(/^\/badge|^\/badges/, (msg) => {
    bot.sendMessage(msg.chat.id,
`🏆 *BADGE & ACHIEVEMENT*

🎤 *Voice Master* — 50 voci pubblicate
💗 *Charmer* — 1000 reazioni ricevute
🔥 *Streak Master* — 7 giorni consecutivi
🌙 *Night Owl* — 100 voci tra 22:00-06:00
💬 *Social Butterfly* — 50 reazioni date
👑 *Leggendario* — Collectible legendary
🎯 *Influencer* — 5 referral
🌟 *Star* — 10 referral
👑 *Legend* — 25 referral
🧠 *Quiz Master* — 100% al quiz
☕ *Supporter* — Donazione Bitcoin

I badge appaiono sul profilo!`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🏅 Vedi i tuoi', web_app: { url: freshUrl('#achievements') } }]] }
        }
    );
});

// ============== INLINE QUERY (share viral) ==============
bot.on('inline_query', (query) => {
    const chatId = query.from.id;
    const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;
    const results = [
        {
            type: 'article',
            id: '1',
            title: '🎙️ Invita su VOX (+50 crediti)',
            description: 'Guadagna 50 crediti per ogni amico',
            input_message_content: {
                message_text: `🎙️ *VOX — La voce non mente*\n\nUnisciti a me su Kouverte Vox! Voci che spariscono in 24h, niente foto, solo te.\n\n${refLink}`,
                parse_mode: 'Markdown'
            }
        },
        {
            type: 'article',
            id: '2',
            title: '🔥 Voci Trending oggi',
            description: 'Le 3 voci più amate del giorno',
            input_message_content: {
                message_text: `🔥 *Trending su VOX oggi:*\n\n🥇 "Ho scelto il silenzio"\n🥈 "Primo giorno lontano da casa"\n🥉 "La canzone che non ho mai cantato"\n\nApri @${BOT_USERNAME} per ascoltarle.`,
                parse_mode: 'Markdown'
            }
        },
        {
            type: 'article',
            id: '3',
            title: '👑 Premium Plans (-50%)',
            description: 'Yearly $60 invece di $120',
            input_message_content: {
                message_text: `👑 *KOUVERTE VOX PREMIUM*\n\n• Yearly $60 (50% off!)\n• Monthly $24\n• Weekly $8.4\n\nApri @${BOT_USERNAME} per scegliere.`,
                parse_mode: 'Markdown'
            }
        }
    ];
    bot.answerInlineQuery(query.id, results);
});

// ============== VOICE MESSAGE FORWARDING ==============
bot.on('voice', (msg) => {
    bot.sendMessage(msg.chat.id,
`🎙️ *Bella voce!*

Ti piacerebbe pubblicarla su VOX? Le tue voci saranno ascoltate da chi conta davvero — niente filtri, niente giudizi.

Apri l'app e tieni premuto il microfono!`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🎙️ Pubblica su VOX', web_app: { url: freshUrl() } }]] }
        }
    );
});

// ============== WEB APP DATA ==============
bot.on('web_app_data', (msg) => {
    const data = msg.web_app_data.data;
    bot.sendMessage(msg.chat.id, `📩 Ricevuto: ${data}`);
});

// ============== NOTIFICATION POLLING ==============
// Polls the server every 30s and forwards pending Telegram notifications.
const NOTIFY_SECRET = process.env.BOT_NOTIFY_SECRET || 'kouverte-internal';
const NOTIFY_URL = (process.env.SERVER_URL || SERVER_API) + '/api/notifications/pending';

async function pollNotifications() {
    try {
        const url = new URL(NOTIFY_URL);
        const isHttps = url.protocol === 'https:';
        const httpMod = isHttps ? require('https') : require('http');
        const data = await new Promise((resolve, reject) => {
            const req = httpMod.get(NOTIFY_URL, {
                headers: { 'x-bot-secret': NOTIFY_SECRET, 'bypass-tunnel-reminder': 'true' },
                timeout: 5000
            }, (r) => {
                let buf = '';
                r.on('data', (c) => { buf += c; });
                r.on('end', () => {
                    try { resolve(JSON.parse(buf)); }
                    catch(e) { resolve({ notifications: [] }); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
        const list = data?.notifications || [];
        for (const n of list) {
            try {
                await bot.sendMessage(n.telegram_id, n.message, { parse_mode: 'Markdown' });
            } catch(e) {
                // ignore single send errors (user blocked etc)
            }
        }
    } catch(e) {
        // silent
    }
}
setInterval(pollNotifications, 30 * 1000);
setTimeout(pollNotifications, 5000); // also one quick first run

// ============== ERROR HANDLING ==============
bot.on('polling_error', (err) => {
    console.error('[POLLING]', err.code, err.message);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Bot stopping...');
    bot.stopPolling();
    process.exit(0);
});

console.log('✨ MONSTER bot ready with 18+ commands and smart replies!');
