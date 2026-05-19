// ============================================================
// KOUVERTE · TELEGRAM BOT
// Chat Mondiale Anonima — pagamenti in Telegram Stars
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const fs   = require('fs');
const path = require('path');

const BOT_TOKEN    = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
const WEBAPP_URL   = process.env.WEBAPP_URL   || 'https://kouverte-voice.onrender.com/app.html';
const BOT_USERNAME = process.env.BOT_USERNAME || 'Kouverte_bot';

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

// Stanze allineate con ROOMS in app.html
const APP_ROOMS = [
  { cat:'🇮🇹 Italia',        rooms:['Italia generale','Nord','Centro','Sud','Sicilia & Sardegna'] },
  { cat:'🇪🇺 Europa',         rooms:['Europa generale','Est Europa','Ovest Europa'] },
  { cat:'🌍 Mondo',           rooms:['Chat Mondiale','Americhe','Asia & Oceania','Africa & M.Oriente'] },
  { cat:'💬 Mood',            rooms:['Late Night','Random','Gaming','Musica','Divertimento','Amicizia'] }
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

  const caption =
`🎭 *KOUVERTE* — Chat Mondiale Anonima

Benvenuto, *${firstName}*!

🇮🇹 Stanze Italia · Nord, Centro, Sud, Sicilia
🌍 Europa · Americhe · Asia · Africa
💬 Mood · Gaming, Musica, Notte Fonda...

🔒 *100% Anonimo* — solo una maschera emoji
🎁 *100 messaggi gratuiti* poi 5€/mese in BTC
🏆 Badge & cornici da sbloccare

*Chatta. Conosci. Condividi. Senza essere chi sei.*

Tocca il bottone qui sotto 👇`;

  const keyboard = {
    inline_keyboard: [
      [{ text:'🚀 Entra in KOUVERTE', web_app:{ url: fresh() } }],
      [
        { text:'🎭 Profilo', callback_data:'profile' },
        { text:'🖼️ Cornici', callback_data:'frames' }
      ],
      [
        { text:'🔗 Invita & guadagna', callback_data:'invite' },
        { text:'⭐ Premium 5€/mese',   callback_data:'premium' }
      ]
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
        [{ text:'🚀 Entra nella Chat' }, { text:'🎭 Profilo' }],
        [{ text:'🖼️ Cornici' },          { text:'🔗 Invita & guadagna' }],
        [{ text:'⭐ Premium' },           { text:'❓ Aiuto' }]
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

Tutte anonime. 100 messaggi gratuiti, poi Premium 5€/mese in BTC.`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🚀 Apri le stanze', web_app:{ url: fresh() } }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/stanze$/i, m => sendRooms(m.chat.id));

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
// /aiuto
// ============================================================
function sendHelp(chatId){
  bot.sendMessage(chatId,
`❓ *Comandi KOUVERTE*

🚀 /start — Benvenuto
⌨️ /menu — Menu rapido
🎭 /profilo — Il tuo profilo
💬 /stanze — Lista delle stanze
🖼️ /cornici — Catalogo cornici
🔗 /invita — Link referral
⭐ /premium — Abbonamento 5€/mese (BTC)
₿ /bitcoin — Info pagamento BTC
❓ /aiuto — Questa lista

_KOUVERTE è 100% anonima. Nessun nome reale, nessuna foto._`, {
    parse_mode:'Markdown',
    reply_markup: { inline_keyboard: [[{ text:'🚀 Apri KOUVERTE', web_app:{ url: fresh() } }]] }
  }).catch(()=>{});
}
bot.onText(/^\/(aiuto|help)$/i, m => sendHelp(m.chat.id));

// ============================================================
// CALLBACK QUERIES (inline buttons)
// ============================================================
bot.on('callback_query', cq => {
  const chatId = cq.message.chat.id;
  bot.answerCallbackQuery(cq.id).catch(()=>{});
  switch(cq.data){
    case 'profile':  return sendProfile(chatId);
    case 'frames':   return sendFrames(chatId);
    case 'invite':   return sendInvite(chatId);
    case 'rooms':    return sendRooms(chatId);
    case 'premium':  return sendPremium(chatId);
    case 'btc_info': return sendBtcInfo(chatId);
    case 'help':     return sendHelp(chatId);
  }
});

// ============================================================
// Reply-keyboard handler (matcha i pulsanti del menu)
// ============================================================
bot.on('message', msg => {
  if(!msg.text || msg.text.startsWith('/') || msg.successful_payment) return;
  const chatId = msg.chat.id;
  const t = msg.text.trim();

  const actions = {
    '🚀 Entra nella Chat':     () => bot.sendMessage(chatId, '🚀 Apri KOUVERTE', { reply_markup:{ inline_keyboard:[[{ text:'▶ Apri', web_app:{ url:fresh() } }]] } }).catch(()=>{}),
    '🎭 Profilo':              () => sendProfile(chatId),
    '🖼️ Cornici':              () => sendFrames(chatId),
    '🔗 Invita & guadagna':    () => sendInvite(chatId),
    '⭐ Premium':              () => sendPremium(chatId),
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

  bot.sendMessage(chatId, '🤔 Non ho capito. Usa /menu.').catch(()=>{});
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
