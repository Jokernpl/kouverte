// ============================================================
// KOUVERTE · TELEGRAM BOT
// "Il velo non si rompe. Si depone."
// ============================================================
// Allineato al sito KOUVERTE (app.html):
//   - Sezioni: Home / Esplora / Chat / Premium / Profilo
//   - Cornici premium (Avorio → Diamante) con Bitcoin
//   - Foto profilo Telegram → avatar webapp
//   - Sistema invita & guadagni con cornici regalo
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
const WEBAPP_URL   = process.env.WEBAPP_URL   || 'https://www.kouverte.com/app.html';
const BOT_USERNAME = process.env.BOT_USERNAME || 'Kouverte_bot';
const BTC_ADDRESS  = process.env.BITCOIN_ADDRESS || 'bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00';

if (!BOT_TOKEN || BOT_TOKEN.startsWith('INSERISCI') || BOT_TOKEN.length < 30) {
  console.error('\n❌ BOT_TOKEN mancante o invalido.');
  console.error('   Imposta la env var BOT_TOKEN (o TELEGRAM_BOT_TOKEN) con il token di BotFather.');
  console.error('   Il bot non verrà avviato — l\'applicazione web continua a funzionare.\n');
  // Esporta uno stub no-op così require('./tg-bot.js') non crasha
  module.exports = { ok: false, error: 'BOT_TOKEN_MISSING' };
  return;
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🕯️  Kouverte Bot avviato · @' + BOT_USERNAME);
console.log('    WebApp: ' + WEBAPP_URL);
console.log('    BTC:    ' + BTC_ADDRESS);

// Cleanup: rimuovi eventuali webhook fantasma che bloccano il polling
// (succede se in passato qualcuno ha provato a impostare un webhook al bot)
bot.deleteWebHook({ drop_pending_updates: false })
   .then(() => console.log('    Webhook: cleared (polling mode active)'))
   .catch(() => {});

// ============================================================
// CATALOGO CORNICI (sincronizzato con app.html — prezzi in EURO)
// ============================================================
const FRAMES = [
  { id: 'ivory',    name: 'Avorio',    price_eur: 0,   emoji: '🤍', tier: 1 },
  { id: 'gold',     name: 'Oro',       price_eur: 3,   emoji: '🟡', tier: 2 },
  { id: 'emerald',  name: 'Smeraldo',  price_eur: 5,   emoji: '💚', tier: 3 },
  { id: 'ruby',     name: 'Rubino',    price_eur: 5,   emoji: '❤️',  tier: 3 },
  { id: 'sapphire', name: 'Zaffiro',   price_eur: 8,   emoji: '💙', tier: 4 },
  { id: 'amethyst', name: 'Ametista',  price_eur: 8,   emoji: '💜', tier: 4 },
  { id: 'topaz',    name: 'Topazio',   price_eur: 12,  emoji: '🧡', tier: 5 },
  { id: 'onyx',     name: 'Onice',     price_eur: 15,  emoji: '🖤', tier: 5 },
  { id: 'platinum', name: 'Platino',   price_eur: 20,  emoji: '⚪', tier: 6 },
  { id: 'diamond',  name: 'Diamante',  price_eur: 50,  emoji: '💎', tier: 7 }
];

// Cambio EUR/BTC (refreshato ogni 10 min via CoinGecko)
let BTC_RATE_EUR = 95000;
function eurToBtc(eur) {
  if (!eur) return '0';
  const btc = eur / BTC_RATE_EUR;
  return btc.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
}
function refreshBtcRate() {
  const https = require('https');
  https.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const j = JSON.parse(data);
        if (j?.bitcoin?.eur) BTC_RATE_EUR = j.bitcoin.eur;
      } catch (e) {}
    });
  }).on('error', () => {});
}
refreshBtcRate();
setInterval(refreshBtcRate, 10 * 60 * 1000);

// ============================================================
// NOTIFICATION POLLING — fetches like/match/message events from server
// ============================================================
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8082';
const BOT_NOTIFY_SECRET = process.env.BOT_NOTIFY_SECRET || 'kouverte-internal';

function pollServerNotifications() {
  const https = require('https');
  const http  = require('http');
  const url = new URL(SERVER_URL + '/api/notifications/pending');
  const lib = url.protocol === 'https:' ? https : http;
  const req = lib.request({
    hostname: url.hostname,
    port:     url.port || (url.protocol === 'https:' ? 443 : 80),
    path:     url.pathname,
    method:   'GET',
    headers:  { 'x-bot-secret': BOT_NOTIFY_SECRET }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const j = JSON.parse(data);
        if (Array.isArray(j.notifications)) {
          j.notifications.forEach(n => {
            const tgId = parseInt(n.telegram_id);
            if (tgId && n.message) {
              bot.sendMessage(tgId, n.message, { parse_mode: 'HTML' }).catch(() => {});
            }
          });
        }
      } catch (e) {}
    });
  });
  req.on('error', () => {});
  req.end();
}
setTimeout(pollServerNotifications, 5000);
setInterval(pollServerNotifications, 30 * 1000);

// Tier di reward per inviti (cornice regalo gratis)
const REFERRAL_REWARDS = [
  { invites: 1,  frame: 'ivory',    label: 'Avorio'   },
  { invites: 3,  frame: 'emerald',  label: 'Smeraldo' },
  { invites: 5,  frame: 'ruby',     label: 'Rubino'   },
  { invites: 10, frame: 'sapphire', label: 'Zaffiro'  },
  { invites: 15, frame: 'amethyst', label: 'Ametista' },
  { invites: 25, frame: 'topaz',    label: 'Topazio'  },
  { invites: 40, frame: 'onyx',     label: 'Onice'    },
  { invites: 60, frame: 'platinum', label: 'Platino'  },
  { invites: 100,frame: 'diamond',  label: 'Diamante' }
];

// ============================================================
// STORAGE PERSISTENTE (file JSON)
// ============================================================
const DB_PATH = path.join(__dirname, 'kouverte-bot.json');
let DB = { users: {}, referrals: {} };

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      DB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      DB.users = DB.users || {};
      DB.referrals = DB.referrals || {};
    }
  } catch (e) { console.error('DB load error:', e.message); }
}
function saveDB() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(DB, null, 2)); }
  catch (e) { console.error('DB save error:', e.message); }
}
loadDB();

function getUser(chatId) {
  const id = String(chatId);
  if (!DB.users[id]) {
    DB.users[id] = {
      id,
      joinedAt: Date.now(),
      invitedBy: null,
      invitedUsers: [],
      ownedFrames: ['ivory'],
      earnedEur: 0
    };
  }
  // Migration: vecchi user con earnedSats
  if (typeof DB.users[id].earnedEur === 'undefined') DB.users[id].earnedEur = 0;
  return DB.users[id];
}

// ============================================================
// HELPERS
// ============================================================
function freshUrl(hash = '') {
  return `${WEBAPP_URL}?v=${Date.now()}${hash}`;
}

function refLink(chatId) {
  return `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;
}

function nextRewardFor(user) {
  const count = user.invitedUsers.length;
  return REFERRAL_REWARDS.find(r => r.invites > count) || null;
}

function frameById(id) {
  return FRAMES.find(f => f.id === id);
}

function formatSats(n) {
  return n.toLocaleString('it-IT');
}
function formatEur(n) {
  return n.toFixed(2).replace('.', ',');
}

// Telegram profile photo (file URL) — async
async function getTgPhotoUrl(chatId) {
  try {
    const photos = await bot.getUserProfilePhotos(chatId, { limit: 1 });
    if (!photos?.photos?.length) return null;
    const sizes = photos.photos[0];
    const biggest = sizes[sizes.length - 1];
    const file = await bot.getFile(biggest.file_id);
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
  } catch (e) {
    return null;
  }
}

// ============================================================
// /start (con referral tracking)
// ============================================================
bot.onText(/^\/start(?:\s+(\S+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'amico';
  const refArg = match[1];
  const user = getUser(chatId);

  // Referral tracking
  if (refArg && refArg.startsWith('ref_')) {
    const refFromId = refArg.substring(4);
    if (refFromId !== String(chatId) && !user.invitedBy) {
      const inviter = getUser(refFromId);
      if (!inviter.invitedUsers.includes(String(chatId))) {
        inviter.invitedUsers.push(String(chatId));
        user.invitedBy = refFromId;
        saveDB();

        // Notifica all'inviter + reward check
        notifyReferralEarned(refFromId, firstName);
      }
    }
  }

  const photoUrl = await getTgPhotoUrl(chatId);

  const caption =
`⚡ *KOUVERTE* ₿
_Voice Dating on Bitcoin_

Benvenuto, *${firstName}*.

Qui sotto il tuo profilo. Apri l'app per personalizzarlo:

🏠 *Home* · Storie, trending, nuovi profili
🔍 *Esplora* · Scopri profili premium
💬 *Chat* · Conversazioni private
👑 *Premium* · Piani Pro / Elite / Infinity
👤 *Profilo* · Avatar, cornici, post

✨ Usa /menu per i comandi rapidi.
💬 Per info dirette: @losangelesbroker`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '🚀 Apri Kouverte', web_app: { url: freshUrl() } }],
      [
        { text: '👤 Profilo',  web_app: { url: freshUrl('#profile') } },
        { text: '🎙️ Stanze',   callback_data: 'rooms_list' }
      ],
      [{ text: '💎 Cornici', callback_data: 'frames_list' }],
      [
        { text: '🔗 Invita & guadagna', callback_data: 'invite_card' },
        { text: '👑 Premium', web_app: { url: freshUrl('#premium') } }
      ],
      [{ text: '₿ Pagamenti Bitcoin', callback_data: 'btc_info' }]
    ]
  };

  try {
    if (photoUrl) {
      await bot.sendPhoto(chatId, photoUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
  } catch (e) {
    bot.sendMessage(chatId, caption, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  setTimeout(() => showMenu(chatId), 600);
});

// ============================================================
// MENU PERSISTENTE
// ============================================================
function showMenu(chatId) {
  bot.sendMessage(chatId, '⌨️  Menu rapido attivo. Usa i pulsanti qui sotto.', {
    reply_markup: {
      keyboard: [
        [{ text: '🏠 Home' },     { text: '🔍 Esplora' }],
        [{ text: '🎙️ Stanze' },   { text: '💬 Chat' }],
        [{ text: '👑 Premium' },  { text: '👤 Profilo' }],
        [{ text: '💎 Cornici' },  { text: '🔗 Invita' }],
        [{ text: '🪙 Guadagni' }, { text: '₿ Bitcoin' }],
        [{ text: '❓ Aiuto' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  });
}
bot.onText(/^\/menu$/, (msg) => showMenu(msg.chat.id));

// ============================================================
// /profilo — mostra la foto Telegram + info
// ============================================================
async function sendProfile(chatId, fromName) {
  const user = getUser(chatId);
  const photoUrl = await getTgPhotoUrl(chatId);
  const invited = user.invitedUsers.length;
  const ownedNames = user.ownedFrames
    .map(id => frameById(id))
    .filter(Boolean)
    .map(f => `${f.emoji} ${f.name}`)
    .join(' · ');

  const text =
`👤 *Profilo di ${fromName}*

📅 Iscritto: ${new Date(user.joinedAt).toLocaleDateString('it-IT')}
👥 Amici invitati: *${invited}*
💰 Valore guadagnato: *${formatEur(user.earnedEur)} €* (${eurToBtc(user.earnedEur)} BTC)

💎 *Cornici possedute:*
${ownedNames || '🤍 Avorio'}

Tocca il bottone qui sotto per usare questa foto come avatar Kouverte.`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '🖼️ Usa questa foto come avatar', web_app: { url: freshUrl('#profile') } }],
      [{ text: '💎 Le mie cornici', callback_data: 'my_frames' }],
      [{ text: '🔗 Il mio link invito', callback_data: 'invite_card' }]
    ]
  };

  if (photoUrl) {
    bot.sendPhoto(chatId, photoUrl, { caption: text, parse_mode: 'Markdown', reply_markup: keyboard });
  } else {
    bot.sendMessage(chatId, text + '\n\n_Nessuna foto profilo Telegram trovata._', {
      parse_mode: 'Markdown', reply_markup: keyboard
    });
  }
}
bot.onText(/^\/profilo$/i, (msg) => sendProfile(msg.chat.id, msg.from.first_name || 'tu'));

// ============================================================
// /cornici — catalogo completo
// ============================================================
function sendFramesList(chatId) {
  const user = getUser(chatId);
  const owned = user.ownedFrames;

  const lines = FRAMES.map(f => {
    const has = owned.includes(f.id);
    const price = f.price_eur === 0
      ? 'Gratis'
      : `${f.price_eur} € · ${eurToBtc(f.price_eur)} BTC`;
    const status = has ? '✅ Posseduta' : `· ${price}`;
    return `${f.emoji}  *${f.name}*  — ${status}`;
  }).join('\n');

  const next = nextRewardFor(user);
  const reward = next
    ? `\n\n🎁 *Prossima cornice regalo:* ${next.label} con *${next.invites - user.invitedUsers.length}* inviti.`
    : '\n\n🏆 Hai sbloccato tutte le cornici regalo possibili!';

  const text =
`💎 *Catalogo Cornici Kouverte*

${lines}
${reward}

_Acquista con Bitcoin dall'app o invita amici per riceverle in regalo._`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛒 Acquista con BTC', web_app: { url: freshUrl('#profile') } }],
        [{ text: '🔗 Invita per guadagnarle', callback_data: 'invite_card' }]
      ]
    }
  });
}
bot.onText(/^\/cornici$/i, (msg) => sendFramesList(msg.chat.id));

// ============================================================
// /invita — link referral + reward tier
// ============================================================
function sendInviteCard(chatId) {
  const user = getUser(chatId);
  const link = refLink(chatId);
  const count = user.invitedUsers.length;
  const next = nextRewardFor(user);

  const rewardsList = REFERRAL_REWARDS
    .map(r => {
      const done = count >= r.invites;
      return `${done ? '✅' : '⬜️'} ${r.invites} inviti → cornice *${r.label}*`;
    })
    .join('\n');

  const text =
`🔗 *Invita & Guadagna*

Condividi il tuo link personale: ogni amico che si iscrive ti regala una cornice esclusiva.

🪙 *Il tuo link:*
\`${link}\`

👥 *Amici invitati:* ${count}
${next ? `🎯 *Prossimo premio:* cornice *${next.label}* tra *${next.invites - count}* inviti.` : '🏆 *Hai sbloccato tutti i premi!*'}

🎁 *Tabella premi:*
${rewardsList}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📤 Condividi link su Telegram', switch_inline_query: `Entra su Kouverte ✨ ${link}` }],
        [{ text: '🪙 Vedi guadagni', callback_data: 'earnings' }]
      ]
    }
  });
}
bot.onText(/^\/invita$/i, (msg) => sendInviteCard(msg.chat.id));

// ============================================================
// /guadagni — riepilogo + cornici sbloccate
// ============================================================
function sendEarnings(chatId) {
  const user = getUser(chatId);
  const count = user.invitedUsers.length;
  const unlocked = REFERRAL_REWARDS.filter(r => count >= r.invites);
  const next = nextRewardFor(user);

  const equivalentEur = unlocked.reduce((sum, r) => {
    const f = frameById(r.frame);
    return sum + (f ? f.price_eur : 0);
  }, 0);

  const text =
`💰 *I tuoi guadagni*

👥 Amici invitati: *${count}*
🎁 Cornici sbloccate: *${unlocked.length}*
💎 Valore totale: *${formatEur(equivalentEur)} €*  (${eurToBtc(equivalentEur)} BTC)

${unlocked.length > 0
  ? '✅ *Sbloccate:* ' + unlocked.map(r => `${frameById(r.frame)?.emoji || ''} ${r.label}`).join(' · ')
  : '_Inizia a invitare per sbloccare la prima cornice._'}

${next ? `🎯 *Prossima:* cornice *${next.label}* tra *${next.invites - count}* inviti.` : '🏆 *Tutte le cornici premio sono tue!*'}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 Invita ancora', callback_data: 'invite_card' }],
        [{ text: '💎 Vedi cornici', callback_data: 'frames_list' }]
      ]
    }
  });
}
bot.onText(/^\/guadagni$/i, (msg) => sendEarnings(msg.chat.id));

// ============================================================
// /stanze — lista stanze vocali
// ============================================================
const ROOMS = [
  { slug: 'lounge-velluto',    label: 'Lounge Velluto',     desc: 'Conversazioni sottili e raffinate',         emoji: '🍷' },
  { slug: 'jazz-after-dark',   label: 'Jazz After Dark',    desc: 'Vinili, smoking e voci basse',              emoji: '🎷' },
  { slug: 'parigi-by-night',   label: 'Parigi by Night',    desc: 'Romance, charme, lingua francese',          emoji: '🗼' },
  { slug: 'cinema-noir',       label: 'Cinema Noir',        desc: 'Recensioni di film cult e contemporanei',   emoji: '🎬' },
  { slug: 'segreti-di-cucina', label: 'Segreti di Cucina',  desc: 'Ricette gourmet e racconti dai grandi chef',emoji: '🥂' },
  { slug: 'arte-e-poesia',     label: 'Arte e Poesia',      desc: 'Letture, mostre, ispirazioni',              emoji: '🎭' },
  { slug: 'salotto-business',  label: 'Salotto Business',   desc: 'Networking, idee, mentor',                  emoji: '💼' }
];

function sendRooms(chatId) {
  const lines = ROOMS.map(r => `${r.emoji}  *${r.label}* — _${r.desc}_`).join('\n\n');
  const text =
`🎙️  *Stanze vocali Kouverte*

Conversazioni in tempo reale con persone selezionate:

${lines}

✨ Entra in una stanza dall'app — la tua voce è la tua firma.`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎙️ Apri Stanze', web_app: { url: freshUrl('#rooms') } }],
        ...ROOMS.slice(0, 3).map(r => ([{
          text: `${r.emoji} ${r.label}`,
          web_app: { url: freshUrl('#rooms') }
        }]))
      ]
    }
  });
}
bot.onText(/^\/stanze$/i, (msg) => sendRooms(msg.chat.id));

// ============================================================
// /premium — piani come nel sito
// ============================================================
function sendPremium(chatId) {
  const text =
`👑 *Kouverte Premium*

Pagamenti in *Bitcoin*. Cambio live aggiornato.

*Vox Pro* · 5 € / mese · _${eurToBtc(5)} BTC_
◆ Storie per 14 giorni
◆ Profilo verificato
◆ Badge Premium

*Vox Elite* · 10 € / mese · _${eurToBtc(10)} BTC_  ⭐ CONSIGLIATO
◆ Storie per 30 giorni
◆ Visibilità prioritaria
◆ Badge Premium

*Vox Infinity* · 20 € / mese · _${eurToBtc(20)} BTC_
◆ Storie permanenti
◆ Tutte le funzioni Elite
◆ Supporto dedicato
◆ Eventi esclusivi`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '👑 Attiva Premium', web_app: { url: freshUrl('#premium') } }],
        [{ text: '₿ Paga in Bitcoin', callback_data: 'btc_info' }]
      ]
    }
  });
}
bot.onText(/^\/premium$/i, (msg) => sendPremium(msg.chat.id));

// ============================================================
// /bitcoin — info pagamenti
// ============================================================
function sendBtcInfo(chatId) {
  const text =
`₿ *Pagamenti in Bitcoin*

Tutti gli acquisti su Kouverte (cornici, Premium) si pagano in Bitcoin.

🔐 *Indirizzo ufficiale:*
\`${BTC_ADDRESS}\`

⚙️ *Come funziona:*
1. Scegli una cornice o un piano dall'app
2. Si apre un *QR code* con importo preciso in sats
3. Paghi dal tuo wallet (Phoenix, Muun, Wallet of Satoshi, ecc.)
4. Dopo *4 conferme* sblocchiamo l'acquisto

💡 *Non hai BTC?* Invita amici e ricevi le cornici in regalo con /invita!`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💎 Vai alle cornici', callback_data: 'frames_list' }],
        [{ text: '🔗 Modalità regalo (gratis)', callback_data: 'invite_card' }]
      ]
    }
  });
}
bot.onText(/^\/bitcoin$/i, (msg) => sendBtcInfo(msg.chat.id));

// ============================================================
// /aiuto — comandi completi
// ============================================================
function sendHelp(chatId) {
  const text =
`❓ *Aiuto — Comandi Kouverte*

🏠 /start — Benvenuto + il tuo profilo
⌨️ /menu — Menu rapido in basso
👤 /profilo — Mostra la tua foto + info
🎙️ /stanze — Stanze vocali attive
💎 /cornici — Catalogo cornici premium
🔗 /invita — Il tuo link referral
🪙 /guadagni — Cornici sbloccate
👑 /premium — Piani Premium
₿ /bitcoin — Pagamenti in Bitcoin
❓ /aiuto — Questa lista

🔗 *Vuoi guadagnare?* Invita amici con /invita e ricevi cornici esclusive — fino al Diamante 💎 (vale 50.000 sats!).`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Apri Kouverte', web_app: { url: freshUrl() } }]
      ]
    }
  });
}
bot.onText(/^\/(aiuto|help|start_help)$/i, (msg) => sendHelp(msg.chat.id));

// ============================================================
// CALLBACK QUERIES (bottoni inline)
// ============================================================
bot.on('callback_query', async (cq) => {
  const chatId = cq.message.chat.id;
  const data = cq.data;
  bot.answerCallbackQuery(cq.id).catch(() => {});

  switch (data) {
    case 'frames_list':  return sendFramesList(chatId);
    case 'rooms_list':   return sendRooms(chatId);
    case 'invite_card':  return sendInviteCard(chatId);
    case 'earnings':     return sendEarnings(chatId);
    case 'my_frames':    return sendFramesList(chatId);
    case 'btc_info':     return sendBtcInfo(chatId);
    case 'premium':      return sendPremium(chatId);
    case 'profilo':      return sendProfile(chatId, cq.from.first_name || 'tu');
  }
});

// ============================================================
// REPLY KEYBOARD HANDLER
// ============================================================
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim().toLowerCase();
  const name = msg.from.first_name || 'tu';

  const actions = {
    '🏠 home':     () => bot.sendMessage(chatId, '🏠 Apri la *Home* di Kouverte', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '▶ Apri', web_app: { url: freshUrl() } }]] } }),
    '🔍 esplora':  () => bot.sendMessage(chatId, '🔍 Esplora i profili', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '▶ Apri', web_app: { url: freshUrl('#explore') } }]] } }),
    '🎙️ stanze':   () => sendRooms(chatId),
    '💬 chat':     () => bot.sendMessage(chatId, '💬 Le tue conversazioni', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '▶ Apri', web_app: { url: freshUrl('#chat') } }]] } }),
    '👑 premium':  () => sendPremium(chatId),
    '👤 profilo':  () => sendProfile(chatId, name),
    '💎 cornici':  () => sendFramesList(chatId),
    '🔗 invita':   () => sendInviteCard(chatId),
    '🪙 guadagni': () => sendEarnings(chatId),
    '₿ bitcoin':   () => sendBtcInfo(chatId),
    '❓ aiuto':    () => sendHelp(chatId)
  };

  for (const key in actions) {
    if (text === key) return actions[key]();
  }

  // Risposte naturali
  if (/ciao|salve|hey/i.test(text)) {
    return bot.sendMessage(chatId, `🕯️ Ciao ${name}. Usa /menu per i comandi.`);
  }
  if (/grazie/i.test(text)) {
    return bot.sendMessage(chatId, '🤍 Sempre un piacere.');
  }
  if (/cornic/i.test(text)) return sendFramesList(chatId);
  if (/invit|amic/i.test(text)) return sendInviteCard(chatId);
  if (/bitcoin|btc|paga/i.test(text)) return sendBtcInfo(chatId);
  if (/profilo|account/i.test(text)) return sendProfile(chatId, name);
  if (/aiuto|help/i.test(text)) return sendHelp(chatId);

  bot.sendMessage(chatId, '🤔 Non ho capito. Usa /menu o /aiuto.');
});

// ============================================================
// REFERRAL: notifica + assegnazione cornice
// ============================================================
async function notifyReferralEarned(inviterId, newUserName) {
  const inviter = getUser(inviterId);
  const count = inviter.invitedUsers.length;

  // Verifica se ha raggiunto un tier di reward
  const justUnlocked = REFERRAL_REWARDS.find(r => r.invites === count);
  let rewardMsg = '';
  if (justUnlocked) {
    if (!inviter.ownedFrames.includes(justUnlocked.frame)) {
      inviter.ownedFrames.push(justUnlocked.frame);
      const f = frameById(justUnlocked.frame);
      inviter.earnedEur += (f?.price_eur || 0);
      saveDB();
      rewardMsg = `\n\n🎉 *PREMIO SBLOCCATO!*\nHai vinto la cornice ${f.emoji} *${f.name}* (valore ${formatEur(f.price_eur)} € · ${eurToBtc(f.price_eur)} BTC).`;
    }
  } else {
    saveDB();
  }

  const next = nextRewardFor(inviter);
  const nextMsg = next
    ? `\n🎯 Prossima cornice: *${next.label}* tra ${next.invites - count} inviti.`
    : '\n🏆 Hai sbloccato tutte le cornici premio!';

  const text =
`🎊 *${newUserName}* si è iscritto col tuo link!

👥 Amici invitati totali: *${count}*${rewardMsg}${nextMsg}`;

  try {
    await bot.sendMessage(inviterId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🪙 Vedi guadagni', callback_data: 'earnings' }],
          [{ text: '🚀 Apri app', web_app: { url: freshUrl('#profile') } }]
        ]
      }
    });
  } catch (e) {
    console.error('Notify referral error:', e.message);
  }
}

// ============================================================
// ERROR HANDLING
// ============================================================
bot.on('polling_error', (err) => console.error('Polling error:', err.message));
bot.on('error', (err) => console.error('Bot error:', err.message));

process.on('SIGINT', () => {
  saveDB();
  console.log('\n💾 DB salvato. Arrivederci.');
  process.exit(0);
});
