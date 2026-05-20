// ============================================================
// KOUVERTE · TELEGRAM BOT
// Chat Mondiale Anonima — pagamenti in Telegram Stars
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const fs   = require('fs');
const path = require('path');

const BOT_TOKEN    = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
const WEBAPP_URL   = process.env.WEBAPP_URL   || 'https://www.kouverte.com/app.html';
const BOT_USERNAME = process.env.BOT_USERNAME || 'Kouverte_bot';
const SITE_URL     = process.env.SITE_URL     || 'https://www.kouverte.com';

if (!BOT_TOKEN || BOT_TOKEN.length < 30) {
  console.error('❌ BOT_TOKEN mancante/invalido.');
  module.exports = { ok:false, error:'BOT_TOKEN_MISSING' };
  return;
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🎭 Kouverte Bot avviato · @' + BOT_USERNAME);
console.log('   WebApp: ' + WEBAPP_URL);

bot.deleteWebHook({ drop_pending_updates: false })
   .then(() => console.log('   Webhook: cleared (polling mode)'))
   .catch(()=>{});

// ============================================================
// CATALOGO CORNICI — allineato 1:1 con app.html
// Pagamenti SOLO in Telegram Stars (★)
// ============================================================
const FRAMES = [
  { id:'none',    name:'Nessuna', emoji:'🎭', stars:0,  prem:false },
  { id:'silver',  name:'Silver',  emoji:'🥈', stars:0,  prem:false },
  { id:'purple',  name:'Viola',   emoji:'💜', stars:0,  prem:false },
  { id:'gold',    name:'Gold',    emoji:'🥇', stars:30, prem:true  },
  { id:'flame',   name:'Fiamma',  emoji:'🔥', stars:40, prem:true  },
  { id:'diamond', name:'Diamond', emoji:'💎', stars:50, prem:true  },
];
const frameById = id => FRAMES.find(f => f.id === id);

// Stanze allineate con ROOMS in app.html (aggiornate)
const APP_ROOMS = [
  { cat:'🌍 Pubbliche', rooms:['Mondo - Chat globale','Italia - Generale italiani','Roma - Capitale','Milano - Nord','Campania - Sud','Calabria - Sud'] },
  { cat:'🕯️ Speciali',  rooms:['Confessionale - 1 messaggio anonimo al giorno'] },
  { cat:'🔐 Private',   rooms:['Stanze a codice - Crea con amici (6 caratteri)'] }
];

// Tier referral: ad ogni N inviti → cornice regalo + badge
const REFERRAL_REWARDS = [
  { invites:1,  frame:'silver',  label:'Silver'  },
  { invites:5,  frame:'purple',  label:'Viola'   },
  { invites:15, frame:'gold',    label:'Gold'    },
  { invites:30, frame:'flame',   label:'Fiamma'  },
  { invites:60, frame:'diamond', label:'Diamond' }
];

// ============================================================
// STORAGE PERSISTENTE
// Upstash Redis (persistente fra deploy) se env presenti, altrimenti file locale (ephemeral su Render free)
// ============================================================
const DB_PATH = path.join(__dirname, 'kouverte-bot.json');
const REDIS_KEY = 'kouverte:bot:db';
let DB = { users:{} };
let redis = null;
let saveTimer = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('   Storage: Upstash Redis (persistente)');
  } catch(e) {
    console.error('   Storage: errore init Upstash, fallback su file:', e.message);
    redis = null;
  }
} else {
  console.log('   Storage: file locale (ephemeral su Render free)');
}

async function loadDB(){
  if (redis) {
    try {
      const data = await redis.get(REDIS_KEY);
      if (data) {
        DB = typeof data === 'string' ? JSON.parse(data) : data;
        DB.users = DB.users || {};
        console.log('   DB caricato da Redis · ' + Object.keys(DB.users).length + ' utenti');
        return;
      }
    } catch(e) { console.error('   Redis load:', e.message); }
  }
  // Fallback file
  try {
    if (fs.existsSync(DB_PATH)) {
      DB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      DB.users = DB.users || {};
    }
  } catch(e) { console.error('DB load:', e.message); }
}

async function saveDB(){
  // Debounce 500ms — evita di tempestare Redis su update consecutivi
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    if (redis) {
      try { await redis.set(REDIS_KEY, JSON.stringify(DB)); return; }
      catch(e) { console.error('Redis save:', e.message); }
    }
    try { fs.writeFileSync(DB_PATH, JSON.stringify(DB, null, 2)); }
    catch(e) { console.error('DB save:', e.message); }
  }, 500);
}

// Carica DB all'avvio (async — non blocca l'init del bot, ma i primi event potrebbero avere DB vuoto per pochi ms)
loadDB().catch(e => console.error('loadDB init:', e.message));

function getUser(chatId){
  const id = String(chatId);
  if(!DB.users[id]){
    DB.users[id] = {
      id,
      joinedAt: Date.now(),
      invitedBy: null,
      invitedUsers: [],
      ownedFrames: ['none','silver','purple'],
      isPremium: false,
      premiumExpiry: 0
    };
  }
  // Migrazione automatica da vecchio schema
  if(!Array.isArray(DB.users[id].ownedFrames) || DB.users[id].ownedFrames.length===0){
    DB.users[id].ownedFrames = ['none','silver','purple'];
  }
  return DB.users[id];
}
function isPremium(u){ return u.isPremium && Date.now() < (u.premiumExpiry||0); }

// ============================================================
// HELPERS
// ============================================================
const fresh = (hash='') => `${WEBAPP_URL}?v=${Date.now()}${hash}`;
const refLink = chatId => `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;
function nextReward(u){
  const c = u.invitedUsers.length;
  return REFERRAL_REWARDS.find(r => r.invites > c) || null;
}

// ============================================================
// /start con referral tracking
// ============================================================
bot.onText(/^\/start(?:\s+(\S+))?$/, async (msg, match) => {
  const chatId    = msg.chat.id;
  const firstName = msg.from.first_name || 'amico';
  const refArg    = match[1];
  const user      = getUser(chatId);

  if(refArg && refArg.startsWith('ref_')){
    const refFromId = refArg.substring(4);
    if(refFromId !== String(chatId) && !user.invitedBy){
      const inviter = getUser(refFromId);
      if(!inviter.invitedUsers.includes(String(chatId))){
        inviter.invitedUsers.push(String(chatId));
        user.invitedBy = refFromId;
        saveDB();
        notifyReferralEarned(refFromId, firstName).catch(()=>{});
      }
    }
  }

  // Deep link "reset" / "recover" / "reset_USERNAME" - mostra istruzioni reset password
  if(refArg && (refArg === 'reset' || refArg === 'recover' || refArg.startsWith('reset_') || refArg.startsWith('recover_'))){
    let prefilledUser = '';
    if (refArg.startsWith('reset_')) prefilledUser = refArg.substring(6);
    else if (refArg.startsWith('recover_')) prefilledUser = refArg.substring(8);

    const text = `🔓 *Recupero Password KOUVERTE*

${prefilledUser ? `Account rilevato: \`${prefilledUser}\`\n\n` : ''}*Come funziona il recupero via Telegram:*

1️⃣ Usa il comando \`/reset USERNAME\` (o email)
   Esempio: \`/reset bob_kouverte\`
2️⃣ Ti invieremo un *codice OTP a 6 cifre* (valido 10 min)
3️⃣ Inserisci il codice sul sito + nuova password

🔑 *Hai i codici di backup salvati?*
Usa quelli direttamente sul sito su www.kouverte.com → "Password dimenticata"

⚠️ *Importante:*
• Il codice è valido solo 10 minuti
• Usa solo se sei TU il proprietario dell'account
• Non condividere mai il codice con nessuno

${prefilledUser ? `\n👇 Tocca per richiedere il codice:` : '\n👇 Premi il bottone per richiedere il codice OTP'}`;

    return bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          prefilledUser
            ? [{ text: `🔑 Richiedi codice per ${prefilledUser}`, callback_data: 'reset_quick_' + prefilledUser.substring(0,30) }]
            : [{ text: '🔑 Come richiedere il codice', callback_data: 'reset_help' }],
          [{ text: '🌐 Apri il sito KOUVERTE', url: SITE_URL }],
          [{ text: '🏠 Menu principale', callback_data: 'help' }]
        ]
      }
    }).catch(e=>console.error('start reset:',e.message));
  }

  const caption =
`🎭 *KOUVERTE* — Chat Mondiale Anonima

Benvenuto, *${firstName}*!

🆕 *NOVITÀ:*
📹 *Video Chat* — webcam P2P anonima
🔐 *Stanze a Codice* — crea con i tuoi amici

🌍 *Stanze Pubbliche:*
🇮🇹 Italia · Roma · Milano · Campania · Calabria
🌍 Mondo · 🕯️ Confessionale

🔒 *100% Anonimo* — solo una maschera emoji
🎁 *100 messaggi gratuiti* poi 5€/mese in BTC
🏆 Badge & cornici da sbloccare
🎤 *Toggle Mic & Camera* in ogni chat

*Chatta. Vediti. Conosci. Senza essere chi sei.*

Tocca il bottone qui sotto 👇`;

  const keyboard = {
    inline_keyboard: [
      [{ text:'🚀 Entra in KOUVERTE', web_app:{ url: fresh() } }],
      [
        { text:'🔐 Crea Stanza Codice', callback_data:'create_room' },
        { text:'🔑 Entra con Codice',   callback_data:'join_room' }
      ],
      [
        { text:'🎭 Profilo', callback_data:'profile' },
        { text:'🖼️ Cornici', callback_data:'frames' }
      ],
      [
        { text:'🔗 Invita & guadagna', callback_data:'invite' },
        { text:'⭐ Premium 5€/mese',   callback_data:'premium' }
      ],
      [{ text:'🌐 Apri sul sito', url: SITE_URL }]
    ]
  };

  bot.sendMessage(chatId, caption, { parse_mode:'Markdown', reply_markup: keyboard }).catch(e=>console.error('start:',e.message));
  setTimeout(()=>showMenu(chatId), 600);
});

// ============================================================
// Menu reply-keyboard persistente
// ============================================================
function showMenu(chatId){
  bot.sendMessage(chatId, '⌨️  Menu rapido', {
    reply_markup: {
      keyboard: [
        [{ text:'🚀 Entra nella Chat' }, { text:'📹 Video Chat' }],
        [{ text:'🔐 Crea Stanza' },      { text:'🔑 Entra con Codice' }],
        [{ text:'🎭 Profilo' },          { text:'🖼️ Cornici' }],
        [{ text:'🔗 Invita & guadagna' }, { text:'⭐ Premium' }],
        [{ text:'🌐 Sito' },             { text:'❓ Aiuto' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  }).catch(()=>{});
}
bot.onText(/^\/menu$/i, m => showMenu(m.chat.id));

// ============================================================
// /profilo
// ============================================================
function sendProfile(chatId){
  const u = getUser(chatId);
  const owned = u.ownedFrames.map(id=>frameById(id)).filter(Boolean);
  const ownedTxt = owned.map(f=>`${f.emoji} ${f.name}`).join(' · ') || '🎭 Nessuna';
  const prem = isPremium(u);
  const premLine = prem
    ? `⭐ *Premium attivo* fino al ${new Date(u.premiumExpiry).toLocaleDateString('it-IT')}`
    : `Non Premium · _Sblocca con 1€/mese_`;

  const text =
`🎭 *Il tuo profilo*

📅 Iscritto: ${new Date(u.joinedAt).toLocaleDateString('it-IT')}
👥 Amici invitati: *${u.invitedUsers.length}*
${premLine}

💎 *Cornici possedute:*
${ownedTxt}`;

  bot.sendMessage(chatId, text, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🎭 Apri profilo in app', web_app:{ url: fresh('#profile') } }],
        [{ text:'🖼️ Vedi cornici', callback_data:'frames' }],
        [{ text:'🔗 Invita amici', callback_data:'invite' }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/profilo$/i, m => sendProfile(m.chat.id));

// ============================================================
// /cornici
// ============================================================
function sendFrames(chatId){
  const u = getUser(chatId);
  const owned = new Set(u.ownedFrames);

  const lines = FRAMES.map(f => {
    const has = owned.has(f.id);
    const price = f.prem ? '_solo Premium o referral_' : 'Gratis';
    return `${f.emoji}  *${f.name}*  — ${has ? '✅ Tua' : price}`;
  }).join('\n');

  const next = nextReward(u);
  const reward = next
    ? `\n\n🎁 *Prossima cornice regalo:* ${next.label} con *${next.invites - u.invitedUsers.length}* inviti.`
    : '\n\n🏆 Hai sbloccato tutte le cornici premio!';

  bot.sendMessage(chatId,
`💎 *Catalogo Cornici*

${lines}${reward}

_Le cornici premium si sbloccano abbonandosi a Premium (5€/mese in BTC) o invitando amici._`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'⭐ Sblocca tutte con Premium', callback_data:'premium' }],
        [{ text:'🔗 Invita per guadagnarle', callback_data:'invite' }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/cornici$/i, m => sendFrames(m.chat.id));

// ============================================================
// /invita
// ============================================================
function sendInvite(chatId){
  const u = getUser(chatId);
  const link = refLink(chatId);
  const c = u.invitedUsers.length;
  const next = nextReward(u);

  const rewardsList = REFERRAL_REWARDS.map(r=>{
    const done = c >= r.invites;
    return `${done?'✅':'⬜️'} ${r.invites} inviti → ${frameById(r.frame)?.emoji||''} *${r.label}*`;
  }).join('\n');

  bot.sendMessage(chatId,
`🔗 *Invita & Guadagna*

Condividi il tuo link: ogni amico che si iscrive ti regala una cornice.

🪙 *Il tuo link:*
\`${link}\`

👥 Amici invitati: *${c}*
${next ? `🎯 Prossima: *${next.label}* tra *${next.invites - c}* inviti` : '🏆 *Tutti i premi sbloccati!*'}

🎁 *Tabella premi:*
${rewardsList}`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'📤 Condividi su Telegram', switch_inline_query:`Entra su KOUVERTE 🎭 ${link}` }],
        [{ text:'🎭 Apri app', web_app:{ url: fresh() } }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/invita$/i, m => sendInvite(m.chat.id));

// ============================================================
// /stanze — solo quelle reali dell'app
// ============================================================
function sendRooms(chatId){
  const lines = APP_ROOMS.map(c =>
    `*${c.cat}*\n${c.rooms.map(r=>`  · ${r}`).join('\n')}`
  ).join('\n\n');

  bot.sendMessage(chatId,
`💬 *Stanze KOUVERTE*

${lines}

Tutte anonime. 100 messaggi gratuiti, poi Premium 5€/mese in BTC.

📹 *In ogni stanza:* video chat P2P + audio anonimo`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🚀 Apri le stanze', web_app:{ url: fresh() } }],
        [
          { text:'🔐 Crea Stanza', callback_data:'create_room' },
          { text:'🔑 Entra con Codice', callback_data:'join_room' }
        ]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/stanze$/i, m => sendRooms(m.chat.id));

// ============================================================
// /crea — Crea stanza a codice
// ============================================================
function sendCreateRoom(chatId){
  bot.sendMessage(chatId,
`🔐 *Crea una Stanza Privata*

Crea una stanza solo per te e i tuoi amici!

*Come funziona:*
1️⃣ Apri l'app KOUVERTE
2️⃣ Tocca "*➕ Crea Stanza*"
3️⃣ Scegli nome ed emoji
4️⃣ Ricevi un *codice di 6 caratteri* (es. K3FD92)
5️⃣ Condividi il codice con i tuoi amici
6️⃣ Loro entrano in "*🔑 Entra con Codice*"

🎉 *Caratteristiche:*
✅ Solo chi ha il codice può entrare
✅ Video chat e audio anonimi
✅ 100% privata e sicura
✅ Niente cronologia salvata`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🔐 Crea Stanza Ora', web_app:{ url: fresh('#create') } }],
        [{ text:'🔑 Ho già un codice', callback_data:'join_room' }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/crea$/i, m => sendCreateRoom(m.chat.id));

// ============================================================
// /entra — Entra in stanza tramite codice
// ============================================================
function sendJoinRoom(chatId){
  bot.sendMessage(chatId,
`🔑 *Entra con un Codice*

Hai ricevuto un codice da un amico?

*Come usare il codice:*
1️⃣ Apri l'app KOUVERTE
2️⃣ Tocca "*🔑 Entra con Codice*"
3️⃣ Inserisci il codice di 6 caratteri
4️⃣ Sei nella stanza con i tuoi amici!

📹 *In stanza puoi:*
✅ Attivare/disattivare camera 📹
✅ Attivare/disattivare microfono 🎤
✅ Chattare in modo anonimo
✅ Vedere video di chi è connesso

_Non hai un codice? Crea la tua stanza ora!_`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🔑 Entra con Codice', web_app:{ url: fresh('#join') } }],
        [{ text:'🔐 Crea la mia Stanza', callback_data:'create_room' }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/entra$/i, m => sendJoinRoom(m.chat.id));

// ============================================================
// /video — Info su video chat
// ============================================================
function sendVideoInfo(chatId){
  bot.sendMessage(chatId,
`📹 *Video Chat Anonima*

KOUVERTE ora ha la *video chat P2P*!

🎥 *In ogni stanza:*
✅ La tua webcam in alto a sinistra
✅ Quella del tuo interlocutore a destra
✅ Lista utenti online in basso

🎤 *Controlli:*
📹 Tocca per disattivare la camera
🎤 Tocca per disattivare il microfono
🔇 Quando spento → icona rossa
📷 Camera OFF → overlay nero

🔒 *Privacy:*
✅ Comunicazione *P2P diretta* (no server)
✅ Niente registrazioni
✅ Niente storage
✅ 100% Anonimo

⚠️ *Funziona solo su HTTPS* (sito + Telegram WebApp)`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'📹 Prova Video Chat', web_app:{ url: fresh() } }],
        [{ text:'🌐 Apri sul sito web', url: SITE_URL }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/video$/i, m => sendVideoInfo(m.chat.id));

// ============================================================
// /sito — Link al sito web
// ============================================================
function sendSiteLink(chatId){
  bot.sendMessage(chatId,
`🌐 *KOUVERTE sul Web*

Apri KOUVERTE direttamente dal browser:

🔗 *${SITE_URL}*

Funziona su:
📱 Mobile (Android, iOS)
💻 Desktop (Chrome, Firefox, Safari)
🌐 Qualsiasi browser moderno

✅ Anonimato totale
✅ Video chat HD
✅ Stanze pubbliche e private
✅ Niente download, niente account

_Salvalo nei segnalibri per accesso veloce!_`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🌐 Apri ' + SITE_URL.replace('https://',''), url: SITE_URL }],
        [{ text:'🚀 O usa la WebApp', web_app:{ url: fresh() } }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/sito$/i, m => sendSiteLink(m.chat.id));

// ============================================================
// /condividi <codice> — Condividi codice stanza
// ============================================================
bot.onText(/^\/condividi(?:\s+(\S+))?$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1] ? match[1].toUpperCase() : null;

  if (!code || code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
    return bot.sendMessage(chatId,
`📤 *Condividi una stanza*

Usa: \`/condividi CODICE\`

Esempio: \`/condividi K3FD92\`

Il codice deve essere di 6 caratteri (lettere maiuscole e numeri).

_Non hai ancora una stanza? Creane una con /crea_`, { parse_mode:'Markdown' }).catch(()=>{});
  }

  const shareText = `🎭 Unisciti alla mia stanza KOUVERTE!\n\n🔐 Codice: *${code}*\n\nApri 👉 ${SITE_URL}\nO la WebApp del bot @${BOT_USERNAME}\n\nPoi tocca "🔑 Entra con Codice"`;

  bot.sendMessage(chatId,
`📤 *Codice pronto da condividere!*

${shareText}

Premi il bottone qui sotto per inviarlo ai tuoi amici 👇`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'📤 Condividi nella chat', switch_inline_query: shareText.replace(/\*/g, '') }],
        [{ text:'🔑 Entra nella stanza', web_app:{ url: fresh('#code=' + code) } }]
      ]
    }
  }).catch(()=>{});
});

// ============================================================
// /premium — 1€/mese = 100★ Telegram Stars
// ============================================================
const BTC_ADDRESS = process.env.BITCOIN_ADDRESS || 'bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00';

function sendPremium(chatId){
  const u = getUser(chatId);
  if(isPremium(u)){
    return bot.sendMessage(chatId,
`⭐ *Sei già Premium!*

Premium attivo fino al ${new Date(u.premiumExpiry).toLocaleDateString('it-IT')}.
✅ Messaggi illimitati
✅ Cornici Gold, Diamond, Fiamma sbloccate`, { parse_mode:'Markdown' }).catch(()=>{});
  }

  bot.sendMessage(chatId,
`⭐ *KOUVERTE Premium*

*5€/mese pagati in Bitcoin* ₿

✅ *Messaggi illimitati* per 30 giorni
✅ *Cornici premium*: Gold 🥇 · Fiamma 🔥 · Diamond 💎
✅ *Nome brillante* in chat
✅ Pagamento diretto, nessun intermediario
✅ Nessun rinnovo automatico

*Come funziona:*
1. Apri l'app → tap "Premium"
2. Ricevi indirizzo + importo esatto in BTC
3. Paga dal tuo wallet (Phoenix, Muun, BlueWallet...)
4. Dopo 4 conferme on-chain → Premium attivo

_Niente Telegram Stars: ogni euro va direttamente sul wallet KOUVERTE._`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'₿ Apri pagamento BTC', web_app:{ url: fresh('#paywall') } }],
        [{ text:'📬 Vedi indirizzo BTC', callback_data:'btc_info' }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/premium$/i, m => sendPremium(m.chat.id));

function sendBtcInfo(chatId){
  bot.sendMessage(chatId,
`₿ *Indirizzo Bitcoin KOUVERTE*

\`${BTC_ADDRESS}\`

⚠️ *Non mandare BTC qui!*

L'importo Premium ha un suffisso univoco di pochi sat per identificare il tuo pagamento. Apri l'app e segui le istruzioni per ricevere quote + QR code.`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text:'₿ Apri pagamento', web_app:{ url: fresh('#paywall') } }]]
    }
  }).catch(()=>{});
}
bot.onText(/^\/bitcoin$/i, m => sendBtcInfo(m.chat.id));

// ============================================================
// /reset <username> - Genera OTP per reset password via Telegram
// ============================================================
function generateOTP(){
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveResetOTP(identifier, otp, chatId){
  const ttlSec = 600; // 10 minuti
  const key = 'kouverte:reset_otp:' + identifier.toLowerCase();
  const data = JSON.stringify({ otp, chatId: String(chatId), createdAt: Date.now() });

  if (redis) {
    try {
      await redis.set(key, data, { ex: ttlSec });
      return true;
    } catch(e) {
      console.error('[Reset] Redis save error:', e.message);
    }
  }
  // Fallback memoria locale (perso al restart, ma valido 10min)
  global._resetOTPs = global._resetOTPs || new Map();
  global._resetOTPs.set(key, { ...JSON.parse(data), expiresAt: Date.now() + ttlSec*1000 });
  // Cleanup OTP scaduti
  for (const [k, v] of global._resetOTPs.entries()) {
    if (v.expiresAt < Date.now()) global._resetOTPs.delete(k);
  }
  return true;
}

bot.onText(/^\/reset(?:\s+(\S+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const identifier = (match[1] || '').trim().toLowerCase();

  if (!identifier) {
    return bot.sendMessage(chatId,
`🔓 *Reset Password via Telegram*

Usa: \`/reset USERNAME\` o \`/reset email@example.com\`

*Esempio:* \`/reset bob_kouverte\`

Riceverai un codice OTP di 6 cifre valido 10 minuti.

💡 Hai i codici di backup? Usa direttamente quelli sul sito → Password dimenticata.`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '🌐 Apri sito KOUVERTE', url: SITE_URL }]
      ]}
    }).catch(()=>{});
  }

  // Validazione
  if (identifier.length < 3 || identifier.length > 80) {
    return bot.sendMessage(chatId, '❌ Username o email non valido.').catch(()=>{});
  }

  // Genera OTP
  const otp = generateOTP();
  const saved = await saveResetOTP(identifier, otp, chatId);
  if (!saved) {
    return bot.sendMessage(chatId, '❌ Errore generazione codice. Riprova.').catch(()=>{});
  }

  // Invia OTP
  bot.sendMessage(chatId,
`🔐 *Codice di Recupero Password*

Per: \`${identifier}\`

Il tuo codice OTP:

🔢 *${otp}*

⏰ *Valido per 10 minuti.*

*Come usarlo:*
1️⃣ Vai su www.kouverte.com
2️⃣ Tocca "Password dimenticata"
3️⃣ Scegli "Recupera via Telegram OTP"
4️⃣ Inserisci username/email + codice OTP + nuova password

⚠️ *Non condividere questo codice con nessuno!*
Se non hai richiesto tu il reset, ignora questo messaggio.`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Apri sito → Inserisci codice', url: SITE_URL + '/app.html#otp=' + encodeURIComponent(identifier) }],
        [{ text: '🚀 Apri WebApp', web_app: { url: fresh('#otp=' + encodeURIComponent(identifier)) } }]
      ]
    }
  }).catch(e=>console.error('reset otp:',e.message));
});

// ============================================================
// /backup - info sui codici di backup
// ============================================================
bot.onText(/^\/backup$/i, m => {
  bot.sendMessage(m.chat.id,
`🔑 *Codici di Backup*

Quando ti sei registrato su KOUVERTE, hai ricevuto *5 codici di recupero* di 8 caratteri.

*Come usarli:*
1️⃣ Vai su www.kouverte.com
2️⃣ Tocca "Password dimenticata"
3️⃣ Inserisci username + uno dei codici + nuova password
4️⃣ Il codice viene consumato (one-time use)

*Hai perso tutti i codici?*
Usa /reset USERNAME per ricevere un OTP via Telegram!

*Vuoi nuovi codici?*
Vai su Impostazioni nel sito → "🔑 Rigenera codici di recupero"`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Apri sito', url: SITE_URL }],
        [{ text: '🔐 Reset con OTP', callback_data: 'reset_help' }]
      ]
    }
  }).catch(()=>{});
});

// ============================================================
// /aiuto
// ============================================================
function sendHelp(chatId){
  bot.sendMessage(chatId,
`❓ *Comandi KOUVERTE*

🚀 /start — Benvenuto + apri app
⌨️ /menu — Menu rapido
🌐 /sito — Apri www.kouverte.com

🆕 *NUOVE FUNZIONALITÀ:*
📹 /video — Info su video chat anonima
🔐 /crea — Crea stanza con codice
🔑 /entra — Entra in stanza con codice
📤 /condividi <codice> — Condividi codice

📋 *Altri comandi:*
🎭 /profilo — Il tuo profilo
💬 /stanze — Lista delle stanze
🖼️ /cornici — Catalogo cornici
🔗 /invita — Link referral
⭐ /premium — Abbonamento 5€/mese (BTC)
₿ /bitcoin — Info pagamento BTC
❓ /aiuto — Questa lista

🔓 *Recupero password:*
🔑 /reset USERNAME — Ricevi OTP per reset password
🔐 /backup — Info sui codici di backup

🔒 *KOUVERTE è 100% anonima.*
Nessun nome reale, nessuna foto salvata.`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🚀 Apri KOUVERTE', web_app:{ url: fresh() } }],
        [{ text:'🌐 Apri sul Sito', url: SITE_URL }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/(aiuto|help)$/i, m => sendHelp(m.chat.id));

// ============================================================
// CALLBACK QUERIES (inline buttons)
// ============================================================
bot.on('callback_query', cq => {
  const chatId = cq.message.chat.id;
  bot.answerCallbackQuery(cq.id).catch(()=>{});

  // reset_quick_USERNAME -> richiede subito OTP
  if (cq.data && cq.data.startsWith('reset_quick_')) {
    const identifier = cq.data.substring(12);
    // Simula /reset USERNAME
    bot.processUpdate({ update_id: Date.now(), message: { chat: { id: chatId }, from: cq.from, text: '/reset ' + identifier, message_id: Date.now() } });
    return;
  }

  switch(cq.data){
    case 'profile':     return sendProfile(chatId);
    case 'frames':      return sendFrames(chatId);
    case 'invite':      return sendInvite(chatId);
    case 'rooms':       return sendRooms(chatId);
    case 'premium':     return sendPremium(chatId);
    case 'btc_info':    return sendBtcInfo(chatId);
    case 'help':        return sendHelp(chatId);
    case 'create_room': return sendCreateRoom(chatId);
    case 'join_room':   return sendJoinRoom(chatId);
    case 'video':       return sendVideoInfo(chatId);
    case 'site':        return sendSiteLink(chatId);
    case 'reset_help':
      return bot.sendMessage(chatId,
`🔓 *Come resettare la password*

Usa il comando:
\`/reset USERNAME\`
oppure
\`/reset email@example.com\`

Esempio: \`/reset bob_kouverte\`

Riceverai un codice OTP di 6 cifre valido 10 minuti.

Poi vai sul sito www.kouverte.com → Password dimenticata → Recupera via Telegram OTP.`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🌐 Apri sito', url: SITE_URL }]] }
      }).catch(()=>{});
  }
});

// ============================================================
// Reply-keyboard handler (matcha i pulsanti del menu)
// ============================================================
bot.on('message', msg => {
  if(!msg.text || msg.text.startsWith('/') || msg.successful_payment) return;
  const chatId = msg.chat.id;
  const t = msg.text.trim();

  // Rilevamento codice stanza (6 caratteri maiuscoli/numeri)
  if (/^[A-Z0-9]{6}$/.test(t)) {
    return bot.sendMessage(chatId,
`🔍 *Codice rilevato:* \`${t}\`

Vuoi entrare nella stanza con questo codice?`, {
      parse_mode:'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text:`🔑 Entra in ${t}`, web_app:{ url: fresh('#code=' + t) } }],
          [{ text:'❌ Annulla', callback_data:'help' }]
        ]
      }
    }).catch(()=>{});
  }

  const actions = {
    '🚀 Entra nella Chat':     () => bot.sendMessage(chatId, '🚀 Apri KOUVERTE', { reply_markup:{ inline_keyboard:[[{ text:'▶ Apri', web_app:{ url:fresh() } }]] } }).catch(()=>{}),
    '📹 Video Chat':           () => sendVideoInfo(chatId),
    '🔐 Crea Stanza':          () => sendCreateRoom(chatId),
    '🔑 Entra con Codice':     () => sendJoinRoom(chatId),
    '🎭 Profilo':              () => sendProfile(chatId),
    '🖼️ Cornici':              () => sendFrames(chatId),
    '🔗 Invita & guadagna':    () => sendInvite(chatId),
    '⭐ Premium':              () => sendPremium(chatId),
    '🌐 Sito':                 () => sendSiteLink(chatId),
    '❓ Aiuto':                () => sendHelp(chatId),
  };
  if(actions[t]) return actions[t]();

  // Fallback naturali
  if(/ciao|salve|hey|hi/i.test(t)) return bot.sendMessage(chatId, `🎭 Ciao! Usa /menu per i comandi.`).catch(()=>{});
  if(/grazie/i.test(t))            return bot.sendMessage(chatId, '🤍 Sempre un piacere.').catch(()=>{});
  if(/cornic/i.test(t))            return sendFrames(chatId);
  if(/invit|amic/i.test(t))        return sendInvite(chatId);
  if(/premium|abbon/i.test(t))     return sendPremium(chatId);
  if(/stanz|room/i.test(t))        return sendRooms(chatId);
  if(/profil/i.test(t))            return sendProfile(chatId);
  if(/aiuto|help/i.test(t))        return sendHelp(chatId);
  if(/video|cam|webcam/i.test(t))  return sendVideoInfo(chatId);
  if(/crea/i.test(t))              return sendCreateRoom(chatId);
  if(/entra|codice/i.test(t))      return sendJoinRoom(chatId);
  if(/sito|web|link/i.test(t))     return sendSiteLink(chatId);

  bot.sendMessage(chatId, '🤔 Non ho capito. Usa /menu per i comandi.\n\n💡 *Suggerimento:* Se hai un codice stanza, scrivilo direttamente!', { parse_mode:'Markdown' }).catch(()=>{});
});

// ============================================================
// Referral: notifica + assegnazione cornice
// ============================================================
async function notifyReferralEarned(inviterId, newUserName){
  const inviter = getUser(inviterId);
  const c = inviter.invitedUsers.length;

  const justUnlocked = REFERRAL_REWARDS.find(r => r.invites === c);
  let rewardMsg = '';
  if(justUnlocked){
    if(!inviter.ownedFrames.includes(justUnlocked.frame)){
      inviter.ownedFrames.push(justUnlocked.frame);
      const f = frameById(justUnlocked.frame);
      rewardMsg = `\n\n🎉 *PREMIO SBLOCCATO!*\nHai vinto la cornice ${f.emoji} *${f.name}*!`;
    }
  }
  saveDB();

  const next = nextReward(inviter);
  const nextMsg = next
    ? `\n🎯 Prossima cornice: *${next.label}* tra ${next.invites - c} inviti.`
    : '\n🏆 Hai sbloccato tutte le cornici!';

  try {
    await bot.sendMessage(inviterId,
`🎊 *${newUserName}* si è iscritto col tuo link!

👥 Amici invitati: *${c}*${rewardMsg}${nextMsg}`, {
      parse_mode:'Markdown',
      reply_markup: { inline_keyboard: [[{ text:'🎭 Apri profilo', web_app:{ url: fresh('#profile') } }]] }
    });
  } catch(e){ console.error('Notify referral:', e.message); }
}

// ============================================================
// ERROR HANDLING
// ============================================================
bot.on('polling_error', e => console.error('Polling error:', e.message));
bot.on('error',         e => console.error('Bot error:', e.message));

process.on('SIGINT', () => { saveDB(); console.log('\n💾 DB salvato.'); process.exit(0); });

module.exports = { ok:true, bot };
