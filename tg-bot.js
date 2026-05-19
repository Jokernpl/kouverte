// ============================================================
// KOUVERTE · TELEGRAM BOT
// Chat Mondiale Anonima — pagamenti in Telegram Stars
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const fs   = require('fs');
const path = require('path');

// ⚠️ TEMP: token hardcoded. Da rimuovere quando BOT_TOKEN sarà su Render env.
const BOT_TOKEN    = process.env.BOT_TOKEN || '8782933185:AAF1NkjD1HQzwwBRCFBjK2ez0sjHyn5RujU';
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
// ============================================================
const DB_PATH = path.join(__dirname, 'kouverte-bot.json');
let DB = { users:{} };
function loadDB(){ try{ if(fs.existsSync(DB_PATH)){ DB = JSON.parse(fs.readFileSync(DB_PATH,'utf8')); DB.users = DB.users||{}; } }catch(e){ console.error('DB load:', e.message); } }
function saveDB(){ try{ fs.writeFileSync(DB_PATH, JSON.stringify(DB,null,2)); }catch(e){ console.error('DB save:', e.message); } }
loadDB();

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
🎁 *100 messaggi gratuiti* poi 1€/mese
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
        { text:'⭐ Premium 1€/mese',   callback_data:'premium' }
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
    const price = f.stars === 0 ? (f.prem ? '_Premium_' : 'Gratis') : `${f.stars}★`;
    return `${f.emoji}  *${f.name}*  — ${has ? '✅ Tua' : price}`;
  }).join('\n');

  const next = nextReward(u);
  const reward = next
    ? `\n\n🎁 *Prossima cornice regalo:* ${next.label} con *${next.invites - u.invitedUsers.length}* inviti.`
    : '\n\n🏆 Hai sbloccato tutte le cornici premio!';

  bot.sendMessage(chatId,
`💎 *Catalogo Cornici*

${lines}${reward}

_Acquista con Telegram Stars dall'app, oppure invita amici per riceverle in regalo._`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'🛒 Apri cornici in app', web_app:{ url: fresh('#profile') } }],
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

Tutte anonime. 100 messaggi gratuiti, poi Premium.`, {
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

*Solo 1€/mese = 100★ Telegram Stars*

✅ *Messaggi illimitati* (no limite 100)
✅ *Cornici premium* sbloccate: Gold 🥇 · Fiamma 🔥 · Diamond 💎
✅ *Nome brillante* in chat — gli altri vedono che sei Premium
✅ Cancellabile in qualsiasi momento

_Paghi con Telegram Stars, nessun rinnovo automatico._`, {
    parse_mode:'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text:'⭐ Abbonati — 100★ (1€)', callback_data:'buy_premium' }],
        [{ text:'🎭 Apri app', web_app:{ url: fresh('#profile') } }]
      ]
    }
  }).catch(()=>{});
}
bot.onText(/^\/premium$/i, m => sendPremium(m.chat.id));

// ============================================================
// Invoice Telegram Stars · Premium
// ============================================================
async function sendPremiumInvoice(chatId){
  try {
    await bot.sendInvoice(
      chatId,
      'KOUVERTE Premium',                                // title
      '1 mese di messaggi illimitati + cornici premium', // description
      JSON.stringify({ type:'premium', chatId }),        // payload
      '',                                                 // provider_token (vuoto per Stars)
      'XTR',                                              // currency = Telegram Stars
      [{ label: 'Premium 1 mese', amount: 100 }]          // 100 stars
    );
  } catch(e){
    console.error('Premium invoice err:', e.message);
    bot.sendMessage(chatId, '⚠️ Errore creazione pagamento. Riprova.');
  }
}

// ============================================================
// Pre-checkout → approva
// ============================================================
bot.on('pre_checkout_query', q => {
  bot.answerPreCheckoutQuery(q.id, true).catch(e=>console.error('pre_checkout:',e.message));
});

// ============================================================
// Pagamento riuscito (Premium + Cornici)
// ============================================================
bot.on('message', async (msg) => {
  if(!msg.successful_payment) return;
  const chatId = msg.chat.id;
  const sp = msg.successful_payment;
  let payload = {};
  try { payload = JSON.parse(sp.invoice_payload); } catch { return; }

  const user = getUser(chatId);

  if(payload.type === 'premium'){
    user.isPremium = true;
    user.premiumExpiry = Date.now() + 30*24*60*60*1000;
    ['gold','flame','diamond'].forEach(f => { if(!user.ownedFrames.includes(f)) user.ownedFrames.push(f); });
    saveDB();
    bot.sendMessage(chatId,
`🎉 *Sei ora KOUVERTE Premium!*

✅ Messaggi illimitati per 30 giorni
✅ Cornici Gold 🥇 · Fiamma 🔥 · Diamond 💎 sbloccate
✅ Nome brillante in chat`, {
      parse_mode:'Markdown',
      reply_markup: { inline_keyboard: [[{ text:'🚀 Vai alla chat', web_app:{ url: fresh() } }]] }
    }).catch(()=>{});
  }
  else if(payload.type === 'frame' && payload.frameId){
    const f = frameById(payload.frameId);
    if(f && !user.ownedFrames.includes(f.id)) user.ownedFrames.push(f.id);
    saveDB();
    bot.sendMessage(chatId,
`${f?.emoji||'🖼️'} *Cornice ${f?.name||payload.frameId} sbloccata!*

Apri il profilo per attivarla.`, {
      parse_mode:'Markdown',
      reply_markup: { inline_keyboard: [[{ text:'🎭 Profilo', web_app:{ url: fresh('#profile') } }]] }
    }).catch(()=>{});
  }
});

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
⭐ /premium — Abbonamento 1€/mese
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
    case 'profile':     return sendProfile(chatId);
    case 'frames':      return sendFrames(chatId);
    case 'invite':      return sendInvite(chatId);
    case 'rooms':       return sendRooms(chatId);
    case 'premium':     return sendPremium(chatId);
    case 'help':        return sendHelp(chatId);
    case 'buy_premium': return sendPremiumInvoice(chatId);
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
