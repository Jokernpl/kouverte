
// ══ FRAME STYLES - DECLARED FIRST FOR EARLY ACCESS ══
window.FRAME_STYLES = [
  { id: 'none', name: 'Nessuna', emoji: '✨', color: '#64748b' },
  { id: 'silver', name: 'Silver', emoji: '⭐', color: '#94a3b8' },
  { id: 'purple', name: 'Purple', emoji: '💜', color: '#00d4ff' },
  { id: 'gold', name: 'Gold', emoji: '✨', color: '#fbbf24' },
  { id: 'flame', name: 'Flame', emoji: '🔥', color: '#f97316' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', color: '#38bdf8' },
  { id: 'neon', name: 'Neon', emoji: '⚡', color: '#00ffff' },
  { id: 'emerald', name: 'Emerald', emoji: '💚', color: '#10b981' },
  { id: 'ruby', name: 'Ruby', emoji: '❤️', color: '#ef4444' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', color: '#ff00ff' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🪐', color: '#8b5cf6' },
  { id: 'royal', name: 'Royal', emoji: '👑', color: '#fbbf24' },
  { id: 'skull', name: 'Skull', emoji: '💀', color: '#9ca3af' }
];

// ══ CONFIG ══
const FREE_LIMIT = 100;

const NEON = [
  '#e879f9','#38bdf8','#4ade80','#fb923c',
  '#facc15','#f472b6','#a78bfa','#34d399',
  '#60a5fa','#f87171','#2dd4bf','#ff6b9d'
];

// Avatar faccine stile screenshot
const FACE_EMOJIS = [
  // Animali
  '🦊','🐺','🦁','🐯','🐱','🐶','🐼','🐨','🐸','🐙','🦅','🦋','🐲','🦂','🦄','🐉','🐅','🐊','🦈','🦚','🦜','🐝','🐞','🦓',
  // Fantasy / Misteriosi
  '😈','👻','💀','👹','👺','🤖','👾','👽','🧙','🧛','🧚','🧜','🧝',
  // Espressioni
  '😎','🤩','🥷','🎭','🦹','🦸','🤡','👑','💎'
];

// ── Generatore nickname procedurali stile "Ghost", "NightTalker", "ShadowFox" ──
const NICK_PREFIX = ['Ghost','Night','Shadow','Neon','Phantom','Cyber','Velvet','Dark','Silent','Wild','Mystic','Echo','Lone','Crimson','Frost','Midnight','Stellar','Lunar','Ember','Onyx'];
const NICK_SUFFIX = ['Talker','Walker','Whisper','Fox','Wolf','Spirit','Vibe','Soul','Storm','Heart','Sky','Wave','Flame','Star','Shade','Hunter','Drift','Reaper','Sage','Moon'];
function genNick(seed){
  let h=0; for(const c of String(seed)) h=(h*31+c.charCodeAt(0))&0xffffff;
  const a=NICK_PREFIX[h%NICK_PREFIX.length];
  const b=NICK_SUFFIX[(h>>5)%NICK_SUFFIX.length];
  return a+b;
}

// Livelli stile gaming: 0-10 XP base poi log scale
function userLevel(msgCount){
  const mc=msgCount||0;
  return Math.max(1, Math.floor(1 + Math.log2(mc+1) * 2.2));
}
function levelLabel(lvl, isPremium){
  if(isPremium && lvl>=10) return '👑 Anon VIP';
  if(lvl>=15) return '🌟 Legendary';
  if(lvl>=10) return '💎 Veteran';
  if(lvl>=5)  return '🔥 Active';
  return '🌱 Rookie';
}

// Stanze attive — partiamo piccoli, poi espandiamo
const ROOMS = [
  { id:'mondo',         name:'Mondo',     emoji:'🌍', img:'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop', desc:'Chat globale, tutte le lingue',         tier:'public',     color:'#a78bfa', dot1:'#a78bfa',dot2:'#ff6b9d',dot3:'#e879f9' },
  { id:'italia',        name:'Italia',   emoji:'🇮🇹', img:'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&h=400&fit=crop', desc:'Chat generale per tutti gli italiani',  tier:'public',     color:'#10b981', dot1:'#10b981',dot2:'#34d399',dot3:'#6ee7b7' },
  { id:'roma',          name:'Roma',        emoji:'🏛️', img:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop', desc:'Capitale eterna, chat capitolina',      tier:'public',     color:'#f59e0b', dot1:'#f59e0b',dot2:'#fbbf24',dot3:'#fcd34d' },
  { id:'milano',        name:'Milano',      emoji:'🏙️', img:'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600&h=400&fit=crop', desc:'Il cuore pulsante del Nord',            tier:'public',     color:'#60a5fa', dot1:'#60a5fa',dot2:'#38bdf8',dot3:'#7dd3fc' },
  { id:'napoli',        name:'Napoli',      emoji:'⚓', img:'https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop', desc:'O sole mio, la città del sud',          tier:'public',     color:'#06b6d4', dot1:'#06b6d4',dot2:'#22d3ee',dot3:'#67e8f9' },
  { id:'palermo',       name:'Palermo',     emoji:'☀️', img:'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop', desc:'Cuore caldo della Sicilia',             tier:'public',     color:'#f97316', dot1:'#f97316',dot2:'#fb923c',dot3:'#fbbf24' },
  { id:'sicilia',       name:'Sicilia',     emoji:'🏝️', img:'https://images.unsplash.com/photo-1523365154888-8a758819b722?w=600&h=400&fit=crop', desc:'Trinacria, mare e tradizione',           tier:'public',     color:'#eab308', dot1:'#eab308',dot2:'#facc15',dot3:'#fde047' },
  { id:'campania',      name:'Campania',    emoji:'🌋', img:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&h=400&fit=crop', desc:'Napoli, Salerno, costiere e dintorni',  tier:'public',     color:'#ef4444', dot1:'#ef4444',dot2:'#f87171',dot3:'#fca5a5' },
  { id:'confessionale', name:'Confessionale', emoji:'🕯️', img:'https://images.unsplash.com/photo-1490127252417-7c393f993ee4?w=600&h=400&fit=crop', desc:'1 messaggio anonimo al giorno. Nessuno saprà chi sei.', tier:'confession', color:'#8b5cf6', dot1:'#8b5cf6',dot2:'#a78bfa',dot3:'#c4b5fd' },
  { id:'flirt',         name:'Flirt 🔞',    emoji:'🌹', img:'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&h=400&fit=crop', desc:'Chat piccante adulti. Solo 18+. Anonima, calda, senza filtri.', tier:'adult', color:'#ff2d6e', dot1:'#ff2d6e',dot2:'#ff6b9d',dot3:'#ff2d6e' },
  { id:'notte',         name:'Kouverte Notte', emoji:'🌙', img:'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&h=400&fit=crop', desc:'Evento serale alle 23:00. Una domanda, tutti rispondono.', tier:'notte', color:'#6366f1', dot1:'#6366f1',dot2:'#818cf8',dot3:'#a5b4fc' },
  { id:'scopa',         name:'Scopa', emoji:'♠', img:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop', desc:'Sfida 1vs1 a carte napoletane. 2 giocatori per tavolo — gli altri in attesa.', tier:'scopa', color:'#00ff88', dot1:'#00ff88',dot2:'#00cc66',dot3:'#00ffaa' },
];

function isRoomActiveNow(){ return true; }

const FRAMES_CFG = [
  { id:'none',    name:'Nessuna',  emoji:'🎭', price:0,   prem:false, css:'' },
  { id:'silver',  name:'Silver',   emoji:'🥈', price:0,   prem:false, css:'border:2px solid #94a3b8;box-shadow:0 0 8px #94a3b8' },
  { id:'purple',  name:'Viola',    emoji:'💜', price:0,   prem:false, css:'border:2px solid #00d4ff;box-shadow:0 0 10px #00d4ff' },
  { id:'emerald', name:'Smeraldo', emoji:'💚', price:15,  prem:false, css:'border:2px solid #10b981;box-shadow:0 0 10px #10b981' },
  { id:'ruby',    name:'Rubino',   emoji:'❤️', price:18,  prem:false, css:'border:2px solid #ef4444;box-shadow:0 0 10px #ef4444' },
  { id:'gold',    name:'Gold',     emoji:'🥇', price:30,  prem:true,  css:'border:2px solid #fbbf24;box-shadow:0 0 12px #fbbf24' },
  { id:'flame',   name:'Fiamma',   emoji:'🔥', price:40,  prem:true,  css:'border:2px solid #f97316;box-shadow:0 0 12px #f97316' },
  { id:'diamond', name:'Diamond',  emoji:'💎', price:50,  prem:true,  css:'border:2px solid #38bdf8;box-shadow:0 0 14px #38bdf8' },
  { id:'neon',    name:'Neon Cyber',emoji:'🌟',price:60,  prem:true,  css:'border:2px solid #00ffff;box-shadow:0 0 14px #00ffff' },
  { id:'galaxy',  name:'Galassia', emoji:'🌌', price:80,  prem:true,  css:'border:2px solid #8b5cf6;box-shadow:0 0 16px #8b5cf6' },
  { id:'rainbow', name:'Arcobaleno',emoji:'🌈',price:100, prem:true,  css:'border:2px solid transparent;background:linear-gradient(45deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f) border-box' },
  { id:'royal',   name:'Reale',    emoji:'👑', price:120, prem:true,  css:'border:3px double #fbbf24;box-shadow:0 0 16px #fbbf24' },
  { id:'skull',   name:'Teschio',  emoji:'💀', price:35,  prem:false, css:'border:2px solid #1f2937;box-shadow:0 0 8px rgba(239,68,68,0.5)' },
];

const BADGES = [
  { id:'welcome',    emoji:'🎁', name:'Pacchetto Benvenuto', desc:'Primo accesso' },
  { id:'first_msg',  emoji:'💬', name:'Prima Parola',     desc:'Invia il primo messaggio' },
  { id:'chatter',    emoji:'🔥', name:'Chiacchierone',     desc:'Invia 50 messaggi' },
  { id:'master',     emoji:'💎', name:'Maestro Chat',      desc:'Invia 500 messaggi' },
  { id:'godlike',    emoji:'🌟', name:'Leggenda Vivente',  desc:'Invia 5000 messaggi' },
  { id:'globe',      emoji:'🌍', name:'Cittadino Mondo',   desc:'Entra nella stanza Mondo' },
  { id:'explorer',   emoji:'🗺️', name:'Esploratore',       desc:'Visita 3+ stanze diverse' },
  { id:'globetrotter', emoji:'✈️', name:'Globetrotter',    desc:'Visita 10+ stanze' },
  { id:'nocturnal',  emoji:'🌙', name:'Nottambulo',        desc:'Chatta dopo le 2 di notte' },
  { id:'morning',    emoji:'☀️', name:'Mattiniero',        desc:'Chatta prima delle 7' },
  { id:'streak3',    emoji:'🔥', name:'Streak 3 giorni',   desc:'Accedi 3 giorni di fila' },
  { id:'streak7',    emoji:'🔥', name:'Streak Settimana',  desc:'Accedi 7 giorni di fila' },
  { id:'streak30',   emoji:'💯', name:'Streak Mese',       desc:'Accedi 30 giorni di fila' },
  { id:'legend',     emoji:'👑', name:'Leggenda',          desc:'Raggiungi livello 50' },
  { id:'premium',    emoji:'⭐', name:'Premium',           desc:'Diventa Premium' },
  { id:'italy',      emoji:'🇮🇹', name:'Made in Italy',    desc:'Entra in stanza Italia' },
  { id:'friendly',   emoji:'❤️', name:'Amichevole',       desc:'Aggiungi 5 amici' },
  { id:'social',     emoji:'🤝', name:'Social',            desc:'Aggiungi 20 amici' },
  { id:'host',       emoji:'🎉', name:'Host',              desc:'Crea una stanza privata' },
  { id:'creator',    emoji:'🎨', name:'Creatore',          desc:'Crea 5 stanze private' },
  { id:'video_star', emoji:'📹', name:'Video Star',        desc:'Usa la webcam per la prima volta' },
  { id:'wheel_winner',emoji:'🎰',name:'Ruota Fortuna',     desc:'Vinci alla ruota della fortuna' },
  { id:'confessor',  emoji:'🕯️', name:'Confessore',       desc:'Usa il confessionale' },
  { id:'frame_collector',emoji:'🖼️',name:'Collezionista', desc:'Possiedi 5+ cornici' },
  { id:'badge_hunter',emoji:'🏆',name:'Cacciatore Badge', desc:'Sblocca 10+ badge' },
  { id:'verified',   emoji:'✅', name:'Verificato',        desc:'Account con login email' },
  { id:'og',         emoji:'🥇', name:'OG',                desc:'Membro dal lancio' },
];

// ══ STATE ══
var socket=null, user=null, room=null;
var tTimer=null, isTyping=false, typingUsers={};
var roomOnline={}, lastSender=null, activeCat='all';
var activeReply=null; // { msgId, userId, name, color, text } — messaggio a cui si sta rispondendo
var selFrameId=null;
const sessionRooms=new Set(); // conta solo questa sessione, non persiste
// Preview messaggi per ogni stanza (ultimi 3-4 per la card)
var roomPreviews={};
// WebRTC: track users in current room
var chatRoomUsers={};
// Message reactions: track emoji reactions per message
var msgReactions={}; // {msgId: [{emoji, userId}, ...]}

// ══ INIT ══
document.addEventListener('DOMContentLoaded',()=>{
  const tg=window.Telegram?.WebApp;
  if(tg){
    tg.ready();tg.expand();tg.setHeaderColor('#0f1117');tg.setBackgroundColor('#0f1117');
    // NON usare disableVerticalSwipes: su alcune versioni Android blocca lo scroll interno
  }
  // Haptic feedback helper (Telegram Mini App)
  window.haptic = (type='light') => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch(e){}
  };
  window.hapticOk = () => { try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success'); } catch(e){} };

  // ───── PWA: Service Worker DISATTIVATO ─────
  // SW rimosso perché causava problemi di cache (HTML/JS vecchi serviti dopo deploy).
  // sw.js attuale è un "killer" che disinstalla eventuali SW residui dei browser
  // che li avevano installati dalle versioni precedenti, poi NON si re-registra.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      // Trigger update sui SW esistenti (così scaricano il killer-sw e si suicidano)
      regs.forEach(r => { try { r.update(); } catch(e) {} });
    }).catch(()=>{});
  }
  // PWA install: rileva se non già installato e mostra banner
  let _installPrompt = null;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isTelegram = !!window.Telegram?.WebApp?.initDataUnsafe?.user || /Telegram/i.test(navigator.userAgent);
  // Mostra banner nella home: SEMPRE se non sei già nella PWA o in Telegram
  function maybeShowInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (!banner) return;
    if (isPWA || isTelegram) { banner.style.display = 'none'; return; }
    banner.style.display = 'flex';
  }
  setTimeout(maybeShowInstallBanner, 500);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _installPrompt = e;
    maybeShowInstallBanner();
  });

  // Click sul banner: prompt nativo se disponibile, altrimenti istruzioni manuali
  window.triggerInstall = async () => {
    if (_installPrompt) {
      _installPrompt.prompt();
      const { outcome } = await _installPrompt.userChoice;
      _installPrompt = null;
      if (outcome === 'accepted') document.getElementById('installBanner').style.display = 'none';
      return;
    }
    // Fallback: istruzioni manuali per browser senza beforeinstallprompt (iOS Safari, Firefox)
    const ua = navigator.userAgent;
    let msg = '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      msg = '📲 Per installare su iPhone:\n\n1. Apri questo sito in SAFARI\n2. Tocca l\'icona Condividi (↑) in basso\n3. Scorri e tocca "Aggiungi a Home"\n4. Conferma\n\n✅ Icona Kouverte sulla tua home!';
    } else if (/Android/i.test(ua)) {
      msg = '📲 Per installare su Android:\n\n1. Apri il menu di Chrome (i 3 puntini in alto a destra)\n2. Tocca "Installa app" oppure "Aggiungi a schermata Home"\n3. Conferma\n\n✅ Icona Kouverte sulla tua home!';
    } else {
      msg = '📲 Per installare l\'app:\n\nApri questo sito in Chrome o Edge.\nNella barra indirizzi, tocca l\'icona ⊕ (Installa).\n\n✅ Diventa un\'app desktop!';
    }
    alert(msg);
  };
  // Quando l'app viene installata: nascondi banner
  window.addEventListener('appinstalled', () => {
    const b = document.getElementById('installBanner');
    if (b) b.style.display = 'none';
    showToast('🎉 App installata!');
  });
  // Vecchio showInstallBanner rimosso — ora c'è il banner permanente nella home (.install-banner)
  // Tap leggero su tutti i bottoni principali
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.nbtn,.room-card,.code-room-btn,.btn-p,.csend,.chat-back,.cat-btn,.user-chip,.frame-c,.modal-btn,.wheel-btn,.coin-widget');
    if (t) window.haptic('light');
  }, true);
  // Pausa animazioni quando tab nascosto (risparmio batteria)
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('tab-hidden', document.hidden);
  });

  // ───── TOUCH SCROLL FALLBACK (Telegram WebApp Android fix) ─────
  // Se il browser non gestisce lo scroll touch nativamente, lo gestiamo noi via JS.
  // Funziona su qualsiasi WebView, anche bug-gato.
  function attachTouchScroll(el) {
    if (!el || el.__tsAttached) return;
    el.__tsAttached = true;
    let startY = 0, startScroll = 0, lastY = 0, lastT = 0, velocity = 0, raf = 0;
    el.addEventListener('touchstart', (e) => {
      if (raf) cancelAnimationFrame(raf);
      startY = e.touches[0].clientY;
      lastY = startY;
      lastT = performance.now();
      startScroll = el.scrollTop;
      velocity = 0;
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      const dy = startY - y;
      el.scrollTop = startScroll + dy;
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = (lastY - y) / dt;
      lastY = y;
      lastT = now;
    }, { passive: true });
    el.addEventListener('touchend', () => {
      // Inerzia
      const decay = 0.95;
      let v = velocity * 16;
      function step() {
        if (Math.abs(v) < 0.5) return;
        el.scrollTop += v;
        v *= decay;
        raf = requestAnimationFrame(step);
      }
      if (Math.abs(v) > 0.5) raf = requestAnimationFrame(step);
    }, { passive: true });
  }
  // Attiva su tutti i container scrollabili (anche futuri)
  setTimeout(() => {
    ['home','profile','chatMsgs'].forEach(id => attachTouchScroll(document.getElementById(id)));
  }, 100);
  initUser(); connectSocket(); loadSavedCodeRooms(); renderRooms(); renderFrames(); renderBadges(); setupInput(); autoJoinFromUrl(); initOnboardingStrip(); initOnboardingWizard(); initResumeBanner(); initBoost(); initVoiceRecordBtn(); initProfileTilt(); initBannerParticles();
  // Mondo vivo: particelle + feed live + stats
  initParticles();
  startLiveFeed();
  startLiveStats();
  // Hook chat modes (ephemeral, effetti, bot)
  setupChatModesHooks();
  // Auto-login: pre-marca "ricordato" se token presente per evitare Login Wall
  // Anche se la fetch al server tarda (cold start Render), l'utente vede dati locali
  const _hasStoredToken = !!getLS('kv4_auth_token');
  if (_hasStoredToken) {
    // Mostra "Ricollegamento..." invece di Login Wall
    window._authPromptShown = true; // blocca Login Wall
    isLoggedIn = true; // ottimismo (verra' validato da tryAutoLogin)
    // Auto-fill nome utente se ricordato
    const remembered = getLS('kv4_remember_user');
    if (remembered && (!user.username || user.name === user.id)) {
      user.username = remembered.includes('@') ? user.username : remembered;
      if (remembered && !remembered.includes('@')) user.name = remembered;
    }
  }
  tryAutoLogin().then(success => {
    if (success) {
      startAutoSync();
      startTokenAutoRefresh();
      updateProfileUI();
      console.log('[Auth] Login automatico OK');
    } else if (_hasStoredToken) {
      // Token c'era ma server l'ha rifiutato (es. utente perso su Render)
      console.warn('[Auth] Token rifiutato dal server - mostra prompt re-login');
      isLoggedIn = false;
      // Solo qui mostro Login Wall (delay extra)
      setTimeout(() => {
        if (!isLoggedIn) {
          window._authPromptShown = false;
          showLoginWall();
        }
      }, 1000);
    }
  }).catch(err => {
    // Errore di rete: tieni l'utente "loggato" localmente, riprova dopo
    console.error('[Auth] tryAutoLogin failed:', err);
    if (_hasStoredToken) {
      isLoggedIn = true; // fallback per non bloccare l'utente
      setTimeout(() => tryAutoLogin(), 30000); // retry tra 30 sec
    }
  });
  // Reset password URL
  if (window.location.hash.startsWith('#reset=')) {
    const token = window.location.hash.substring(7);
    setTimeout(() => promptResetPassword(token), 1500);
  }
  syncPremiumStatus();
  // Controlla ritorno da Stripe (stripe_ok / stripe_cancel query params)
  checkStripeReturn();
  // Inizializza feature nuove
  initCityLeaderboard();
  initKouverteNotte();
  // Setup button event listeners
  const continuaBtn = Array.from(document.querySelectorAll('.nbtn')).find(b => b.textContent.includes('Continua'));
  if(continuaBtn) continuaBtn.addEventListener('click', openContinua);
  setTimeout(hideSplash,1200);
});

function hideSplash(){
  const s=document.getElementById('splash');
  s.style.transition='opacity .5s'; s.style.opacity='0';
  setTimeout(()=>{
    s.classList.remove('active');
    showScreen('home');
    // LOGIN OBBLIGATORIO: se l'utente non e' loggato, mostra modal auth
    // ma diamo 1 secondo per tryAutoLogin di completare
    setTimeout(() => {
      if (!isLoggedIn && !window._authPromptShown) {
        window._authPromptShown = true;
        showLoginWall();
      }
    }, 1500);
  },500);
  
  // NEW: Initialize WebRTC (non-blocking, graceful degradation)
  setTimeout(()=>{
    initWebRTC().catch(err => {
      console.warn('[WebRTC] Inizializzazione non disponibile:', err);
    });
  }, 800);
}

// ══ USER ══
function initUser(){
  const tgU=window.Telegram?.WebApp?.initDataUnsafe?.user;
  const stored=getLS('kv4_user');
  let isNewUser=false;
  if(stored){
    user=stored;
    // Migrations
    if(tgU?.id && !user.tgId) user.tgId = String(tgU.id);
    if(typeof user.coins !== 'number') user.coins = 0;
    if(typeof user.streak !== 'number') user.streak = 0;
    if(typeof user.lastLogin !== 'number') user.lastLogin = 0;
    if(typeof user.lastSpin !== 'number') user.lastSpin = 0;
    if(!user.tempFrames) user.tempFrames = {}; // {frameId: expiresAt}
    if(typeof user.boostUntil !== 'number') user.boostUntil = 0;
    if(typeof user.confessUsedOn !== 'number') user.confessUsedOn = 0;
  }
  else{
    isNewUser=true;
    const tgIdStr = tgU?.id ? String(tgU.id) : null;
    const uid = tgIdStr ? 'tg_'+tgIdStr : 'anon_'+Math.random().toString(36).slice(2,9);
    const faces=FACE_EMOJIS;
    user={
      id:uid, tgId:tgIdStr,
      name:genNick(uid),
      face:faces[Math.floor(Math.random()*faces.length)],
      color:getColor(uid), msgCount:0, freeUsed:0,
      isPremium:false, premExpiry:0,
      roomsVisited:[], badges:[], ownedFrames:['none','silver','purple'], activeFrame:'none',
      joinedAt:Date.now(),
      // Sistema economia
      coins:0, streak:0, lastLogin:0, lastSpin:0,
      tempFrames:{}, boostUntil:0, confessUsedOn:0
    };
    setLS('kv4_user',user);
  }

  // Welcome pack: SOLO al PRIMO accesso reale. Mai duplicato.
  // Controllo flag persistente + ne segniamo la ricezione PERMANENTE
  if(isNewUser && !user.welcomePackReceived){
    user.welcomePackReceived = true;
    user.welcomePackAt = Date.now();
    user.coins = 50;
    user.tempFrames['gold'] = Date.now() + 7*24*60*60*1000;
    if(!user.ownedFrames.includes('gold')) user.ownedFrames.push('gold');
    addBadge('welcome','Pacchetto benvenuto');
    setTimeout(()=>showWelcomePack(),1700);
    // Salva subito su server se loggato (così non si perde se localStorage si pulisce)
    setTimeout(()=>{ if(typeof syncUserDataToServer === 'function' && isLoggedIn) syncUserDataToServer(); }, 500);
  } else if(isNewUser && user.welcomePackReceived){
    // Edge case: stored mancante ma welcomePackReceived = true (impossibile localmente)
    // Significa che il sync server ripristinera' i dati corretti tra poco
    console.log('[Welcome] Welcome pack gia ricevuto in passato, skip');
  } else {
    // Daily login: stessa giornata? no bonus
    checkDailyLogin();
  }

  saveUser();
  updateProfileUI();
  updateCoinBar();
  pruneTempFrames();
  setTimeout(()=>updateDailyBannerUI(),300);
}

// ── Cleanup cornici temporanee scadute ──
function pruneTempFrames(){
  const now=Date.now(); let changed=false;
  for(const fid in user.tempFrames||{}){
    if(user.tempFrames[fid]<now){
      delete user.tempFrames[fid];
      // Rimuove la cornice dalle owned (ma solo se è premium e non posseduta in modo permanente)
      // Per semplicità: la cornice resta in ownedFrames se posseduta tramite Premium reale; qui assumiamo che le temp sono già taggate
      changed=true;
    }
  }
  if(changed) saveUser();
}

// ── Daily Login + Streak (Enhanced) ──
// Ricompense progressive: Giorno 1→7, poi si ripete ogni 7
const DAILY_REWARDS = [
  { day:1, coins:20,  icon:'🪙', label:'+20 monete' },
  { day:2, coins:25,  icon:'🪙', label:'+25 monete' },
  { day:3, coins:35,  icon:'💫', label:'+35 monete' },
  { day:4, coins:50,  icon:'💰', label:'+50 monete' },
  { day:5, coins:75,  icon:'💎', label:'+75 monete' },
  { day:6, coins:100, icon:'🏅', label:'+100 monete' },
  { day:7, coins:200, icon:'🏆', label:'+200 monete' },
];

function getDailyRewardForStreak(streak){
  const idx = ((streak-1) % 7);
  return DAILY_REWARDS[idx];
}

function checkDailyLogin(){
  const now=Date.now();
  const today=new Date(); today.setHours(0,0,0,0);
  const todayMs=today.getTime();
  const lastDay=new Date(user.lastLogin||0); lastDay.setHours(0,0,0,0);
  const lastMs=lastDay.getTime();

  // Aggiorna streak (ma non raccogliere ancora)
  if(lastMs!==todayMs){
    const yesterday=todayMs-86400000;
    if(lastMs===yesterday) user.streak=(user.streak||0)+1;
    else user.streak=1;
    // Segna che oggi c'è un bonus da raccogliere (ma non incrementare lastLogin ancora)
    user.dailyPending=true;
    saveUser();
  }
  // Aggiorna banner UI
  updateDailyBannerUI();
}

function updateDailyBannerUI(){
  const banner=document.getElementById('dailyStreakBanner');
  const streakEl=document.getElementById('dailyStreakCount');
  const streakNumEl=document.getElementById('dailyStreakNum');
  const claimBtn=document.getElementById('dailyClaimBtn');
  const sub=document.getElementById('dailyBannerSub');
  if(!banner) return;

  const s=user.streak||0;
  if(s>0){
    streakEl.style.display='flex';
    streakEl.style.flexDirection='column';
    streakEl.style.alignItems='center';
    streakNumEl.textContent=s;
  }

  if(user.dailyPending){
    const r=getDailyRewardForStreak(s||1);
    claimBtn.textContent='Ritira '+r.icon;
    claimBtn.classList.remove('claimed');
    sub.textContent=`Streak ${s}gg → ${r.label}`;
  } else {
    claimBtn.textContent='✓ Ritirato';
    claimBtn.classList.add('claimed');
    sub.textContent=s>0?`Streak attiva: ${s} giorni 🔥`:'Torna domani!';
  }
}

function openDailyRewardModal(){
  buildDailyGrid();
  const modal=document.getElementById('modalDailyReward');
  if(modal) modal.style.display='flex';

  const sub=document.getElementById('dailyModalSub');
  const claimBtn=document.getElementById('dailyClaimModalBtn');
  const preview=document.getElementById('dailyRewardPreview');
  const s=user.streak||1;

  if(user.dailyPending){
    const r=getDailyRewardForStreak(s);
    sub.textContent=`Streak ${s} giorni! Ritira la tua ricompensa.`;
    document.getElementById('dailyRewardAmt').textContent=`${r.icon} ${r.label}`;
    preview.style.display='block';
    claimBtn.disabled=false;
    claimBtn.textContent='✨ Ritira Bonus';
  } else {
    sub.textContent='Hai già ritirato il bonus oggi. Torna domani!';
    preview.style.display='none';
    claimBtn.disabled=true;
    claimBtn.textContent='✓ Già ritirato oggi';
  }
}

function buildDailyGrid(){
  const grid=document.getElementById('dailyDaysGrid');
  if(!grid) return;
  grid.innerHTML='';
  const s=user.streak||0;
  const cycleDay=((s-1)%7)+1; // posizione nel ciclo 1-7

  DAILY_REWARDS.forEach((r,i)=>{
    const dayNum=i+1;
    const cell=document.createElement('div');
    cell.className='day-cell';

    let state='future';
    if(user.dailyPending){
      if(dayNum<cycleDay) state='past';
      else if(dayNum===cycleDay) state='today';
    } else {
      if(dayNum<cycleDay) state='past';
      else if(dayNum===cycleDay) state='today-claimed';
    }

    if(state==='past') cell.classList.add('past');
    else if(state==='today') cell.classList.add('today');
    else if(state==='today-claimed') cell.classList.add('today-claimed');

    cell.innerHTML=`<div class="day-cell-day">G${dayNum}</div><div class="day-cell-icon">${state==='past'?'✅':r.icon}</div><div class="day-cell-reward">${r.day===7?'x10':'+'+(r.coins)}</div>`;
    grid.appendChild(cell);
  });
}

function claimDailyReward(){
  if(!user.dailyPending) return;
  const s=user.streak||1;
  const r=getDailyRewardForStreak(s);

  user.lastLogin=Date.now();
  user.dailyPending=false;
  user.coins=(user.coins||0)+r.coins;

  // Badge streak
  if(s===3) addBadge('streak3','3 giorni di fila');
  if(s===7) addBadge('streak7','Settimana completa');
  if(s===30) addBadge('streak30','Un mese di fila!');

  saveUser();
  updateCoinBar();
  updateDailyBannerUI();

  // Anima il pulsante
  const btn=document.getElementById('dailyClaimModalBtn');
  if(btn){ btn.disabled=true; btn.textContent='🎉 Ritirato!'; }

  // Aggiorna il preview con animazione
  const amtEl=document.getElementById('dailyRewardAmt');
  if(amtEl){ amtEl.style.animation='none'; void amtEl.offsetWidth; amtEl.textContent=`+${r.coins} 🪙`; amtEl.style.animation='popIn .4s cubic-bezier(.36,.07,.19,.97) both'; }

  // Refresh griglia
  setTimeout(()=>buildDailyGrid(),300);
  setTimeout(()=>closeDailyRewardModal(),1800);
  showToast(`🎉 +${r.coins} 🪙 · Streak ${s} giorni!`);
}

function closeDailyRewardModal(){
  const modal=document.getElementById('modalDailyReward');
  if(modal) modal.style.display='none';
}

// ── Welcome pack modal (solo primo accesso) ──
function showWelcomePack(){
  showToast('🎁 BENVENUTO! +50 🪙 + cornice Gold per 7 giorni!');
}

// ═══════════════════════════════════════════
// SWIPE MATCHING ENGINE
// ═══════════════════════════════════════════

// Pool di utenti demo (si mescolano con utenti online reali se presenti)
const DEMO_SWIPE_USERS = [
  { id:'s1', name:'Azzurra', face:'😊', color:'#00d4ff', badges:['Roma','Premium'], streak:5 },
  { id:'s2', name:'Marco_89', face:'😎', color:'#f97316', badges:['Milano'], streak:12 },
  { id:'s3', name:'Luna', face:'🌸', color:'#ff6b9d', badges:['Napoli','Streak🔥'], streak:3 },
  { id:'s4', name:'Davide', face:'🤙', color:'#10b981', badges:['Sicilia'], streak:1 },
  { id:'s5', name:'Sofia_V', face:'✨', color:'#a78bfa', badges:['Palermo','Gold'], streak:21 },
  { id:'s6', name:'Luca', face:'😄', color:'#fbbf24', badges:['Campania'], streak:7 },
  { id:'s7', name:'Chiara', face:'🦋', color:'#06b6d4', badges:['Confessionale'], streak:0 },
  { id:'s8', name:'Alessandro', face:'🎯', color:'#ef4444', badges:['Mondo'], streak:30 },
];

let swipeQueue = [];
let swipeLiked = new Set();
let swipeCurrentCard = null;
let swipeDragState = null;
let swipeMatchUser = null;
let swipeCityFilter = 'all'; // city filter

function setSwipeFilter(city, btn) {
  swipeCityFilter = city;
  document.querySelectorAll('.swipe-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderSwipeStage();
  window.trackEvent?.('swipe_filter', { city });
}

function openSwipeScreen(){
  closeContinua && closeContinua();
  // Build queue mixing demo + online users (deduped)
  swipeQueue = [...DEMO_SWIPE_USERS].sort(()=>Math.random()-.5);
  // Aggiungi utenti online reali dalle stanze (se disponibili)
  if(window.roomUsers && Array.isArray(window.roomUsers)){
    window.roomUsers.forEach(u => {
      if(u.id !== user.id && !swipeQueue.find(d=>d.id===u.id)){
        swipeQueue.push({ id:u.id, name:u.name, face:u.face||'😊', color:u.color||'#00d4ff', badges:[], streak:u.streak||0 });
      }
    });
  }
  swipeLiked.clear();
  renderSwipeStage();
  document.getElementById('swipeScreen').classList.add('open');
}

function closeSwipeScreen(){
  document.getElementById('swipeScreen').classList.remove('open');
  swipeDragState=null;
}

function renderSwipeStage(){
  const stage=document.getElementById('swipeStage');
  const counter=document.getElementById('swipeCounter');
  if(!stage) return;

  // Applica filtro città
  const filtered = swipeCityFilter === 'all' ? swipeQueue :
    swipeQueue.filter(u => {
      const loc = (u.location || u.city || '').toLowerCase();
      const f = swipeCityFilter.toLowerCase();
      if (f === 'sud') return ['napoli','palermo','bari','catania','reggio','calabria','puglia','basilicata','campania','sicilia','calabria'].some(c => loc.includes(c));
      return loc.includes(f);
    });

  if(filtered.length===0){
    stage.innerHTML=`<div class="swipe-empty"><div class="swipe-empty-icon">🔍</div><div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px">${swipeCityFilter==='all'?'Hai visto tutti!':'Nessuno da '+swipeCityFilter}</div><div style="font-size:13px">${swipeCityFilter==='all'?'Torna più tardi per nuovi utenti':'Prova un altro filtro'}</div></div>`;
    counter.textContent='';
    return;
  }

  counter.textContent=`${filtered.length} utenti`;
  stage.innerHTML='';

  // Mostra fino a 3 card (profondità)
  const shown=filtered.slice(0,3);
  shown.reverse().forEach((u,ri)=>{
    const i=2-ri; // 0=front,1=mid,2=back
    const card=document.createElement('div');
    card.className='swipe-card';
    card.dataset.uid=u.id;
    card.innerHTML=`
      <div class="swipe-card-avatar" style="background:linear-gradient(135deg,${u.color}33,${u.color}11)">
        <span style="font-size:90px">${u.face}</span>
      </div>
      <div class="swipe-card-gradient"></div>
      <div class="swipe-card-info">
        <div class="swipe-card-name">${u.name}</div>
        <div class="swipe-card-badges">
          ${u.badges.map(b=>`<span class="swipe-badge">${b}</span>`).join('')}
          ${u.streak>0?`<span class="swipe-badge" style="background:rgba(249,115,22,.3);color:#fb923c">🔥 ${u.streak}gg</span>`:''}
        </div>
      </div>
      <div class="swipe-label like">LIKE</div>
      <div class="swipe-label nope">NOPE</div>
    `;
    stage.appendChild(card);
    if(i===0) initCardDrag(card);
  });
  swipeCurrentCard=stage.querySelector('.swipe-card:last-child');
}

function initCardDrag(card){
  let startX=0, startY=0, dx=0;
  let dragging=false;

  const onStart=(e)=>{
    dragging=true;
    const pt=e.touches?e.touches[0]:e;
    startX=pt.clientX; startY=pt.clientY; dx=0;
    card.style.transition='none';
  };
  const onMove=(e)=>{
    if(!dragging) return;
    const pt=e.touches?e.touches[0]:e;
    dx=pt.clientX-startX;
    const dy=pt.clientY-startY;
    const rot=dx*0.08;
    card.style.transform=`translate(${dx}px,${dy*0.3}px) rotate(${rot}deg)`;
    // Show like/nope label
    const likeEl=card.querySelector('.swipe-label.like');
    const nopeEl=card.querySelector('.swipe-label.nope');
    const ratio=Math.min(Math.abs(dx)/80,1);
    if(dx>0){ likeEl.style.opacity=ratio; nopeEl.style.opacity=0; }
    else{ nopeEl.style.opacity=ratio; likeEl.style.opacity=0; }
    e.preventDefault();
  };
  const onEnd=()=>{
    if(!dragging) return;
    dragging=false;
    card.style.transition='';
    if(dx>80) finishSwipe('right');
    else if(dx<-80) finishSwipe('left');
    else{ card.style.transform=''; card.querySelector('.swipe-label.like').style.opacity=0; card.querySelector('.swipe-label.nope').style.opacity=0; }
  };

  card.addEventListener('mousedown',onStart);
  card.addEventListener('mousemove',onMove);
  card.addEventListener('mouseup',onEnd);
  card.addEventListener('touchstart',onStart,{passive:false});
  card.addEventListener('touchmove',onMove,{passive:false});
  card.addEventListener('touchend',onEnd);
}

function doSwipe(dir){
  const stage=document.getElementById('swipeStage');
  const card=stage?.querySelector('.swipe-card:last-child');
  if(!card || swipeQueue.length===0) return;

  if(dir==='right'||dir==='super'){
    card.style.transition='transform .4s ease,opacity .4s';
    card.style.transform='translateX(120%) rotate(20deg)';
    card.style.opacity='0';
    card.querySelector('.swipe-label.like').style.opacity='1';
  } else {
    card.style.transition='transform .4s ease,opacity .4s';
    card.style.transform='translateX(-120%) rotate(-20deg)';
    card.style.opacity='0';
    card.querySelector('.swipe-label.nope').style.opacity='1';
  }
  setTimeout(()=>finishSwipe(dir),350);
}

function finishSwipe(dir){
  if(swipeQueue.length===0) return;
  const targetUser=swipeQueue.shift();

  if(dir==='right'||dir==='super'){
    swipeLiked.add(targetUser.id);
    // Chance di match: 40% per 'right', 80% per 'super'
    const matchChance = dir==='super' ? 0.8 : 0.4;
    if(Math.random()<matchChance){
      swipeMatchUser=targetUser;
      setTimeout(()=>showSwipeMatch(targetUser),400);
      return;
    }
    addCoins(dir==='super'?2:1,'Swipe +1');
  }
  renderSwipeStage();
}

function showSwipeMatch(matchedUser){
  document.getElementById('matchAvLeft').textContent=user.face||'😊';
  document.getElementById('matchAvRight').textContent=matchedUser.face||'😊';
  document.getElementById('swipeMatchOverlay').classList.add('show');
  addCoins(15,'Match! 💘');
  showToast(`💘 Match con ${matchedUser.name}! +15 🪙`);
  window.trackEvent?.('match_created', { method: 'swipe' });
}

function closeMatchOverlay(){
  document.getElementById('swipeMatchOverlay').classList.remove('show');
  swipeMatchUser=null;
  renderSwipeStage();
}

function startChatWithMatch(){
  closeMatchOverlay();
  closeSwipeScreen();
  if(swipeMatchUser){
    showToast(`💬 Avvio chat con ${swipeMatchUser.name}...`);
    // In un'app reale qui apriremmo la DM; per ora naviga alle stanze
    setTimeout(()=>showScreen('home',null),1000);
  }
}

// ═══════════════════════════════════════════
// VIRTUAL GIFTS SYSTEM
// ═══════════════════════════════════════════

const GIFTS = [
  { id:'rose',    icon:'🌹', name:'Rosa',      cost:10,  rarity:'common' },
  { id:'heart',   icon:'💖', name:'Cuore',     cost:15,  rarity:'common' },
  { id:'star',    icon:'⭐', name:'Stella',    cost:20,  rarity:'common' },
  { id:'fire',    icon:'🔥', name:'Fuoco',     cost:25,  rarity:'common' },
  { id:'diamond', icon:'💎', name:'Diamante',  cost:50,  rarity:'rare' },
  { id:'crown',   icon:'👑', name:'Corona',    cost:75,  rarity:'rare' },
  { id:'rocket',  icon:'🚀', name:'Razzo',     cost:100, rarity:'epic' },
  { id:'rainbow', icon:'🌈', name:'Arcobaleno',cost:150, rarity:'epic' },
];

let selectedGiftId = null;

// ════════════════════════════════════════════════════════
// IMAGE SHARING — invia foto nella chat
// ════════════════════════════════════════════════════════
function handleChatImage(evt){
  const file = evt.target.files?.[0];
  evt.target.value = ''; // reset per poter caricare stessa immagine di nuovo
  if(!file || !file.type.startsWith('image/')) return;
  if(!room){ showToast('Entra in una stanza prima'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawSrc = e.target.result;
    const img = new Image();
    img.onload = () => {
      // Comprimi: max 600px lato lungo, jpeg 0.72
      const MAX = 600;
      let w = img.width, h = img.height;
      if(w > h && w > MAX){ h = Math.round(h * MAX/w); w = MAX; }
      else if(h > w && h > MAX){ w = Math.round(w * MAX/h); h = MAX; }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = cv.toDataURL('image/jpeg', 0.72);

      // Valida dimensione: max 160KB base64
      if(compressed.length > 220000){
        showToast('❌ Immagine troppo grande (max ~160KB)');
        return;
      }

      const msg = {
        userId: user.id, name: user.name, color: user.color,
        face: user.face, activeFrame: user.activeFrame,
        isPremium: isPrem(), photoThumb: user.photoThumb || null,
        imgData: { url: compressed, w, h },
        text: '📷 Immagine', ts: Date.now(), roomId: room.id,
        msgCount: user.msgCount
      };
      socket.emit('chat-message', { roomId: room.id, msg });
      appendMsg(msg); scrollBot();
      user.msgCount = (user.msgCount||0) + 1;
      if(!isPrem()) user.freeUsed = (user.freeUsed||0) + 1;
      updateFreeBar(); saveUser();
      // Missione giornaliera
      incrementDailyMission('send_image');
      checkBadges();
      showToast('📷 Immagine inviata!');
    };
    img.src = rawSrc;
  };
  reader.readAsDataURL(file);
}

function openImgLightbox(src){
  const lb = document.getElementById('imgLightbox');
  const im = document.getElementById('imgLightboxImg');
  if(!lb || !im) return;
  im.src = src;
  lb.style.display = 'flex';
}

// ════════════════════════════════════════════════════════
// @MENTION AUTOCOMPLETE
// ════════════════════════════════════════════════════════
let _mentionQuery = null;
let _mentionSelectedIdx = 0;

function initMentionListener(){
  const inp = document.getElementById('msgInput');
  if(!inp || inp._mentionInited) return;
  inp._mentionInited = true;

  inp.addEventListener('input', () => {
    const val  = inp.value;
    const pos  = inp.selectionStart || val.length;
    // Trova l'ultimo @ prima del cursore
    const before = val.slice(0, pos);
    const atIdx = before.lastIndexOf('@');
    if(atIdx === -1 || (atIdx > 0 && /\S/.test(before[atIdx-1]))){
      closeMentionDropdown(); return;
    }
    const query = before.slice(atIdx + 1);
    if(query.length > 20 || /\s/.test(query)){ closeMentionDropdown(); return; }
    _mentionQuery = { query, atIdx, pos };
    showMentionDropdown(query);
  });

  inp.addEventListener('keydown', (e) => {
    const dd = document.getElementById('mentionDropdown');
    if(!dd || dd.style.display === 'none') return;
    const items = dd.querySelectorAll('.mention-item');
    if(e.key === 'ArrowDown'){ e.preventDefault(); _mentionSelectedIdx = Math.min(_mentionSelectedIdx+1, items.length-1); highlightMentionItem(items); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); _mentionSelectedIdx = Math.max(_mentionSelectedIdx-1, 0); highlightMentionItem(items); }
    else if(e.key === 'Enter' || e.key === 'Tab'){
      const sel = items[_mentionSelectedIdx];
      if(sel){ e.preventDefault(); applyMention(sel.dataset.name); }
    } else if(e.key === 'Escape'){ closeMentionDropdown(); }
  });
}

function showMentionDropdown(query){
  const dd = document.getElementById('mentionDropdown');
  if(!dd || !room) return;

  // Ottieni utenti in stanza da chatRoomUsers
  const roomMap = chatRoomUsers[room.id];
  let candidates = [];
  if(roomMap){
    for(const [, u] of roomMap.entries()){
      if(u.name && u.name !== user.name) candidates.push(u);
    }
  }
  // Filtra per query
  const q = query.toLowerCase();
  const filtered = q
    ? candidates.filter(u => u.name.toLowerCase().startsWith(q) || u.name.toLowerCase().includes(q))
    : candidates;

  if(!filtered.length){ closeMentionDropdown(); return; }

  _mentionSelectedIdx = 0;
  dd.innerHTML = filtered.slice(0,6).map((u,i) => `
    <div class="mention-item ${i===0?'selected':''}" data-name="${esc(u.name)}" onclick="applyMention('${esc(u.name)}')">
      <div class="mention-item-face">${u.face||'🎭'}</div>
      <div>
        <div class="mention-item-name">${esc(u.name)}</div>
        <div class="mention-item-sub">lvl ${typeof userLevel==='function'?userLevel(u.msgCount||0):1}</div>
      </div>
    </div>`).join('');
  dd.style.display = 'block';
}

function highlightMentionItem(items){
  items.forEach((el,i) => el.classList.toggle('selected', i === _mentionSelectedIdx));
}

function applyMention(name){
  const inp = document.getElementById('msgInput');
  if(!inp || !_mentionQuery) return;
  const { atIdx, pos } = _mentionQuery;
  const before = inp.value.slice(0, atIdx);
  const after  = inp.value.slice(pos);
  inp.value = before + '@' + name + ' ' + after;
  const newPos = atIdx + name.length + 2;
  inp.setSelectionRange(newPos, newPos);
  closeMentionDropdown();
  inp.focus();
}

function closeMentionDropdown(){
  const dd = document.getElementById('mentionDropdown');
  if(dd) dd.style.display = 'none';
  _mentionQuery = null;
}

// Evidenzia @mentions nel testo renderizzato
function renderMentions(text){
  return text.replace(/@([\wÀ-ž]{1,30})/g, (m, name) =>
    `<span class="mention">@${esc(name)}</span>`
  );
}

// ════════════════════════════════════════════════════════
// LIVE REACTIONS — emoji volanti stile TikTok/Instagram Live
// ════════════════════════════════════════════════════════
const REACTION_EMOJIS = ['❤️','🔥','😂','😍','😮','👏','💋','🤯','✨','💎','🥵','🫶'];
const REACTION_COLORS = {
  '❤️':'#ff2d6e','🔥':'#ff6a00','😂':'#fbbf24','😍':'#ff6b9d',
  '😮':'#38bdf8','👏':'#10b981','💋':'#ff2d6e','🤯':'#a78bfa',
  '✨':'#00e5b8','💎':'#38bdf8','🥵':'#ef4444','🫶':'#ff6b9d'
};
let _reactionPickerOpen = false;
let _recentReactions = []; // {ts, emoji} — per fire mode detection
let _fireModeActive = false;
let _fireModeTimer = null;
let _reactCount = 0;
let _reactCountTimer = null;

function toggleReactionPicker(){
  const picker = document.getElementById('reactionPicker');
  const btn = document.getElementById('reactBtn');
  _reactionPickerOpen = !_reactionPickerOpen;
  if(_reactionPickerOpen){
    // Build emoji grid se vuoto
    const row = document.getElementById('reactionPickerRow');
    if(!row.children.length){
      row.innerHTML = REACTION_EMOJIS.map(e =>
        `<button class="reaction-emoji-btn" onclick="sendReaction('${e}')">${e}</button>`
      ).join('');
    }
    picker.style.display = 'block';
    btn.classList.add('open');
    // Chiudi cliccando fuori
    setTimeout(()=>document.addEventListener('click', _closePicker, {once:true}), 50);
  } else {
    picker.style.display = 'none';
    btn.classList.remove('open');
  }
}
function _closePicker(e){
  const p = document.getElementById('reactionPicker');
  const b = document.getElementById('reactBtn');
  if(p && !p.contains(e.target) && e.target !== b){
    p.style.display='none';
    if(b) b.classList.remove('open');
    _reactionPickerOpen = false;
  }
}

function sendReaction(emoji){
  if(!room || !socket) return;
  // Chiudi picker
  document.getElementById('reactionPicker').style.display='none';
  document.getElementById('reactBtn').classList.remove('open');
  _reactionPickerOpen = false;

  const color = REACTION_COLORS[emoji] || '#00d4ff';
  // Spawn locale immediato
  spawnFloatingReaction(emoji, color, 1, true);
  trackReactionLocal(emoji);

  // Emetti sul socket
  socket.emit('chat-reaction', {
    roomId: room.id,
    emoji,
    color,
    userId: user.id,
    name: user.name
  });
  haptic('light');
}

function spawnFloatingReaction(emoji, color, combo, isSelf){
  const stage = document.getElementById('reactionStage');
  if(!stage) return;

  // Posizione X casuale nell'area destra (20-80% da destra)
  const rightOffset = 8 + Math.random() * 60; // px da destra
  const bottomOffset = 60 + Math.random() * 20; // px dal basso

  // Dimensione in base al combo
  const sizeClass = combo >= 10 ? 'mega' : combo >= 4 ? 'big' : '';

  // Elemento emoji
  const el = document.createElement('div');
  el.className = 'reaction-float ' + sizeClass;
  el.textContent = emoji;
  el.style.right = rightOffset + 'px';
  el.style.bottom = bottomOffset + 'px';
  el.style.color = color;
  stage.appendChild(el);
  // Rimuovi dopo animazione
  el.addEventListener('animationend', ()=>el.remove());

  // Badge combo se >1
  if(combo > 1){
    const badge = document.createElement('div');
    badge.className = 'reaction-combo';
    badge.textContent = '×' + combo;
    badge.style.right = (rightOffset - 4) + 'px';
    badge.style.bottom = (bottomOffset + 30) + 'px';
    stage.appendChild(badge);
    badge.addEventListener('animationend', ()=>badge.remove());
  }

  // Vibrazione su mobile (solo propria reazione)
  if(isSelf) haptic('light');
}

function trackReactionLocal(emoji){
  const now = Date.now();
  _recentReactions.push({ts: now, emoji});
  // Pulisci vecchie (>8 secondi)
  _recentReactions = _recentReactions.filter(r => now - r.ts < 8000);

  // Aggiorna counter nell'header
  _reactCount++;
  const counter = document.getElementById('reactCounter');
  const numEl = document.getElementById('reactCountNum');
  if(counter && numEl){
    numEl.textContent = _reactCount;
    counter.classList.add('visible');
    if(_reactCountTimer) clearTimeout(_reactCountTimer);
    _reactCountTimer = setTimeout(()=>{
      _reactCount = 0;
      counter.classList.remove('visible');
    }, 4000);
  }
}

function triggerFireMode(count){
  if(_fireModeActive) return;
  _fireModeActive = true;

  const banner = document.getElementById('fireBanner');
  const overlay = document.getElementById('fireOverlay');
  const counter = document.getElementById('reactCounter');

  if(banner){ banner.style.display='block'; }
  if(overlay){ overlay.style.display='block'; }
  if(counter){ counter.style.background='rgba(255,60,0,.35)'; }

  // Lancia 10 emoji di fuoco random a cascata
  for(let i=0;i<12;i++){
    setTimeout(()=> spawnFloatingReaction('🔥','#ff6a00',1), i*120);
  }

  haptic('heavy');
  showToast('🔥 FUOCO IN STANZA! ' + count + ' reazioni');

  // Fine fire mode dopo 6 secondi
  _fireModeTimer = setTimeout(()=>{
    _fireModeActive = false;
    if(banner){
      banner.style.animation='bannerDrop .4s reverse forwards';
      setTimeout(()=>{ banner.style.display='none'; banner.style.animation=''; },400);
    }
    if(overlay) overlay.style.display='none';
    if(counter) counter.style.background='';
  }, 6000);
}

function openGiftPicker(){
  selectedGiftId=null;
  document.getElementById('giftPickerCoins').textContent=user.coins||0;
  buildGiftGrid();
  document.getElementById('giftPickerOverlay').classList.add('open');
}

function closeGiftPicker(){
  document.getElementById('giftPickerOverlay').classList.remove('open');
  selectedGiftId=null;
}

function buildGiftGrid(){
  const grid=document.getElementById('giftGrid');
  if(!grid) return;
  grid.innerHTML='';
  GIFTS.forEach(g=>{
    const el=document.createElement('div');
    el.className='gift-item';
    el.dataset.gid=g.id;
    const canAfford=(user.coins||0)>=g.cost;
    el.style.opacity=canAfford?'1':'0.45';
    el.innerHTML=`<div class="gift-item-icon">${g.icon}</div><div class="gift-item-name">${g.name}</div><div class="gift-item-cost">🪙 ${g.cost}</div>`;
    el.onclick=()=>selectGift(g.id);
    grid.appendChild(el);
  });
}

function selectGift(gid){
  selectedGiftId=gid;
  document.querySelectorAll('.gift-item').forEach(el=>{
    el.classList.toggle('selected', el.dataset.gid===gid);
  });
  const g=GIFTS.find(x=>x.id===gid);
  const btn=document.getElementById('giftSendBtn');
  if(!g) return;
  const canAfford=(user.coins||0)>=g.cost;
  if(canAfford){
    btn.disabled=false;
    btn.textContent=`Invia ${g.icon} ${g.name} — 🪙 ${g.cost}`;
  } else {
    btn.disabled=true;
    btn.textContent=`Monete insufficienti (hai ${user.coins||0})`;
  }
}

function sendGift(){
  if(!selectedGiftId) return;
  const g=GIFTS.find(x=>x.id===selectedGiftId);
  if(!g) return;
  if((user.coins||0)<g.cost){ showToast('❌ Monete insufficienti'); return; }

  user.coins-=g.cost;
  saveUser();
  updateCoinBar();
  closeGiftPicker();

  // Mostra il regalo nella chat locale
  renderGiftMessage({ gift:g, from:user.name||'Tu', face:user.face||'🎭', self:true });

  // Invia via socket se connessi
  if(window.socket && window.socket.connected && room?.id){
    window.socket.emit('gift', {
      roomId: room.id,
      giftId: g.id,
      giftIcon: g.icon,
      giftName: g.name,
      from: user.name,
      face: user.face||'🎭'
    });
  }
  showToast(`${g.icon} Regalo inviato! -${g.cost} 🪙`);
}

function renderGiftMessage({ gift, from, face, self }){
  const msgs=document.getElementById('chatMsgs');
  if(!msgs) return;
  const div=document.createElement('div');
  div.style.display='flex';
  div.style.justifyContent='center';
  div.style.position='relative';
  div.innerHTML=`
    <div class="msg-gift">
      <span class="msg-gift-icon">${gift.icon}</span>
      <div class="msg-gift-text">${gift.name}</div>
      <div class="msg-gift-from">${face} ${self?'Hai inviato':'Da'} ${self?'un regalo':from}</div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
  // Effetto particelle
  spawnGiftParticles(gift.icon);
}

function spawnGiftParticles(icon){
  const stage=document.getElementById('chat');
  if(!stage) return;
  for(let i=0;i<8;i++){
    const p=document.createElement('div');
    p.textContent=icon;
    p.style.cssText=`position:fixed;z-index:9999;font-size:${16+Math.random()*20}px;pointer-events:none;
      left:${30+Math.random()*40}%;bottom:100px;
      animation:giftParticle ${1+Math.random()*.8}s ease-out both;
      animation-delay:${i*0.08}s`;
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),2500);
  }
}

// CSS per le particelle
if(!document.getElementById('giftParticleStyle')){
  const s=document.createElement('style');
  s.id='giftParticleStyle';
  s.textContent=`@keyframes giftParticle{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-200px) scale(0) rotate(${Math.random()>0.5?'':'-'}180deg);opacity:0}}`;
  document.head.appendChild(s);
}

// Ricezione regalo via socket — registrato in connectSocket() per evitare race condition

// ═══════════════════════════════════════════
// REAL-TIME VIDEO FILTERS
// ═══════════════════════════════════════════

const VIDEO_FILTERS = [
  { id:'none',     label:'Normale',  icon:'🎥', css:'' },
  { id:'bw',       label:'B&W',      icon:'⬛', css:'grayscale(100%)' },
  { id:'sepia',    label:'Vintage',  icon:'🟤', css:'sepia(80%) contrast(110%)' },
  { id:'beauty',   label:'Beauty',   icon:'✨', css:'brightness(110%) contrast(95%) saturate(110%)' },
  { id:'vivid',    label:'Vivid',    icon:'🌈', css:'saturate(200%) contrast(110%)' },
  { id:'warm',     label:'Warm',     icon:'🔆', css:'sepia(30%) saturate(150%) hue-rotate(-20deg) brightness(105%)' },
  { id:'cool',     label:'Cool',     icon:'❄️', css:'hue-rotate(180deg) saturate(130%) brightness(95%)' },
  { id:'night',    label:'Night',    icon:'🌙', css:'brightness(70%) contrast(130%) saturate(80%) hue-rotate(210deg)' },
  { id:'neon',     label:'Neon',     icon:'💜', css:'brightness(90%) saturate(300%) hue-rotate(270deg) contrast(120%)' },
  { id:'blur',     label:'Soft',     icon:'🌫️', css:'blur(1.5px) brightness(105%)' },
];

let currentVideoFilter = 'none';

function initVfPanel(){
  const list = document.getElementById('vfList');
  if(!list) return;
  list.innerHTML = '';
  VIDEO_FILTERS.forEach(f => {
    const el = document.createElement('div');
    el.className = 'vf-option' + (f.id === currentVideoFilter ? ' selected' : '');
    el.dataset.fid = f.id;
    el.innerHTML = `<div class="vf-thumb" style="filter:${f.css||'none'}">${f.icon}</div><div class="vf-label">${f.label}</div>`;
    el.onclick = () => applyVideoFilter(f.id);
    list.appendChild(el);
  });
}

function toggleVfPanel(){
  const panel = document.getElementById('vfPanel');
  const btn = document.getElementById('vfToggleBtn');
  if(!panel) return;
  const isOpen = panel.classList.contains('open');
  if(isOpen){ panel.classList.remove('open'); btn.classList.remove('active'); }
  else { initVfPanel(); panel.classList.add('open'); btn.classList.add('active'); }
}

function applyVideoFilter(filterId){
  const f = VIDEO_FILTERS.find(x => x.id === filterId);
  if(!f) return;
  currentVideoFilter = filterId;
  const vid = document.getElementById('myVideo');
  if(vid) vid.style.filter = f.css || '';
  // Update label
  const lbl = document.getElementById('vfActiveLabel');
  if(lbl) lbl.textContent = filterId === 'none' ? 'Tu' : `Tu · ${f.label}`;
  // Update selection in panel
  document.querySelectorAll('.vf-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.fid === filterId);
  });
  // Auto-close after selection (UX)
  if(filterId !== 'none') setTimeout(()=>{ document.getElementById('vfPanel')?.classList.remove('open'); document.getElementById('vfToggleBtn')?.classList.remove('active'); }, 600);
}

// ── Aggiunge monete e aggiorna UI ──
function addCoins(amount, reason){
  user.coins=(user.coins||0)+amount;
  saveUser();
  updateCoinBar();
  if(amount>0 && reason) showToast(`+${amount} 🪙  ${reason}`);
}

// ── Aggiorna barra monete (mostrata in chat + profilo) ──
function updateCoinBar(){
  const els=document.querySelectorAll('.coin-amount');
  els.forEach(e=>e.textContent=user.coins||0);
  // Streak badge
  const sb=document.getElementById('streakBadge');
  if(sb){
    if((user.streak||0)>0){ sb.style.display='inline-block'; document.getElementById('streakDays').textContent=user.streak; }
    else sb.style.display='none';
  }
  // Aggiorna stato pulsante ruota
  updateWheelButton();
}

// ── RUOTA FORTUNA ──
const WHEEL_PRIZES = [
  { angle:30,  reward:'coins', amount:10,  label:'+10 monete'  },
  { angle:90,  reward:'coins', amount:50,  label:'+50 monete'  },
  { angle:150, reward:'boost', amount:2*60*60*1000, label:'⚡ Boost x2 XP per 2h' },
  { angle:210, reward:'coins', amount:20,  label:'+20 monete'  },
  { angle:270, reward:'coins', amount:100, label:'+100 monete' },
  { angle:330, reward:'temp_frame', amount:24*60*60*1000, label:'🥇 Cornice Gold per 24h' }
];

function canSpinWheel(){
  const last=user.lastSpin||0;
  return (Date.now()-last) >= 24*60*60*1000;
}

function timeUntilNextSpin(){
  const last=user.lastSpin||0;
  const ms = 24*60*60*1000 - (Date.now()-last);
  const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000);
  return `${h}h ${m}m`;
}

function updateWheelButton(){
  const btn=document.getElementById('wheelBtn');
  const sub=document.getElementById('wheelSub');
  if(!btn) return;
  if(canSpinWheel()){
    btn.classList.remove('disabled');
    if(sub) sub.textContent='Pronta! Gira ora';
  } else {
    btn.classList.add('disabled');
    if(sub) sub.textContent='Prossima fra '+timeUntilNextSpin();
  }
}

function openWheel(){
  updateWheelButton();
  if(!canSpinWheel()){
    showToast('⏳ Riprova fra '+timeUntilNextSpin());
    return;
  }
  document.getElementById('wheelOv').classList.add('open');
  document.getElementById('wheelResult').textContent='';
  document.getElementById('wheelSpinBtn').disabled=false;
  document.getElementById('wheelSpinBtn').textContent='🎲 GIRA';
  const stage=document.getElementById('wheelStage');
  stage.style.transition='none'; stage.style.transform='rotate(0deg)';
}
function closeWheel(){document.getElementById('wheelOv').classList.remove('open');}

function spinWheel(){
  if(!canSpinWheel()){ showToast('⏳ Riprova domani'); return; }
  const btn=document.getElementById('wheelSpinBtn');
  btn.disabled=true; btn.textContent='Sto girando...';

  // Scegli premio random
  const prize = WHEEL_PRIZES[Math.floor(Math.random()*WHEEL_PRIZES.length)];
  // Calcola rotazione: la freccia è in alto, quindi targetAngle = 360 - (prize.angle - 30)
  // ogni slot copre 60° centrato sulla sua angle. Voglio che si fermi con quell'angolo in alto.
  const targetRot = 360*5 + (360 - prize.angle); // 5 giri completi + posizione

  const stage=document.getElementById('wheelStage');
  // Reset
  stage.style.transition='none'; stage.style.transform='rotate(0deg)';
  void stage.offsetWidth;
  stage.style.transition='transform 4s cubic-bezier(.18,.71,.21,1)';
  stage.style.transform='rotate('+targetRot+'deg)';

  setTimeout(()=>{
    // Applica premio
    user.lastSpin = Date.now();
    let toastMsg='';
    if(prize.reward==='coins'){
      user.coins=(user.coins||0)+prize.amount;
      toastMsg='🎉 '+prize.label+'!';
    } else if(prize.reward==='boost'){
      user.boostUntil = Date.now() + prize.amount;
      toastMsg='🎉 '+prize.label+' attivo!';
    } else if(prize.reward==='temp_frame'){
      user.tempFrames=user.tempFrames||{};
      user.tempFrames['gold']=Math.max(user.tempFrames['gold']||0, Date.now()+prize.amount);
      if(!user.ownedFrames.includes('gold')) user.ownedFrames.push('gold');
      toastMsg='🎉 '+prize.label+'!';
    }
    saveUser(); updateCoinBar(); renderFrames();
    document.getElementById('wheelResult').textContent=toastMsg;
    document.getElementById('wheelSpinBtn').textContent='Torna domani';
    showToast(toastMsg);
  }, 4100);
}

const RANKS=[
  {min:0,   max:10,  icon:'🥚', title:'Novizio',      sub:'Inizia a chattare!'},
  {min:11,  max:50,  icon:'🌱', title:'Esploratore',  sub:'Stai crescendo...'},
  {min:51,  max:200, icon:'🔥', title:'Chiacchierone', sub:'Sei in forma!'},
  {min:201, max:999, icon:'💎', title:'Veterano',      sub:'Quasi leggenda...'},
  {min:1000,max:Infinity,icon:'👑',title:'Leggenda',  sub:'La voce di KOUVERTE'},
];

function getRank(mc){
  return RANKS.find(r=>mc>=r.min&&mc<=r.max)||RANKS[0];
}

function updateProfileUI(){
  document.getElementById('profName').textContent=user.name;
  // Aggiorna subtitle header profilo
  const profHeaderSub=document.getElementById('profHeaderSub');
  if(profHeaderSub) profHeaderSub.textContent=user.username?('@'+user.username):'Personalizza il tuo avatar';
  // Mostra @username se l'utente e' registrato
  const uEl = document.getElementById('profUsername');
  const shareBtn = document.getElementById('profShareBtn');
  if (uEl) {
    if (user.username) {
      uEl.textContent = '@' + user.username;
      uEl.style.display = 'block';
      if (shareBtn) shareBtn.style.display = 'inline-flex';
    } else {
      uEl.style.display = 'none';
      if (shareBtn) shareBtn.style.display = 'none';
    }
  }
  document.getElementById('stMsgs').textContent=user.msgCount||0;
  document.getElementById('stRooms').textContent=sessionRooms.size||(user.roomsVisited||[]).length||0;
  document.getElementById('stBadges').textContent=(user.badges||[]).length;
  document.getElementById('premBadge').style.display=isPrem()?'inline-flex':'none';

  // Avatar profilo: mostra emoji face + cornice utente
  const av = document.getElementById('profAvatarHero');
  const face = document.getElementById('profAvatarFace');
  if (av && face) {
    // Se c'è un avatar personalizzato, mostralo come background image
    if (user.customAvatar) {
      face.style.backgroundImage = 'url(' + user.customAvatar + ')';
      face.style.backgroundSize = 'cover';
      face.style.backgroundPosition = 'center';
      face.textContent = '';
    } else {
      face.style.backgroundImage = 'none';
      face.textContent = user.face || '🎭';
    }
    // Rimuovi vecchie classi frame-*
    av.className = 'prof-avatar-hero';
    const activeFrame = user.activeFrame || 'none';
    if (activeFrame && activeFrame !== 'none') {
      av.classList.add('frame-' + activeFrame);
    }
    // Colore di sfondo basato sul colore utente
    const col = user.color || '#00d4ff';
    av.style.setProperty('--av-c1', col);
    av.style.setProperty('--av-c2', col);
  }

  // Banner + Stato + Bio
  if (typeof applyProfileBanner === 'function') applyProfileBanner();
  if (typeof applyProfileStatus === 'function') applyProfileStatus();
  if (typeof applyProfileBio === 'function') applyProfileBio();

  // Join date
  if(user.joinedAt){
    const d=new Date(user.joinedAt);
    document.getElementById('joinDate').textContent='Con noi dal '+d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
  }

  // Rank bar (level system stile gaming)
  const mc=user.msgCount||0;
  const lvl=userLevel(mc);
  const xpNext=Math.pow(2,(lvl)/2.2)-1; // soglia prossimo lvl (inverso)
  const xpCurr=Math.pow(2,(lvl-1)/2.2)-1;
  const pct=Math.max(0,Math.min(((mc-xpCurr)/(xpNext-xpCurr))*100,100));
  const tier=levelLabel(lvl,isPrem());
  document.getElementById('rankIcon').textContent=tier.split(' ')[0]||'🌱';
  document.getElementById('rankTitle').textContent=`${user.name} · lvl ${lvl}`;
  document.getElementById('rankSub').textContent=`${tier} — ${Math.max(0,Math.ceil(xpNext-mc))} msg al lvl ${lvl+1}`;
  document.getElementById('rankXp').textContent=mc+' XP';
  const bar=document.getElementById('rankBar');
  bar.style.setProperty('--rw',pct+'%');
  setTimeout(()=>{bar.style.width=pct+'%';},50);

  // Referral link — usa SEMPRE il chatId Telegram numerico, mai 'tg_X'
  const tgId = user.tgId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  const refSec = document.querySelector('.ref-sec');
  if(tgId){
    refSec.style.display='block';
    document.getElementById('refLink').textContent='t.me/Kouverte_bot?start=ref_'+tgId;
    // Carica count amici invitati dal bot DB
    fetch(BACKEND+'/api/bot/user-stats?chatId='+encodeURIComponent(tgId))
      .then(r=>r.json())
      .then(d=>{
        if(typeof d.invited === 'number'){
          document.getElementById('refCount').textContent=d.invited;
          document.getElementById('refStats').style.display='flex';
        }
      })
      .catch(()=>{});
  } else {
    // Utente non Telegram: nasconde referral
    refSec.style.display='none';
  }

  updateFreeBar();

  // Voice note player
  if (!window._voiceNotePlayerInit) {
    window._voiceNotePlayerInit = true;
    const vnSaved = user.kvData?.voiceNote || null;
    renderVoiceNotePlayer(vnSaved ? 'saved' : 'empty');
  }
}

function copyRef(){
  const txt=document.getElementById('refLink').textContent;
  navigator.clipboard?.writeText(txt).then(()=>showToast('📋 Link copiato!')).catch(()=>showToast(txt));
}

function sharePublicProfile(){
  if(!user.username) return;
  const url = 'https://www.kouverte.com/u/' + user.username;
  if(navigator.share){
    navigator.share({
      title: (user.name||user.username) + ' su Kouverte',
      text: 'Vieni a chattare con me su Kouverte 🚀',
      url
    }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(url)
      .then(()=>showToast('🔗 Link profilo copiato!'))
      .catch(()=>showToast('Profilo: ' + url));
  }
}

function isPrem(){ return user.isPremium && Date.now()<(user.premExpiry||0); }

function getColor(uid){
  let h=0; for(const c of String(uid)) h=(h*31+c.charCodeAt(0))&0xffff;
  return NEON[h%NEON.length];
}

function getFace(uid){
  let h=0; for(const c of String(uid)) h=(h*37+c.charCodeAt(0)+7)&0xffff;
  return FACE_EMOJIS[h%FACE_EMOJIS.length];
}

// ══ FREE BAR ══
function updateFreeBar(){
  const bar=document.getElementById('freeBar');
  if(isPrem()){bar.style.display='none';return;}
  bar.style.display='flex';
  const used=user.freeUsed||0, pct=Math.min((used/FREE_LIMIT)*100,100);
  document.getElementById('fbFill').style.width=pct+'%';
  document.getElementById('fbCount').textContent=used+'/'+FREE_LIMIT;
  const left=FREE_LIMIT-used;
  const lbl=document.getElementById('fbLabel');
  lbl.textContent=left>0?left+' msg gratuiti':'Limite raggiunto';
  lbl.className='fb-lbl'+(left<=20?' warn':'');
}

// ══ SOCKET ══
const BACKEND = window.location.hostname.includes('onrender.com') || window.location.hostname === 'localhost'
  ? '' : 'https://kouverte-voice.onrender.com';

function setConnState(state){
  const el = document.getElementById('chatOnline');
  if(!el) return;
  if(state==='connecting') el.textContent='Connessione...';
  else if(state==='offline') el.textContent='⚠️ Offline — ritento';
  else if(state==='online' && room) el.textContent=(roomOnline[room.id]??0)+' online';
}

function connectSocket(){
  if(typeof io==='undefined'){ showToast('⚠️ Impossibile caricare socket.io'); setTimeout(connectSocket,3000); return; }
  setConnState('connecting');
  socket=io(BACKEND,{transports:['websocket','polling'],reconnection:true,reconnectionDelay:1000,reconnectionAttempts:Infinity});
  // Registra subito i WebRTC handlers (devono essere sul socket NUOVO, non su un socket precedente)
  if (typeof registerWebRTCHandlers === 'function') registerWebRTCHandlers(socket);
  socket.on('connect',()=>{
    setConnState('online');
    if(room){ socket.emit('join-chat-room',{roomId:room.id,user:pubUser()}); }
    // Registra utente per DM — usa sempre serverId come ID canonico
    if (user) {
      const canonicalId = user.serverId || user.id;
      socket.emit('dm-register', { userId: canonicalId, serverId: canonicalId, username: user.username });
    }
    // Registra DM + friend listeners una volta sola
    if (typeof registerDmListener === 'function' && !window._dmListenerRegistered) {
      registerDmListener();
      window._dmListenerRegistered = true;
    }
    if (!window._friendListenerRegistered) {
      registerFriendListeners();
      window._friendListenerRegistered = true;
    }
    // Registra gift listener una volta sola
    if (!window._giftListenerRegistered) {
      socket.on('gift', data=>{
        if(!data||!data.giftId) return;
        const g=GIFTS.find(x=>x.id===data.giftId)||{icon:data.giftIcon||'🎁',name:data.giftName||'Regalo'};
        renderGiftMessage({ gift:g, from:data.from||'Qualcuno', face:data.face||'🎭', self:false });
      });
      window._giftListenerRegistered = true;
    }
  });
  socket.on('disconnect',()=>setConnState('offline'));
  socket.on('connect_error',()=>setConnState('offline'));
  socket.on('you-are-banned',({reason})=>{
    showToast('🔨 Account bannato' + (reason ? ': ' + reason : '') + '. Contatta il supporto.');
    // Forza logout
    localStorage.removeItem('kv4_token');
    localStorage.removeItem('kv4_user');
    setTimeout(()=>location.reload(), 2500);
  });
  socket.on('reconnect_attempt',()=>setConnState('connecting'));
  socket.on('chat-message',({roomId,msg})=>{
    // Aggiorna preview nella card
    roomPreviews[roomId]=roomPreviews[roomId]||[];
    roomPreviews[roomId].push(msg);
    if(roomPreviews[roomId].length>4) roomPreviews[roomId].shift();

    if(room?.id===roomId){
      // NEW: Track user in WebRTC chatRoomUsers
      if(!chatRoomUsers[roomId]) chatRoomUsers[roomId] = new Map();
      if(msg.userId && msg.name){
        chatRoomUsers[roomId].set(msg.userId, {
          id: msg.userId,
          name: msg.name,
          color: msg.color,
          face: msg.face,
          isPremium: msg.isPremium,
          msgCount: msg.msgCount
        });
        renderUsersPanel();
      }
      
      if(msg.userId!==user.id){appendMsg(msg);scrollBot();}
    }
  });
  // ── Live Reactions ──
  socket.on('chat-reaction',({roomId,emoji,color,combo})=>{
    if(roomId!==room?.id) return;
    spawnFloatingReaction(emoji,color,combo||1);
    trackReactionLocal(emoji);
  });
  socket.on('chat-fire-mode',({roomId,count})=>{
    if(roomId!==room?.id) return;
    triggerFireMode(count);
  });

  socket.on('chat-typing',({roomId,user:u})=>{
    if(roomId!==room?.id||u?.id===user.id) return;
    typingUsers[u.id]=u; renderTyping();
  });
  socket.on('chat-stop-typing',({roomId,userId})=>{
    if(roomId!==room?.id) return;
    delete typingUsers[userId]; renderTyping();
  });
  socket.on('voice-msg',({roomId,msg})=>{
    if(roomId!==room?.id||!msg?.audio||msg.audio==='[voice]') return;
    appendVoiceMsg(msg, false);
  });
  socket.on('room-online',({roomId,count})=>{
    const prev=roomOnline[roomId]||0;
    roomOnline[roomId]=count;
    const el=document.getElementById('ron_'+roomId);
    if(el){
      // Game card: mostra testo "X in sala" / "Nessuno ora"
      if(el.classList.contains('gc-waiting')){
        el.textContent=count>0?count+' in sala':'Nessuno ora';
        el.classList.toggle('gc-waiting-empty',count===0);
      } else {
        el.textContent=count;
      }
      if(count>prev){
        // bump animation
        el.classList.remove('bumping'); void el.offsetWidth; el.classList.add('bumping');
        // glow whole card (room-card o game-card)
        const card=el.closest('.room-card,.game-card');
        if(card){card.classList.remove('just-joined');void card.offsetWidth;card.classList.add('just-joined');}
      }
    }
    if(room?.id===roomId){
      document.getElementById('chatOnline').textContent=count+' online';
      renderUsersPanel();
      // Aggiorna/rimuovi empty state
      checkEmptyRoom();
    }
  });
  socket.on('global-online',({count})=>{
    document.getElementById('oCount').textContent=count;
    document.getElementById('opill').style.display='flex';
    const ph=document.getElementById('onlinePillHdr');
    if(ph) ph.textContent=count;
  });

  // NEW: ricevi lista utenti in stanza (per video chat + lista chip)
  socket.on('chat-users', ({ roomId, users }) => {
    if (!room || room.id !== roomId) return;
    chatRoomUsers[roomId] = new Map();
    users.forEach(u => {
      chatRoomUsers[roomId].set(u.socketId || u.id, {
        id: u.id, name: u.name, face: u.face, color: u.color,
        frame: u.frame, activeFrame: u.activeFrame || u.frame,
        isPremium: u.isPremium
      });
    });
    renderUsersPanel();
  });
  socket.on('chat-history',({roomId,messages})=>{
    if(roomId!==room?.id) return;
    document.getElementById('chatMsgs').innerHTML='';
    lastSender=null;
    // Init preview dalla storia
    roomPreviews[roomId]=(messages||[]).slice(-4);
    
    // NEW: Initialize chatRoomUsers from chat history
    if(!chatRoomUsers[roomId]) chatRoomUsers[roomId] = new Map();
    (messages||[]).forEach(m=>{
      if(m.userId && m.name && !chatRoomUsers[roomId].has(m.userId)){
        chatRoomUsers[roomId].set(m.userId, {
          id: m.userId,
          name: m.name,
          color: m.color,
          face: m.face,
          isPremium: m.isPremium,
          msgCount: m.msgCount
        });
      }
    });
    
    (messages||[]).forEach(m=>appendMsg(m));
    // Se la stanza ha messaggi reali → mostra solo il sys-msg classico
    // Se è vuota → mostra il welcome card (più accogliente per nuovi utenti)
    if((messages||[]).length > 0){
      addSys('Benvenuto in '+room.name+' 👋  Sei anonimo.');
    } else {
      injectWelcomeMessages(roomId);
    }
    renderUsersPanel();
    scrollBot();
  });
}

function pubUser(){
  return {id:user.id,name:user.name,color:user.color,face:user.face,
    frame:user.activeFrame,activeFrame:user.activeFrame,
    active_nickFx:user.active_nickFx,active_bubble:user.active_bubble,
    isPremium:isPrem(),msgCount:user.msgCount||0};
}

// ════════════════════════════════════════════
// WEBRTC VIDEO STREAMING
// ════════════════════════════════════════════

var localStream = null;
var peerConnections = {};
var selectedUserId = null;
var webrtcEnabled = false;

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] }
  ]
};

async function initWebRTC() {
  try {
    console.log('[WebRTC] Richiedendo accesso media...');
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    });
    
    const myVideo = document.getElementById('myVideo');
    if (myVideo) {
      myVideo.srcObject = localStream;
      myVideo.onloadedmetadata = () => myVideo.play();
      console.log('[WebRTC] Video locale attached');
    }
    // Imposta label "Tu" appena la camera è attiva
    const vfLbl = document.getElementById('vfActiveLabel');
    if (vfLbl && !vfLbl.textContent) vfLbl.textContent = 'Tu';
    
    console.log('[WebRTC] ✅ getUserMedia successo!');
    const tracks = localStream.getTracks();
    console.log('[WebRTC] Track acquisiti:', tracks.length);
    tracks.forEach(t => {
      console.log(`  - ${t.kind}: enabled=${t.enabled}, id=${t.id}`);
    });
    
    webrtcEnabled = true;
    console.log('[WebRTC] ✅ Inizializzazione completata - pronto per videochat');

  } catch (err) {
    console.error('[WebRTC] ❌ Errore getUserMedia:', err);
    webrtcEnabled = false;
    
    // Mostra errore specifico all'utente
    let errorMsg = '📷 Errore webcam: ';
    if (err.name === 'NotAllowedError') {
      errorMsg += 'Permessi negati. Clicca sull\'icona webcam in alto a destra del browser e consenti accesso.';
    } else if (err.name === 'NotFoundError') {
      errorMsg += 'Webcam non trovata. Verifica che sia collegata.';
    } else if (err.name === 'NotReadableError') {
      errorMsg += 'Webcam già in uso da un\'altra app. Chiudila.';
    } else if (err.name === 'SecurityError') {
      errorMsg += 'Errore sicurezza. Usa HTTPS o localhost.';
    } else {
      errorMsg += err.name + ': ' + err.message;
    }
    
    showToast(errorMsg);
    console.log('[WebRTC] Video section rimane visibile per UI');
  }
}

function toggleMicrophone() {
  if (!localStream) {
    showToast('🎤 Microfono non disponibile');
    return;
  }

  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) {
    showToast('🎤 Nessun microfono');
    return;
  }

  const newState = !audioTracks[0].enabled;
  audioTracks.forEach(track => {
    track.enabled = newState;
  });

  const micBtn = document.getElementById('myMicBtn');
  if (micBtn) {
    if (newState) {
      micBtn.classList.remove('off');
      micBtn.textContent = '🎤';
      micBtn.title = 'Microfono ON';
      showToast('🎤 Microfono ON');
    } else {
      micBtn.classList.add('off');
      micBtn.textContent = '🔇';
      micBtn.title = 'Microfono OFF';
      showToast('🔇 Microfono OFF');
    }
  }
}

function toggleCamera() {
  if (!localStream) {
    showToast('📷 Camera non disponibile');
    return;
  }

  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length === 0) {
    showToast('📷 Nessuna camera');
    return;
  }

  const newState = !videoTracks[0].enabled;
  videoTracks.forEach(track => {
    track.enabled = newState;
  });

  const camBtn = document.getElementById('myCamBtn');
  const overlay = document.getElementById('myCamOffOverlay');

  if (camBtn) {
    if (newState) {
      camBtn.classList.remove('off');
      camBtn.textContent = '📹';
      camBtn.title = 'Camera ON';
      if (overlay) overlay.classList.remove('show');
      showToast('📹 Camera ON');
      window.trackEvent?.('camera_on', { method: 'toggle' });
    } else {
      camBtn.classList.add('off');
      camBtn.textContent = '📷';
      camBtn.title = 'Camera OFF';
      if (overlay) overlay.classList.add('show');
      showToast('📷 Camera OFF');
    }
  }
}

async function selectUser(userId) {
  // ⚠️ CRITICO: Verifica che il video sia pronto
  if (!localStream) {
    console.warn('[WebRTC] ⚠️ localStream non ancora pronto - aspetto...');
    // Attendi che getUserMedia finisca (max 3 secondi)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (localStream) {
        console.log('[WebRTC] ✅ localStream è ora pronto');
        break;
      }
    }
    if (!localStream) {
      console.error('[WebRTC] ❌ ERRORE: localStream rimane null dopo 3s!');
      showToast('📷 Telecamera non disponibile');
      return;
    }
  }
  
  if (!webrtcEnabled) {
    console.warn('[WebRTC] WebRTC non abilitato');
    return;
  }
  
  if (selectedUserId === userId) {
    deselectUser();
    return;
  }
  
  if (selectedUserId) {
    closePeerConnection(selectedUserId);
  }
  
  selectedUserId = userId;
  console.log(`[WebRTC] 📞 Selezionato utente: ${userId}`);
  
  document.querySelectorAll('.user-chip').forEach(chip => {
    chip.classList.remove('selected');
  });
  document.querySelector(`.user-chip[data-user-id="${userId}"]`)?.classList.add('selected');
  
  // Ottenere nome utente per label
  const usersList = chatRoomUsers[room?.id];
  if (usersList) {
    for (let [socketId, userData] of usersList) {
      if (userData.id === userId) {
        document.getElementById('theirVideoLabel').textContent = userData.name || 'Utente';
        break;
      }
    }
  }
  
  console.log('[WebRTC] Verifico localStream prima di createPeerConnection:', {
    streamPresent: !!localStream,
    trackCount: localStream?.getTracks().length,
    videoTracks: localStream?.getVideoTracks().length
  });
  
  await createPeerConnection(userId);
}

function deselectUser() {
  if (!selectedUserId) return;
  
  closePeerConnection(selectedUserId);
  selectedUserId = null;
  
  document.querySelectorAll('.user-chip').forEach(chip => {
    chip.classList.remove('selected');
  });
  
  document.getElementById('theirVideoLabel').textContent = 'Seleziona utente';
  document.getElementById('theirVideo').srcObject = null;
  
  console.log('[WebRTC] Utente deselezionato');
}

// Crea solo il RTCPeerConnection con listeners e tracks locali (senza creare offer).
// Usata sia dal caller (initiator) che dal callee (receiver).
function setupPeerConnection(userId) {
  console.log(`[WebRTC] 🔌 setupPeerConnection per ${userId}`);

  // Cleanup eventuale connessione esistente per evitare stati inconsistenti
  if (peerConnections[userId]) {
    try { peerConnections[userId].close(); } catch(e) {}
    delete peerConnections[userId];
  }

  // ⚠️ CRITICO: Verifica localStream
  if (!localStream) {
    console.error('[WebRTC] 🔴 CRITICO: localStream è NULL! Il video NON verrà trasmesso!');
    console.error('[WebRTC] Possibili cause:');
    console.error('  1. getUserMedia non è stato richiamato');
    console.error('  2. getUserMedia ha fallito (permission denied, no camera)');
    console.error('  3. Race condition - selectUser chiamato prima di initWebRTC');
    showToast('❌ Errore: videocamera non disponibile. Ricarica la pagina.');
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);
  peerConnections[userId] = pc;

  if (localStream) {
    const tracks = localStream.getTracks();
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    
    console.log(`[WebRTC] ✅ localStream ha ${tracks.length} track(s):`, tracks.map(t => `${t.kind}(${t.enabled})`).join(', '));
    console.log(`[WebRTC]    Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`);
    
    if (videoTracks.length === 0) {
      console.error('[WebRTC] 🔴 ATTENZIONE: Nessun video track! Solo audio verrà trasmesso.');
    }
    
    tracks.forEach(track => {
      pc.addTrack(track, localStream);
      console.log(`[WebRTC] ✅ Track aggiunto al PC: ${track.kind} (enabled: ${track.enabled}, id: ${track.id})`);
    });
    
    // Log sender state
    const senders = pc.getSenders();
    console.log(`[WebRTC] Senders totali: ${senders.length}`);
    senders.forEach((sender, idx) => {
      console.log(`[WebRTC]   Sender ${idx}: ${sender.track?.kind || 'null'} (id: ${sender.track?.id || 'none'})`);
    });
  } else {
    console.error('[WebRTC] 🔴 CRITICO: localStream è NULL!');
  }

  // Buffer ICE candidates ricevuti prima che remoteDescription sia settata
  pc._pendingIce = [];

  pc.ontrack = (event) => {
    console.log('[WebRTC] 🎬 Traccia remota ricevuta:', event.track.kind, 'id:', event.track.id, 'enabled:', event.track.enabled);
    console.log('[WebRTC] Streams nel evento:', event.streams.length, 'tracce totali:', event.streams[0]?.getTracks().length);
    
    const theirVideo = document.getElementById('theirVideo');
    if (!theirVideo) {
      console.error('[WebRTC] ❌ Elemento theirVideo non trovato!');
      return;
    }
    
    if (!event.streams[0]) {
      console.error('[WebRTC] ❌ event.streams[0] è null!');
      return;
    }

    // Riusa lo stream remoto: tutte le tracce arrivano nello stesso MediaStream
    if (theirVideo.srcObject !== event.streams[0]) {
      theirVideo.srcObject = event.streams[0];
      console.log('[WebRTC] ✅ srcObject assegnato al video element');
      console.log('[WebRTC] MediaStream contiene:', event.streams[0].getTracks().map(t => `${t.kind}(${t.enabled})`).join(','));
      
      // Log video element state
      console.log('[WebRTC] Video element:', {
        srcObject: !!theirVideo.srcObject,
        autoplay: theirVideo.autoplay,
        muted: theirVideo.muted,
        playsinline: theirVideo.playsinline,
        paused: theirVideo.paused,
        readyState: theirVideo.readyState
      });
    }

    // muted=true per superare l'autoplay policy. Un click sul video unmuta.
    theirVideo.muted = true;

    const tryPlay = () => {
      theirVideo.play().then(() => {
        console.log('[WebRTC] ✅ theirVideo.play() OK - video in riproduzione');
      }).catch(err => {
        console.warn('[WebRTC] ⚠️ theirVideo.play() failed:', err.message);
      });
    };
    tryPlay();
    theirVideo.onloadedmetadata = tryPlay;
    theirVideo.oncanplay = tryPlay;

    // Click per attivare audio (richiesto da autoplay policy quando audio non-muted)
    theirVideo.onclick = (e) => {
      e.stopPropagation();
      theirVideo.muted = !theirVideo.muted;
      console.log('[WebRTC] Muted toggle:', theirVideo.muted);
    };
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('voice-ice', {
        to: userId,
        from: user.id,
        roomId: room.id,
        candidate: event.candidate
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC] 🔗 Connection state (${userId}): ${pc.connectionState}`);
    console.log(`[WebRTC] Ice connection state: ${pc.iceConnectionState}`);
    console.log(`[WebRTC] Signaling state: ${pc.signalingState}`);
    
    if (pc.connectionState === 'connected') {
      console.log('[WebRTC] ✅ Connessione stabilita! I track dovrebbero arrivare ora...');
    }
    
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
      console.warn('[WebRTC] ⚠️ Connessione persa, chiudo peer connection');
      closePeerConnection(userId);
    }
  };
  
  pc.oniceconnectionstatechange = () => {
    console.log(`[WebRTC] 🧊 ICE state (${userId}): ${pc.iceConnectionState}`);
  };
  
  pc.onsignalingstatechange = () => {
    console.log(`[WebRTC] Signaling state (${userId}): ${pc.signalingState}`);
  };

  return pc;
}

// Usata dall'INITIATOR per avviare la connessione (crea offer e lo invia)
async function createPeerConnection(userId) {
  try {
    // ⚠️ CRITICO: Verifica che localStream sia ready PRIMA di creare offer
    if (!localStream) {
      console.error('[WebRTC] 🔴 ERRORE: localStream è null - non posso creare offer!');
      showToast('❌ Errore: telecamera non disponibile');
      return;
    }
    
    // Glare prevention: se entrambi i lati provano a iniziare contemporaneamente,
    // solo l'utente con id "minore" (lex) inizia. L'altro aspetta l'offer.
    if (String(user.id) > String(userId)) {
      console.log(`[WebRTC] ⏳ Glare prevention: aspetto offer da ${userId} (id maggiore)`);
      return;
    }

    console.log(`[WebRTC] 📤 Sto creando offer per ${userId}...`);
    const pc = setupPeerConnection(userId);

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);

    socket.emit('voice-offer', {
      to: userId,
      from: user.id,
      roomId: room.id,
      offer: pc.localDescription
    });

    console.log(`[WebRTC] ✅ Offer inviato a ${userId}`);

  } catch (err) {
    console.error('[WebRTC] 🔴 Errore createPeerConnection:', err);
    showToast('❌ Errore connessione video');
  }
}

function closePeerConnection(userId) {
  const pc = peerConnections[userId];
  if (pc) {
    pc.close();
    delete peerConnections[userId];
    console.log(`[WebRTC] Connessione chiusa: ${userId}`);
  }
}

// Helper: applica ICE candidates buffered dopo che setRemoteDescription è andata a buon fine
async function flushPendingIce(pc, userId) {
  if (!pc._pendingIce || !pc._pendingIce.length) return;
  const pending = pc._pendingIce.splice(0);
  for (const c of pending) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    } catch (e) {
      console.warn(`[WebRTC] addIceCandidate (buffered) fallito per ${userId}:`, e.message);
    }
  }
}

// Socket.io handlers per WebRTC — wrappati in funzione per essere ri-registrati
// se socket viene ricreato (es. su reconnect). Chiamata da connectSocket().
function registerWebRTCHandlers(sock) {
  console.log('[WebRTC] Registering socket handlers su socket', sock.id || '(not-connected-yet)');

  sock.on('voice-offer', async (data) => {
  try {
    const { from, offer } = data;
    console.log(`[WebRTC] Ricevuto offer da ${from}`);

    // CALLEE path: crea il pc SENZA generare offer (era il bug: createPeerConnection
    // creava un offer concorrente causando glare e setRemoteDescription falliva).
    const pc = setupPeerConnection(from);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushPendingIce(pc, from);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('voice-answer', {
      to: from,
      from: user.id,
      roomId: room.id,
      answer: pc.localDescription
    });

    console.log(`[WebRTC] Answer inviato a ${from}`);
  } catch (err) {
    console.error('[WebRTC] Errore processing offer:', err);
  }
});

  sock.on('voice-answer', async (data) => {
  try {
    const { from, answer } = data;
    console.log(`[WebRTC] Ricevuto answer da ${from}`);

    const pc = peerConnections[from];
    if (pc && pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingIce(pc, from);
      console.log(`[WebRTC] Remote description settata da ${from}`);
    } else if (pc) {
      console.warn(`[WebRTC] Answer ignorato, signalingState=${pc.signalingState}`);
    }
  } catch (err) {
    console.error('[WebRTC] Errore processing answer:', err);
  }
});

  sock.on('voice-ice', async (data) => {
  try {
    const { from, candidate } = data;
    const pc = peerConnections[from];

    if (!pc || !candidate) return;

    // Se remoteDescription non è ancora settata, bufferizza il candidate
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
      pc._pendingIce = pc._pendingIce || [];
      pc._pendingIce.push(candidate);
      return;
    }

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error('[WebRTC] Errore aggiungendo ICE:', err);
  }
});

} // fine registerWebRTCHandlers

// Se socket esiste gia' al momento del parsing (script-load tardivo), registra subito
if (typeof socket !== 'undefined' && socket) {
  try { registerWebRTCHandlers(socket); } catch(e) { console.warn('[WebRTC] post-load register failed:', e); }
}

// ══ VIDEO QUALITY SELECTOR ══
var currentQuality = 'auto';
function toggleQualityMenu() {
  const menu = document.getElementById('qualityMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function setVideoQuality(quality) {
  currentQuality = quality;
  document.getElementById('qualityBtn').textContent = quality === 'auto' ? 'Auto' : quality + 'p';
  document.getElementById('qualityMenu').style.display = 'none';
  console.log('[Video] Quality set to:', quality);
  showToast(`📺 Qualità: ${quality === 'auto' ? 'Auto' : quality + 'p'}`);
}

// ══ SCREENSHOT VIDEO ══
function screenshotVideo() {
  const video = document.getElementById('theirVideo');
  if(!video || !video.srcObject) { showToast('❌ Nessun video in streaming'); return; }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kouverte-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📸 Screenshot salvato!');
  }, 'image/png');
}

// ══ BACKGROUND BLUR ══
var videoBlurEnabled = false;
function toggleVideoBlur() {
  const myVideo = document.getElementById('myVideo');
  if(!myVideo) return;

  videoBlurEnabled = !videoBlurEnabled;
  const btn = document.getElementById('blurBtn');

  if(videoBlurEnabled) {
    myVideo.style.filter = 'blur(12px)';
    btn.style.background = 'rgba(0,212,255,0.4)';
    showToast('🌫️ Sfocatura attiva');
  } else {
    myVideo.style.filter = 'none';
    btn.style.background = 'rgba(0,212,255,0.2)';
    showToast('📷 Video normale');
  }
}

function stopAllWebRTC() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  Object.keys(peerConnections).forEach(userId => {
    closePeerConnection(userId);
  });
  
  selectedUserId = null;
  console.log('[WebRTC] Tutte le connessioni chiuse');
}

function renderUsersPanel() {
  const container = document.getElementById('usersScrollContainer');
  if (!container || !room) return;

  container.innerHTML = '';

  const usersMap = chatRoomUsers[room.id];
  if (!usersMap || usersMap.size === 0) {
    container.innerHTML = '<div style="padding: 12px; color: #9ca3af; white-space: nowrap;">📭 Nessun altro utente in stanza. Aspetta che entrino o invita amici!</div>';
    // Aggiorna label video
    const theirLabel = document.getElementById('theirVideoLabel');
    if (theirLabel) theirLabel.textContent = 'Aspetto qualcuno...';
    return;
  }

  let firstOtherUser = null;

  usersMap.forEach((userObj, socketId) => {
    if (userObj.id === user.id) return;

    // Salva il primo utente per auto-select
    if (!firstOtherUser) firstOtherUser = userObj;

    const chip = document.createElement('div');
    chip.className = 'user-chip';
    chip.setAttribute('data-user-id', userObj.id);
    chip.setAttribute('data-socket-id', socketId);

    // Cornice se ce l'ha
    const ufr = userObj.activeFrame || userObj.frame || 'none';
    const avatar = document.createElement('div');
    avatar.className = 'user-chip-avatar' + (ufr !== 'none' ? ' frame-' + ufr : '');
    if (userObj.color) avatar.style.background = userObj.color + '33';
    avatar.textContent = userObj.face || '🎭';

    const name = document.createElement('div');
    name.className = 'user-chip-name';
    name.textContent = (userObj.name || 'Anonimo').substring(0, 10);

    const onlineDot = document.createElement('div');
    onlineDot.className = 'user-chip-online-dot';

    const camIndicator = document.createElement('div');
    camIndicator.className = 'user-chip-cam-indicator';
    camIndicator.textContent = '🎥';
    camIndicator.style.display = webrtcEnabled ? 'flex' : 'none';
    camIndicator.title = 'Tocca per video chat';

    chip.appendChild(avatar);
    chip.appendChild(name);
    chip.appendChild(onlineDot);
    chip.appendChild(camIndicator);

    chip.addEventListener('click', () => selectUser(userObj.id));

    container.appendChild(chip);
  });

  // AUTO-CONNECT: se WebRTC ok e nessun utente selezionato, auto-collega al primo
  if (webrtcEnabled && localStream && firstOtherUser && !selectedUserId) {
    console.log('[WebRTC] Auto-connect al primo utente:', firstOtherUser.id);
    setTimeout(() => selectUser(firstOtherUser.id), 800);
  }
}

// ══ ROOMS ══
// ══════════════════════════════════════════
// CHAT MODES: ephemeral, effects, music, voice, bot, radar
// ══════════════════════════════════════════
var chatModes = {
  ephemeral: false,
  effects: null,  // 'rain'|'glitch'|'storm'
  music: null,
  voice: false,
  bot: false,
  radar: false
};
var botTimer = null;
var effectsLayer = null;

// ── 1. CHAT EFFIMERA: messaggi spariscono dopo 30 secondi
function toggleEphemeralChat(){
  chatModes.ephemeral = !chatModes.ephemeral;
  document.getElementById('modeEphemeral')?.classList.toggle('active', chatModes.ephemeral);
  showToast(chatModes.ephemeral ? '⏱️ Modalità Chat Effimera attiva (msg in 30s)' : '⏱️ Chat normale');
}

// ── 2. EFFETTI EVENTO: pioggia neon, glitch, cyberstorm
var EFFECT_PRESETS = ['rain','glitch','storm'];
var currentEffectIdx = -1;
function toggleChatEffects(){
  currentEffectIdx++;
  if (currentEffectIdx >= EFFECT_PRESETS.length) currentEffectIdx = -1;
  chatModes.effects = currentEffectIdx >= 0 ? EFFECT_PRESETS[currentEffectIdx] : null;
  document.getElementById('modeEffects')?.classList.toggle('active', !!chatModes.effects);
  applyChatEffects();
  if (chatModes.effects) {
    const names = { rain:'🌧️ Pioggia Neon', glitch:'⚡ Glitch', storm:'🌪️ CyberStorm' };
    showToast(names[chatModes.effects] + ' attivo');
  } else {
    showToast('🎬 Effetti disattivati');
  }
}

function applyChatEffects(){
  // Rimuovi vecchio layer
  if (effectsLayer && effectsLayer.parentNode) effectsLayer.parentNode.removeChild(effectsLayer);
  effectsLayer = null;
  if (!chatModes.effects) return;

  const container = document.getElementById('chatMsgs');
  if (!container || !container.parentNode) return;

  effectsLayer = document.createElement('div');
  effectsLayer.className = 'chat-effects-layer';
  container.parentNode.style.position = 'relative';
  container.parentNode.appendChild(effectsLayer);

  if (chatModes.effects === 'rain') {
    for (let i = 0; i < 30; i++) {
      const d = document.createElement('div');
      const cls = ['','p','v'][Math.floor(Math.random()*3)];
      d.className = 'fx-rain-drop ' + cls;
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = (0.6 + Math.random() * 1.4) + 's';
      d.style.animationDelay = (Math.random() * 2) + 's';
      effectsLayer.appendChild(d);
    }
  } else if (chatModes.effects === 'glitch') {
    const g = document.createElement('div');
    g.className = 'fx-glitch';
    effectsLayer.appendChild(g);
  } else if (chatModes.effects === 'storm') {
    // Bolts random ogni 0.5-2 sec
    if (effectsLayer._stormTimer) clearInterval(effectsLayer._stormTimer);
    effectsLayer._stormTimer = setInterval(() => {
      if (!effectsLayer || !effectsLayer.parentNode) return;
      const b = document.createElement('div');
      b.className = 'fx-storm-bolt';
      b.style.left = (10 + Math.random() * 80) + '%';
      b.style.top = (10 + Math.random() * 50) + '%';
      effectsLayer.appendChild(b);
      setTimeout(() => b.remove(), 500);
    }, 500 + Math.random() * 1500);
    // Pioggia leggera di fondo
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('div');
      d.className = 'fx-rain-drop v';
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = '1s';
      d.style.animationDelay = (Math.random() * 2) + 's';
      d.style.opacity = '0.4';
      effectsLayer.appendChild(d);
    }
  }
}

// ── 3. MUSIC: stazioni lo-fi (audio nascosti via YouTube/HTML5)
var MUSIC_STATIONS = [
  { id:'off',    label:'🔇 Spento',         icon:'🔇', url:null },
  { id:'lofi',   label:'☕ Lo-Fi Chill',     icon:'☕', url:'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1' },
  { id:'jazz',   label:'🎷 Jazz Notturno',   icon:'🎷', url:'https://www.youtube.com/embed/Dx5qFachd3A?autoplay=1' },
  { id:'piano',  label:'🎹 Piano Relax',     icon:'🎹', url:'https://www.youtube.com/embed/4xDzrJKXOOY?autoplay=1' },
  { id:'synth',  label:'🌃 Synthwave',       icon:'🌃', url:'https://www.youtube.com/embed/EHFsM2HRpkk?autoplay=1' },
  { id:'rain',   label:'🌧️ Pioggia',         icon:'🌧️', url:'https://www.youtube.com/embed/q76bMs-NwRk?autoplay=1' },
];

function toggleRoomMusic(){
  const w = document.getElementById('musicWidget');
  if (!w) return;
  if (w.classList.contains('show')) {
    closeMusicWidget();
    return;
  }
  // Popola stazioni
  const sel = document.getElementById('musicStations');
  if (sel) {
    sel.innerHTML = MUSIC_STATIONS.map(s => `
      <div class="music-station ${chatModes.music === s.id ? 'active' : ''}" onclick="playMusicStation('${s.id}')">
        <span>${s.icon}</span><span>${s.label}</span>
      </div>
    `).join('');
  }
  w.classList.add('show');
  document.getElementById('modeMusic')?.classList.add('active');
}

function closeMusicWidget(){
  document.getElementById('musicWidget')?.classList.remove('show');
  document.getElementById('modeMusic')?.classList.toggle('active', !!chatModes.music && chatModes.music !== 'off');
}

function playMusicStation(stationId){
  const s = MUSIC_STATIONS.find(x => x.id === stationId);
  if (!s) return;
  chatModes.music = stationId === 'off' ? null : stationId;

  // Rimuovi vecchio iframe
  const old = document.getElementById('musicPlayer');
  if (old) old.remove();

  if (s.url) {
    const iframe = document.createElement('iframe');
    iframe.id = 'musicPlayer';
    iframe.src = s.url;
    iframe.allow = 'autoplay';
    iframe.style.cssText = 'position:fixed;width:1px;height:1px;left:-100px;top:-100px;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);
    showToast(s.icon + ' Musica: ' + s.label);
  } else {
    showToast('🔇 Musica spenta');
  }
  // Re-render
  toggleRoomMusic(); toggleRoomMusic();
}

// ── 4. VOICE MODE: WebRTC audio-only
function toggleVoiceMode(){
  chatModes.voice = !chatModes.voice;
  document.getElementById('modeVoice')?.classList.toggle('active', chatModes.voice);
  if (chatModes.voice) {
    // Disabilita video, attiva solo audio
    if (typeof toggleCamera === 'function' && localStream && localStream.getVideoTracks().some(t => t.enabled)) {
      toggleCamera();
    }
    showToast('🎙️ Modalità VOICE: solo audio, niente video');
  } else {
    showToast('📹 Video riabilitato');
    if (typeof toggleCamera === 'function' && localStream && !localStream.getVideoTracks().some(t => t.enabled)) {
      toggleCamera();
    }
  }
}

// ── 5. BOT ASSIST: parla quando c'è silenzio
var BOT_PHRASES = [
  '👋 Ciao a tutti! Come va?',
  '🎯 Curiosità: lo sapevate che il KOUVERTE significa "velo" in francese?',
  '💬 Suggerimento: cliccate sul nome di un utente per vedere il profilo!',
  '🎲 Volete provare il Match Anonimo? È nel menu Continua!',
  '🎁 Avete aperto la cassa premio oggi? È nel menu!',
  '🌍 In quale stanza vi piacerebbe creare un evento?',
  '💎 Lo Shop ha cornici e effetti nickname premium ora!',
  '🔥 Avete notato il nuovo feed live in home? Sempre attivo!',
  '⏱️ Provate la modalità chat effimera (icona orologio in alto)',
  '🎵 Volete musica di sottofondo? Tocchiamo l\'icona musica!',
  '✨ Qualcuno ha provato ad acquistare bolle chat animate?',
];
var BOT_USER = { id:'bot_kv', name:'KouvBot', color:'#06b6d4', face:'🤖', isPremium:false, msgCount:9999 };
var lastChatActivity = Date.now();

function toggleBotAssist(){
  chatModes.bot = !chatModes.bot;
  document.getElementById('modeBot')?.classList.toggle('active', chatModes.bot);
  if (botTimer) { clearInterval(botTimer); botTimer = null; }
  if (chatModes.bot) {
    showToast('🤖 Bot anti-silenzio attivo (locale)');
    botTimer = setInterval(() => {
      const silenceMs = Date.now() - lastChatActivity;
      if (silenceMs > 60000) { // 60 secondi di silenzio
        injectBotMessage();
        lastChatActivity = Date.now();
      }
    }, 15000);
  } else {
    showToast('🔕 Bot disattivato');
  }
}

function injectBotMessage(){
  const text = BOT_PHRASES[Math.floor(Math.random() * BOT_PHRASES.length)];
  const c = document.getElementById('chatMsgs');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'mrow bot-msg';
  row.style.position = 'relative';
  row.innerHTML = `
    <div class="mavatar" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;margin-top:1px">🤖</div>
    <div class="mbody">
      <div class="mline">
        <span class="mname">KouvBot</span><span style="color:#06b6d4;margin-right:5px">:</span>
        <span class="mtext">${esc(text)}</span>
      </div>
      <div class="mtime">ora</div>
    </div>
  `;
  c.appendChild(row);
  scrollBot();
}

// ── 6. RADAR MODE: utenti "vicini" (city-level)
function openRadarMode(){
  document.getElementById('modeRadar')?.classList.toggle('active', true);
  let modal = document.getElementById('radarModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'radarModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) { modal.classList.remove('show'); document.getElementById('modeRadar')?.classList.remove('active'); } };
    document.body.appendChild(modal);
  }

  // Ottieni utenti reali della stanza corrente come "vicini" (privacy-safe)
  let nearbyUsers = [];
  if (typeof room === 'object' && room && typeof chatRoomUsers === 'object' && chatRoomUsers[room.id]) {
    chatRoomUsers[room.id].forEach((u, sid) => {
      if (u.id !== user?.id) {
        nearbyUsers.push({
          name: u.name || 'Anonimo',
          face: u.face || '🎭',
          color: u.color || '#00d4ff',
          distance: Math.floor(Math.random() * 1500) + 50, // 50-1550m
          city: ['Stessa città','Vicino a te','Nelle vicinanze'][Math.floor(Math.random()*3)]
        });
      }
    });
  }
  nearbyUsers.sort((a,b) => a.distance - b.distance);

  const list = nearbyUsers.length > 0 ? nearbyUsers.map(u => `
    <div class="friend-row">
      <div class="friend-avatar" style="background:${u.color}33">${u.face}</div>
      <div class="friend-info">
        <div class="friend-name">${esc(u.name)}</div>
        <div class="friend-username">📍 ${u.distance}m · ${u.city}</div>
      </div>
    </div>
  `).join('') : '<div class="friend-empty"><div class="friend-empty-icon">📡</div><div>Nessun utente vicino in questa stanza<br><span style="font-size:10px;color:#9ca3af">Entra in una stanza con altri per vedere il radar</span></div></div>';

  modal.innerHTML = `
    <div class="modal-box" style="max-width:420px">
      <div class="modal-hdr">
        <div class="modal-title">📡 Radar Utenti Vicini</div>
        <button class="modal-close" onclick="document.getElementById('radarModal').classList.remove('show');document.getElementById('modeRadar')?.classList.remove('active')">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:10px;padding:10px;margin-bottom:12px;font-size:11px;color:#cbd5e1">
          🔒 <strong>Privacy:</strong> Le distanze sono approssimate e basate sulla stanza, mai sulla posizione GPS reale.
        </div>
        ${list}
      </div>
    </div>
  `;
  modal.classList.add('show');
}

// Hook quando arriva un messaggio: marca attività + applica effimero
var _originalAppendMsg = null;
function setupChatModesHooks(){
  // Override appendMsg per applicare ephemeral
  if (typeof appendMsg === 'function' && !_originalAppendMsg) {
    _originalAppendMsg = appendMsg;
    window.appendMsg = function(msg){
      _originalAppendMsg(msg);
      if (typeof lastChatActivity !== 'undefined') {
        lastChatActivity = Date.now();
      }
      if (chatModes && chatModes.ephemeral) {
        const c = document.getElementById('chatMsgs');
        const last = c?.lastElementChild;
        if (last && !last.classList.contains('msys') && !last.classList.contains('bot-msg')) {
          last.style.position = 'relative';
          last.classList.add('ephemeral');
          // Auto-remove dopo 30 sec
          setTimeout(() => { if (last.parentNode) last.remove(); }, 30000);
        }
      }
    };
  }
}

// Reset modes quando entri/esci stanza
function resetChatModesOnRoomChange(){
  // Disabilita effetti pesanti se cambi stanza
  if (chatModes.effects) {
    applyChatEffects();
  }
}

// ══════════════════════════════════════════
// SHOP PREMIUM - effetti nick, bolle chat, suoni, ecc.
// ══════════════════════════════════════════
var SHOP_ITEMS = [
  // Effetti nickname
  { id:'nick_glow',    cat:'Effetti Nickname', emoji:'✨', name:'Nick Glow',     desc:'Il tuo nome brilla soft',          price:50,  type:'nickFx', val:'glow' },
  { id:'nick_fire',    cat:'Effetti Nickname', emoji:'🔥', name:'Nick Fuoco',    desc:'Nome in fiamme animate',           price:120, type:'nickFx', val:'fire' },
  { id:'nick_rainbow', cat:'Effetti Nickname', emoji:'🌈', name:'Nick Rainbow',  desc:'Colori arcobaleno scorrevoli',     price:200, type:'nickFx', val:'rainbow' },
  { id:'nick_neon',    cat:'Effetti Nickname', emoji:'💎', name:'Nick Neon',     desc:'Effetto cyberpunk lampeggiante',   price:180, type:'nickFx', val:'neon' },
  { id:'nick_pulse',   cat:'Effetti Nickname', emoji:'💗', name:'Nick Pulse',    desc:'Pulsazioni morbide',               price:60,  type:'nickFx', val:'pulse' },
  { id:'nick_vip',     cat:'Effetti Nickname', emoji:'👑', name:'Nick VIP Gold', desc:'Effetto dorato esclusivo',         price:500, type:'nickFx', val:'vip', rare:true },

  // Bolle chat
  { id:'bub_gradient', cat:'Bolle Chat',       emoji:'💬', name:'Bolla Gradient',desc:'Sfumature animate',                price:80,  type:'bubble', val:'gradient' },
  { id:'bub_neon',     cat:'Bolle Chat',       emoji:'🌟', name:'Bolla Neon',    desc:'Bordi luminescenti cyan',          price:150, type:'bubble', val:'neon' },
  { id:'bub_fire',     cat:'Bolle Chat',       emoji:'🔥', name:'Bolla Fuoco',   desc:'Messaggi in fiamme',               price:180, type:'bubble', val:'fire' },
  { id:'bub_galaxy',   cat:'Bolle Chat',       emoji:'🌌', name:'Bolla Galassia',desc:'Sfondo spaziale animato',          price:220, type:'bubble', val:'galaxy' },
  { id:'bub_rainbow',  cat:'Bolle Chat',       emoji:'🎨', name:'Bolla Rainbow', desc:'Tutti i colori scorrevoli',        price:300, type:'bubble', val:'rainbow', rare:true },

  // Suoni entrata
  { id:'snd_pop',      cat:'Suoni Entrata',    emoji:'🔔', name:'Pop',           desc:'Pop discreto',                     price:40,  type:'enterSound', val:'pop' },
  { id:'snd_chime',    cat:'Suoni Entrata',    emoji:'🎵', name:'Chime',         desc:'Carillon angelico',                price:60,  type:'enterSound', val:'chime' },
  { id:'snd_magic',    cat:'Suoni Entrata',    emoji:'✨', name:'Magic',         desc:'Suono magico',                     price:80,  type:'enterSound', val:'magic' },
  { id:'snd_boom',     cat:'Suoni Entrata',    emoji:'💥', name:'Boom',          desc:'Entrata epica',                    price:120, type:'enterSound', val:'boom' },

  // Effetti messaggi (particelle)
  { id:'fx_sparkle',   cat:'Effetti Messaggio',emoji:'✨', name:'Scintille',     desc:'Particelle al messaggio',          price:100, type:'msgFx', val:'sparkle' },
  { id:'fx_heart',     cat:'Effetti Messaggio',emoji:'💖', name:'Cuori',         desc:'Cuori volanti',                    price:120, type:'msgFx', val:'heart' },
  { id:'fx_fire',      cat:'Effetti Messaggio',emoji:'🔥', name:'Fuoco',         desc:'Fiamme che salgono',               price:150, type:'msgFx', val:'fire' },
  { id:'fx_star',      cat:'Effetti Messaggio',emoji:'⭐', name:'Stelle',        desc:'Stelle cadenti',                   price:160, type:'msgFx', val:'star' },

  // Temi stanza (cosmetici tutte le tue stanze)
  { id:'theme_dark',   cat:'Temi Stanza',      emoji:'🌑', name:'Dark Velvet',   desc:'Tema scuro profondo',              price:100, type:'roomTheme', val:'dark' },
  { id:'theme_purple', cat:'Temi Stanza',      emoji:'💜', name:'Royal Purple',  desc:'Sfumature reali',                  price:130, type:'roomTheme', val:'purple' },
  { id:'theme_cyber',  cat:'Temi Stanza',      emoji:'🤖', name:'Cyberpunk',     desc:'Neon e griglia',                   price:200, type:'roomTheme', val:'cyber' },
];

function getShopOwned(){
  return new Set(user.shopItems || []);
}

function openShop(){
  closeContinua();
  let modal = document.getElementById('shopModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shopModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }

  const owned = getShopOwned();
  const cats = [...new Set(SHOP_ITEMS.map(i => i.cat))];
  const grid = cats.map(cat => {
    const items = SHOP_ITEMS.filter(i => i.cat === cat);
    return `
      <div class="shop-cat-title">${cat}</div>
      <div class="shop-grid">
        ${items.map(it => {
          const isOwned = owned.has(it.id);
          const isActive = user['active_' + it.type] === it.val;
          return `
            <div class="shop-item ${it.rare?'rare':''} ${isOwned?'owned':''} ${isActive?'active':''}" onclick="shopBuy('${it.id}')">
              ${it.rare ? '<div class="rare-tag">⭐ RARO</div>' : ''}
              ${isActive ? '<div class="active-tag">✓ ATTIVO</div>' : ''}
              <div class="shop-emoji">${it.emoji}</div>
              <div class="shop-name">${it.name}</div>
              <div class="shop-desc">${it.desc}</div>
              <div class="shop-price ${isOwned?'owned':''}">${isOwned ? (isActive ? 'Attivato' : 'Tocca per attivare') : '🪙 ' + it.price}</div>
            </div>`;
        }).join('')}
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px">
      <div class="modal-hdr">
        <div class="modal-title">🛍️ Shop Premium</div>
        <button class="modal-close" onclick="document.getElementById('shopModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="max-height:70vh;overflow-y:auto">
        <div class="shop-coins-bar">
          <span style="font-size:14px;font-weight:600;color:#fbbf24">🪙 ${user.coins||0}</span>
          <span style="font-size:11px;color:#9ca3af">Le tue monete</span>
          <button class="stripe-topup-btn" onclick="openStripeModal()">💳 Ricarica con carta</button>
        </div>
        ${grid}
      </div>
    </div>
  `;
  modal.classList.add('show');
}

function shopBuy(itemId){
  const it = SHOP_ITEMS.find(x => x.id === itemId);
  if (!it) return;
  const owned = getShopOwned();
  if (owned.has(itemId)) {
    // Toggle attiva/disattiva
    const key = 'active_' + it.type;
    if (user[key] === it.val) {
      user[key] = null;
      showToast('❌ ' + it.name + ' disattivato');
    } else {
      user[key] = it.val;
      showToast('✅ ' + it.name + ' attivato!');
    }
    saveUser();
    openShop();
    return;
  }
  // Acquista
  if ((user.coins||0) < it.price) {
    showToast('⚠️ Servono ' + it.price + ' 🪙 (hai ' + (user.coins||0) + '). Chatta per guadagnare!');
    return;
  }
  if (!confirm('Acquistare ' + it.emoji + ' ' + it.name + ' per ' + it.price + ' 🪙?')) return;
  user.coins -= it.price;
  user.shopItems = [...(user.shopItems||[]), itemId];
  user['active_' + it.type] = it.val;
  saveUser();
  updateCoinBar();
  showToast('🎉 Acquistato e attivato: ' + it.name);
  openShop();
}

// ══════════════════════════════════════════
// STRIPE PAYMENTS — ricarica con carta
// ══════════════════════════════════════════
var _stripeModalBuilt = false;

const STRIPE_PACKS_CLIENT = [
  { id:'coins_300',   type:'coins',   coins:300,  eur:'2.99', label:'Starter',      desc:'300 monete',                icon:'🪙', popular:false },
  { id:'coins_900',   type:'coins',   coins:900,  eur:'6.99', label:'Popular',      desc:'900 monete · +10% bonus',   icon:'💰', popular:true  },
  { id:'coins_2500',  type:'coins',   coins:2500, eur:'16.99',label:'Mega',         desc:'2500 monete · +25% bonus',  icon:'💎', popular:false },
  { id:'premium_30',  type:'premium', days:30,    eur:'4.99', label:'Premium 30gg', desc:'Frame · Badge VIP · No limiti',icon:'👑', popular:false },
  { id:'premium_365', type:'premium', days:365,   eur:'39.99',label:'VIP Annuale',  desc:'Un anno completo · Miglior valore',icon:'🌟', popular:false }
];

function openStripeModal(){
  let modal = document.getElementById('stripeModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'stripeModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }

  const packsHtml = STRIPE_PACKS_CLIENT.map(p => {
    const badgeHtml = p.popular ? '<div class="stripe-pack-badge">⭐ Più scelto</div>' : '';
    const coinInfo  = p.type === 'coins'   ? `<div class="stripe-pack-coins">${p.icon} ${p.coins} monete</div>` : '';
    const premInfo  = p.type === 'premium' ? `<div class="stripe-pack-coins">${p.icon} ${p.days} giorni</div>` : '';
    return `
      <div class="stripe-pack ${p.popular?'popular':''}" onclick="buyWithStripe('${p.id}')">
        ${badgeHtml}
        <div class="stripe-pack-label">${p.label}</div>
        ${coinInfo}${premInfo}
        <div class="stripe-pack-desc">${p.desc}</div>
        <div class="stripe-pack-price">€${p.eur}</div>
        <button class="stripe-pack-btn">Acquista</button>
      </div>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box stripe-modal-box">
      <div class="modal-hdr">
        <div class="modal-title">💳 Ricarica con Carta</div>
        <button class="modal-close" onclick="document.getElementById('stripeModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body">
        <p class="stripe-modal-sub">Pagamento sicuro via Stripe · Carta di credito / debito / Apple Pay / Google Pay</p>
        <div class="stripe-packs-grid">${packsHtml}</div>
        <p class="stripe-modal-note">🔒 I tuoi dati di pagamento non vengono mai salvati sui nostri server.<br>Gestito da <strong>Stripe</strong> — lo standard sicurezza dei pagamenti online.</p>
      </div>
    </div>
  `;
  modal.classList.add('show');
}

// Ricarica monete + stato premium dal server (usato dopo ritorno da Stripe)
async function loadUserFromServer(){
  if(!user?.id) return;
  try {
    const r = await fetch('/api/stripe/balance?userId=' + encodeURIComponent(user.id));
    if(!r.ok) return;
    const d = await r.json();
    if(typeof d.coins === 'number'){
      user.coins = d.coins;
      updateCoinBar();
    }
    if(d.isPremium){
      user.isPremium = true;
      user.premExpiry = d.premExpiry;
    }
    saveUser();
    updateProfileUI && updateProfileUI();
  } catch(e){ /* silent */ }
}

async function buyWithStripe(packId){
  if(!user?.id){ showToast('❌ Accedi prima'); return; }
  const pack = STRIPE_PACKS_CLIENT.find(p => p.id === packId);
  if(!pack) return;
  showToast('⏳ Apertura pagamento…');
  try {
    const r = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId, userId: user.id })
    });
    const data = await r.json();
    if(data.url){
      window.location.href = data.url;
    } else {
      showToast('❌ ' + (data.error || 'Errore pagamento'));
    }
  } catch(e) {
    showToast('❌ Errore connessione: ' + e.message);
  }
}

// Gestione ritorno da Stripe (success/cancel)
function checkStripeReturn(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('stripe_ok') === '1'){
    const packId = params.get('pack') || '';
    const pack = STRIPE_PACKS_CLIENT.find(p => p.id === packId);
    // Pulisci URL
    history.replaceState({}, '', window.location.pathname);
    // Mostra toast con dettaglio
    if(pack){
      if(pack.type === 'coins'){
        showToast(`🎉 Pagamento riuscito! +${pack.coins} monete in arrivo…`);
        // Ricarica dati utente dal server dopo 2s (il webhook ha già accreditato)
        setTimeout(() => loadUserFromServer && loadUserFromServer(), 2000);
      } else {
        showToast(`👑 Premium attivato! ${pack.days} giorni di accesso VIP.`);
        setTimeout(() => loadUserFromServer && loadUserFromServer(), 2000);
      }
    } else {
      showToast('✅ Pagamento riuscito! Le monete verranno accreditate a breve.');
    }
  } else if(params.get('stripe_cancel') === '1'){
    history.replaceState({}, '', window.location.pathname);
    showToast('❌ Pagamento annullato');
  }
}

// ══════════════════════════════════════════════════════════════
// 🏆 CLASSIFICA CITTÀ LIVE
// ══════════════════════════════════════════════════════════════
var _cityStats = [];
const CITY_LABELS = {
  napoli:'⚓ Napoli', roma:'🏛️ Roma', milano:'🏙️ Milano',
  palermo:'☀️ Palermo', sicilia:'🏝️ Sicilia', campania:'🌋 Campania',
  italia:'🇮🇹 Italia', mondo:'🌍 Mondo', confessionale:'🕯️ Confessionale',
  flirt:'🌹 Flirt'
};
const CITY_COLORS = {
  napoli:'#06b6d4', roma:'#f59e0b', milano:'#60a5fa', palermo:'#f97316',
  sicilia:'#eab308', campania:'#ef4444', italia:'#10b981', mondo:'#a78bfa',
  confessionale:'#8b5cf6', flirt:'#ff2d6e'
};

function initCityLeaderboard(){
  // Fetch iniziale
  fetch('/api/leaderboard/cities')
    .then(r => r.json()).then(d => { _cityStats = d.cities || []; renderCityLeaderboard(); })
    .catch(() => {});
  // Update real-time via socket
  if(socket) socket.on('city-stats-update', (d) => { _cityStats = d.cities || []; renderCityLeaderboard(); });
}

function renderCityLeaderboard(){
  const el = document.getElementById('cityLeaderboard');
  if(!el || !_cityStats.length) return;
  el.style.display = 'block';
  const medals = ['🥇','🥈','🥉'];
  const today = new Date().toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'});
  el.innerHTML = `
    <div class="city-lb-header">
      <div class="city-lb-title">🔥 Stanze più attive oggi</div>
      <div class="city-lb-date">${today}</div>
    </div>
    <div class="city-lb-rows">
    ${_cityStats.slice(0,5).map((c,i) => {
      const col = CITY_COLORS[c.id] || '#00d4ff';
      const label = CITY_LABELS[c.id] || c.id;
      const width = Math.max(8, Math.round((_cityStats[0]?.msgs || 1) > 0 ? (c.msgs / _cityStats[0].msgs) * 100 : 0));
      return `<div class="city-lb-row" onclick="enterRoom('${c.id}')">
        <span class="city-lb-medal">${medals[i] || `<span style='font-size:11px;color:rgba(255,255,255,.35)'>#${i+1}</span>`}</span>
        <span class="city-lb-name">${label}</span>
        <div class="city-lb-bar-wrap"><div class="city-lb-bar" style="width:${width}%;background:${col}"></div></div>
        <span class="city-lb-count">${c.msgs}</span>
      </div>`;
    }).join('')}
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// 🌙 KOUVERTE NOTTE
// ══════════════════════════════════════════════════════════════
var _notteSession = null;
var _notteCountdownTimer = null;
var _notteVotes = {}; // msgId → boolean (voted by me)

function initKouverteNotte(){
  fetch('/api/notte/status').then(r => r.json()).then(d => {
    if(d.active){
      _notteSession = { theme: d.theme, endsAt: d.endsAt, sessionId: d.sessionId };
      showNotteBanner(true);
    } else {
      showNotteBanner(false, d.nextAt);
    }
  }).catch(() => {});

  if(socket){
    socket.on('notte-start', (d) => {
      _notteSession = d;
      _notteVotes = {};
      showNotteBanner(true);
      showNotteEntrance(d.theme);
    });
    socket.on('notte-end', (d) => {
      _notteSession = null;
      hideNotteBanner();
      showNotteEnding(d);
      // Se l'utente è nella stanza notte, torna alla home
      if(room?.id === 'notte') setTimeout(() => showScreen('home'), 3000);
    });
    socket.on('notte-message', (msg) => {
      appendNotteMessage(msg);
    });
    socket.on('notte-vote-update', (d) => {
      const vEl = document.getElementById('nv_' + d.msgId);
      if(vEl) vEl.textContent = '❤️ ' + d.votes;
    });
  }
}

function showNotteBanner(active, nextAt){
  let banner = document.getElementById('notteBanner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'notteBanner';
    banner.className = 'notte-banner';
    document.getElementById('home')?.prepend(banner);
  }
  if(active && _notteSession){
    banner.innerHTML = `
      <div class="notte-banner-glow"></div>
      <div class="notte-banner-inner">
        <div class="notte-icon">🌙</div>
        <div class="notte-info">
          <div class="notte-title">Kouverte Notte è LIVE!</div>
          <div class="notte-theme">${esc(_notteSession.theme)}</div>
        </div>
        <div class="notte-timer" id="notteTimer"></div>
        <button class="notte-enter-btn" onclick="enterNotteRoom()">Entra →</button>
      </div>`;
    banner.classList.add('active');
    startNotteCountdown(_notteSession.endsAt);
  } else if(nextAt){
    banner.innerHTML = `
      <div class="notte-banner-inner preview">
        <div class="notte-icon">🌙</div>
        <div class="notte-info">
          <div class="notte-title">Kouverte Notte</div>
          <div class="notte-theme">Ogni sera alle 23:00 — una domanda, tutti rispondono</div>
        </div>
        <div class="notte-next" id="notteNext"></div>
      </div>`;
    banner.classList.remove('active');
    startNotteNextCountdown(nextAt);
  } else {
    banner.style.display = 'none';
  }
}

function hideNotteBanner(){
  const b = document.getElementById('notteBanner');
  if(b) b.classList.remove('active');
}

function startNotteCountdown(endsAt){
  clearInterval(_notteCountdownTimer);
  _notteCountdownTimer = setInterval(() => {
    const left = endsAt - Date.now();
    const el = document.getElementById('notteTimer');
    if(!el){ clearInterval(_notteCountdownTimer); return; }
    if(left <= 0){ el.textContent = '🔒 Chiusa'; clearInterval(_notteCountdownTimer); return; }
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if(left < 60000) el.classList.add('urgent');
  }, 1000);
}

function startNotteNextCountdown(nextAt){
  clearInterval(_notteCountdownTimer);
  _notteCountdownTimer = setInterval(() => {
    const left = nextAt - Date.now();
    const el = document.getElementById('notteNext');
    if(!el || left <= 0){ clearInterval(_notteCountdownTimer); return; }
    const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000);
    el.textContent = h > 0 ? `tra ${h}h ${m}m` : `tra ${m} min`;
  }, 30000);
  const el = document.getElementById('notteNext');
  if(el){
    const left = nextAt - Date.now();
    const h = Math.floor(left/3600000), m = Math.floor((left%3600000)/60000);
    el.textContent = h > 0 ? `tra ${h}h ${m}m` : `tra ${m} min`;
  }
}

function showNotteEntrance(theme){
  const overlay = document.createElement('div');
  overlay.className = 'notte-entrance-overlay';
  overlay.innerHTML = `
    <div class="notte-entrance-content">
      <div class="notte-entrance-moon">🌙</div>
      <div class="notte-entrance-title">Kouverte Notte</div>
      <div class="notte-entrance-theme">${esc(theme)}</div>
      <div class="notte-entrance-sub">La notte è iniziata. Sei anonimo.</div>
      <button class="notte-entrance-btn" onclick="this.closest('.notte-entrance-overlay').remove();enterNotteRoom()">Entra nella Notte →</button>
      <button class="notte-entrance-skip" onclick="this.closest('.notte-entrance-overlay').remove()">Più tardi</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 50);
}

function showNotteEnding(data){
  const overlay = document.createElement('div');
  overlay.className = 'notte-ending-overlay';
  const winHtml = data.winner
    ? `<div class="notte-end-winner">
        <div class="notte-end-winner-label">⭐ Messaggio vincitore</div>
        <div class="notte-end-winner-text">"${esc(data.winner.text)}"</div>
        <div class="notte-end-winner-votes">❤️ ${data.winner.votes} cuori · +150 monete</div>
      </div>`
    : '<div class="notte-end-nomsg">Stanotte nessuno ha risposto…</div>';
  overlay.innerHTML = `
    <div class="notte-ending-content">
      <div class="notte-ending-moon">🌙✨</div>
      <div class="notte-ending-title">La Notte è finita</div>
      <div class="notte-ending-stats">${data.participants || 0} anonimi · ${data.totalMessages || 0} messaggi</div>
      ${winHtml}
      <div class="notte-end-reward">+20 monete per aver partecipato!</div>
      <button onclick="this.closest('.notte-ending-overlay').remove()" class="notte-entrance-btn">Grazie 🌙</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 50);
  setTimeout(() => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 500); }, 8000);
}

function enterNotteRoom(){
  if(!_notteSession){ showToast('🌙 La Notte non è ancora attiva'); return; }
  enterRoom('notte');
}

function appendNotteMessage(msg){
  const container = document.getElementById('notte-messages');
  if(!container) return;
  const isMe = msg.userId === (user.serverId || user.id);
  const el = document.createElement('div');
  el.className = `notte-msg ${isMe ? 'me' : ''}`;
  el.id = 'nmsg_' + msg.id;
  el.innerHTML = `
    <div class="notte-msg-face">${esc(msg.face)}</div>
    <div class="notte-msg-body">
      <div class="notte-msg-text">${esc(msg.text)}</div>
    </div>
    <button class="notte-vote-btn" id="nv_${msg.id}" onclick="voteNotteMsg('${msg.id}')">❤️ ${msg.votes||0}</button>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function sendNotteMessage(){
  const inp = document.getElementById('notteInput');
  const text = inp?.value.trim();
  if(!text || !_notteSession || !socket) return;
  socket.emit('notte-message', { userId: user.serverId||user.id, name: user.name||'Anonimo', face: user.face||'🎭', color: user.color||'#00d4ff', text });
  inp.value = '';
}

function voteNotteMsg(msgId){
  if(!socket || !_notteSession) return;
  const already = _notteVotes[msgId];
  _notteVotes[msgId] = !already;
  socket.emit('notte-vote', { msgId, voterId: user.serverId||user.id });
  const btn = document.getElementById('nv_' + msgId);
  if(btn) btn.classList.toggle('voted', !already);
}

function openNotteModal(){
  if(!_notteSession){ showToast('🌙 La Notte inizia alle 23:00'); return; }
  let modal = document.getElementById('notteModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'notteModal';
    modal.className = 'notte-fullscreen';
    modal.innerHTML = `
      <div class="notte-header">
        <div class="notte-header-left">
          <span class="notte-live-badge">● LIVE</span>
          <span class="notte-header-title">Kouverte Notte</span>
        </div>
        <div class="notte-header-timer" id="notteModalTimer"></div>
        <button class="notte-close-btn" onclick="document.getElementById('notteModal').classList.remove('open')">✕</button>
      </div>
      <div class="notte-theme-strip" id="notteThemeStrip"></div>
      <div class="notte-messages" id="notte-messages"></div>
      <div class="notte-input-bar">
        <input id="notteInput" placeholder="Rispondi anonimamente…" maxlength="280" onkeydown="if(event.key==='Enter')sendNotteMessage()">
        <button class="notte-send-btn" onclick="sendNotteMessage()">✦</button>
      </div>`;
    document.body.appendChild(modal);
  }
  const themeEl = document.getElementById('notteThemeStrip');
  if(themeEl && _notteSession) themeEl.textContent = _notteSession.theme;
  modal.classList.add('open');
  startNotteCountdown(_notteSession.endsAt);
  document.getElementById('notteInput')?.focus();
}

// ══════════════════════════════════════════════════════════════
// 📤 SHARE CARD ANONIMA — genera immagine virale per Instagram
// ══════════════════════════════════════════════════════════════
function generateShareCard(text, roomName){
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // Background sfumato scuro
  const bg = ctx.createLinearGradient(0, 0, 1080, 1080);
  bg.addColorStop(0, '#0f1117');
  bg.addColorStop(0.5, '#1a1f3a');
  bg.addColorStop(1, '#0f1117');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1080);

  // Pattern di stelle
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for(let i = 0; i < 120; i++){
    const x = Math.random() * 1080, y = Math.random() * 1080;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }

  // Cerchio decorativo
  const grad = ctx.createRadialGradient(540, 540, 100, 540, 540, 500);
  grad.addColorStop(0, 'rgba(99,91,255,0.12)');
  grad.addColorStop(1, 'rgba(99,91,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(540, 540, 500, 0, Math.PI*2); ctx.fill();

  // Linea orizzontale sopra
  ctx.strokeStyle = 'rgba(99,91,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(100, 200); ctx.lineTo(980, 200); ctx.stroke();

  // Logo Kouverte
  ctx.fillStyle = '#635bff';
  ctx.font = 'bold 42px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KOUVERTE', 540, 170);

  // Stanza
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '28px Inter, sans-serif';
  ctx.fillText(roomName || 'Chat Anonima', 540, 230);

  // Virgolette decorative
  ctx.fillStyle = 'rgba(99,91,255,0.3)';
  ctx.font = 'bold 200px Georgia, serif';
  ctx.fillText('"', 80, 440);

  // Testo del messaggio — a capo automatico
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.textAlign = 'center';
  const words = text.split(' ');
  let line = '', y = 460, lineH = 72;
  const maxW = 860;
  for(const word of words){
    const test = line + (line ? ' ' : '') + word;
    if(ctx.measureText(test).width > maxW && line){
      ctx.fillText(line, 540, y); line = word; y += lineH;
      if(y > 760) break;
    } else line = test;
  }
  if(line) ctx.fillText(line, 540, y);

  // Linea sotto
  ctx.strokeStyle = 'rgba(99,91,255,0.5)';
  ctx.beginPath(); ctx.moveTo(100, 860); ctx.lineTo(980, 860); ctx.stroke();

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Indovina chi sono • kouverte.com', 540, 920);

  // Mascherina anonima
  ctx.font = '56px sans-serif';
  ctx.fillText('🎭', 540, 990);

  return canvas.toDataURL('image/png');
}

async function shareMessage(text, roomName){
  const imgData = generateShareCard(text, roomName);
  const blob = await (await fetch(imgData)).blob();
  const file = new File([blob], 'kouverte-share.png', { type: 'image/png' });

  if(navigator.canShare && navigator.canShare({ files: [file] })){
    await navigator.share({
      title: 'Qualcuno su Kouverte ha detto…',
      text: `"${text.slice(0,60)}" — indovina chi. kouverte.com`,
      files: [file]
    });
  } else {
    // Fallback: download
    const a = document.createElement('a');
    a.href = imgData; a.download = 'kouverte-share.png'; a.click();
    showToast('📥 Immagine salvata! Condividila su Instagram');
  }
}

// ══════════════════════════════════════════════════════════════
// 🎤 PROFILO VOCE — registrazione e riproduzione
// ══════════════════════════════════════════════════════════════
var _voiceRecorder = null;
var _voiceChunks = [];
var _voiceRecording = false;
var _voiceTimeout = null;
const VOICE_NOTE_MAX_SEC = 15;

async function startVoiceNoteRecording(){
  if(_voiceRecording){ stopVoiceNoteRecording(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _voiceChunks = [];
    _voiceRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' });
    _voiceRecorder.ondataavailable = e => { if(e.data.size > 0) _voiceChunks.push(e.data); };
    _voiceRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(_voiceChunks, { type: _voiceRecorder.mimeType });
      const reader = new FileReader();
      reader.onload = e => {
        const audio = e.target.result;
        socket.emit('voice-note-save', { userId: user.serverId||user.id, audio });
        socket.once('voice-note-saved', () => {
          user.voiceNote = audio;
          saveUser();
          renderVoiceNotePlayer('saved');
          showToast('🎤 Nota vocale salvata!');
        });
      };
      reader.readAsDataURL(blob);
    };
    _voiceRecorder.start();
    _voiceRecording = true;
    renderVoiceNotePlayer('recording');
    // Auto-stop dopo 15 secondi
    _voiceTimeout = setTimeout(stopVoiceNoteRecording, VOICE_NOTE_MAX_SEC * 1000);
  } catch(e){
    showToast('❌ Microfono non disponibile: ' + e.message);
  }
}

function stopVoiceNoteRecording(){
  clearTimeout(_voiceTimeout);
  if(_voiceRecorder && _voiceRecorder.state !== 'inactive') _voiceRecorder.stop();
  _voiceRecording = false;
  renderVoiceNotePlayer('processing');
}

function deleteVoiceNote(){
  if(!confirm('Cancellare la nota vocale?')) return;
  socket.emit('voice-note-delete', { userId: user.serverId||user.id });
  delete user.voiceNote;
  saveUser();
  renderVoiceNotePlayer('empty');
  showToast('🗑️ Nota vocale cancellata');
}

function renderVoiceNotePlayer(state){
  const el = document.getElementById('voiceNotePlayer');
  if(!el) return;
  if(state === 'empty'){
    el.innerHTML = `
      <div class="vnp-label">🎤 Nota Vocale Profilo</div>
      <div class="vnp-empty">
        <div class="vnp-empty-icon">🎙️</div>
        <div class="vnp-empty-text">Aggiungi una nota vocale.<br>Chi visita il tuo profilo potrà ascoltarti.</div>
        <button class="vnp-record-btn" onclick="startVoiceNoteRecording()">🎙️ Registra (max 15s)</button>
      </div>`;
  } else if(state === 'recording'){
    let _sec = 0;
    el.innerHTML = `
      <div class="vnp-label">🔴 Registrazione in corso…</div>
      <div class="vnp-recording-ui">
        <div class="vnp-rec-timer" id="vnpRecTimer">0:00</div>
        <div class="vnp-waveform">
          <div class="vnp-wave-bar"></div><div class="vnp-wave-bar"></div>
          <div class="vnp-wave-bar"></div><div class="vnp-wave-bar"></div>
          <div class="vnp-wave-bar"></div><div class="vnp-wave-bar"></div>
          <div class="vnp-wave-bar"></div><div class="vnp-wave-bar"></div>
        </div>
        <button class="vnp-rec-stop" onclick="stopVoiceNoteRecording()">■ Ferma e salva</button>
      </div>`;
    // Tick timer
    if(window._vnpTimerInterval) clearInterval(window._vnpTimerInterval);
    window._vnpTimerInterval = setInterval(() => {
      _sec++;
      const t = document.getElementById('vnpRecTimer');
      if(t) t.textContent = Math.floor(_sec/60)+':'+((_sec%60)+'').padStart(2,'0');
      if(_sec >= VOICE_NOTE_MAX_SEC){ clearInterval(window._vnpTimerInterval); }
    }, 1000);
  } else if(state === 'processing'){
    if(window._vnpTimerInterval) clearInterval(window._vnpTimerInterval);
    el.innerHTML = `<div class="vnp-label">⏳ Elaborazione in corso…</div>`;
  } else if(state === 'saved'){
    if(window._vnpTimerInterval) clearInterval(window._vnpTimerInterval);
    const src = user.voiceNote || user.kvData?.voiceNote || '';
    el.innerHTML = `
      <div class="vnp-label">🎤 Nota Vocale Profilo</div>
      <div class="vnp-saved-ui">
        <button class="vnp-play-btn" id="vnpPlayBtn" onclick="playVoiceNote(this)">▶</button>
        <div class="vnp-saved-info">
          <div class="vnp-saved-label">Nota vocale attiva ✓</div>
          <div class="vnp-saved-hint">Tocca ▶ per ascoltare la tua registrazione</div>
        </div>
        <button class="vnp-del-btn" onclick="deleteVoiceNote()" title="Cancella">🗑️</button>
      </div>`;
    // Store src on the button
    const btn = el.querySelector('#vnpPlayBtn');
    if(btn) btn._vnSrc = src;
  }
}

function playVoiceNote(btnEl){
  const src = (typeof btnEl === 'string') ? btnEl : btnEl?._vnSrc || '';
  if(!src) { showToast('🎤 Nessuna nota vocale disponibile'); return; }
  const existing = document.getElementById('vnpAudio');
  if(existing){ existing.pause(); existing.remove(); }
  const audio = new Audio(src);
  audio.id = 'vnpAudio';
  document.body.appendChild(audio);
  audio.play().catch(() => showToast('❌ Impossibile riprodurre'));
  const btn = typeof btnEl === 'string' ? document.getElementById('vnpPlayBtn') : btnEl;
  if(btn){
    btn.textContent = '⏸';
    btn.classList.add('playing');
    audio.onended = () => { btn.textContent = '▶'; btn.classList.remove('playing'); };
  }
}

async function playProfileVoiceNote(userId){
  try {
    const r = await fetch('/api/voice-note/' + userId);
    if(!r.ok){ showToast('🎤 Nessuna nota vocale'); return; }
    const d = await r.json();
    const audio = new Audio(d.audio);
    audio.play().catch(() => showToast('❌ Riproduzione non riuscita'));
    showToast('🎤 Nota vocale in riproduzione…');
  } catch(e){ showToast('❌ Errore'); }
}

// ══════════════════════════════════════════════════════════════
// ♠  SCOPA — Carte Napoletane (multiplayer 1vs1)
// ══════════════════════════════════════════════════════════════
var _sc = null;       // game state
var _scSelCard = null; // carta in mano selezionata (id)
var _scSelCap = [];   // id carte tavolo selezionate per cattura
var _scGameId = null;
var _scLobby = null;  // lobby data { tables, queue }
var _scMyQPos = 1;    // posizione in coda

const SC_ICON  = {coppe:'♥',denari:'♦',bastoni:'♣',spade:'♠'};
const SC_COLOR = {coppe:'#f43f5e',denari:'#f59e0b',bastoni:'#22c55e',spade:'#38bdf8'};
const SC_VL    = {1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'F',9:'C',10:'R'};
const SC_VN    = {1:'Asso',2:'Due',3:'Tre',4:'Quattro',5:'Cinque',6:'Sei',7:'Sette',8:'Fante',9:'Cavallo',10:'Re'};
const SC_SN    = {coppe:'Coppe',denari:'Denari',bastoni:'Bastoni',spade:'Spade'};

function openScopaGame(){
  let scr=document.getElementById('scopaScreen');
  if(!scr){
    scr=document.createElement('div');
    scr.id='scopaScreen';
    scr.className='scopa-fs';
    scr.innerHTML=`
      <div class="scopa-hdr">
        <button class="scopa-back" onclick="closeScopaGame()">←</button>
        <div class="scopa-hdr-mid">
          <div class="scopa-hdr-title">♠ SCOPA</div>
          <div class="scopa-hdr-sub">Carte Napoletane</div>
        </div>
        <div class="scopa-hdr-score" id="scHdrScore"></div>
      </div>
      <div class="scopa-body" id="scopaBody"></div>`;
    document.body.appendChild(scr);
  }
  setTimeout(()=>scr.classList.add('show'),30);
  _scSelCard=null; _scSelCap=[];
  scRenderWaiting(1,1);
  registerScopaListeners();
  if(socket?.connected){
    socket.emit('scopa:join',{
      userId:user.serverId||user.id,
      name:user.name||'Anonimo',
      face:user.face||'🎭',
      color:user.color||'#00d4ff'
    });
  }
}

function closeScopaGame(){
  const scr=document.getElementById('scopaScreen');
  if(scr){scr.classList.remove('show');setTimeout(()=>scr.remove(),420);}
  if(socket?.connected) socket.emit('scopa:leave');
  _sc=null; _scSelCard=null; _scSelCap=[]; _scGameId=null; _scLobby=null; _scMyQPos=1;
  window._scopaLR=false;
}

function registerScopaListeners(){
  if(window._scopaLR||!socket) return;
  window._scopaLR=true;
  socket.on('scopa:waiting',({position,total})=>{ _scMyQPos=position; scRenderWaiting(position,total); });
  socket.on('scopa:lobby',(data)=>{ _scLobby=data; if(!_sc){ const myQ=data.queue.find((_,i)=>i+1===_scMyQPos)||data.queue[0]; scRenderWaiting(_scMyQPos, data.queue.length||1); } });
  socket.on('scopa:state',(st)=>{ _sc=st; _scGameId=st.gameId; _scSelCard=null; _scSelCap=[]; scRender(); });
  socket.on('scopa:scopa',({byPlayerId})=>{
    const mine=byPlayerId===(user.serverId||user.id);
    scFlash(mine?'⚡ SCOPA!':'💀 Scopa avversario',mine?'#00ff88':'#ff4466');
  });
  socket.on('scopa:choose',({cardId,options})=>{ _scSelCard=cardId; _scSelCap=[]; scRender(); });
  socket.on('scopa:round-end',(d)=> scRenderRoundEnd(d));
  socket.on('scopa:game-over',(d)=> scRenderGameOver(d));
  socket.on('scopa:opp-left',()=>{ showToast('👋 Avversario abbandonato'); scRenderWaiting(1,1); });
  socket.on('scopa:opp-disconnected',()=>{ showToast('⏳ Avversario disconnesso, attendi 30s...'); });
  socket.on('scopa:opp-reconnected',({name})=>{ showToast('✅ '+name+' riconnesso!'); });
  socket.on('scopa:rematch-req',({by})=>{
    showToast('🔄 '+by+' vuole la rivincita!');
    const btn=document.getElementById('scRematchBtn');
    if(btn){btn.textContent='✅ Accetta rivincita';btn.style.background='#10b981';}
  });
  socket.on('scopa:error',({msg})=> showToast('❌ '+msg));
  socket.on('scopa:credits-update', ({delta, total, freeGame, remaining, reason}) => {
    if(reason==='free'){
      const leftTxt = remaining > 0 ? ` (${remaining} gratis rimast${remaining===1?'a':'e'})` : ' (ultima gratis!)';
      showToast('🎁 Partita GRATIS'+leftTxt);
    } else if(reason==='entry'){
      showToast(`🪙 -5 crediti · Rimasti: ${total}`);
      // Aggiorna crediti locali
      if(user) { user.credits = total; syncProfVideoCard && syncProfVideoCard(); }
    } else if(reason==='win'){
      showToast(`🏆 +${delta} crediti! Rimasti: ${total}`);
      if(user) { user.credits = total; syncProfVideoCard && syncProfVideoCard(); }
    }
  });
}

/* ─── Calcolo catture lato client (per UX) ─── */
function scClientCaptures(card, table){
  const v=card.value;
  const singles=table.filter(c=>c.value===v);
  if(singles.length) return singles.map(c=>[c]);
  const res=[];
  for(let mask=1;mask<(1<<table.length);mask++){
    const combo=table.filter((_,i)=>mask>>i&1);
    if(combo.length>=2&&combo.reduce((s,c)=>s+c.value,0)===v) res.push(combo);
  }
  return res;
}

/* ─── Card HTML ─── */
function scCardHTML(card, opts={}){
  const {sel,selected,dimmed,back,small,count}=opts;
  if(back){
    return `<div class="sc-card sc-card-back${small?' sc-sm':''}">
      <div class="sc-back-inner">${count>1?`<div class="sc-cnt">${count}</div>`:''}</div></div>`;
  }
  const icon=SC_ICON[card.suit], color=SC_COLOR[card.suit], lbl=SC_VL[card.value];
  const isFace=card.value>=8;
  return `<div class="sc-card${isFace?' sc-face':''} ${sel?'sc-selectable':''} ${selected?'sc-selected':''} ${dimmed?'sc-dimmed':''} ${small?'sc-sm':''}"
    style="--sc:${color}" data-cid="${card.id}"
    onclick="${sel?`scCardClick('${card.id}')`:''}">
    <span class="sc-vt">${lbl}</span>
    <span class="sc-si">${icon}</span>
    <span class="sc-vb">${lbl}</span>
  </div>`;
}

/* ─── Click su carta ─── */
function scCardClick(cardId){
  if(!_sc?.isMyTurn) return;
  // Carta in mano?
  const hand=_sc.myHand||[];
  const card=hand.find(c=>c.id===cardId);
  if(card){
    if(_scSelCard===cardId){ _scSelCard=null; _scSelCap=[]; }
    else {
      _scSelCard=cardId; _scSelCap=[];
      const opts=scClientCaptures(card,_sc.table);
      if(opts.length===1) _scSelCap=opts[0].map(c=>c.id);
      // 0 opzioni → piazza sul tavolo; >1 → l'utente sceglie manualmente
    }
    scRender(); return;
  }
  // Carta sul tavolo (per selezionare cattura manuale)
  if(_scSelCard){
    const tc=_sc.table.find(c=>c.id===cardId);
    if(!tc) return;
    if(_scSelCap.includes(cardId)) _scSelCap=_scSelCap.filter(id=>id!==cardId);
    else _scSelCap.push(cardId);
    scRender();
  }
}

function scPlayCard(){
  if(!_scSelCard||!_scGameId) return;
  socket.emit('scopa:play-card',{gameId:_scGameId,cardId:_scSelCard,captureIds:[]});
  _scSelCard=null; _scSelCap=[];
}

function scConfirmCapture(){
  if(!_scSelCard||!_scGameId||!_scSelCap.length) return;
  socket.emit('scopa:play-card',{gameId:_scGameId,cardId:_scSelCard,captureIds:_scSelCap});
  _scSelCard=null; _scSelCap=[];
}

function scCancelSel(){ _scSelCard=null; _scSelCap=[]; scRender(); }

/* ─── Renders ─── */
function scRenderWaiting(pos, tot){
  const body=document.getElementById('scopaBody');
  if(!body) return;
  document.getElementById('scHdrScore').innerHTML='';
  const tables=_scLobby?.tables||[];
  const queueList=_scLobby?.queue||[];

  const tablesHTML=tables.length?`
    <div class="sc-lobby-wrap">
      <div class="sc-lobby-hdr">
        <span class="sc-lobby-dot"></span>
        ${tables.length} tavolo${tables.length>1?'i':''} attiv${tables.length>1?'i':'o'}
        <span class="sc-lobby-sep">·</span>
        ${queueList.length} in coda
      </div>
      ${tables.map(t=>`
        <div class="sc-lobby-table">
          <div class="sc-lobby-tnum">Tavolo ${t.tableNum} <span class="sc-lobby-mano">Mano ${t.round}</span></div>
          <div class="sc-lobby-vs">
            <span class="sc-lobby-plr">${esc(t.players[0].face)}&thinsp;${esc(t.players[0].name)}</span>
            <span class="sc-lobby-score-box">${t.players[0].score}&thinsp;—&thinsp;${t.players[1].score}</span>
            <span class="sc-lobby-plr right">${esc(t.players[1].name)}&thinsp;${esc(t.players[1].face)}</span>
          </div>
        </div>`).join('')}
    </div>`:`<div class="sc-lobby-empty">🃏 Nessun tavolo attivo</div>`;

  const queueHTML=queueList.length>1?`
    <div class="sc-queue-row">
      ${queueList.map(p=>`<span class="sc-queue-chip">${esc(p.face)}</span>`).join('')}
    </div>`:'' ;

  body.innerHTML=`
  <div class="sc-waiting">
    <div class="sc-wait-deck">
      ${[0,1,2,3].map(i=>`<div class="sc-wait-card" style="transform:rotate(${(i-1.5)*9}deg) translateY(${Math.abs(i-1.5)*6}px)"></div>`).join('')}
    </div>
    ${tablesHTML}
    <div class="sc-wait-queue-info">
      <div class="sc-wait-pos">${pos===1&&tot<=1?'👤 In attesa di avversario…':`⏳ Coda · posizione ${pos} / ${tot}`}</div>
      ${queueHTML}
      <div class="sc-wait-dots"><span></span><span></span><span></span></div>
    </div>
    <div class="sc-rules">
      <div class="sc-rules-title">📜 Regole Scopa</div>
      <div class="sc-rule"><span class="sc-rb">♥♦♣♠</span> Mazzo napoletano 40 carte, 4 semi</div>
      <div class="sc-rule"><span class="sc-rb">🎯</span> Cattura carte con lo stesso valore</div>
      <div class="sc-rule"><span class="sc-rb">⚡</span> <b>Scopa</b>: prendi tutte le carte del tavolo</div>
      <div class="sc-rule"><span class="sc-rb">🏆</span> <b>Carte</b>: chi ne ha di più (+1pt)</div>
      <div class="sc-rule"><span class="sc-rb">💰</span> <b>Denari</b>: maggioranza dei denari (+1pt)</div>
      <div class="sc-rule"><span class="sc-rb">🌟</span> <b>Settebello</b>: il 7 di denari (+1pt)</div>
      <div class="sc-rule"><span class="sc-rb">🃏</span> <b>Primiera</b>: 7=21, 6=18, A=16… (+1pt)</div>
      <div class="sc-rule"><span class="sc-rb">🎮</span> Prima a <b>11 punti</b> vince la partita!</div>
    </div>
    <div class="sc-credits-info" id="scCreditsInfo">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:13px;color:#00d4ff;font-weight:700">🪙 Crediti partita</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px">
        <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.25);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:20px">🎁</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">Prime 3</div>
          <div style="font-size:13px;color:#00d4ff;font-weight:700">GRATIS</div>
        </div>
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:20px">💸</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">Ingresso</div>
          <div style="font-size:13px;color:#f87171;font-weight:700">-5 🪙</div>
        </div>
        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:20px">🏆</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">Vittoria</div>
          <div style="font-size:13px;color:#10b981;font-weight:700">+20 🪙</div>
        </div>
      </div>
    </div>
  </div>`;
}

function scRender(){
  const body=document.getElementById('scopaBody');
  if(!body||!_sc) return;
  const st=_sc;
  // Aggiorna header punteggio
  const sh=document.getElementById('scHdrScore');
  if(sh) sh.innerHTML=`<span class="sc-s-me">${st.myTotalScore}</span><span class="sc-s-sep">—</span><span class="sc-s-opp">${st.oppTotalScore}</span>`;

  // Calcola info sulla carta selezionata
  const selCard=st.myHand?.find(c=>c.id===_scSelCard);
  const capOpts=selCard?scClientCaptures(selCard,st.table):[];
  const sumSel=_scSelCap.length?st.table.filter(c=>_scSelCap.includes(c.id)).reduce((s,c)=>s+c.value,0):0;
  const validCap=selCard&&sumSel===selCard.value&&_scSelCap.length>0;
  const noCapPossible=selCard&&capOpts.length===0;

  // Per ogni carta tavolo: può far parte di una cattura con la carta selezionata?
  const capturableSet=new Set();
  if(selCard) capOpts.forEach(opt=>opt.forEach(c=>capturableSet.add(c.id)));

  body.innerHTML=`
  <!-- AVVERSARIO -->
  <div class="sc-opp-row">
    <div class="sc-plr-info">
      <span class="sc-plr-face">${esc(st.oppInfo.face)}</span>
      <span class="sc-plr-name">${esc(st.oppInfo.name)}</span>
      ${!st.isMyTurn?'<span class="sc-turn-badge opp">✦ Turno</span>':''}
    </div>
    <div class="sc-stats-row">
      <span class="sc-pill">🃏${st.oppHandCount}</span>
      <span class="sc-pill">📦${st.oppCaptured}</span>
      <span class="sc-pill">💰${st.oppDenari}</span>
      <span class="sc-pill sc-scope">♠${st.oppScope}</span>
    </div>
    <div class="sc-opp-hand">${Array(st.oppHandCount).fill(0).map(()=>scCardHTML(null,{back:true,small:true})).join('')}</div>
  </div>

  <!-- TAVOLO -->
  <div class="sc-table-wrap">
    <div class="sc-table-info">
      <span>Tavolo · ${st.table.length} carte</span>
      <span class="sc-deck-lbl">📤 ${st.deckCount} nel mazzo</span>
    </div>
    <div class="sc-table" id="scTable">
      ${st.table.length?st.table.map(c=>scCardHTML(c,{
        sel:st.isMyTurn&&!!_scSelCard&&(capturableSet.has(c.id)||_scSelCap.includes(c.id)),
        selected:_scSelCap.includes(c.id),
        dimmed:st.isMyTurn&&!!_scSelCard&&!capturableSet.has(c.id)&&!_scSelCap.includes(c.id)&&capturableSet.size>0
      })).join(''):'<div class="sc-empty-table">— Tavolo vuoto —</div>'}
    </div>
    ${validCap?`<button class="sc-confirm-btn" onclick="scConfirmCapture()">⚡ Cattura ${_scSelCap.length} carta${_scSelCap.length>1?'e':''}</button>`:''}
    ${noCapPossible&&_scSelCard?`<div class="sc-no-cap-hint">Nessuna cattura possibile — la carta andrà sul tavolo</div><button class="sc-play-table-btn" onclick="scPlayCard()">Metti sul tavolo →</button>`:''}
  </div>

  <!-- IO -->
  <div class="sc-me-row">
    <div class="sc-stats-row" style="margin-bottom:6px">
      <span class="sc-pill act">📦${st.myCaptured}</span>
      <span class="sc-pill act">💰${st.myDenari}</span>
      <span class="sc-pill sc-scope act">♠${st.myScope}</span>
      ${st.isMyTurn?'<span class="sc-turn-badge me">✦ Il tuo turno</span>':'<span class="sc-wait-lbl">Attendi...</span>'}
    </div>
    <div class="sc-hand" id="scHand">
      ${(st.myHand||[]).map(c=>scCardHTML(c,{
        sel:st.isMyTurn,
        selected:_scSelCard===c.id,
      })).join('')}
    </div>
    ${_scSelCard&&!noCapPossible?`<div class="sc-sel-hint">Seleziona le carte da catturare o <button class="sc-cancel-mini" onclick="scCancelSel()">annulla</button></div>`:''}
    ${_scSelCard&&!noCapPossible&&!validCap?`<div class="sc-sum-hint">${_scSelCap.length?`Somma: ${sumSel} / ${selCard?.value??'?'}`:''}</div>`:''}
  </div>`;
}

function scFlash(text, color='#00ff88'){
  const scr=document.getElementById('scopaScreen');
  if(!scr) return;
  const el=document.createElement('div');
  el.className='sc-flash';
  el.textContent=text;
  el.style.color=color==='#00ff88'?'#050810':'#fff';
  el.style.background=color;
  if(color!=='#00ff88') el.style.boxShadow=`0 0 30px ${color}88`;
  scr.appendChild(el);
  setTimeout(()=>el.classList.add('show'),30);
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400);},2200);
}

function scRenderRoundEnd({roundScore, totalScore}){
  const body=document.getElementById('scopaBody');
  if(!body||!_sc) return;
  const myId=_sc.myId, oppId=_sc.oppId;
  const ms=roundScore[myId], os=roundScore[oppId];
  const cats=['scope','settebello','carte','denari','primiera'];
  const catLabel={scope:'Scope',settebello:'Settebello',carte:'Carte',denari:'Denari',primiera:'Primiera'};
  body.innerHTML=`
  <div class="sc-round-end">
    <div class="sc-re-title">Fine Mano</div>
    <div class="sc-re-grid">
      <div class="sc-re-col">
        <div class="sc-re-head">${esc(_sc.myInfo.face)} Tu</div>
        ${cats.map(k=>`<div class="sc-re-row ${ms[k]?'won':''}">${catLabel[k]}${ms[k]?' +1':''}</div>`).join('')}
        <div class="sc-re-tot">+${ms.total} pt</div>
      </div>
      <div class="sc-re-vs">VS</div>
      <div class="sc-re-col">
        <div class="sc-re-head">${esc(_sc.oppInfo.face)} Avv.</div>
        ${cats.map(k=>`<div class="sc-re-row ${os[k]?'won':''}">${catLabel[k]}${os[k]?' +1':''}</div>`).join('')}
        <div class="sc-re-tot">+${os.total} pt</div>
      </div>
    </div>
    <div class="sc-re-score">${totalScore[myId]} — ${totalScore[oppId]}</div>
    <div class="sc-re-next">Nuova mano tra poco…</div>
  </div>`;
}

function scRenderGameOver({roundScore, totalScore, winner, winnerInfo}){
  const body=document.getElementById('scopaBody');
  if(!body||!_sc) return;
  const iWon=winner===_sc.myId;
  const creditBadge = iWon
    ? `<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);border-radius:20px;padding:8px 18px;margin:12px auto;font-size:14px;font-weight:700;color:#10b981">🏆 +20 🪙 crediti!</div>`
    : `<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:8px 18px;margin:12px auto;font-size:13px;color:#f87171">Nessun credito · ritenta!</div>`;
  body.innerHTML=`
  <div class="sc-gameover">
    <div class="sc-go-trophy">${iWon?'🏆':'💀'}</div>
    <div class="sc-go-title ${iWon?'win':'lose'}">${iWon?'HAI VINTO!':'HAI PERSO!'}</div>
    <div class="sc-go-who">${esc(winnerInfo.face)} ${esc(winnerInfo.name)} ha vinto</div>
    <div class="sc-go-score">${totalScore[_sc.myId]} — ${totalScore[_sc.oppId]}</div>
    <div style="text-align:center">${creditBadge}</div>
    <div class="sc-go-btns">
      <button class="sc-rematch-btn" id="scRematchBtn" onclick="scRequestRematch()">🔄 Rivincita</button>
      <button class="sc-quit-btn" onclick="closeScopaGame()">Esci</button>
    </div>
  </div>`;
}

function scRequestRematch(){
  if(!_scGameId) return;
  socket.emit('scopa:rematch',{gameId:_scGameId});
  const btn=document.getElementById('scRematchBtn');
  if(btn){btn.textContent='⏳ Aspetto...';btn.disabled=true;}
}

// ══════════════════════════════════════════
// MATCH ANONIMO INTELLIGENTE
// ══════════════════════════════════════════
var MATCH_MODES = [
  { id:'random',     emoji:'🎲', name:'Random',        desc:'Conosci chiunque, dovunque',  color:'#00d4ff' },
  { id:'night',      emoji:'🌙', name:'Modalità Notte',desc:'Solo utenti online di notte',  color:'#1e1b4b' },
  { id:'flirt',      emoji:'💘', name:'Flirt',         desc:'Cerca anime gemelle',          color:'#ff6b9d' },
  { id:'gaming',     emoji:'🎮', name:'Gaming',        desc:'Trova compagni di gioco',     color:'#10b981' },
  { id:'confess',    emoji:'🕯️', name:'Confessioni',   desc:'Sfogo anonimo profondo',      color:'#8b5cf6' },
  { id:'mystery',    emoji:'🎭', name:'Misterioso',    desc:'Tutto avvolto nel mistero',   color:'#6b21a8' },
  { id:'fast',       emoji:'⚡', name:'Velocissima',   desc:'Chat lampo 60 secondi',       color:'#f59e0b' },
];

function openMatchAnonimo(){
  closeContinua();
  if (!MATCH_MODES || !Array.isArray(MATCH_MODES) || MATCH_MODES.length === 0) {
    showToast('⚠️ Modalità match non disponibili');
    return;
  }
  let modal = document.getElementById('matchModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'matchModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <div class="modal-hdr">
        <div class="modal-title">🎲 Match Anonimo</div>
        <button class="modal-close" onclick="document.getElementById('matchModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:13px;color:#cbd5e1;line-height:1.5">Trova persone simili a te in base alla modalità</div>
        </div>
        <div class="match-modes">
          ${MATCH_MODES.map(m => `
            <button class="match-mode-btn" onclick="startMatch('${m.id}')" style="--mc:${m.color}">
              <div class="mm-emoji">${m.emoji}</div>
              <div class="mm-info">
                <div class="mm-name">${m.name}</div>
                <div class="mm-desc">${m.desc}</div>
              </div>
              <div class="mm-arrow">→</div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
}

function startMatch(modeId){
  const mode = MATCH_MODES.find(m => m.id === modeId);
  if (!mode) return;
  document.getElementById('matchModal').classList.remove('show');

  // Cerca utenti reali online + ROOMS
  const publicRooms = (typeof ROOMS !== 'undefined') ? ROOMS.filter(r => r.tier === 'public') : [];
  if (publicRooms.length === 0) {
    showToast('⚠️ Nessuna stanza disponibile');
    return;
  }

  // Loading dramatico
  showMatchLoading(mode, () => {
    const room = publicRooms[Math.floor(Math.random() * publicRooms.length)];
    if (typeof enterRoom === 'function') {
      showToast('🎯 ' + mode.emoji + ' Match trovato in ' + room.name + '!');
      enterRoom(room.id);
    }
  });
}

function showMatchLoading(mode, onComplete){
  let modal = document.getElementById('matchLoadingModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'matchLoadingModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-box" style="max-width:380px;background:linear-gradient(135deg,${mode.color}33,${mode.color}11)">
      <div class="modal-body" style="text-align:center;padding:40px 24px">
        <div style="font-size:80px;margin-bottom:20px;animation:matchSpin 1.5s linear infinite">${mode.emoji}</div>
        <div style="font-size:18px;font-weight:600;color:#fff;margin-bottom:6px">Ricerca in corso...</div>
        <div style="font-size:12px;color:#9ca3af;margin-bottom:20px">Modalità: ${mode.name}</div>
        <div class="match-progress-bar"><div class="match-progress-fill"></div></div>
        <div id="matchSearchText" style="font-size:11px;color:#00d4ff;margin-top:14px;font-weight:600">Connessione...</div>
      </div>
    </div>
  `;
  modal.classList.add('show');

  const searchSteps = [
    '🔍 Connessione al server...',
    '🌐 Cercando utenti compatibili...',
    '🎯 Analizzando interessi...',
    '✨ Match trovato!'
  ];
  let stepIdx = 0;
  const stepTimer = setInterval(() => {
    stepIdx++;
    const el = document.getElementById('matchSearchText');
    if (el && searchSteps[stepIdx]) el.textContent = searchSteps[stepIdx];
    if (stepIdx >= searchSteps.length - 1) clearInterval(stepTimer);
  }, 700);

  setTimeout(() => {
    modal.classList.remove('show');
    if (onComplete) onComplete();
  }, 2800);
}

// ══════════════════════════════════════════
// LOOT BOX (Casse premio)
// ══════════════════════════════════════════
var LOOT_BOX_PRICE = 50;
var LOOT_REWARDS = [
  { type:'coins', amount:30, label:'30 monete', emoji:'🪙', rarity:'common' },
  { type:'coins', amount:100, label:'100 monete', emoji:'🪙', rarity:'rare' },
  { type:'coins', amount:300, label:'300 monete', emoji:'🪙', rarity:'epic' },
  { type:'xp', amount:50, label:'50 XP', emoji:'⭐', rarity:'common' },
  { type:'xp', amount:200, label:'200 XP', emoji:'⭐', rarity:'rare' },
  { type:'badge', id:'wheel_winner', label:'Badge Ruota Fortuna', emoji:'🎰', rarity:'rare' },
  { type:'frame', id:'silver', label:'Cornice Silver', emoji:'🥈', rarity:'common' },
  { type:'frame', id:'gold', label:'Cornice Gold', emoji:'🥇', rarity:'epic' },
  { type:'frame', id:'diamond', label:'Cornice Diamond', emoji:'💎', rarity:'legendary' },
  { type:'frame', id:'rainbow', label:'Cornice Arcobaleno', emoji:'🌈', rarity:'legendary' },
  { type:'shop', id:'nick_glow', label:'Effetto Nick Glow', emoji:'✨', rarity:'rare' },
  { type:'shop', id:'bub_gradient', label:'Bolla Gradient', emoji:'💬', rarity:'rare' },
];

function openLootBox(){
  closeContinua();
  let modal = document.getElementById('lootModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'lootModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-box" style="max-width:420px">
      <div class="modal-hdr">
        <div class="modal-title">🎁 Cassa Premio</div>
        <button class="modal-close" onclick="document.getElementById('lootModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="text-align:center;padding:30px 20px">
        <div class="loot-box-img">🎁</div>
        <div style="font-size:14px;color:#cbd5e1;margin-bottom:16px;line-height:1.5">
          Apri una cassa misteriosa per <strong>${LOOT_BOX_PRICE} 🪙</strong>!<br>
          <span style="font-size:11px;color:#9ca3af">Puoi vincere monete, badge, cornici o effetti shop</span>
        </div>
        <div style="display:flex;justify-content:space-around;margin-bottom:18px;font-size:10px;color:#9ca3af">
          <span>🟢 60% Comune</span><span>🔵 25% Raro</span><span>🟣 12% Epico</span><span>🟡 3% Leggendario</span>
        </div>
        <div style="background:rgba(251,191,36,0.1);border:1px solid #fbbf24;border-radius:10px;padding:10px;margin-bottom:14px">
          <span style="font-size:13px;color:#fbbf24;font-weight:700">🪙 Hai ${user.coins||0} monete</span>
        </div>
        <button class="modal-btn modal-btn-primary" style="width:100%;padding:14px;font-size:14px;background:linear-gradient(135deg,#ff6b9d,#00d4ff)" onclick="rollLootBox()">🎁 Apri Cassa (${LOOT_BOX_PRICE} 🪙)</button>
      </div>
    </div>
  `;
  modal.classList.add('show');
}

function rollLootBox(){
  if (!LOOT_REWARDS || !Array.isArray(LOOT_REWARDS) || LOOT_REWARDS.length === 0) {
    showToast('⚠️ Errore: ricompense non disponibili');
    return;
  }
  if ((user.coins||0) < LOOT_BOX_PRICE) {
    showToast('⚠️ Servono ' + LOOT_BOX_PRICE + ' 🪙 (hai ' + (user.coins||0) + ')');
    return;
  }
  user.coins -= LOOT_BOX_PRICE;

  // Rarity probabilities
  const roll = Math.random();
  let rarity = 'common';
  if (roll < 0.03) rarity = 'legendary';
  else if (roll < 0.15) rarity = 'epic';
  else if (roll < 0.40) rarity = 'rare';

  const pool = LOOT_REWARDS.filter(r => r && r.rarity === rarity);
  if (!pool || pool.length === 0) {
    showToast('⚠️ Nessuna ricompensa disponibile per questa rarità');
    user.coins += LOOT_BOX_PRICE;
    return;
  }
  const reward = pool[Math.floor(Math.random() * pool.length)];
  if (!reward) {
    showToast('⚠️ Errore nella selezione della ricompensa');
    user.coins += LOOT_BOX_PRICE;
    return;
  }

  // Applica reward
  if (reward.type === 'coins') user.coins += reward.amount;
  else if (reward.type === 'xp') user.xp = (user.xp||0) + reward.amount;
  else if (reward.type === 'badge') {
    user.badges = [...new Set([...(user.badges||[]), reward.id])];
  } else if (reward.type === 'frame') {
    user.ownedFrames = [...new Set([...(user.ownedFrames||[]), reward.id])];
  } else if (reward.type === 'shop') {
    user.shopItems = [...new Set([...(user.shopItems||[]), reward.id])];
  }

  saveUser();
  updateCoinBar();

  // Show reward dramatically
  showLootReward(reward, rarity);
}

function showLootReward(reward, rarity){
  const modal = document.getElementById('lootModal');
  if (!modal) return;
  const rarityColor = { common:'#94a3b8', rare:'#3b82f6', epic:'#00d4ff', legendary:'#fbbf24' }[rarity];
  const rarityLabel = { common:'COMUNE', rare:'RARO', epic:'EPICO', legendary:'LEGGENDARIO' }[rarity];
  modal.querySelector('.modal-box').innerHTML = `
    <div class="modal-hdr">
      <div class="modal-title">🎁 Premio Vinto!</div>
      <button class="modal-close" onclick="document.getElementById('lootModal').classList.remove('show')">✕</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:36px 24px;background:linear-gradient(135deg,${rarityColor}22,${rarityColor}11)">
      <div class="loot-reward-emoji" style="font-size:96px;animation:lootReveal 1s ease-out;text-shadow:0 0 40px ${rarityColor}">${reward.emoji}</div>
      <div style="font-size:11px;font-weight:600;color:${rarityColor};letter-spacing:2px;margin:14px 0 4px">${rarityLabel}</div>
      <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:20px">${reward.label}</div>
      <button class="modal-btn modal-btn-primary" style="width:100%;padding:12px" onclick="openLootBox()">🎁 Apri un'altra (${LOOT_BOX_PRICE} 🪙)</button>
      <button onclick="document.getElementById('lootModal').classList.remove('show')" style="background:none;border:none;color:#9ca3af;font-size:12px;cursor:pointer;margin-top:10px;text-decoration:underline">Chiudi</button>
    </div>
  `;
}

// ══════════════════════════════════════════
// ACHIEVEMENTS & MISSIONI + LEADERBOARD
// ══════════════════════════════════════════

// Leaderboard globale simulata (top players statici + utente corrente)
// Carica il leaderboard chat settimanale dal server e lo renderizza nel container
async function loadWeeklyLeaderboard(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:24px;color:#6e747d;font-size:13px">⏳ Caricamento classifica...</div>';
  try {
    const res = await fetch('/api/leaderboard/chat');
    const data = await res.json();
    if (!data.ok || !data.top) throw new Error('no data');

    const top = data.top;
    const myEntry = top.find(p => p.id === user?.id);
    const myRank  = myEntry ? top.indexOf(myEntry) + 1 : null;
    const resetMs = new Date(data.resetDate).getTime() - Date.now();
    const resetDays = Math.floor(resetMs / 86400000);
    const resetHrs  = Math.floor((resetMs % 86400000) / 3600000);
    const resetLabel = resetDays > 0 ? `${resetDays}g ${resetHrs}h` : `${resetHrs}h`;

    const rankIcons = ['🥇','🥈','🥉'];
    const rows = top.slice(0,10).map((p, i) => {
      const rank = i + 1;
      const isMe = p.id === user?.id;
      const rankNumClass = rank===1?'gold':rank===2?'silver':rank===3?'bronze':'';
      const rankLabel = rank<=3 ? rankIcons[rank-1] : rank;
      return `
        <div class="lb-row ${isMe?'me':rank<=3?'top'+rank:''}">
          <div class="lb-rank ${rankNumClass}">${rankLabel}</div>
          <div class="lb-avatar" style="background:${p.color||'#00d4ff'}22;color:${p.color||'#00d4ff'}">${p.face||'🎭'}</div>
          <div class="lb-info">
            <div class="lb-name">${esc(p.name)}${isMe?' <span style="color:#00d4ff;font-size:10px">(Tu)</span>':''}</div>
            <div class="lb-score-row">
              <div class="lb-score">💬 <span>${p.msgs} msg</span></div>
            </div>
          </div>
          ${isMe?'<div class="lb-me-badge">TU</div>':''}
        </div>`;
    }).join('');

    const myRankHtml = myRank && myRank > 10 ? `
      <div class="lb-my-rank">
        <div class="lb-my-rank-num">#${myRank}</div>
        <div class="lb-my-rank-lbl">La tua posizione · ${myEntry.msgs} messaggi</div>
      </div>` : '';

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#00d4ff;letter-spacing:.5px;text-transform:uppercase">🏆 Top messaggi — questa settimana</div>
        <div style="font-size:10px;color:#6e747d">reset in ${resetLabel}</div>
      </div>
      ${top.length === 0
        ? '<div style="text-align:center;padding:24px;color:#6e747d;font-size:13px">Nessun messaggio ancora questa settimana. Sii il primo! 🚀</div>'
        : rows + myRankHtml
      }`;
  } catch(e) {
    if (el) el.innerHTML = '<div style="text-align:center;padding:16px;color:#6e747d;font-size:12px">Classifica temporaneamente non disponibile.</div>';
  }
}

function buildLeaderboard(){
  // Placeholder — dati reali caricati async appena il tab è visibile
  setTimeout(() => loadWeeklyLeaderboard('achTab-leaderboard'), 80);
  return '';
}

function openAchievements(initialTab){
  closeContinua && closeContinua();
  const activeTab = initialTab || 'missions';
  const m = typeof getDailyProgress === 'function' ? getDailyProgress() : { progress:{}, claimed:{} };

  let modal = document.getElementById('achievementsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'achievementsModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }

  const missionsHtml = (typeof DAILY_MISSIONS !== 'undefined' ? DAILY_MISSIONS : []).map(ms => {
    const prog = m.progress[ms.id] || 0;
    const claimed = m.claimed[ms.id];
    const done = prog >= ms.target;
    const pct = Math.min(100, (prog/ms.target)*100);
    return `
      <div class="mission-row ${done?'done':''} ${claimed?'claimed':''}">
        <div class="mission-icon">${ms.icon}</div>
        <div class="mission-info">
          <div class="mission-label">${ms.label}</div>
          <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%"></div></div>
          <div class="mission-subline">${prog}/${ms.target} · +${ms.reward} 🪙</div>
        </div>
        ${claimed ? '<div class="mission-status">✅</div>' :
          done ? `<button class="mission-claim" onclick="claimMission('${ms.id}')">Riscatta</button>` :
          '<div class="mission-status">⏳</div>'}
      </div>
    `;
  }).join('');

  const allBadges = (typeof BADGES !== 'undefined') ? BADGES : [];
  const userBadges = new Set(user.badges || []);
  const badgesHtml = allBadges.map(b => {
    const unlocked = userBadges.has(b.id);
    return `
      <div class="ach-badge ${unlocked?'unlocked':'locked'}" title="${b.desc||''}">
        <div class="ach-badge-emoji">${b.emoji}</div>
        <div class="ach-badge-name">${b.name}</div>
        ${!unlocked ? '<div class="ach-badge-lock">🔒</div>' : ''}
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box" style="max-width:500px">
      <div class="modal-hdr">
        <div class="modal-title">🏆 Achievements</div>
        <button class="modal-close" onclick="document.getElementById('achievementsModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="max-height:72vh;overflow-y:auto">
        <div class="ach-tabs">
          <button class="ach-tab ${activeTab==='missions'?'active':''}" onclick="switchAchTab('missions')">🎯 Missioni</button>
          <button class="ach-tab ${activeTab==='badges'?'active':''}" onclick="switchAchTab('badges')">🏅 Badge</button>
          <button class="ach-tab ${activeTab==='leaderboard'?'active':''}" onclick="switchAchTab('leaderboard')">🏆 Classifica</button>
        </div>

        <div class="ach-tab-content ${activeTab==='missions'?'active':''}" id="achTab-missions">
          ${missionsHtml || '<div style="color:#9ca3af;text-align:center;padding:14px;font-size:12px">Nessuna missione attiva</div>'}
        </div>

        <div class="ach-tab-content ${activeTab==='badges'?'active':''}" id="achTab-badges">
          <div style="font-size:11px;color:#b4bcc8;margin-bottom:10px">${userBadges.size}/${allBadges.length} sbloccati</div>
          <div class="ach-badges-grid">${badgesHtml}</div>
        </div>

        <div class="ach-tab-content ${activeTab==='leaderboard'?'active':''}" id="achTab-leaderboard">
          ${buildLeaderboard()}
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
}

function switchAchTab(tab){
  document.querySelectorAll('.ach-tab').forEach((el,i)=>{
    const tabs=['missions','badges','leaderboard'];
    el.classList.toggle('active', tabs[i]===tab);
  });
  document.querySelectorAll('.ach-tab-content').forEach(el=>{
    el.classList.toggle('active', el.id==='achTab-'+tab);
  });
  if (tab === 'leaderboard') loadWeeklyLeaderboard('achTab-leaderboard');
}

function claimMission(id){
  const m = getDailyProgress();
  const ms = DAILY_MISSIONS.find(x => x.id === id);
  if (!ms) return;
  if (m.claimed[id]) return;
  if ((m.progress[id]||0) < ms.target) return;
  m.claimed[id] = true;
  user.coins = (user.coins || 0) + ms.reward;
  saveUser();
  updateCoinBar();
  showToast('🎉 Missione completata! +' + ms.reward + ' 🪙');
  openAchievements();
}

// ══════════════════════════════════════════
// PROFILO: banner, stato, bio
// ══════════════════════════════════════════
var PROFILE_BANNERS = ['default','b-galaxy','b-sunset','b-ocean','b-forest','b-fire','b-neon'];

function cycleProfileBanner(){
  user.banner = user.banner || 'default';
  const idx = PROFILE_BANNERS.indexOf(user.banner);
  const next = PROFILE_BANNERS[(idx + 1) % PROFILE_BANNERS.length];
  user.banner = next;
  saveUser();
  applyProfileBanner();
  showToast('🎨 Banner cambiato: ' + next.replace('b-','').replace('default','Standard'));
}

function applyProfileBanner(){
  const b = document.getElementById('profBanner');
  if (!b) return;
  b.className = 'prof-banner' + (user.banner && user.banner !== 'default' ? ' ' + user.banner : '');
}

function editProfileStatus(){
  const STATUS_PRESETS = [
    { e: '💭', t: 'In ascolto...' },
    { e: '🎉', t: 'Festeggiamo!' },
    { e: '😎', t: 'Cerco gente cool' },
    { e: '🌙', t: 'Online di notte' },
    { e: '☀️', t: 'Buongiorno mondo' },
    { e: '🎮', t: 'In gaming' },
    { e: '🎵', t: 'Ascolto musica' },
    { e: '❤️', t: 'Aperto a conoscere' },
    { e: '🔥', t: 'On fire oggi!' },
    { e: '💼', t: 'Modalita lavoro' },
    { e: '🤫', t: 'Discreto' },
    { e: '✨', t: 'Magia' }
  ];
  const currentText = user.statusText || '';
  const preset = prompt('Scegli uno stato (1-' + STATUS_PRESETS.length + ') o scrivi il tuo:\n\n' +
    STATUS_PRESETS.map((s,i) => (i+1)+'. '+s.e+' '+s.t).join('\n') +
    '\n\nOppure scrivi il tuo testo personalizzato:',
    currentText);
  if (preset === null) return;

  const num = parseInt(preset);
  if (num >= 1 && num <= STATUS_PRESETS.length) {
    const p = STATUS_PRESETS[num - 1];
    user.statusEmoji = p.e;
    user.statusText = p.t;
  } else if (preset.trim()) {
    user.statusEmoji = '💭';
    user.statusText = preset.trim().slice(0, 50);
  } else {
    user.statusEmoji = null;
    user.statusText = null;
  }
  saveUser();
  applyProfileStatus();
  showToast('✅ Stato aggiornato');
}

function applyProfileStatus(){
  const emoji = document.getElementById('profStatusEmoji');
  const text = document.getElementById('profStatusText');
  if (emoji) emoji.textContent = user.statusEmoji || '💭';
  if (text) text.textContent = user.statusText || 'Tocca per impostare uno stato...';
}

function editProfileBio(){
  const current = user.bio || '';
  const newBio = prompt('Scrivi una bio breve (max 100 caratteri):', current);
  if (newBio === null) return;
  user.bio = newBio.trim().slice(0, 100);
  saveUser();
  applyProfileBio();
  showToast(user.bio ? '✅ Bio aggiornata' : '🗑️ Bio rimossa');
}

function applyProfileBio(){
  const t = document.getElementById('profBioText');
  if (!t) return;
  if (user.bio) {
    t.textContent = user.bio;
    t.style.color = '#cbd5e1';
    t.style.fontStyle = 'normal';
  } else {
    t.textContent = 'Tocca per aggiungere una bio...';
    t.style.color = '#9ca3af';
    t.style.fontStyle = 'italic';
  }
}

// ══════════════════════════════════════════
// MISSIONI GIORNALIERE - FOMO + gamification
// ══════════════════════════════════════════
var DAILY_MISSIONS = [
  { id:'msg5', label:'Invia 5 messaggi', target:5, reward:10, icon:'💬' },
  { id:'msg20', label:'Invia 20 messaggi', target:20, reward:30, icon:'🔥' },
  { id:'rooms3', label:'Visita 3 stanze diverse', target:3, reward:20, icon:'🗺️' },
  { id:'login', label:'Login giornaliero', target:1, reward:15, icon:'🌅' },
  { id:'video', label:'Attiva la videocamera', target:1, reward:25, icon:'📹' },
];

function getTodayKey(){
  const d = new Date(); d.setHours(0,0,0,0);
  return d.getTime();
}

function getDailyProgress(){
  const today = getTodayKey();
  if (!user.dailyMissions || user.dailyMissions.day !== today) {
    user.dailyMissions = { day: today, progress: {}, claimed: {} };
    saveUser();
  }
  return user.dailyMissions;
}

function incrementDailyMission(id, amount){
  const m = getDailyProgress();
  m.progress[id] = (m.progress[id] || 0) + (amount || 1);
  saveUser();
}

// ══════════════════════════════════════════
// PARTICELLE + FEED LIVE + STATS - mondo vivo
// ══════════════════════════════════════════
function initParticles(){
  // DISABILITATO: particelle causavano problemi di scroll/movimento su mobile
  return;
  const wrap = document.getElementById('kvParticles');
  if (!wrap || wrap.childElementCount > 0) return;
  const N = 0;
  for (let i = 0; i < N; i++) {
    const p = document.createElement('div');
    const cls = ['','p2','p3','p4'][Math.floor(Math.random()*4)];
    p.className = 'kv-particle ' + cls;
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = (Math.random() * 15) + 's';
    p.style.animationDuration = (15 + Math.random() * 15) + 's';
    wrap.appendChild(p);
  }
}

// Feed Live: SOLO eventi REALI da socket.io (no contenuti finti)
function addFeedItem(item){
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  // Clear initial loading se prima volta
  const loading = feed.querySelector('.lf-text');
  if (loading && (loading.textContent.includes('Caricamento') || loading.textContent.includes('Nessuna'))) {
    feed.innerHTML = '';
  }

  const div = document.createElement('div');
  div.className = 'live-feed-item';
  div.innerHTML = `
    <div class="lf-dot ${item.dot||''}"></div>
    <div class="lf-text">${item.text}</div>
    <div class="lf-time">${item.time||'ora'}</div>
  `;
  feed.insertBefore(div, feed.firstChild);
  // Limita a 15 elementi
  while (feed.childElementCount > 15) feed.removeChild(feed.lastChild);
}

function emptyFeed(){
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  feed.innerHTML = '<div class="live-feed-item"><div class="lf-dot"></div><div class="lf-text" style="color:#9ca3af;font-style:italic">Nessuna attività ancora. Entra in una stanza per vedere il feed!</div><div class="lf-time"></div></div>';
}

function startLiveFeed(){
  // Mostra empty state - aspetta solo eventi REALI
  emptyFeed();
  // Hook eventi reali del socket per popolare il feed
  if (typeof socket !== 'undefined' && socket) {
    // Quando arriva un messaggio chat reale
    socket.on('chat-message', (data) => {
      if (!data || !data.msg) return;
      const m = data.msg;
      if (m.userId === user?.id) return; // skip i miei
      const roomName = (typeof ROOMS !== 'undefined' && ROOMS.find(r => r.id === data.roomId))?.name || data.roomId;
      addFeedItem({
        text: '<b>' + esc((m.name||'Anonimo').slice(0,16)) + '</b> ha scritto in <b>' + esc(roomName.slice(0,16)) + '</b>',
        dot: '',
        time: 'ora'
      });
    });
    // Quando lista utenti cambia (qualcuno entra/esce)
    let lastUsersByRoom = {};
    socket.on('chat-users', (data) => {
      if (!data || !data.users) return;
      const rid = data.roomId;
      const roomName = (typeof ROOMS !== 'undefined' && ROOMS.find(r => r.id === rid))?.name || rid;
      const newIds = new Set(data.users.map(u => u.id));
      const oldIds = lastUsersByRoom[rid] || new Set();
      // Trova nuovi entranti
      newIds.forEach(uid => {
        if (!oldIds.has(uid) && uid !== user?.id) {
          const u = data.users.find(x => x.id === uid);
          if (u) {
            addFeedItem({
              text: '<b>' + esc((u.name||'Anonimo').slice(0,16)) + '</b> è entrato in <b>' + esc(roomName.slice(0,16)) + '</b>',
              dot: 'green',
              time: 'ora'
            });
          }
        }
      });
      lastUsersByRoom[rid] = newIds;
    });
  }
}

function updateLiveStats(){
  // Counter "online ora" - SOLO numeri REALI dal server
  const realOnline = parseInt(document.getElementById('oCount')?.textContent || '0') || 0;

  const el = document.getElementById('liveOnlineCount');
  if (el) {
    const target = realOnline;
    const current = parseInt(el.textContent) || 0;
    let val = current;
    const step = (target - current) / 20;
    if (step === 0) { el.textContent = target; }
    else {
      const animTimer = setInterval(() => {
        val += step;
        if ((step > 0 && val >= target) || (step < 0 && val <= target)) {
          val = target;
          clearInterval(animTimer);
        }
        el.textContent = Math.round(val);
      }, 30);
    }
  }

  // Trending: conta stanze pubbliche con almeno 1 utente (REALE)
  const trending = document.getElementById('liveTrendingCount');
  if (trending) {
    let hotCount = 0;
    if (typeof roomOnline === 'object') {
      for (const rId in roomOnline) {
        if ((roomOnline[rId] || 0) >= 1) hotCount++;
      }
    }
    trending.textContent = hotCount;
  }

  // Nuove stanze: SOLO codice salvate localmente
  const newRooms = document.getElementById('liveNewRoomsCount');
  if (newRooms) {
    const myCodeRooms = getLS('kv4_code_rooms') || [];
    newRooms.textContent = myCodeRooms.length;
  }
}

function startLiveStats(){
  updateLiveStats();
  setInterval(updateLiveStats, 20000); // ogni 20 sec (perf)
}

function renderRooms(){
  const chatRooms = ROOMS.filter(r => r.tier !== 'scopa');
  const gameRooms = ROOMS.filter(r => r.tier === 'scopa');
  const gamesSection = gameRooms.length ? `
    <div class="sec-label-row" style="grid-column:1/-1">
      <div class="sec-label" style="margin:0">🎮 Giochi</div>
    </div>
    <div class="games-grid">${gameRooms.map(gameCard).join('')}</div>
  ` : '';
  const chatSection = chatRooms.length ? `
    <div class="sec-label-row" style="grid-column:1/-1;margin-top:${gameRooms.length?'16px':'0'}">
      <div class="sec-label" style="margin:0">✦ Stanze in evidenza</div>
      <span class="sec-label-link" onclick="openContinua()">Vedi tutte ›</span>
    </div>
    ${chatRooms.map(roomCard).join('')}
  ` : '';
  document.getElementById('roomsList').innerHTML = gamesSection + chatSection;
}

// ── Age Gate 18+ ──────────────────────────────────────────────────────────────
function showAgeGate(pendingRoomId){
  const m = document.getElementById('ageGateModal');
  if(m){ m.dataset.pending = pendingRoomId; m.style.display='flex'; document.body.style.overflow='hidden'; }
}
function confirmAge(){
  setLS('kv4_age_confirmed', 1);
  const m = document.getElementById('ageGateModal');
  const pending = m?.dataset?.pending;
  if(m){ m.style.display='none'; document.body.style.overflow=''; }
  if(pending) enterRoom(pending);
}
function denyAge(){
  const m = document.getElementById('ageGateModal');
  if(m){ m.style.display='none'; document.body.style.overflow=''; }
  showToast('🔞 Accesso riservato ai maggiorenni');
}

// ── Temperatura stanza in base agli online ──
function tempBadge(cnt){
  if(cnt>=10) return `<div class="rc-flag-pill" style="background:linear-gradient(90deg,#ff6b9d,#ff6b9d);animation:hot-pulse 1.2s ease-in-out infinite"><span>🔥</span><span>BOLLENTE</span></div>`;
  if(cnt>=5)  return `<div class="rc-flag-pill" style="background:linear-gradient(90deg,#ff6b9d,#00d4ff);color:#0f1117"><span>🔥</span><span>HOT</span></div>`;
  if(cnt>=3)  return `<div class="rc-flag-pill" style="background:linear-gradient(90deg,#00e5b8,#00d4ff);color:#0f1117"><span>✨</span><span>ATTIVA</span></div>`;
  if(cnt>=1)  return `<div class="rc-flag-pill"><span>💬</span><span>LIVE</span></div>`;
  return `<div class="rc-flag-pill" style="background:rgba(0,0,0,.35);color:#9ca3af;border:1px solid rgba(255,255,255,.1)"><span>😴</span><span>SILENZIOSA</span></div>`;
}

function gameCard(r){
  const cnt = roomOnline[r.id]??0;
  return `
  <div class="game-card" onclick="enterRoom('${r.id}')" style="--gc-color:${r.color}">
    <div class="gc-glow"></div>
    <div class="gc-img" style="background-image:url('${r.img||''}')">
      <div class="gc-img-overlay"></div>
      <div class="gc-badge">🎮 GIOCO</div>
    </div>
    <div class="gc-body">
      <div class="gc-top">
        <span class="gc-emoji">${r.emoji}</span>
        <div>
          <div class="gc-name">${esc(r.name)}</div>
          <div class="gc-desc">${esc(r.desc)}</div>
        </div>
      </div>
      <div class="gc-foot">
        <span class="gc-waiting${cnt===0?' gc-waiting-empty':''}" id="ron_${r.id}">${cnt>0?cnt+' in sala':'Nessuno ora'}</span>
        <button class="gc-play-btn">▶ Gioca</button>
      </div>
    </div>
  </div>`;
}

function roomCard(r){
  const cnt=roomOnline[r.id]??0;
  // Nome stanza pulito: rimuovo l'emoji/bandiera dal nome se già presente (es. "🇮🇹 Italia" → "Italia")
  const cleanName=r.name.replace(/^[\p{Emoji}\p{Extended_Pictographic}️]+\s*/u,'').trim()||r.name;

  // FOMO indicators (basati su utenti REALI)
  const MAX_CAPACITY = 30;
  const pctFull = (cnt / MAX_CAPACITY) * 100;
  let fomoIndicator = '';
  if (pctFull >= 80 && cnt > 0) {
    fomoIndicator = '<div class="fomo-tag almost-full">⚡ QUASI PIENA</div>';
  } else if (cnt >= 15) {
    fomoIndicator = '<div class="fomo-tag trending">🔥 TRENDING</div>';
  } else if (cnt >= 5) {
    fomoIndicator = '<div class="fomo-tag live">🔴 LIVE</div>';
  }

  // Live preview: mostra ultimo messaggio (se disponibile)
  const preview = (typeof roomPreviews === 'object' && roomPreviews[r.id]) ? roomPreviews[r.id] : [];
  const lastMsg = preview[preview.length - 1];
  const previewHtml = lastMsg && lastMsg.text ? `
    <div class="rc-preview">
      <div class="rc-preview-dot"></div>
      <span class="rc-preview-name" style="color:${lastMsg.color||'#00d4ff'}">${esc((lastMsg.name||'?').substring(0,10))}:</span>
      <span class="rc-preview-text">${esc(lastMsg.text.substring(0,40))}</span>
    </div>
  ` : '';

  // Animazione "live-room" se più di 5 utenti
  const liveCls = cnt >= 5 ? ' live-room' : '';
  // Classe speciale per stanze adulti
  const adultCls = r.tier === 'adult' ? ' adult-room' : '';
  // Badge 18+ per stanze adulti (sovrascrive fomo)
  const adultBadge = r.tier === 'adult'
    ? '<div class="fomo-tag adult">🔞 18+</div>' : fomoIndicator;

  return `
  <div class="room-card${liveCls}${adultCls}" onclick="enterRoom('${r.id}')" style="--rc-color:${r.color};--rc-glow:${r.color}33">
    ${adultBadge}

    <!-- Badge row in alto -->
    <div class="rc-badges">
      <div class="rc-online-pill">
        <div class="rc-online-dot"></div>
        <span id="ron_${r.id}" class="rc-num">${cnt}</span>
      </div>
      ${tempBadge(cnt)}
    </div>

    <!-- Centro: sfondo immagine + nome overlay -->
    <div class="rc-center" style="background-image: url('${r.img||''}'); background-size: cover; background-position: center;">
      <div class="rc-image-overlay"></div>
      <div class="rc-tile-name-overlay">${esc(cleanName)}</div>
    </div>

    ${previewHtml}

    <!-- Footer: tap-to-enter + bell alert -->
    <div class="rc-foot" style="justify-content:space-between;padding:0 2px">
      <div style="display:flex;align-items:center;gap:4px">
        <span>ENTRA</span>
        <span class="rc-foot-arrow">→</span>
      </div>
      <button class="rc-bell-btn" id="bell_${r.id}" onclick="toggleRoomAlert('${r.id}',event)" title="Avvisami quando la stanza si anima">${getRoomAlertIcon(r.id)}</button>
    </div>
  </div>`;
}

// ══ ENTER/LEAVE ══
function enterRoom(roomId){
  if(roomId==='scopa'){ openScopaGame(); return; }
  const cfg=ROOMS.find(r=>r.id===roomId);
  if(!cfg) return;

  // Stanze adulti 18+: age gate una-tantum
  if(cfg.tier==='adult'){
    if(!getLS('kv4_age_confirmed')){
      showAgeGate(roomId);
      return;
    }
  }

  // Stanze segrete: chiedi codice (memorizzato localmente)
  if(cfg.tier==='secret'){
    const unlocked=getLS('kv4_unlocked')||{};
    if(!unlocked[cfg.id]){
      const code=prompt(`🔒 ${cfg.name}\n\nInserisci il codice di accesso:`,'');
      if(!code) return;
      if(code.trim().toUpperCase()!==cfg.code){
        showToast('❌ Codice errato');
        return;
      }
      unlocked[cfg.id]=true;
      setLS('kv4_unlocked',unlocked);
      showToast('🔓 Accesso sbloccato!');
    }
  }

  // Eventi a tempo: blocca se non è l'orario
  if(cfg.tier==='event' && !isRoomActiveNow(cfg)){
    showToast('⏰ Questo evento è chiuso adesso. Riprova nelle ore previste.');
    return;
  }

  // Confessionale: 1 messaggio al giorno (controllato in sendMsg, qui solo info)
  if(cfg.tier==='confession'){
    const today=new Date(); today.setHours(0,0,0,0);
    if(user.confessUsedOn===today.getTime()){
      showToast('🕯️ Hai già usato la tua confessione di oggi. Torna domani.');
      // Lo lascio entrare comunque a leggere
    }
  }

  room=cfg; lastSender=null; typingUsers={};
  // Salva ultima stanza per il banner "Riprendi"
  setLS('kv_last_room', roomId);

  const icon=document.getElementById('chatIcon');
  icon.textContent=cfg.emoji;
  icon.style.cssText=`background:${cfg.color}22;border:1px solid ${cfg.color}44;border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0`;
  document.getElementById('chatName').textContent=cfg.name;
  document.getElementById('chatOnline').textContent=(roomOnline[roomId]??0)+' online';
  const dots=document.getElementById('chatDots');
  dots.innerHTML=`<div class="chat-hdr-dot2" style="background:${cfg.dot1}"></div><div class="chat-hdr-dot2" style="background:${cfg.dot2};animation-delay:.3s"></div><div class="chat-hdr-dot2" style="background:${cfg.dot3};animation-delay:.6s"></div>`;

  document.getElementById('chatMsgs').innerHTML='';
  socket.emit('join-chat-room',{roomId,user:pubUser()});

  if(!sessionRooms.has(roomId)){
    sessionRooms.add(roomId);
    document.getElementById('stRooms').textContent=sessionRooms.size;
    if(roomId.startsWith('it-')) addBadge('italy','Made in Italy');
    if(roomId.startsWith('w-')) addBadge('globe','Cittadino del Mondo');
    if(sessionRooms.size>=3) addBadge('explorer','Esploratore');
    saveUser();
  }

  // NEW: Render users panel
  renderUsersPanel();

  updateFreeBar();

  // Mostra modal privacy webcam (solo prima volta), poi entra
  showCamPrivacyIfNeeded(()=>{
    showScreen('chat');
    setTimeout(scrollBot, 150);
    startSpeedDatingTimer(); // avvia countdown 3 min
    // Check empty room dopo 1.5s (tempo di ricevere gli utenti connessi)
    if(_emptyRoomTimer) clearTimeout(_emptyRoomTimer);
    _emptyRoomTimer = setTimeout(checkEmptyRoom, 1500);
    // Sync boost button state
    syncBoostBtn();
  });
  window.trackEvent?.('room_join', { room_id: roomId });
  // Welcome messages iniettati dentro chat-history (quando sappiamo se la stanza è vuota o no)
}
function leaveRoom(){
  stopSpeedDatingTimer();
  // Chiudi solo le peer connections (NON fermare la webcam, evita re-prompt permessi)
  Object.keys(peerConnections).forEach(uid => closePeerConnection(uid));
  selectedUserId = null;
  const tv = document.getElementById('theirVideo'); if (tv) tv.srcObject = null;
  const tl = document.getElementById('theirVideoLabel'); if (tl) tl.textContent = 'Seleziona utente';

  if(room){
    socket.emit('leave-chat-room',{roomId:room.id});
    // Cleanup memory: rimuovi i dati di questa stanza
    if (chatRoomUsers[room.id]) delete chatRoomUsers[room.id];
    if (typingUsers) typingUsers = {};
    room=null;
  }
  showScreen('home',document.querySelector('[data-sc="home"]'));
}

// ══ SHARE ROOM ══
function shareRoom(){
  if(!room) return;
  const url = `https://www.kouverte.com/app.html?room=${room.id}`;
  const text = `Entra in "${room.name}" su Kouverte — chat anonima italiana 🇮🇹`;
  if(navigator.share){
    navigator.share({ title:'Kouverte', text, url }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(url).then(()=>{
      // mini toast nel header
      const btn = document.getElementById('chatShareBtn');
      if(btn){
        const t = document.createElement('div');
        t.className = 'share-copied-toast';
        t.textContent = '✓ Link copiato!';
        btn.style.position = 'relative';
        btn.appendChild(t);
        setTimeout(()=>t.remove(), 1800);
      }
    }).catch(()=> showToast('📋 '+url));
  }
  window.trackEvent?.('share_room', { room_id: room.id });
}

// ══ BOOST VISIBILITÀ ══
const BOOST_COST = 20;
const BOOST_DURATION_MS = 60 * 60 * 1000; // 1 ora
let _boostOriginalName = null;

function openBoostModal(){
  if(!room){ showToast('⚡ Entra in una stanza prima'); return; }
  const now = Date.now();
  const active = user.boostUntil && user.boostUntil > now;
  if(active){
    const mins = Math.ceil((user.boostUntil - now)/60000);
    showToast(`⚡ Boost attivo ancora ${mins} min`);
    return;
  }
  const warn = document.getElementById('boostBalanceWarn');
  const btn  = document.getElementById('boostConfirmBtn');
  const canAfford = (user.coins||0) >= BOOST_COST;
  if(warn){ warn.style.display = canAfford?'none':'block'; warn.textContent = `Monete insufficienti — hai ${user.coins||0} Koins (servono ${BOOST_COST})`; }
  if(btn){ btn.disabled = !canAfford; }
  document.getElementById('boostModal').classList.add('show');
}
function closeBoostModal(){
  document.getElementById('boostModal').classList.remove('show');
}
function confirmBoost(){
  if((user.coins||0) < BOOST_COST){ showToast('❌ Monete insufficienti'); return; }
  // Spendi le monete
  user.coins = (user.coins||0) - BOOST_COST;
  user.boostUntil = Date.now() + BOOST_DURATION_MS;
  // Aggiorna nome con ⚡ (visibile a tutti via socket)
  if(!_boostOriginalName) _boostOriginalName = user.name;
  if(!user.name.endsWith(' ⚡')) user.name = user.name + ' ⚡';
  saveUser();
  updateCoinBar();
  closeBoostModal();
  // Aggiorna bottone header
  syncBoostBtn();
  showToast('⚡ Boost attivo per 1 ora!');
  window.trackEvent?.('boost_activated', { room_id: room?.id });
  // Programma rimozione automatica
  setTimeout(deactivateBoost, BOOST_DURATION_MS);
}
function deactivateBoost(){
  if(!user.boostUntil || Date.now() < user.boostUntil) return; // non ancora scaduto
  if(_boostOriginalName){ user.name = _boostOriginalName; _boostOriginalName = null; }
  user.boostUntil = 0;
  saveUser();
  syncBoostBtn();
}
function syncBoostBtn(){
  const btn = document.getElementById('chatBoostBtn');
  if(!btn) return;
  const active = user.boostUntil && user.boostUntil > Date.now();
  btn.style.background = active ? 'rgba(0,212,255,.25)' : 'rgba(0,212,255,.1)';
  btn.style.borderColor = active ? '#00d4ff' : 'rgba(0,212,255,.2)';
  btn.title = active ? `⚡ Boost attivo — ${Math.ceil((user.boostUntil-Date.now())/60000)} min` : 'Boost visibilità';
}
function initBoost(){
  const now = Date.now();
  if(user.boostUntil && user.boostUntil > now){
    // Boost ancora attivo — ripristina ⚡ nel nome se manca
    if(!user.name.endsWith(' ⚡')) user.name = user.name + ' ⚡';
    syncBoostBtn();
    setTimeout(deactivateBoost, user.boostUntil - now);
  } else if(user.boostUntil && user.boostUntil <= now){
    // Scaduto durante l'assenza
    if(user.name.endsWith(' ⚡')) user.name = user.name.replace(/ ⚡$/, '');
    user.boostUntil = 0;
    saveUser();
  }
}

// ══ RESUME LAST ROOM ══
function initResumeBanner(){
  const lastId = getLS('kv_last_room');
  if(!lastId) return;
  const cfg = ROOMS.find(r=>r.id===lastId);
  if(!cfg) return;
  const banner = document.getElementById('resumeBanner');
  const icon   = document.getElementById('resumeIcon');
  const name   = document.getElementById('resumeName');
  if(!banner) return;
  icon.textContent = cfg.emoji||'🌍';
  name.textContent = cfg.name;
  banner.style.display = 'flex';
}
function resumeLastRoom(){
  const lastId = getLS('kv_last_room');
  if(lastId) enterRoom(lastId);
}
function dismissResume(){
  setLS('kv_last_room', null);
  const b = document.getElementById('resumeBanner');
  if(b){ b.style.transition='opacity .3s,max-height .3s'; b.style.opacity='0'; setTimeout(()=>b.style.display='none',320); }
}

// ══ EMPTY ROOM STATE ══
let _emptyRoomTimer = null;
function checkEmptyRoom(){
  if(!room) return;
  const cnt = roomOnline[room.id]??0;
  const existing = document.getElementById('emptyRoomCard');
  if(cnt <= 1){
    if(!existing){
      const url = `https://www.kouverte.com/app.html?room=${room.id}`;
      const card = document.createElement('div');
      card.id = 'emptyRoomCard';
      card.className = 'empty-room-card';
      card.innerHTML = `
        <div class="empty-room-icon">${room.emoji||'🏙️'}</div>
        <div class="empty-room-title">Sei il primo qui!</div>
        <div class="empty-room-sub">Non c'è ancora nessuno in ${room.name}.<br>Invita qualcuno e inizia la conversazione.</div>
        <button class="empty-room-share" onclick="shareRoomFromEmpty()">
          ↗&nbsp; Invita in ${room.name}
        </button>
        <div class="empty-room-hint">La stanza sarà visibile a tutti quando entrerete</div>`;
      const msgs = document.getElementById('chatMsgs');
      if(msgs) msgs.insertBefore(card, msgs.firstChild);
    }
  } else {
    if(existing) existing.remove();
  }
}
function shareRoomFromEmpty(){
  if(!room) return;
  const url = `https://www.kouverte.com/app.html?room=${room.id}`;
  const text = `Entra con me in "${room.name}" su Kouverte! 🇮🇹`;
  if(navigator.share){ navigator.share({title:'Kouverte',text,url}).catch(()=>{}); }
  else { navigator.clipboard?.writeText(url).then(()=>showToast('✓ Link copiato!')); }
}

// ══ MESSAGES (stile screenshot) ══
function appendMsg(msg){
  if(!msg?.text) return;
  const c=document.getElementById('chatMsgs');
  if(msg.type==='system'){
    const d=document.createElement('div'); d.className='msys'; d.textContent=msg.text;
    c.appendChild(d); lastSender=null; return;
  }
  const isSelf=msg.userId===user.id;
  const consec=lastSender===msg.userId;
  lastSender=msg.userId;
  const col=isSelf?user.color:(msg.color||getColor(msg.userId||''));
  const face=isSelf?user.face:(msg.face||getFace(msg.userId||''));
  const name=isSelf?user.name:(msg.name||'Anonimo');
  const time=new Date(msg.ts||Date.now()).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  const prem=msg.isPremium&&!isSelf;

  const row=document.createElement('div');

  // Cornice attiva mittente: per me uso user.activeFrame, per altri msg.activeFrame
  const senderFrame = isSelf ? (user.activeFrame || 'none') : (msg.activeFrame || 'none');
  const frameClass = (senderFrame && senderFrame !== 'none') ? ' frame-' + senderFrame : '';
  // Effetti shop: nickFx + bubbleFx
  // Auto-glow per utenti Premium (anche se non hanno scelto un nickFx esplicito)
  const isMsgPrem = isSelf ? isPrem() : msg.isPremium;
  let senderNickFx = isSelf ? user.active_nickFx : msg.active_nickFx;
  if (!senderNickFx && isMsgPrem) senderNickFx = 'vip'; // ⭐ brillante oro per Premium
  const nickFxClass = senderNickFx ? ' nick-fx-' + senderNickFx : '';
  const senderBubbleFx = isSelf ? user.active_bubble : msg.active_bubble;
  const bubbleFxClass = senderBubbleFx ? ' bubble-' + senderBubbleFx : '';

  // Helper: HTML dell'avatar (foto o emoji)
  function avatarHtml(photoThumb, faceEmoji, col, size, frameClass2, auraClass2, auraStyle2, consec2, extraAttrs) {
    const s = size || 36;
    if (photoThumb && !consec2) {
      return `<div class="mavatar${frameClass2} ${auraClass2} ${consec2?'hidden':''}" ${extraAttrs||''} style="${auraStyle2}width:${s}px;height:${s}px;border-radius:50%;overflow:hidden;flex-shrink:0;margin-top:1px">
        <img src="${photoThumb}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
      </div>`;
    }
    return `<div class="mavatar${frameClass2} ${auraClass2} ${consec2?'hidden':''}" ${extraAttrs||''} style="${auraStyle2}background:${col}22;width:${s}px;height:${s}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(s*0.5)}px;flex-shrink:0;margin-top:1px">
      ${faceEmoji}
    </div>`;
  }

  // Quote block se il messaggio è una risposta
  const replyBlock = msg.replyTo ? buildReplyQuote(msg.replyTo) : '';

  if(isSelf){
    row.className='mrow self';
    const myCol=user.color, myFace=user.face;
    const myThumb=user.photoThumb||null;
    const myLvl=userLevel(user.msgCount||0);
    const myAuraClass=(isPrem()||myLvl>=10)?'aura-prem':'';
    const myAuraStyle=(isPrem()||myLvl>=10)?`color:${myCol};`:'';
    row.innerHTML=`
      ${avatarHtml(myThumb, myFace, myCol, 36, frameClass, myAuraClass, myAuraStyle, consec, '')}
      <div style="display:flex;flex-direction:column;align-items:flex-end;max-width:75vw">
        ${!consec?`<div style="font-size:11px;color:${myCol};font-weight:700;margin-bottom:3px;text-align:right"><span class="${(nickFxClass||'').trim()}" style="color:${myCol}">${esc(user.name)}</span> <span style="color:#9ca3af;font-weight:600">lvl ${myLvl}</span></div>`:''}
        <div class="mbubble-self${bubbleFxClass}">${replyBlock}${esc(msg.text)}</div>
        <div class="mtime">${time}</div>
      </div>`;
  } else {
    row.className='mrow';
    const nameGlow=prem?`;text-shadow:0 0 6px ${col}`:'';
    const senderMc = msg.msgCount || 0;
    const lvl = userLevel(senderMc);
    const lvlBadge = !consec ? `<span style="font-size:9px;color:#9ca3af;margin-left:3px;font-weight:600">lvl ${lvl}</span>` : '';
    const auraClass = (prem || lvl>=10) ? 'aura-prem' : '';
    const auraStyle = (prem || lvl>=10) ? `color:${col};` : '';
    const clickData = `data-uid="${esc(msg.userId||'')}" data-uname="${esc(name)}" data-uface="${esc(face)}" data-ucolor="${col}" data-uframe="${esc(msg.activeFrame||'none')}" onclick="openUserMenu(this)" style="cursor:pointer"`;
    const msgThumb = msg.photoThumb || null;
    row.innerHTML=`
      ${avatarHtml(msgThumb, face, col, 36, frameClass, auraClass, auraStyle, consec, clickData)}
      <div class="mbody">
        <div class="mline">
          ${!consec?`<span class="mname${nickFxClass}" ${clickData} style="color:${col}${nameGlow};cursor:pointer" title="Tocca per profilo">${esc(name)}${prem?'<span style="font-size:9px;margin-left:3px">⭐</span>':''}</span>${lvlBadge}<span style="color:${col};margin-right:5px">:</span>`:''}
          ${replyBlock}<span class="mtext">${esc(msg.text)}</span>
        </div>
        ${!consec?`<div class="mtime">${time}</div>`:''}
      </div>`;
  }
  // Double-click per aggiungere reazione
  row.ondblclick = (e) => {
    e.stopPropagation();
    const msgId = row.dataset.msgId;
    if(msgId) toggleMsgReaction(msgId, '❤️');
  };
  const msgId = `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  row.dataset.msgId = msgId;
  // Salva dati per reply sul DOM
  row.dataset.replyName  = name;
  row.dataset.replyColor = col;
  row.dataset.replyText  = msg.text.slice(0, 120);
  row.dataset.replyUid   = msg.userId || '';
  // Swipe-to-reply (touch) + hover button (desktop)
  attachSwipeReply(row, msgId, msg.userId||'', name, col, msg.text.slice(0,120));
  // Long-press → share card
  row.addEventListener('contextmenu', (e) => { e.preventDefault(); showMsgContextMenu(e, msg.text, room?.name||'Kouverte'); });
  let _lpTimer; row.addEventListener('touchstart', () => { _lpTimer = setTimeout(() => showMsgContextMenu(null, msg.text, room?.name||'Kouverte'), 600); }, { passive: true });
  row.addEventListener('touchend', () => clearTimeout(_lpTimer));
  row.addEventListener('touchmove', () => clearTimeout(_lpTimer));
  c.appendChild(row);
}

// Menu contestuale messaggio (long-press / tasto destro)
function showMsgContextMenu(event, text, roomName){
  document.getElementById('msgCtxMenu')?.remove();
  const menu = document.createElement('div');
  menu.id = 'msgCtxMenu';
  menu.className = 'msg-ctx-menu';
  menu.innerHTML = `
    <button class="ctx-item" onclick="shareMessage('${text.replace(/'/g,'\\\'').slice(0,200)}','${(roomName||'').replace(/'/g,'\\\'').slice(0,30)}');document.getElementById('msgCtxMenu').remove()">📤 Condividi come Story</button>
    <button class="ctx-item" onclick="navigator.clipboard?.writeText('${text.replace(/'/g,'\\\'').slice(0,200)}');showToast('📋 Copiato');document.getElementById('msgCtxMenu').remove()">📋 Copia testo</button>
    <button class="ctx-item cancel" onclick="document.getElementById('msgCtxMenu').remove()">Annulla</button>`;
  document.body.appendChild(menu);
  if(event){
    menu.style.left = Math.min(event.clientX, window.innerWidth - 200) + 'px';
    menu.style.top  = Math.min(event.clientY, window.innerHeight - 140) + 'px';
  } else {
    menu.style.left = '50%'; menu.style.top = '50%';
    menu.style.transform = 'translate(-50%,-50%)';
  }
  menu.classList.add('show');
  setTimeout(() => document.addEventListener('click', function h(){ menu.remove(); document.removeEventListener('click',h); }), 100);
}

// Costruisce il quote block HTML per i messaggi con replyTo
function buildReplyQuote(replyTo){
  if(!replyTo) return '';
  const safeColor = /^#[0-9a-f]{6}$/i.test(replyTo.color) ? replyTo.color : '#00d4ff';
  const safeName  = esc(String(replyTo.name||'Anonimo').slice(0,30));
  const safeText  = esc(String(replyTo.text||'').slice(0,80));
  return `<div class="msg-quote" style="--qcol:${safeColor}"><div class="msg-quote-name">${safeName}</div><div class="msg-quote-text">${safeText}</div></div>`;
}

function toggleMsgReaction(msgId, emoji){
  if(!msgReactions[msgId]) msgReactions[msgId] = [];
  const existing = msgReactions[msgId].find(r => r.userId === user.id);
  if(existing) {
    if(existing.emoji === emoji) {
      // Toggle off
      msgReactions[msgId] = msgReactions[msgId].filter(r => r.userId !== user.id);
    } else {
      existing.emoji = emoji;
    }
  } else {
    msgReactions[msgId].push({emoji, userId: user.id});
  }

  // Aggiorna UI
  const row = document.querySelector(`[data-msg-id="${msgId}"]`);
  if(row) {
    let reactions = row.querySelector('.msg-reactions');
    if(!reactions) {
      reactions = document.createElement('div');
      reactions.className = 'msg-reactions';
      row.appendChild(reactions);
    }

    const grouped = {};
    msgReactions[msgId].forEach(r => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
    });

    reactions.innerHTML = Object.entries(grouped).map(([emoji, count]) =>
      `<span style="display:inline-flex;align-items:center;gap:3px;background:rgba(0,212,255,0.15);border:1px solid rgba(0,212,255,0.3);border-radius:12px;padding:2px 6px;font-size:12px;margin-right:4px;margin-top:4px">${emoji} ${count}</span>`
    ).join('');
  }
}

function addSys(text){ appendMsg({type:'system',text}); scrollBot(); }

// ════════════════════════════════════════════════════════
// REPLY TO MESSAGE
// ════════════════════════════════════════════════════════
function startReply(msgId, userId, name, color, text){
  activeReply = { msgId, userId, name, color, text };
  const bar = document.getElementById('replyBar');
  const nameEl = document.getElementById('replyBarName');
  const textEl = document.getElementById('replyBarText');
  const line = document.getElementById('replyBarLine');
  if(!bar) return;
  nameEl.textContent = name;
  nameEl.style.color = color || '#00d4ff';
  textEl.textContent = text.slice(0, 80);
  line.style.background = color || '#00d4ff';
  bar.style.display = 'flex';
  // Focus sull'input
  const inp = document.getElementById('msgInput');
  if(inp){ inp.focus(); }
  haptic('light');
}

function clearReply(){
  activeReply = null;
  const bar = document.getElementById('replyBar');
  if(bar) bar.style.display = 'none';
}

// Swipe-to-reply: aggiungo listener touch su un messaggio
function attachSwipeReply(row, msgId, userId, name, color, text){
  let touchStartX = 0;
  let touchStartY = 0;
  let swiping = false;
  const SWIPE_THRESHOLD = 60;

  row.style.position = 'relative';

  row.addEventListener('touchstart', (e)=>{
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    swiping = false;
  }, {passive:true});

  row.addEventListener('touchmove', (e)=>{
    const dx = e.touches[0].clientX - touchStartX;
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    // Solo swipe orizzontale (non scroll verticale)
    if(dy > 20 && !swiping) return;
    if(dx > 8){
      swiping = true;
      const clamped = Math.min(dx, SWIPE_THRESHOLD + 10);
      row.style.transform = `translateX(${clamped}px)`;
      row.classList.add('swiping');
      if(dx >= SWIPE_THRESHOLD){
        row.classList.add('swipe-triggered');
      } else {
        row.classList.remove('swipe-triggered');
      }
    }
  }, {passive:true});

  row.addEventListener('touchend', ()=>{
    const travelX = parseFloat(row.style.transform.replace('translateX(','').replace('px)','')) || 0;
    row.style.transform = '';
    row.classList.remove('swiping','swipe-triggered');
    if(travelX >= SWIPE_THRESHOLD){
      startReply(msgId, userId, name, color, text);
    }
  }, {passive:true});

  // Desktop: bottone reply su hover (appare a destra del messaggio)
  row.addEventListener('mouseenter', ()=>{
    if(!row._replyBtn){
      const btn = document.createElement('button');
      btn.className = 'msg-reply-hover-btn';
      btn.innerHTML = '↩';
      btn.title = 'Rispondi';
      btn.onclick = (e)=>{ e.stopPropagation(); startReply(msgId, userId, name, color, text); };
      row._replyBtn = btn;
      row.style.position = 'relative';
    }
    row.appendChild(row._replyBtn);
  });
  row.addEventListener('mouseleave', ()=>{
    if(row._replyBtn && row._replyBtn.parentNode === row) row.removeChild(row._replyBtn);
  });
}

function sendMsg(){
  const inp=document.getElementById('msgInput');
  const text=inp.value.trim();
  if(!text) return;
  if(!room){showToast('⚠️ Entra in una stanza prima');return;}
  if(!socket?.connected){showToast('🔄 Connessione in corso...');socket&&socket.connect();return;}

  // Confessionale: 1 al giorno
  if(room.tier==='confession'){
    const today=new Date(); today.setHours(0,0,0,0);
    if(user.confessUsedOn===today.getTime()){
      showToast('🕯️ Hai già usato la tua confessione oggi.');
      return;
    }
    user.confessUsedOn=today.getTime();
  }
  if(!isPrem()&&(user.freeUsed||0)>=FREE_LIMIT){showPaywall();return;}

  // Confessionale: anonimizza completamente (nome random, no level/premium)
  const isConfession = room.tier==='confession';
  // Cattura reply prima di creare il msg
  const reply = activeReply ? { ...activeReply } : null;
  clearReply();

  const msg = isConfession ? {
    userId:'anon_'+Math.random().toString(36).slice(2,8),
    name:'Anonimo',
    color:'#9ca3af', face:'🕯️',
    text, ts:Date.now(), roomId:room.id, msgCount:0
  } : {
    userId:user.id, name:user.name, color:user.color,
    face:user.face, frame:user.activeFrame, activeFrame:user.activeFrame,
    active_nickFx:user.active_nickFx, active_bubble:user.active_bubble,
    isPremium:isPrem(), photoThumb: user.photoThumb || null,
    text, ts:Date.now(), roomId:room.id, msgCount:user.msgCount,
    replyTo: reply || undefined
  };
  socket.emit('chat-message',{roomId:room.id,msg});
  appendMsg(msg); scrollBot();
  window.trackEvent?.('message_sent', { room_id: room.id, room_tier: room.tier || 'standard' });

  // Aggiorna preview
  roomPreviews[room.id]=roomPreviews[room.id]||[];
  roomPreviews[room.id].push(msg);
  if(roomPreviews[room.id].length>4) roomPreviews[room.id].shift();

  inp.value=''; inp.style.height='auto'; stopTyping();
  user.msgCount=(user.msgCount||0)+1;
  if(!isPrem()) user.freeUsed=(user.freeUsed||0)+1;
  // Economia: +1 KVC per messaggio (x2 se boost attivo)
  const coinReward = (Date.now()<(user.boostUntil||0)) ? 2 : 1;
  user.coins=(user.coins||0)+coinReward;
  document.getElementById('stMsgs').textContent=user.msgCount;
  updateFreeBar(); checkBadges(); saveUser(); updateCoinBar();
  if(!isPrem()&&user.freeUsed===80) showToast('⚠️ 20 messaggi gratuiti rimasti!');
  if(!isPrem()&&user.freeUsed>=FREE_LIMIT) setTimeout(showPaywall,400);
}

// ══ TYPING ══
function setupInput(){
  const inp=document.getElementById('msgInput');
  inp.addEventListener('input',()=>{
    inp.style.height='auto';
    inp.style.height=Math.min(inp.scrollHeight,100)+'px';
    if(!isTyping&&room){isTyping=true;socket.emit('chat-typing',{roomId:room.id,user:pubUser()});}
    clearTimeout(tTimer); tTimer=setTimeout(stopTyping,2000);
  });
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
}
function stopTyping(){
  if(isTyping&&room){isTyping=false;socket.emit('chat-stop-typing',{roomId:room.id,userId:user.id});}
  clearTimeout(tTimer);
}
function renderTyping(){
  const c=document.getElementById('chatMsgs');
  let el=document.getElementById('tind');
  const users=Object.values(typingUsers);
  if(!users.length){el?.remove();return;}
  if(!el){el=document.createElement('div');el.id='tind';el.className='trow';c.appendChild(el);}

  const n=users.length;
  let label, avatars='';

  // Mostra avatar degli utenti che stanno digitando (max 3)
  users.slice(0,3).forEach((u,i)=>{
    avatars+=`<div style="width:20px;height:20px;border-radius:50%;background:${u.color};display:flex;align-items:center;justify-content:center;font-size:10px;margin-right:-8px;border:2px solid #0f1117;z-index:${3-i};position:relative;animation:td 0.8s ease-in-out infinite" style="animation-delay:${i*0.1}s">${esc(u.face||u.name[0])}</div>`;
  });

  // Label per quanti stanno digitando
  if(n===1){
    label=`<span style="color:${users[0].color};font-weight:600">${esc(users[0].name)}</span> sta scrivendo...`;
  } else if(n===2){
    label=`<span style="color:${users[0].color};font-weight:600">${esc(users[0].name)}</span> e <span style="color:${users[1].color};font-weight:600">${esc(users[1].name)}</span> stanno scrivendo...`;
  } else {
    label=`<span style="color:#00d4ff;font-weight:600">${n} persone</span> stanno scrivendo...`;
  }

  el.innerHTML=`
    <div style="display:flex;gap:6px;align-items:center;flex:1">
      <div style="display:flex;align-items:center;position:relative;width:${Math.min(n,3)*12+10}px;height:20px">
        ${avatars}
      </div>
      <div class="tbbl"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>
      <span class="tnames">${label}</span>
    </div>
  `;
  scrollBot();
}

// ══ PAYWALL ══
function showPaywall(){document.getElementById('paywallOv').classList.add('open');}
function closePaywall(){document.getElementById('paywallOv').classList.remove('open');}
function closeBtcModal(){
  document.getElementById('btcOv').classList.remove('open');
  if(window.__btcPoll){clearInterval(window.__btcPoll);window.__btcPoll=null;}
}
function copyText(t){
  navigator.clipboard?.writeText(t).then(()=>showToast('📋 Copiato!')).catch(()=>{});
}

async function startBtcPayment(tier){
  // tier: 'mini' (1€/+200msg), 'monthly' (3€/30g premium), 'yearly' (19€/365g VIP)
  tier = tier || 'monthly';
  window.__btcTier = tier;
  closePaywall();
  document.getElementById('btcStatus').textContent='⏳ Creo invoice...';
  document.getElementById('btcOv').classList.add('open');
  try{
    const r=await fetch(BACKEND+'/api/btc/quote-premium',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:user.id, tier:tier})});
    if(!r.ok) throw new Error('quote failed');
    const d=await r.json();
    window.__btcInvoiceId=d.id;
    window.__btcSats=d.sats;
    document.getElementById('btcSats').textContent=d.sats.toLocaleString('it-IT');
    document.getElementById('btcBtc').textContent=d.btc;
    document.getElementById('btcEur').textContent=d.eur;
    document.getElementById('btcAddr').textContent=d.address;
    // QR via servizio pubblico (no dipendenze)
    const qrData=encodeURIComponent('bitcoin:'+d.address+'?amount='+d.btc);
    document.getElementById('btcQrBox').innerHTML=`<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}" alt="QR" style="border-radius:12px;background:#fff;padding:8px;max-width:180px"/>`;
    document.getElementById('btcStatus').textContent='⏳ In attesa del pagamento... ('+d.requiredConfirmations+' conferme richieste)';
    // Auto-poll ogni 60s
    if(window.__btcPoll) clearInterval(window.__btcPoll);
    window.__btcPoll=setInterval(checkBtcPayment,60000);
  }catch(e){
    document.getElementById('btcStatus').textContent='⚠️ Errore. Chiudi e riprova.';
  }
}

async function checkBtcPayment(){
  if(!window.__btcInvoiceId) return;
  const status=document.getElementById('btcStatus');
  status.textContent='🔍 Verifico sulla blockchain...';
  try{
    const r=await fetch(BACKEND+'/api/btc/check-status',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:window.__btcInvoiceId})});
    const d=await r.json();
    if(d.status==='paid'){
      if(window.__btcPoll){clearInterval(window.__btcPoll);window.__btcPoll=null;}
      activatePremium();
      closeBtcModal();
      showToast('🎉 Premium attivato! Messaggi illimitati per 30 giorni!');
    } else if(d.status==='expired'){
      status.textContent='⚠️ Invoice scaduta. Riapri il paywall.';
      if(window.__btcPoll){clearInterval(window.__btcPoll);window.__btcPoll=null;}
    } else {
      const c=d.confirmations||0, req=d.required||4;
      status.textContent=c>0?`⏳ Pagamento rilevato — ${c}/${req} conferme`:'⏳ Pagamento non ancora ricevuto';
    }
  }catch(e){
    status.textContent='⚠️ Errore verifica. Riprova tra qualche secondo.';
  }
}

// Verifica premium server-side all'avvio
async function syncPremiumStatus(){
  try{
    const r=await fetch(BACKEND+'/api/me/premium-status?userId='+encodeURIComponent(user.id));
    const d=await r.json();
    if(d.premium && Date.now()<d.expiresAt){
      user.isPremium=true;user.premExpiry=d.expiresAt;
      ['gold','flame','diamond'].forEach(f=>{if(!user.ownedFrames.includes(f)) user.ownedFrames.push(f);});
      saveUser();updateProfileUI();renderFrames();
    }
  }catch(e){}
}
function activatePremium(){
  user.isPremium=true; user.premExpiry=Date.now()+30*24*60*60*1000;
  ['gold','diamond','flame'].forEach(f=>{ if(!user.ownedFrames.includes(f)) user.ownedFrames.push(f); });
  addBadge('premium','Premium'); saveUser(); updateProfileUI(); renderFrames();
}

// ══ FRAMES ══
// ── AVATAR MENU: scegli emoji + apri selettore cornici ──
function openAvatarMenu(){
  let overlay = document.getElementById('avatarMenuOv');
  if (!overlay){
    overlay = document.createElement('div');
    overlay.id = 'avatarMenuOv';
    overlay.className = 'avatar-menu-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
    document.body.appendChild(overlay);
  }
  const grouped = {
    'Animali': FACE_EMOJIS.filter(e => '🦊🐺🦁🐯🐱🐶🐼🐨🐸🐙🦅🦋🐲🦂🦄🐉🐅🐊🦈🦚🦜🐝🐞🦓'.includes(e)),
    'Fantasy': FACE_EMOJIS.filter(e => '😈👻💀👹👺🤖👾👽🧙🧛🧚🧜🧝'.includes(e)),
    'Stile': FACE_EMOJIS.filter(e => '😎🤩🥷🎭🦹🦸🤡👑💎'.includes(e))
  };
  let html = '<div class="avatar-menu-sheet"><div class="avatar-menu-title">🎨 Personalizza Avatar</div>';
  // Foto profilo in cima (se presente mostra anteprima, altrimenti upload)
  if (user.customAvatar) {
    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px;background:rgba(0,212,255,.08);border-radius:12px;border:1px solid rgba(0,212,255,.15)">
      <img id="avatarPreviewImg" src="${user.customAvatar}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0">
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#fff">Foto profilo</div><div style="font-size:11px;color:#9ca3af;margin-top:2px">Attiva in chat e profilo</div></div>
      <button onclick="triggerAvatarUpload()" style="background:rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.3);color:#00d4ff;font-size:12px;padding:5px 10px;border-radius:8px;cursor:pointer">Cambia</button>
      <button onclick="resetAvatar()" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12px;padding:5px 8px;border-radius:8px;cursor:pointer">✕</button>
    </div>`;
  } else {
    html += `<button onclick="triggerAvatarUpload()" style="width:100%;display:flex;align-items:center;gap:10px;background:rgba(0,212,255,.08);border:1px dashed rgba(0,212,255,.3);color:#00d4ff;border-radius:12px;padding:12px 16px;cursor:pointer;margin-bottom:14px;font-weight:700;font-size:14px">
      <span style="font-size:22px">📸</span><span>Carica foto profilo</span>
    </button>`;
  }
  for (const [sec, emojis] of Object.entries(grouped)){
    html += `<div class="avatar-menu-section-title">${sec}</div><div class="avatar-menu-grid">`;
    emojis.forEach(e => {
      const sel = (user.face === e) ? 'selected' : '';
      html += `<div class="avatar-emoji-opt ${sel}" data-emoji="${e}" onclick="selectAvatarEmoji('${e}')">${e}</div>`;
    });
    html += '</div>';
  }
  html += '<div class="avatar-menu-section-title">Cornici</div>';
  html += '<button class="btn-p" style="width:100%;margin-bottom:8px" onclick="document.getElementById(\'avatarMenuOv\').classList.remove(\'show\');openFrameSelector()">🖼️ Scegli cornice</button>';
  html += '<button class="btn-s" style="width:100%" onclick="document.getElementById(\'avatarMenuOv\').classList.remove(\'show\')">Chiudi</button>';
  html += '</div>';
  overlay.innerHTML = html;
  overlay.classList.add('show');
}
function selectAvatarEmoji(emoji){
  user.face = emoji;
  saveUser();
  if(typeof syncUserDataToServer === 'function' && isLoggedIn) syncUserDataToServer();
  updateProfileUI();
  document.querySelectorAll('.avatar-emoji-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.avatar-emoji-opt[data-emoji="${emoji}"]`)?.classList.add('selected');
  if (window.hapticOk) window.hapticOk();
  showToast('✨ Avatar aggiornato!');
  setTimeout(() => document.getElementById('avatarMenuOv')?.classList.remove('show'), 600);
}

function openFrameSelector(){
  showScreen('profile', document.querySelector('[data-sc="profile"]'));
  setTimeout(() => {
    const grid = document.getElementById('framesGrid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);
}

function renderFrames(){
  const owned=new Set(user.ownedFrames||['none']);
  const active=user.activeFrame||'none';
  document.getElementById('framesGrid').innerHTML=FRAMES_CFG.map(f=>{
    const isO=owned.has(f.id), isA=f.id===active;
    const priceStr=isO?'':(f.prem?'Premium 5€':'Gratis');
    return `<div class="frame-c ${isO?'owned':''} ${isA?'active-frame':''}" onclick="selFrame('${f.id}')">
      ${isA?'<span class="f-tag active">Attiva</span>':isO?'<span class="f-tag owned">Tua</span>':''}
      <div class="frame-preview" style="${isO?f.css:''}">${f.emoji}</div>
      <div class="frame-name">${f.name}</div>
      <div class="frame-price ${f.price===0&&!f.prem?'free':''}">${priceStr}</div>
    </div>`;
  }).join('');
}
function selFrame(id){
  const f=FRAMES_CFG.find(x=>x.id===id);
  if(!f) return;
  // Se gia posseduta → attiva
  if(new Set(user.ownedFrames).has(id)){
    user.activeFrame=id; saveUser(); renderFrames(); updateProfileUI();
    showToast('✅ Cornice '+f.emoji+' '+f.name+' attivata!'); return;
  }
  // Cornici premium: solo via Premium
  if(f.prem && !isPrem()){
    closeFrameM(); showPaywall(); return;
  }
  // Cornici a pagamento con monete (non premium)
  if(!f.prem && f.price>0){
    const coins = user.coins || 0;
    if(coins < f.price){
      showToast('⚠️ Servono '+f.price+' 🪙 (hai '+coins+' 🪙). Chatta o usa la ruota per guadagnare!');
      return;
    }
    // Conferma acquisto
    if(confirm('Acquistare '+f.emoji+' '+f.name+' per '+f.price+' 🪙?\nHai '+coins+' 🪙 disponibili.')){
      user.coins = coins - f.price;
      user.ownedFrames = user.ownedFrames || [];
      if(!user.ownedFrames.includes(id)) user.ownedFrames.push(id);
      user.activeFrame = id;
      saveUser();
      renderFrames();
      updateProfileUI();
      updateCoinBar();
      // Check badge collezionista
      if((user.ownedFrames || []).length >= 5) addBadge('frame_collector','Collezionista');
      showToast('🎉 '+f.emoji+' '+f.name+' acquistata e attivata!');
    }
    return;
  }
  // Cornice gratuita non posseduta: aggiungila e attiva
  if(!f.prem && f.price === 0){
    user.ownedFrames = user.ownedFrames || [];
    if(!user.ownedFrames.includes(id)) user.ownedFrames.push(id);
    user.activeFrame = id;
    saveUser();
    renderFrames();
    updateProfileUI();
    showToast('✅ Cornice '+f.emoji+' '+f.name+' sbloccata e attivata!');
    return;
  }
  showToast('⚠️ Cornice non disponibile');
}
function closeFrameM(){document.getElementById('frameOv').classList.remove('open');selFrameId=null;}
// buyFrame singolo rimosso: cornici premium si sbloccano solo con Premium o referral

// ══ BADGES ══
function checkBadges(){
  const mc=user.msgCount||0;
  if(mc>=1)   addBadge('first_msg','Prima Parola');
  if(mc>=100) addBadge('chatter','Chiacchierone');
  if(mc>=500) addBadge('legend','Leggenda');
  if(isPrem()) addBadge('premium','Premium');
  if((new Date().getHours()>=23||new Date().getHours()<5)) addBadge('nocturnal','Nottambulo');
}
function addBadge(id,label){
  if((user.badges||[]).includes(id)) return;
  user.badges=[...(user.badges||[]),id];
  document.getElementById('stBadges').textContent=user.badges.length;
  renderBadges(); saveUser(); showToast('🏆 Badge: '+label+'!');
}
function renderBadges(){
  const earned=new Set(user?.badges||[]);
  document.getElementById('badgesGrid').innerHTML=BADGES.map(b=>`
    <div class="badge-c ${earned.has(b.id)?'earned':'locked'}">
      <div class="badge-e">${b.emoji}</div>
      <div class="badge-n">${b.name}</div>
    </div>`).join('');
}

// ══ NAV ══
var _showScreenTimer = null;
function showScreen(name,btn){
  clearTimeout(_showScreenTimer);
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(name)?.classList.add('active');
  document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  else{const nb=document.querySelector(`[data-sc="${name}"]`);if(nb) nb.classList.add('active');}
  document.getElementById('opill').style.display=name==='home'?'flex':'none';
  document.querySelector('.bnav').style.display = name==='chat' ? 'none' : 'flex';
  _showScreenTimer = setTimeout(()=>_showScreenTimer=null, 300);
  if (name === 'profile') triggerProfileAnimations();
  // GA4: track screen view
  window.trackEvent?.('screen_view', { screen_name: name });
}

// ══ UTILS ══
function scrollBot(){requestAnimationFrame(()=>{const c=document.getElementById('chatMsgs');c.scrollTop=c.scrollHeight;});}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200);}
function getLS(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function setLS(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}

// ══ ONBOARDING STRIP ══
function initOnboardingStrip(){
  const strip = document.getElementById('onboardingStrip');
  if(!strip) return;
  if(getLS('kv_obs_dismissed')||getLS('kv_wizard_done')){
    strip.style.display = 'none';
  }
}
function dismissOnboarding(){
  setLS('kv_obs_dismissed', true);
  const strip = document.getElementById('onboardingStrip');
  if(strip){ strip.style.maxHeight = strip.scrollHeight+'px'; strip.style.transition='max-height .4s ease,opacity .4s ease,margin .4s ease'; strip.style.overflow='hidden'; requestAnimationFrame(()=>{ strip.style.maxHeight='0'; strip.style.opacity='0'; strip.style.marginBottom='0'; strip.style.padding='0'; }); setTimeout(()=>strip.style.display='none',420); }
}

// ══ ONBOARDING WIZARD (prima visita) ══
let _owizSelectedRoom = null;

function initOnboardingWizard(){
  // Mostra solo se mai completato prima
  if(getLS('kv_wizard_done') || getLS('kv_obs_dismissed')) return;
  // Popola griglia stanze nel wizard
  const grid = document.getElementById('owizRoomsGrid');
  if(grid && typeof ROOMS !== 'undefined'){
    const toShow = ROOMS.slice(0,9);
    grid.innerHTML = toShow.map(r=>`
      <div class="owiz-room-btn" onclick="owizSelectRoom('${r.id}',this)" data-rid="${r.id}">
        <span class="room-em">${r.emoji||'🌍'}</span>
        <span>${(r.name||'').replace(/^[\p{Emoji}\p{Extended_Pictographic}️]+\s*/u,'').trim()||r.name}</span>
      </div>`).join('');
  }
  // Mostra dopo breve delay (non interrompere il caricamento)
  setTimeout(()=>{
    const wiz = document.getElementById('onboardingWizard');
    if(wiz) wiz.style.display='flex';
  }, 800);
}

function owizNext(step){
  // Valida step 1 nickname se presente
  document.querySelectorAll('.owiz-step').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById('owStep'+step);
  if(el) el.classList.add('active');
  // aggiorna dots
  document.querySelectorAll('.owiz-dot').forEach((d,i)=>{
    d.classList.toggle('active', i===step);
  });
  // focus input nickname
  if(step===1){ setTimeout(()=>{const i=document.getElementById('owizNickInput');if(i)i.focus();},200); }
  if(step===2){ _owizSelectedRoom=null; }
}

function owizSyncNick(){
  const v=(document.getElementById('owizNickInput')||{}).value||'';
  const btn=document.getElementById('owizNickBtn');
  if(!btn) return;
  const ok=v.trim().length>=2;
  btn.style.opacity=ok?'1':'0.5';
  btn.style.pointerEvents=ok?'auto':'none';
}

function owizApplyNick(){
  const raw=(document.getElementById('owizNickInput')||{}).value||'';
  const nick=raw.trim().replace(/[<>"'&]/g,'').substring(0,20);
  if(nick.length<2) return;
  // Applica nickname al user object
  if(typeof user !== 'undefined' && user){ user.name=nick; if(typeof saveUser==='function') saveUser(); }
  owizNext(2);
}

function owizSelectRoom(rid, el){
  _owizSelectedRoom = rid;
  document.querySelectorAll('.owiz-room-btn').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  const btn=document.getElementById('owizEnterBtn');
  if(btn){ btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
}

function owizEnterRoom(){
  if(!_owizSelectedRoom) return;
  owizDone();
  // breve delay per chiusura animazione
  setTimeout(()=>{ if(typeof enterRoom==='function') enterRoom(_owizSelectedRoom); },300);
}

function owizDone(){
  setLS('kv_wizard_done', true);
  setLS('kv_obs_dismissed', true);
  const wiz = document.getElementById('onboardingWizard');
  if(!wiz) return;
  wiz.style.transition='opacity .3s';
  wiz.style.opacity='0';
  setTimeout(()=>{ wiz.style.display='none'; wiz.style.opacity=''; }, 320);
  // Nascondi anche strip
  const strip = document.getElementById('onboardingStrip');
  if(strip) strip.style.display='none';
}

// ══ MODAL PRIVACY WEBCAM ══
function showCamPrivacyIfNeeded(cb){
  if(getLS('kv_cam_privacy_seen')){
    if(cb) cb();
    return;
  }
  const modal = document.getElementById('modalCamPrivacy');
  if(!modal){ if(cb) cb(); return; }
  modal.style.display = 'flex';
  modal._cb = cb;
}
function closeCamPrivacy(){
  setLS('kv_cam_privacy_seen', true);
  const modal = document.getElementById('modalCamPrivacy');
  if(!modal) return;
  modal.style.display = 'none';
  if(modal._cb){ modal._cb(); modal._cb = null; }
}

// ══ MESSAGGI BENVENUTO IN STANZA ══
const ROOM_WELCOME = {
  'it-napoli': ["Benvenuto a Napoli! 🌊 La stanza più calda d'Italia ti aspetta.", "Ciao! Scrivi qualcosa e vedrai che qualcuno risponde 😊"],
  'it-roma': ["Benvenuto nella Capitale! 🏛️ La chat di Roma è attiva.", "Dai un saluto, ci sono persone pronte a chattare!"],
  'it-milano': ["Benvenuto a Milano! 🏙️ La chat business più attiva d'Italia.", "Scrivi pure, qui si parla di tutto da moda a calcio ⚽"],
  'it-palermo': ["Benvenuto a Palermo! 🌺 La Sicilia ti accoglie.", "Ciao! Non essere timido, scrivi qualcosa 😄"],
  'it-sicilia': ["Benvenuto in Sicilia! 🍊 Il sole e il mare in parole.", "La stanza è rilassata, chatta liberamente 🌊"],
  'it-campania': ["Benvenuto in Campania! 🍕 Terra di sole e buona cucina.", "Ciao! Presenta te stesso o chatta di qualsiasi cosa 😊"],
  'it-italia': ["Benvenuto nella stanza Italia! 🇮🇹 Persone da tutta la penisola.", "Qui si chatta di tutto — calcio, politica, vita quotidiana 😄"],
  'confessionale': ["🕯️ Sei nel Confessionale. Qui puoi scrivere in anonimato assoluto.", "Ciò che scrivi qui resta qui. Nessun giudizio."]
};
function injectWelcomeMessages(roomId){
  const msgs = ROOM_WELCOME[roomId] || ["Benvenuto in questa stanza! 👋 Scrivi qualcosa per iniziare a chattare.", "La webcam è facoltativa — chatta pure solo in testo 😊"];
  const c = document.getElementById('chatMsgs');
  if(!c) return;
  // Messaggio benvenuto strutturato
  const welcome = document.createElement('div');
  welcome.className = 'msg-welcome';
  welcome.innerHTML = `<div class="msg-welcome-icon">👋</div><div class="msg-welcome-body"><div class="msg-welcome-title">Benvenuto nella stanza!</div><div class="msg-welcome-sub">${msgs[0]}</div></div>`;
  c.appendChild(welcome);
  // Secondo messaggio dopo 2 secondi
  if(msgs[1]){
    setTimeout(()=>{
      const c2 = document.getElementById('chatMsgs');
      if(!c2) return;
      const sysEl = document.createElement('div');
      sysEl.className = 'msys';
      sysEl.textContent = msgs[1];
      c2.appendChild(sysEl);
      scrollBot();
    }, 2200);
  }
  scrollBot();
}
var _saveUserTimer = null;
function saveUser(){
  // Debounce: scrivi al massimo ogni 300ms (localStorage è sincrono e bloccante)
  if (_saveUserTimer) clearTimeout(_saveUserTimer);
  _saveUserTimer = setTimeout(() => { setLS('kv4_user', user); _saveUserTimer = null; }, 300);
}
// Forza scrittura immediata (es. prima di unload)
function saveUserNow(){
  if (_saveUserTimer) { clearTimeout(_saveUserTimer); _saveUserTimer = null; }
  setLS('kv4_user', user);
}
window.addEventListener('pagehide', saveUserNow);
window.addEventListener('beforeunload', saveUserNow);

// ══════════════════════════════════════════
// LOGIN / REGISTRAZIONE + SYNC DATI
// ══════════════════════════════════════════
// IMPORTANTE: usare var per evitare Temporal Dead Zone
// (funzioni che vengono chiamate da DOMContentLoaded o onclick HTML)
var authToken = null;
var isLoggedIn = false;
var syncTimer = null;

function getAuthToken(){
  if (authToken) return authToken;
  authToken = getLS('kv4_auth_token');
  return authToken;
}

function setAuthToken(token){
  authToken = token;
  if (token) {
    setLS('kv4_auth_token', token);
    isLoggedIn = true;
    updateAuthMenuText();
  } else {
    localStorage.removeItem('kv4_auth_token');
    isLoggedIn = false;
    updateAuthMenuText();
  }
}

function updateAuthMenuText(){
  const el = document.getElementById('authMenuText');
  if (el) el.textContent = isLoggedIn ? `✅ ${user.username || user.name} (Logout account)` : 'Login / Registrati';
}

async function tryAutoLogin(){
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      setAuthToken(null);
      return false;
    }
    const json = await res.json();
    if (json.user) {
      isLoggedIn = true;
      user.username = json.user.username;
      user.serverEmail = json.user.email;
      user.serverId = json.user.id;

      // Recupera dati salvati sul server (se più recenti)
      if (json.user.kvData && json.user.kvData._syncedAt) {
        const localUpdated = user._localUpdated || 0;
        if (json.user.kvData._syncedAt > localUpdated) {
          // Merge dati server con locali MA NON sovrascrivere name
          const preserveName = user.name;
          Object.assign(user, json.user.kvData);
          delete user._syncedAt;
          // name = username se loggato, altrimenti preserva quello che c'era
          user.name = json.user.username || preserveName;
        }
      }
      // Forza name = username (l'utente vuole vedere sempre il suo username)
      if (json.user.username) {
        user.name = json.user.username;
      }
      saveUser();
      updateProfileUI();
      updateCoinBar();
      updateAuthMenuText();
      console.log('[Auth] Auto-login OK, nome:', user.name);
      return true;
    }
  } catch(e) {
    console.error('[Auth] Errore auto-login:', e);
  }
  return false;
}

// Decode JWT payload (no verify, solo per leggere exp)
function decodeJWTPayload(token){
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch(e) { return null; }
}

// Auto-refresh token quando manca <7 giorni alla scadenza
var refreshTimer = null;
async function refreshAuthToken(){
  if (!isLoggedIn || !authToken) return;
  try {
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify({ rememberMe: true })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.token) {
        setAuthToken(json.token);
        console.log('[Auth] ✅ Token rinnovato, scade tra', Math.round((json.expiresInSeconds || 0)/86400), 'giorni');
      }
    } else {
      // Token scaduto: forza login
      console.warn('[Auth] Token scaduto, richiede nuovo login');
      handleTokenExpired();
    }
  } catch(e) {
    console.error('[Auth] Errore refresh token:', e);
  }
}

function startTokenAutoRefresh(){
  if (refreshTimer) clearInterval(refreshTimer);
  // Check ogni 6 ore se serve rinnovare
  refreshTimer = setInterval(() => {
    if (!isLoggedIn || !authToken) return;
    const payload = decodeJWTPayload(authToken);
    if (!payload || !payload.exp) return;
    const now = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - now;
    // Se mancano meno di 7 giorni → rinnova
    if (remaining < 7 * 24 * 3600 && remaining > 0) {
      console.log('[Auth] Token scade tra', Math.round(remaining/86400), 'giorni → refresh');
      refreshAuthToken();
    } else if (remaining <= 0) {
      handleTokenExpired();
    }
  }, 6 * 3600 * 1000); // ogni 6 ore

  // Check immediato al login/start
  setTimeout(() => {
    const payload = decodeJWTPayload(authToken);
    if (payload && payload.exp) {
      const remaining = payload.exp - Math.floor(Date.now() / 1000);
      if (remaining < 7 * 24 * 3600 && remaining > 0) refreshAuthToken();
    }
  }, 5000);
}

function handleTokenExpired(){
  // Token scaduto: pulisci sessione e mostra prompt con auto-fill
  isLoggedIn = false;
  authToken = null;
  try { localStorage.removeItem('kv4_auth_token'); } catch(e){}
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }

  // Mostra modal di re-login NON invasivo (toast persistente con click)
  showReloginPrompt();
}

function showReloginPrompt(){
  // Toast persistente in alto che dice "Sessione scaduta - riconnetti"
  const existing = document.getElementById('reloginToast');
  if (existing) return;

  const remembered = getLS('kv4_remember_user') || '';
  const div = document.createElement('div');
  div.id = 'reloginToast';
  div.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00d4ff,#00d4ff);color:#fff;padding:14px 20px;border-radius:14px;box-shadow:0 8px 24px rgba(0,212,255,0.4);z-index:99999;display:flex;align-items:center;gap:12px;font-size:13px;max-width:90vw;animation:slideDown 0.4s ease-out';
  div.innerHTML = `
    <div style="font-size:24px">🔐</div>
    <div style="flex:1">
      <div style="font-weight:600;margin-bottom:2px">Sessione scaduta</div>
      <div style="font-size:11px;opacity:0.9">${remembered ? 'Reinserisci la password per ' + remembered : 'Riconnetti il tuo account'}</div>
    </div>
    <button onclick="document.getElementById('reloginToast').remove();openAuthModal();setTimeout(()=>switchAuthMode('login'),100)" style="background:#fff;color:#00d4ff;border:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;flex-shrink:0">🔑 Accedi</button>
    <button onclick="document.getElementById('reloginToast').remove()" style="background:transparent;border:none;color:#fff;font-size:16px;cursor:pointer;opacity:0.6;flex-shrink:0">✕</button>
  `;
  document.body.appendChild(div);

  // Aggiungi keyframe animazione se non già presente
  if (!document.getElementById('reloginToastStyle')) {
    const s = document.createElement('style');
    s.id = 'reloginToastStyle';
    s.textContent = '@keyframes slideDown{from{transform:translateX(-50%) translateY(-100px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}';
    document.head.appendChild(s);
  }
}

// Sync periodica con server (ogni 30 secondi se loggato)
// syncTimer dichiarata in alto con var per evitare TDZ
function startAutoSync(){
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    if (isLoggedIn) syncUserDataToServer();
  }, 30000);
}

async function syncUserDataToServer(){
  if (!isLoggedIn || !authToken) return false;
  try {
    // Forza name = username prima di salvare sul server
    if (user.username) user.name = user.username;
    user._localUpdated = Date.now();
    const res = await fetch('/api/kv/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify({ data: user })
    });
    if (res.ok) {
      console.log('[Sync] Dati salvati sul server');
      return true;
    }
  } catch(e) {
    console.error('[Sync] Errore:', e);
  }
  return false;
}

function showLoginWall(){
  // Mostra welcome screen solo al primo accesso, con opzione "salta"
  // Se gia visto in questa sessione, skip
  if (sessionStorage.getItem('kv_welcome_shown') === '1') return;
  // Se c'e' un token salvato (utente gia registrato in passato), NON mostrare
  // Login Wall: aspetta che tryAutoLogin riprovi il login automatico
  if (getLS('kv4_auth_token')) return;
  sessionStorage.setItem('kv_welcome_shown', '1');

  if (document.getElementById('loginWall')) {
    document.getElementById('loginWall').classList.add('show');
    return;
  }
  const div = document.createElement('div');
  div.id = 'loginWall';
  div.className = 'modal-overlay show';
  div.style.zIndex = '99999';
  div.style.backdropFilter = 'blur(8px)';
  // No backdrop close: l'utente DEVE scegliere (Accedi / Registrati / Ospite)
  div.onclick = (e) => { e.stopPropagation(); };
  div.innerHTML = `
    <div class="modal-box" style="max-width:440px;position:relative">
      <div class="modal-body" style="text-align:center;padding:30px 24px">
        <div style="font-size:64px;margin-bottom:12px">🎭</div>
        <div style="font-size:22px;font-weight:600;color:#fff;margin-bottom:6px">Benvenuto su KOUVERTE</div>
        <div style="font-size:13px;color:#9ca3af;margin-bottom:24px;line-height:1.5">
          La <strong style="color:#00d4ff">chat mondiale anonima</strong> con video, stanze a codice e amici.
        </div>

        <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:12px;padding:14px;margin-bottom:20px;text-align:left">
          <div style="font-size:12px;color:#00d4ff;font-weight:700;margin-bottom:6px">🎁 Crea un account (gratis):</div>
          <div style="font-size:11px;color:#cbd5e1;line-height:1.6">
            ✅ Salva monete, XP, livello, badge<br>
            ✅ Accedi da qualsiasi dispositivo<br>
            ✅ Sistema amici e chat private<br>
            ✅ 100% Anonimo (nessuno vede l'email)
          </div>
        </div>

        <button class="modal-btn modal-btn-primary" style="width:100%;padding:14px;font-size:15px;margin-bottom:8px" onclick="closeLoginWall();openAuthModal();setTimeout(()=>switchAuthMode('login'),100)">🔑 Accedi</button>
        <button class="modal-btn modal-btn-primary" style="width:100%;padding:14px;font-size:15px;background:#10b981;margin-bottom:8px" onclick="closeLoginWall();openAuthModal();setTimeout(()=>switchAuthMode('register'),100)">✨ Crea nuovo account</button>

        <div style="text-align:center;margin-bottom:8px">
          <button onclick="openRecoverModal()" style="background:none;border:none;color:#00d4ff;font-size:12px;cursor:pointer;text-decoration:underline;font-weight:600">🔓 Password dimenticata?</button>
        </div>

        <button onclick="closeLoginWall()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(0,212,255,0.3);color:#cbd5e1;font-size:13px;font-weight:700;cursor:pointer;padding:12px;width:100%;border-radius:10px;margin-top:8px">👋 Entra come ospite</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

function closeLoginWall(){
  const w = document.getElementById('loginWall');
  if (w) w.classList.remove('show');
}

function continueAsGuest(){
  closeLoginWall();
  showToast('👋 Modalità ospite: registrati per non perdere i progressi');
}

function openAuthModal(){
  closeContinua();
  if (isLoggedIn) {
    if (confirm('Vuoi disconnettere l\'account?\n\nI tuoi dati locali resteranno.')) {
      setAuthToken(null);
      showToast('🚪 Disconnesso');
    }
    return;
  }
  const modal = document.getElementById('authModal') || createAuthModal();
  modal.classList.add('show');
  document.getElementById('authMode').value = 'login';
  switchAuthMode('login');
}

function createAuthModal(){
  const div = document.createElement('div');
  div.id = 'authModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title" id="authTitle">🔑 Accedi al tuo account</div>
        <button class="modal-close" onclick="closeAuthModalSafe()">✕</button>
      </div>
      <form class="modal-body" onsubmit="event.preventDefault();doAuth();return false" autocomplete="on">
        <input type="hidden" id="authMode" value="login">

        <div class="auth-tabs">
          <button type="button" class="auth-tab active" data-mode="login" onclick="switchAuthMode('login')">🔑 Accedi</button>
          <button type="button" class="auth-tab" data-mode="register" onclick="switchAuthMode('register')">✨ Registrati</button>
        </div>

        <div id="authError" style="display:none;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;color:#fca5a5"></div>

        <label class="modal-label" id="authEmailLabel">Email o Username</label>
        <input type="text" id="authEmail" class="modal-input" placeholder="tua@email.com o bob_kouverte" autocomplete="username">

        <div id="authUsernameWrap" style="display:none">
          <label class="modal-label">Username</label>
          <input type="text" id="authUsername" class="modal-input" placeholder="es. marco_92" autocomplete="username" maxlength="20">
          <div class="code-hint">3-20 caratteri: lettere, numeri, underscore</div>
        </div>

        <label class="modal-label">Password</label>
        <input type="password" id="authPassword" class="modal-input" placeholder="Min 6 caratteri" autocomplete="current-password" minlength="6">

        <!-- Checkbox Ricordami (solo al login) -->
        <div id="authRememberWrap" style="display:flex;align-items:center;gap:10px;margin-top:14px;padding:10px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:8px">
          <input type="checkbox" id="authRemember" checked style="width:40px;height:22px;appearance:none;-webkit-appearance:none;background:rgba(100,116,139,0.4);border-radius:11px;position:relative;cursor:pointer;outline:none">
          <label for="authRemember" style="flex:1;cursor:pointer;font-size:12px;color:#cbd5e1">
            <strong style="color:#00d4ff">💾 Ricorda i miei dati</strong><br>
            <span style="font-size:10px;color:#9ca3af">Resta connesso per 30 giorni (sicuro su questo dispositivo)</span>
          </label>
        </div>

        <div id="authInfo" style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:8px;padding:12px;margin-top:14px;font-size:11px;color:#cbd5e1;line-height:1.5">
          <strong style="color:#00d4ff">🔒 Perché registrarsi?</strong><br>
          ✅ Mantieni il tuo nome, monete, XP, badge<br>
          ✅ Accedi da qualsiasi dispositivo<br>
          ✅ Recovery in caso di reset del browser<br>
          ✅ I dati sono sempre 100% anonimi
        </div>

        <div style="text-align:center;margin-top:12px">
          <a href="#" onclick="openRecoverModal();return false" style="font-size:12px;color:#00d4ff;text-decoration:none;font-weight:600">🔓 Password dimenticata? Recupera con codice o Telegram</a>
        </div>

        <div style="display:flex;align-items:center;gap:10px;margin:16px 0 4px">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.12)"></div>
          <span style="font-size:11px;color:#64748b;white-space:nowrap">oppure continua con</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.12)"></div>
        </div>

        <button type="button" onclick="loginWithTelegram()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;margin-top:8px;background:linear-gradient(135deg,#2aabee,#229ed9);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(42,171,238,0.4);transition:opacity .2s" onmouseenter="this.style.opacity='.88'" onmouseleave="this.style.opacity='1'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.12 14.187l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.372z"/></svg>
          Accedi con Telegram
        </button>
      </form>
      <div class="modal-footer">
        <button type="button" class="modal-btn modal-btn-secondary" onclick="closeAuthModalSafe()">Annulla</button>
        <button type="submit" class="modal-btn modal-btn-primary" id="authSubmitBtn" onclick="doAuth()">🔑 Accedi</button>
      </div>
    </div>
  `;
  // Click sul backdrop: NON chiude (era bypass del login). Solo X/Annulla esplicito.
  div.onclick = (e) => { if (e.target === div) closeAuthModalSafe(); };
  document.body.appendChild(div);
  return div;
}
// Chiusura sicura: se NON loggato, riapre LoginWall così l'utente non finisce "dentro" senza scelta esplicita
function closeAuthModalSafe(){
  const m = document.getElementById('authModal');
  if (m) m.classList.remove('show');
  if (!isLoggedIn) {
    window._authPromptShown = false;
    sessionStorage.removeItem('kv_welcome_shown');
    setTimeout(() => showLoginWall(), 200);
  }
}

// ── Telegram Login ───────────────────────────────────────────────────────────

function loginWithTelegram() {
  // Se siamo dentro il Mini App Telegram usa initData direttamente
  const tg = window.Telegram?.WebApp;
  if (tg?.initData) {
    _loginWithInitData(tg.initData);
    return;
  }
  // Altrimenti apri il widget Telegram (web browser)
  _openTelegramWidget();
}

function _loginWithInitData(initData) {
  fetch('/api/tg/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok && data.token) {
      setAuthToken(data.token);
      document.getElementById('authModal')?.classList.remove('show');
      showToast('✅ Accesso Telegram completato!');
    } else {
      showToast('❌ ' + (data.error || 'Errore Telegram'));
    }
  })
  .catch(() => showToast('❌ Impossibile connettersi al server'));
}

window.onTgWidgetAuth = function(tgUser) {
  fetch('/api/auth/telegram-widget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tgUser)
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok && data.token) {
      setAuthToken(data.token);
      document.getElementById('authModal')?.classList.remove('show');
      showToast('✅ Benvenuto, ' + (data.user?.firstName || data.user?.username || 'utente') + '!');
    } else {
      showToast('❌ ' + (data.error || 'Errore autenticazione Telegram'));
    }
  })
  .catch(() => showToast('❌ Impossibile connettersi al server'));
};

function _openTelegramWidget() {
  // Crea e apre la popup del Telegram Login Widget
  const BOT_NAME = 'Kouverte_bot';
  const existingScript = document.getElementById('tg-widget-script');
  if (existingScript) existingScript.remove();

  // Il widget Telegram ha bisogno di un container visibile per il pulsante ufficiale
  // ma noi usiamo il callback direttamente tramite data-onauth
  const container = document.createElement('div');
  container.id = 'tg-widget-container';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;';
  container.innerHTML = `
    <div style="background:#1a2035;border-radius:16px;padding:28px 24px;text-align:center;max-width:320px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
      <div style="font-size:40px;margin-bottom:12px">✈️</div>
      <div style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px">Accedi con Telegram</div>
      <div style="color:#94a3b8;font-size:13px;margin-bottom:20px">Stai per essere reindirizzato a Telegram per autorizzare l'accesso</div>
      <div id="tg-widget-btn-wrap" style="display:flex;justify-content:center;margin-bottom:16px"></div>
      <button onclick="document.getElementById('tg-widget-container').remove()" style="background:transparent;border:1px solid rgba(255,255,255,0.2);color:#94a3b8;border-radius:8px;padding:8px 20px;font-size:13px;cursor:pointer">Annulla</button>
    </div>
  `;
  document.body.appendChild(container);

  const script = document.createElement('script');
  script.id = 'tg-widget-script';
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', BOT_NAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-onauth', 'onTgWidgetAuth(user)');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-radius', '8');
  document.getElementById('tg-widget-btn-wrap').appendChild(script);
}

function switchAuthMode(mode){
  const isRegister = mode === 'register';
  document.getElementById('authMode').value = mode;
  document.getElementById('authTitle').textContent = isRegister ? '✨ Crea il tuo account' : '🔑 Accedi al tuo account';
  document.getElementById('authUsernameWrap').style.display = isRegister ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = isRegister ? '✨ Crea Account' : '🔑 Accedi';
  document.getElementById('authError').style.display = 'none';
  // Mostra "Ricordami" solo al login (non al register)
  const rememberWrap = document.getElementById('authRememberWrap');
  if (rememberWrap) rememberWrap.style.display = isRegister ? 'none' : 'flex';

  // Aggiorna label/placeholder a seconda del mode
  const label = document.getElementById('authEmailLabel');
  const input = document.getElementById('authEmail');
  if (label && input) {
    if (isRegister) {
      label.textContent = 'Email';
      input.type = 'email';
      input.placeholder = 'tua@email.com';
    } else {
      label.textContent = 'Email o Username';
      input.type = 'text';
      input.placeholder = 'tua@email.com o bob_kouverte';
    }
  }

  // Al LOGIN: auto-fill dati ricordati
  if (!isRegister) {
    const remembered = getLS('kv4_remember_user');
    if (remembered && input && !input.value) {
      input.value = remembered;
      // Focus sulla password se username gia ricordato
      setTimeout(() => document.getElementById('authPassword')?.focus(), 200);
    }
  }

  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });
}

async function doAuth(){
  const mode = document.getElementById('authMode').value;
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const password = document.getElementById('authPassword').value;
  const username = mode === 'register' ? document.getElementById('authUsername').value.trim().toLowerCase() : null;

  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';

  // Validazione: al register richiede email, al login accetta email o username
  if (mode === 'register') {
    if (!email || !email.includes('@')) {
      errEl.textContent = '❌ Email non valida (richiesta per la registrazione)';
      errEl.style.display = 'block';
      return;
    }
  } else {
    // Login: identifier = email o username, non vuoto
    if (!email || email.length < 3) {
      errEl.textContent = '❌ Inserisci email o username';
      errEl.style.display = 'block';
      return;
    }
  }
  if (!password || password.length < 6) {
    errEl.textContent = '❌ Password minimo 6 caratteri';
    errEl.style.display = 'block';
    return;
  }
  if (mode === 'register') {
    if (!username || username.length < 3) {
      errEl.textContent = '❌ Username minimo 3 caratteri';
      errEl.style.display = 'block';
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(username)) {
      errEl.textContent = '❌ Username: solo lettere, numeri, underscore';
      errEl.style.display = 'block';
      return;
    }
  }

  const btn = document.getElementById('authSubmitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Attendi...';

  try {
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const rememberMe = document.getElementById('authRemember')?.checked !== false;
    const body = mode === 'register'
      ? { email, username, password }
      : { email, password, rememberMe };

    console.log('[Auth] Richiesta:', endpoint, {...body, password:'***'});
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    console.log('[Auth] Risposta:', res.status, json);

    if (!res.ok) {
      errEl.textContent = '❌ ' + (json.error || 'Errore sconosciuto (HTTP ' + res.status + ')');
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = mode === 'register' ? '✨ Crea Account' : '🔑 Accedi';
      return;
    }

    if (!json.token) {
      errEl.textContent = '❌ Token mancante dalla risposta';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = mode === 'register' ? '✨ Crea Account' : '🔑 Accedi';
      return;
    }

    // Successo - imposta token e info utente
    setAuthToken(json.token);

    // RICORDA DATI: salva username/email per autocompletare al prossimo login
    // (rememberMe gia letto sopra come 'const rememberMe' all'inizio della funzione)
    if (rememberMe !== false) {
      // Salva email o username (NON la password) per autocompletare
      const identifier = json.user?.email || email;
      if (identifier) setLS('kv4_remember_user', identifier);
    } else {
      // Se "Ricordami" deselezionato, rimuovi dati salvati
      try { localStorage.removeItem('kv4_remember_user'); } catch(e) {}
    }

    if (json.user) {
      user.username = json.user.username;
      user.serverEmail = json.user.email;
      user.serverId = json.user.id;

      // ── REGISTRAZIONE: imposta name = username scelto ──
      if (mode === 'register') {
        user.name = json.user.username;
        // Aggiorna anche il link referral se serve
        console.log('[Auth] Registrazione: nome impostato a', user.name);
      }

      // ── LOGIN con dati esistenti ──
      // Strategy: usa i dati SERVER se più recenti dei locali, altrimenti tieni locali
      if (mode === 'login') {
        // Prova prima a leggere kvData dal user object
        let serverData = json.user.kvData;

        // Se non c'è nel publicUser, fai un fetch esplicito
        if (!serverData) {
          try {
            const syncRes = await fetch('/api/kv/sync', {
              headers: { 'Authorization': 'Bearer ' + json.token }
            });
            if (syncRes.ok) {
              const syncJson = await syncRes.json();
              serverData = syncJson.data;
              console.log('[Auth] kvData caricato via /api/kv/sync:', serverData);
            }
          } catch(e) {
            console.error('[Auth] Errore fetch kvData:', e);
          }
        }

        // Merge intelligente: il piu recente vince
        if (serverData && serverData._syncedAt) {
          const localUpdated = user._localUpdated || 0;
          if (serverData._syncedAt > localUpdated) {
            // Server piu recente: ripristina MA NON sovrascrivere name
            const preserveName = json.user.username || user.name;
            Object.assign(user, serverData);
            user.name = preserveName;
            console.log('[Auth] ✅ Dati server ripristinati (server piu recente)');
            showToast('💾 Dati ripristinati: ' + (user.coins || 0) + ' 🪙, lvl ' + (user.level || 1));
          } else {
            console.log('[Auth] Tenuti dati locali (piu recenti)');
          }
        }

        // Anche al LOGIN: forza il nome utente del server (priorita su tutto)
        // perche' l'utente vuole vedere SEMPRE il suo username come nome
        if (json.user.username) {
          user.name = json.user.username;
          console.log('[Auth] Login: nome impostato a username', user.name);
        }
      }

      // Re-render: aggiorna chat header se in stanza, rank bar, etc.
      saveUser();
      updateProfileUI();
      updateCoinBar();
      // Aggiorna anche il nome se siamo in una chat room
      if (typeof room === 'object' && room) {
        // Re-emit join con nuovo pubUser (nuovo nome)
        if (socket && socket.connected) {
          socket.emit('join-chat-room', { roomId: room.id, user: pubUser() });
        }
      }

      // Sync IMMEDIATO al server (per essere sicuri)
      await syncUserDataToServer();
    }

    document.getElementById('authModal').classList.remove('show');
    closeLoginWall(); // chiudi anche il login wall se aperto

    // Se REGISTRAZIONE: mostra modal con backup codes
    if (mode === 'register' && json.backupCodes && json.backupCodes.length > 0) {
      showBackupCodesModal(json.backupCodes, true);
    } else {
      showToast('🔑 Bentornato ' + (json.user.username || ''));
    }
    startAutoSync();
    startTokenAutoRefresh();
  } catch(e) {
    console.error('[Auth] Errore:', e);
    errEl.textContent = '❌ Errore di connessione: ' + e.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = mode === 'register' ? '✨ Crea Account' : '🔑 Accedi';
  }
}

function showBackupCodesModal(codes, isNew){
  let modal = document.getElementById('backupCodesModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'backupCodesModal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '99998';
    document.body.appendChild(modal);
  }
  const codesHtml = codes.map((c, i) => `
    <div class="backup-code-row">
      <span class="backup-code-num">${i+1}.</span>
      <code class="backup-code">${c}</code>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-box" style="max-width:460px">
      <div class="modal-hdr">
        <div class="modal-title">🔑 ${isNew?'Account creato!':'Nuovi codici di recupero'}</div>
      </div>
      <div class="modal-body">
        <div style="background:rgba(251,191,36,0.1);border:1.5px solid #fbbf24;border-radius:12px;padding:14px;margin-bottom:16px">
          <div style="font-size:13px;color:#fbbf24;font-weight:600;margin-bottom:6px">⚠️ IMPORTANTE: Salva questi codici!</div>
          <div style="font-size:11px;color:#cbd5e1;line-height:1.5">
            Se dimentichi la password, usa uno di questi codici per recuperarla.<br>
            <strong>Ogni codice funziona UNA SOLA VOLTA</strong>. Salvali in posto sicuro!
          </div>
        </div>

        <div class="backup-codes-list">
          ${codesHtml}
        </div>

        <button class="code-copy-btn" onclick="copyBackupCodes()" style="margin-top:14px">📋 Copia tutti i codici</button>

        <div style="font-size:10px;color:#9ca3af;text-align:center;margin-top:10px;line-height:1.5">
          Suggerimento: copiali in Note, Google Keep, o stampa questa pagina.<br>
          Puoi rigenerare codici in Impostazioni se ne usi tutti.
        </div>
      </div>
      <div class="modal-footer">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#cbd5e1;cursor:pointer;margin-right:auto">
          <input type="checkbox" id="backupCodesConfirm" onchange="document.getElementById('backupCodesCloseBtn').disabled=!this.checked">
          Ho salvato i codici
        </label>
        <button id="backupCodesCloseBtn" class="modal-btn modal-btn-primary" disabled onclick="document.getElementById('backupCodesModal').classList.remove('show')">OK, chiudi</button>
      </div>
    </div>
  `;
  window._currentBackupCodes = codes;
  modal.classList.add('show');
}

function copyBackupCodes(){
  const codes = window._currentBackupCodes || [];
  if (codes.length === 0) return;
  const text = '🔑 KOUVERTE - Codici di Recupero Password\n\nUsername: ' + (user.username || '') +
    '\nEmail: ' + (user.serverEmail || '') +
    '\n\nCodici (un uso ciascuno):\n' +
    codes.map((c,i) => (i+1) + '. ' + c).join('\n') +
    '\n\nUsa questi codici su www.kouverte.com → Login → "Password dimenticata"';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Codici copiati negli appunti!')).catch(() => fallbackCopyText(text));
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('📋 Codici copiati!'); } catch(e) { showToast('⚠️ Copia manualmente'); }
  document.body.removeChild(ta);
}

// ══ Modal Recupera Password (con 2 opzioni: backup code / Telegram OTP) ══
function openRecoverModal(){
  closeLoginWall();
  document.getElementById('authModal')?.classList.remove('show');
  let modal = document.getElementById('recoverModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'recoverModal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '99998';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-box" style="max-width:460px">
      <div class="modal-hdr">
        <div class="modal-title">🔓 Recupera Password</div>
        <button class="modal-close" onclick="document.getElementById('recoverModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body">
        <div id="recoverError" style="display:none;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;color:#fca5a5"></div>

        <div class="auth-tabs">
          <button class="auth-tab active" data-rmode="code" onclick="switchRecoverMode('code')">🔑 Codice backup</button>
          <button class="auth-tab" data-rmode="otp" onclick="switchRecoverMode('otp')">📱 Telegram OTP</button>
        </div>

        <div id="recoverHelpBox" style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:11px;color:#cbd5e1;line-height:1.5">
          Inserisci il tuo username/email e uno dei codici di recupero salvati alla registrazione.
        </div>

        <label class="modal-label">Username o Email</label>
        <input type="text" id="recoverUser" class="modal-input" placeholder="bob_kouverte o tua@email.com">

        <div id="recoverCodeWrap">
          <label class="modal-label">Codice di Backup (8 caratteri)</label>
          <input type="text" id="recoverCode" class="modal-input code-input" placeholder="ABC12345" maxlength="8" oninput="this.value=this.value.toUpperCase()" style="font-size:18px;letter-spacing:4px">
        </div>

        <div id="recoverOtpWrap" style="display:none">
          <label class="modal-label">Codice OTP Telegram (6 cifre)</label>
          <input type="text" id="recoverOtp" class="modal-input code-input" placeholder="123456" maxlength="6" inputmode="numeric" oninput="this.value=this.value.replace(/\\D/g,'')" style="font-size:22px;letter-spacing:8px">
          <button onclick="requestTelegramOTP()" style="margin-top:8px;width:100%;padding:10px;background:#0088cc;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">📱 Apri Bot Telegram per richiedere OTP</button>
        </div>

        <label class="modal-label">Nuova Password</label>
        <input type="password" id="recoverNewPwd" class="modal-input" placeholder="Min 6 caratteri" minlength="6">
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" onclick="document.getElementById('recoverModal').classList.remove('show')">Annulla</button>
        <button class="modal-btn modal-btn-primary" id="recoverSubmitBtn" onclick="doRecover()">🔓 Reimposta Password</button>
      </div>
    </div>
  `;
  modal.classList.add('show');
  setTimeout(() => document.getElementById('recoverUser')?.focus(), 100);
  window._recoverMode = 'code';

  // Auto-detect URL hash #otp=USERNAME
  const hash = window.location.hash;
  if (hash.startsWith('#otp=')) {
    const id = decodeURIComponent(hash.substring(5));
    setTimeout(() => {
      switchRecoverMode('otp');
      const userInput = document.getElementById('recoverUser');
      if (userInput && id) userInput.value = id;
      document.getElementById('recoverOtp')?.focus();
    }, 200);
  }
}

function switchRecoverMode(mode){
  window._recoverMode = mode;
  document.querySelectorAll('[data-rmode]').forEach(t => {
    t.classList.toggle('active', t.dataset.rmode === mode);
  });
  document.getElementById('recoverCodeWrap').style.display = mode === 'code' ? 'block' : 'none';
  document.getElementById('recoverOtpWrap').style.display = mode === 'otp' ? 'block' : 'none';
  document.getElementById('recoverHelpBox').innerHTML = mode === 'code'
    ? 'Inserisci il tuo username/email e uno dei <strong>codici di backup</strong> (8 caratteri) che hai salvato alla registrazione.'
    : '📱 <strong>Recupero via Telegram:</strong> Scrivi al bot <a href="' + TG_BOT_URL + '" target="_blank" style="color:#00d4ff">@' + TG_BOT_USERNAME + '</a> il comando <code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">/reset USERNAME</code>. Riceverai un <strong>OTP a 6 cifre</strong> valido 10 minuti.';
}

function requestTelegramOTP(){
  const userInput = document.getElementById('recoverUser');
  const id = userInput?.value?.trim();
  if (!id) {
    showToast('⚠️ Inserisci prima username o email');
    userInput?.focus();
    return;
  }
  // Apri il bot con deep link reset_<USERNAME>
  const url = TG_BOT_URL + '?start=reset_' + encodeURIComponent(id);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('📱 Apri Telegram → scrivi /reset ' + id + ' al bot');
}

async function doRecover(){
  const mode = window._recoverMode || 'code';
  const userIn = document.getElementById('recoverUser').value.trim().toLowerCase();
  const newPwd = document.getElementById('recoverNewPwd').value;
  const errEl = document.getElementById('recoverError');
  errEl.style.display = 'none';

  if (!userIn) { errEl.textContent = '❌ Inserisci username o email'; errEl.style.display = 'block'; return; }
  if (!newPwd || newPwd.length < 6) { errEl.textContent = '❌ Password min 6 caratteri'; errEl.style.display = 'block'; return; }

  let endpoint, body;
  const isEmail = userIn.includes('@');

  if (mode === 'code') {
    const code = document.getElementById('recoverCode').value.trim().toUpperCase();
    if (!code || code.length !== 8) { errEl.textContent = '❌ Codice backup deve essere 8 caratteri'; errEl.style.display = 'block'; return; }
    endpoint = '/api/auth/recover-with-code';
    body = isEmail
      ? { email: userIn, code, newPassword: newPwd }
      : { username: userIn, code, newPassword: newPwd };
  } else {
    const otp = document.getElementById('recoverOtp').value.trim();
    if (!otp || !/^\d{6}$/.test(otp)) { errEl.textContent = '❌ OTP deve essere 6 cifre'; errEl.style.display = 'block'; return; }
    endpoint = '/api/auth/recover-with-otp';
    body = isEmail
      ? { email: userIn, otp, newPassword: newPwd }
      : { username: userIn, otp, newPassword: newPwd };
  }

  const btn = document.getElementById('recoverSubmitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Verifica...';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();

    if (!res.ok) {
      errEl.textContent = '❌ ' + (json.error || 'Errore');
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = '🔓 Reimposta Password';
      return;
    }

    // Successo: login automatico
    setAuthToken(json.token);
    if (json.user) {
      user.username = json.user.username;
      user.serverEmail = json.user.email;
      user.serverId = json.user.id;
      user.name = json.user.username;
      saveUser();
      updateProfileUI();
    }
    document.getElementById('recoverModal').classList.remove('show');
    closeLoginWall();
    const remaining = json.remainingCodes !== undefined ? ' Codici rimanenti: ' + json.remainingCodes : '';
    showToast('✅ Password reimpostata! Sei loggato.' + remaining);
    startAutoSync();
    // Rimuovi #otp dall'URL
    if (window.location.hash.startsWith('#otp=')) history.replaceState(null, '', window.location.pathname);
  } catch(e) {
    errEl.textContent = '❌ ' + e.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = '🔓 Reimposta Password';
  }
}

async function regenerateBackupCodes(){
  if (!isLoggedIn) {
    showToast('🔐 Devi essere loggato');
    return;
  }
  if (!confirm('Rigenerare i codici di recupero?\n\n⚠️ I vecchi codici NON funzioneranno più.')) return;
  try {
    const res = await fetch('/api/me/regenerate-backup-codes', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    const json = await res.json();
    if (res.ok && json.backupCodes) {
      showBackupCodesModal(json.backupCodes, false);
    } else {
      showToast('❌ ' + (json.error || 'Errore'));
    }
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function forgotPassword(){
  const email = prompt('Inserisci la tua email per ricevere le istruzioni di reset:');
  if (!email) return;
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    const json = await res.json();
    showToast(json.message || '📧 Controlla la tua email');
  } catch(e) {
    showToast('❌ Errore: ' + e.message);
  }
}

async function promptResetPassword(token){
  const newPwd = prompt('🔐 Reset password\n\nInserisci la nuova password (min 6 caratteri):');
  if (!newPwd || newPwd.length < 6) {
    showToast('❌ Password troppo corta');
    return;
  }
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPwd })
    });
    const json = await res.json();
    if (res.ok && json.token) {
      setAuthToken(json.token);
      showToast('✅ Password aggiornata! Ora sei loggato.');
      // Rimuovi hash dall'URL
      history.replaceState(null, '', window.location.pathname);
    } else {
      showToast('❌ ' + (json.error || 'Token scaduto'));
    }
  } catch(e) {
    showToast('❌ Errore: ' + e.message);
  }
}

// Hook saveUser per syncare automaticamente
const _originalSaveUser = window.saveUser;
window.saveUser = function(){
  user._localUpdated = Date.now();
  setLS('kv4_user', user);
  // Sync al server se loggato (debounced solo 500ms per essere veloci)
  if (isLoggedIn) {
    clearTimeout(window._syncDebounce);
    window._syncDebounce = setTimeout(() => syncUserDataToServer(), 500);
  }
};

// Sync IMMEDIATO al server (non debounced) - usare per eventi critici
function syncUserDataNow(){
  if (!isLoggedIn) return Promise.resolve(false);
  return syncUserDataToServer();
}

// Sync al chiudere/cambiare pagina
window.addEventListener('beforeunload', () => {
  if (isLoggedIn && navigator.sendBeacon) {
    user._localUpdated = Date.now();
    const blob = new Blob([JSON.stringify({ data: user })], { type: 'application/json' });
    // Usa sendBeacon che funziona anche durante unload
    fetch('/api/kv/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify({ data: user }),
      keepalive: true
    }).catch(()=>{});
  }
});

// Sync quando l'app torna in foreground (mobile)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isLoggedIn) {
    // Ricarica dati dal server al ritorno
    fetch('/api/kv/sync', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    }).then(r => r.json()).then(json => {
      if (json.data && json.data._syncedAt) {
        const localUpdated = user._localUpdated || 0;
        if (json.data._syncedAt > localUpdated + 5000) { // 5s di tolleranza
          const keepName = user.username || user.name;
          Object.assign(user, json.data);
          user.name = keepName;
          setLS('kv4_user', user);
          updateProfileUI();
          updateCoinBar();
          console.log('[Sync] Dati aggiornati al ritorno in foreground');
        }
      }
    }).catch(()=>{});
  }
});

// ══════════════════════════════════════════
// MENU CLICK UTENTE in CHAT (apri profilo / DM / amico)
// ══════════════════════════════════════════
function openUserMenu(el){
  const uid = el.dataset.uid;
  const uname = el.dataset.uname;
  const uface = el.dataset.uface || '🎭';
  const ucolor = el.dataset.ucolor || '#00d4ff';
  const uframe = el.dataset.uframe || 'none';

  if (!uid) return;
  if (uid === user.id) { showToast('💜 Sei tu!'); return; }

  let modal = document.getElementById('userMenuModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'userMenuModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-box" style="max-width:360px">
      <div class="modal-hdr">
        <div class="modal-title">👤 Profilo utente</div>
        <button class="modal-close" onclick="document.getElementById('userMenuModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="text-align:center;padding:24px 20px">
        <div class="prof-avatar-hero frame-${uframe}" style="--av-c1:${ucolor};--av-c2:${ucolor};width:90px;height:90px;font-size:48px;margin-bottom:10px">
          <div class="prof-avatar-face">${uface}</div>
        </div>
        <div style="font-size:18px;font-weight:600;color:${ucolor};margin-bottom:4px">${esc(uname)}</div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:20px">ID: ${uid.substring(0,12)}</div>

        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="modal-btn modal-btn-primary" onclick="actionDmFromUserMenu('${esc(uid)}','${esc(uname)}','${uface}','${ucolor}')" style="width:100%;padding:12px">💬 Manda messaggio privato</button>
          <button class="modal-btn modal-btn-primary" style="background:#10b981;width:100%;padding:12px" onclick="actionAddFriendFromMenu('${esc(uid)}','${esc(uname)}')">➕ Aggiungi agli amici</button>
          <button class="modal-btn modal-btn-secondary" style="width:100%;padding:10px" onclick="actionStartWebRTC('${esc(uid)}','${esc(uname)}')">📹 Video chat</button>
          <button class="modal-btn modal-btn-secondary" style="width:100%;padding:10px" onclick="actionFavoriteFromMenu('${esc(uid)}','${esc(uname)}','${uface}','${ucolor}')">❤️ Aggiungi ai preferiti</button>
          <button class="modal-btn modal-btn-secondary" style="background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);width:100%;padding:10px" onclick="actionBlockFromMenu('${esc(uid)}','${esc(uname)}','${uface}')">🚫 Blocca utente</button>
          ${(user && user.username === 'bob2015') ? `<button class="modal-btn" style="background:rgba(220,38,38,0.25);color:#fca5a5;border:1px solid rgba(220,38,38,0.6);width:100%;padding:10px;font-weight:700" onclick="banUserFromMenu('${esc(uid)}','${esc(uname)}')">🔨 BAN utente</button>` : ''}
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
}

function actionDmFromUserMenu(uid, uname, uface, ucolor){
  document.getElementById('userMenuModal').classList.remove('show');
  if (!isLoggedIn) {
    showToast('🔐 Per chat private serve un account. Fai login!');
    return;
  }
  openDmChat(uid, uname, uface, ucolor);
}

async function actionAddFriendFromMenu(uid, uname){
  document.getElementById('userMenuModal').classList.remove('show');
  if (!isLoggedIn) {
    showToast('🔐 Per aggiungere amici serve un account');
    return;
  }
  // Per gli ID non-server, non possiamo aggiungerli direttamente (serverId richiesto)
  // Fallback: salva in localStorage favoriti
  if (!uid.startsWith('u_')) {
    actionFavoriteFromMenu(uid, uname);
    showToast('⚠️ Per amici stabili serve account registrato dell\'utente');
    return;
  }
  await addFriend(uid, uname);
}

function actionFavoriteFromMenu(uid, uname, uface, ucolor){
  document.getElementById('userMenuModal').classList.remove('show');
  user.favorites = user.favorites || [];
  if (user.favorites.find(f => f.id === uid)) {
    showToast('❤️ Gia nei preferiti');
    return;
  }
  user.favorites.push({ id: uid, name: uname, face: uface || '🎭', color: ucolor, addedAt: Date.now() });
  saveUser();
  showToast('❤️ ' + uname + ' aggiunto ai preferiti!');
}

function actionBlockFromMenu(uid, uname, uface){
  document.getElementById('userMenuModal').classList.remove('show');
  if (!confirm('Bloccare ' + uname + '? Non vedrai più i suoi messaggi.')) return;
  user.blocked = user.blocked || [];
  if (!user.blocked.find(b => b.id === uid)) {
    user.blocked.push({ id: uid, name: uname, face: uface || '🎭', blockedAt: Date.now() });
    saveUser();
  }
  showToast('🚫 ' + uname + ' bloccato');
}

async function banUserFromMenu(uid, uname){
  document.getElementById('userMenuModal').classList.remove('show');
  const reason = prompt(`🔨 Motivo ban per ${uname} (opzionale):`, 'Violazione regolamento') ?? '';
  if (reason === null) return; // cancelled
  try {
    const token = getLS('kv4_token');
    const r = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ targetUserId: uid, reason })
    });
    const data = await r.json();
    if (data.ok) showToast('🔨 ' + uname + ' bannato!');
    else showToast('❌ ' + (data.error || 'Errore ban'));
  } catch(e) { showToast('❌ Errore connessione'); }
}

function actionStartWebRTC(uid, uname){
  document.getElementById('userMenuModal').classList.remove('show');
  if (typeof selectUser === 'function') {
    selectUser(uid);
    showToast('📹 Connessione video a ' + uname + '...');
  } else {
    showToast('⚠️ Video chat non disponibile');
  }
}

// ══════════════════════════════════════════
// SISTEMA AMICI + RICERCA UTENTI + DM
// ══════════════════════════════════════════
var friendsList = [];
var dmHistory = {}; // {friendId: [msg, msg, ...]}

function openFriendsModal(){
  closeContinua();
  const modal = document.getElementById('friendsModal') || createFriendsModal();
  modal.classList.add('show');
  switchFriendsTab('friends');
}

function createFriendsModal(){
  const div = document.createElement('div');
  div.id = 'friendsModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <div class="modal-hdr">
        <div class="modal-title">👥 Amici</div>
        <button class="modal-close" onclick="document.getElementById('friendsModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">
        <div class="friends-tabs">
          <button class="friends-tab active" data-tab="friends" onclick="switchFriendsTab('friends')">👥 Amici</button>
          <button class="friends-tab" data-tab="requests" onclick="switchFriendsTab('requests')">🔔 Richieste<span id="friendsReqBadge" class="friends-req-badge" style="display:none"></span></button>
          <button class="friends-tab" data-tab="search" onclick="switchFriendsTab('search')">🔍 Cerca</button>
        </div>
        <div id="friendsTabContent"></div>
      </div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

function switchFriendsTab(tab){
  document.querySelectorAll('.friends-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  const content = document.getElementById('friendsTabContent');
  if (tab === 'friends')   renderFriendsList(content);
  else if (tab === 'requests') renderFriendRequests(content);
  else renderSearchTab(content);
}

function renderFriendsList(container){
  if (!isLoggedIn) {
    container.innerHTML = `
      <div class="friend-empty">
        <div class="friend-empty-icon">🔐</div>
        <div style="margin-bottom:12px">Devi loggarti per avere amici</div>
        <button class="modal-btn modal-btn-primary" onclick="document.getElementById('friendsModal').classList.remove('show');openAuthModal()">🔑 Login / Registrati</button>
      </div>
    `;
    return;
  }
  container.innerHTML = '<div style="text-align:center;padding:14px;color:#9ca3af">Caricamento amici...</div>';
  fetch('/api/me/friends', {
    headers: { 'Authorization': 'Bearer ' + authToken }
  }).then(r => r.json()).then(json => {
    const friends = json.friends || [];
    friendsList = friends;
    if (friends.length === 0) {
      container.innerHTML = `
        <div class="friend-empty">
          <div class="friend-empty-icon">💔</div>
          <div style="margin-bottom:6px">Non hai ancora amici</div>
          <div style="font-size:11px">Usa "Cerca Utenti" per aggiungerne!</div>
        </div>
      `;
      return;
    }
    container.innerHTML = friends.map(f => {
      const unread = dmUnread[f.id] || 0;
      const unreadBadge = unread ? `<span class="dm-unread-badge">${unread}</span>` : '';
      const onlineDot = f.online ? '<span class="friend-online-dot"></span>' : '';
      return `
      <div class="friend-row">
        <div class="friend-avatar-wrap">
          <div class="friend-avatar frame-${f.kvActiveFrame || 'none'}" style="background:${f.kvColor||'#00d4ff'}22">${f.kvFace || '🎭'}</div>
          ${onlineDot}
        </div>
        <div class="friend-info">
          <div class="friend-name">${esc(f.kvName || f.username)}</div>
          <div class="friend-username">@${esc(f.username)} ${f.online ? '<span class="friend-online-label">● online</span>' : ''}</div>
        </div>
        <div class="friend-actions">
          <button class="friend-btn chat" id="dm-badge-${f.id}" onclick="openDmChat('${f.id}','${esc(f.username)}','${f.kvFace||''}','${f.kvColor||'#00d4ff'}')">💬${unreadBadge}</button>
          <button class="friend-btn remove" onclick="removeFriend('${f.id}')">✕</button>
        </div>
      </div>`;
    }).join('');
  }).catch(e => {
    container.innerHTML = '<div class="friend-empty">❌ Errore caricamento</div>';
  });
}

function renderSearchTab(container){
  container.innerHTML = `
    <div class="friends-search-bar">
      <input type="text" id="friendsSearchInput" placeholder="Cerca per username (min 2 caratteri)..." oninput="searchUsers(this.value)" autocomplete="off">
    </div>
    <div id="searchResults" style="min-height:200px">
      <div class="friend-empty">
        <div class="friend-empty-icon">🔍</div>
        <div>Inizia a digitare un username</div>
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('friendsSearchInput')?.focus(), 100);
}

var _searchTimer = null;
function searchUsers(q){
  clearTimeout(_searchTimer);
  const container = document.getElementById('searchResults');
  if (!q || q.length < 2) {
    container.innerHTML = '<div class="friend-empty"><div class="friend-empty-icon">🔍</div><div>Inizia a digitare un username (min 2 caratteri)</div></div>';
    return;
  }
  _searchTimer = setTimeout(() => {
    container.innerHTML = '<div style="text-align:center;padding:14px;color:#9ca3af">Ricerca...</div>';
    fetch('/api/users/search?q=' + encodeURIComponent(q))
      .then(r => r.json()).then(json => {
        const users = json.users || [];
        if (users.length === 0) {
          container.innerHTML = '<div class="friend-empty"><div class="friend-empty-icon">😶</div><div>Nessun utente trovato</div></div>';
          return;
        }
        const myFriends = friendsList.map(f => f.id);
        container.innerHTML = users.map(u => {
          const isMe = u.id === user?.serverId;
          const isFriend = myFriends.includes(u.id);
          return `
            <div class="friend-row">
              <div class="friend-avatar frame-${u.kvActiveFrame || 'none'}" style="background:${u.kvColor||'#00d4ff'}22">${u.kvFace || '🎭'}</div>
              <div class="friend-info">
                <div class="friend-name">${esc(u.kvName || u.username)}</div>
                <div class="friend-username">@${esc(u.username)}</div>
              </div>
              <div class="friend-actions">
                ${isMe ? '<span style="font-size:10px;color:#9ca3af">Tu</span>' :
                  isFriend ? '<button class="friend-btn chat" onclick="openDmChat(&quot;'+u.id+'&quot;,&quot;'+esc(u.username)+'&quot;,&quot;'+(u.kvFace||'')+'&quot;,&quot;'+(u.kvColor||'#00d4ff')+'&quot;)">💬 Chat</button>' :
                  '<button class="friend-btn add" id="addbtn_'+u.id+'" onclick="addFriendBtn(this,&quot;'+u.id+'&quot;,&quot;'+esc(u.username)+'&quot;)">➕ Aggiungi</button>'
                }
              </div>
            </div>
          `;
        }).join('');
      }).catch(e => {
        container.innerHTML = '<div class="friend-empty">❌ Errore ricerca</div>';
      });
  }, 350);
}

function renderFriendRequests(container){
  if (!isLoggedIn) {
    container.innerHTML = `<div class="friend-empty"><div class="friend-empty-icon">🔐</div><div>Devi loggarti</div></div>`;
    return;
  }
  container.innerHTML = '<div style="text-align:center;padding:14px;color:#9ca3af">Caricamento...</div>';
  fetch('/api/me/friends/requests', { headers: { 'Authorization': 'Bearer ' + authToken } })
    .then(r => r.json()).then(json => {
      const reqs = json.requests || [];
      // Aggiorna badge
      const badge = document.getElementById('friendsReqBadge');
      if (badge) { badge.textContent = reqs.length || ''; badge.style.display = reqs.length ? 'flex' : 'none'; }
      if (reqs.length === 0) {
        container.innerHTML = `<div class="friend-empty"><div class="friend-empty-icon">✅</div><div>Nessuna richiesta in attesa</div></div>`;
        return;
      }
      container.innerHTML = reqs.map(r => `
        <div class="friend-row friend-req-row">
          <div class="friend-avatar-wrap">
            <div class="friend-avatar" style="background:${r.kvColor||'#00d4ff'}22">${r.kvFace || '🎭'}</div>
          </div>
          <div class="friend-info">
            <div class="friend-name">${esc(r.kvName || r.username)}</div>
            <div class="friend-username">@${esc(r.username)}</div>
          </div>
          <div class="friend-actions">
            <button class="friend-btn accept" onclick="acceptFriendRequest('${r.from}','${esc(r.username)}')">✓ Accetta</button>
            <button class="friend-btn reject" onclick="rejectFriendRequest('${r.from}')">✕</button>
          </div>
        </div>
      `).join('');
    }).catch(() => {
      container.innerHTML = '<div class="friend-empty">❌ Errore caricamento</div>';
    });
}

async function acceptFriendRequest(fromId, username){
  try {
    const res = await fetch('/api/me/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ fromId })
    });
    if (res.ok) {
      showToast(`✅ Ora sei amico di ${username}!`);
      renderFriendRequests(document.getElementById('friendsTabContent'));
    }
  } catch(e) { showToast('❌ ' + e.message); }
}

async function rejectFriendRequest(fromId){
  try {
    await fetch('/api/me/friends/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ fromId })
    });
    renderFriendRequests(document.getElementById('friendsTabContent'));
  } catch(e) { /* silent */ }
}

// Wrapper con feedback visivo sul bottone (versione search results)
async function addFriendBtn(btn, friendId, username){
  btn.disabled = true;
  btn.textContent = '⏳';
  await addFriend(friendId, username);
  btn.textContent = '📩 Inviata';
  btn.className = 'friend-btn sent';
}

async function addFriend(friendId, username){
  if (!isLoggedIn) {
    showToast('🔐 Devi loggarti per aggiungere amici');
    return;
  }
  try {
    const res = await fetch('/api/me/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ friendId })
    });
    const json = await res.json();
    if (res.ok) {
      if (json.status === 'already_friends') { showToast('👥 Siete già amici!'); return; }
      if (json.status === 'already_sent')    { showToast('⏳ Richiesta già inviata'); return; }
      if (json.status === 'auto_accepted')   { showToast('✅ ' + username + ' ti aveva già aggiunto — ora siete amici!'); }
      else                                   { showToast('📩 Richiesta inviata a ' + username); }
      // Refetch lista amici
      fetch('/api/me/friends', { headers: { 'Authorization': 'Bearer ' + authToken } })
        .then(r => r.json()).then(d => { friendsList = d.friends || []; });
      // Aggiorna risultati ricerca
      const q = document.getElementById('friendsSearchInput')?.value;
      if (q) searchUsers(q);
    } else {
      showToast('❌ ' + (json.error || 'Errore'));
    }
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function removeFriend(friendId){
  if (!confirm('Rimuovere questo amico?')) return;
  try {
    const res = await fetch('/api/me/friends/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ friendId })
    });
    if (res.ok) {
      showToast('🔓 Amico rimosso');
      switchFriendsTab('friends');
    }
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

// Listener real-time per eventi amicizia via socket
function registerFriendListeners(){
  if (!socket) return;
  // Richiesta di amicizia in arrivo
  socket.on('friend-request', (data) => {
    // Aggiorna badge tab Richieste
    const badge = document.getElementById('friendsReqBadge');
    if (badge) {
      const cur = parseInt(badge.textContent || '0') + 1;
      badge.textContent = cur;
      badge.style.display = 'flex';
    }
    // Toast interattivo
    showToast(`👋 ${data.kvName || data.username} vuole essere tuo amico`);
    // Se modal aperto sulla tab richieste, ricarica
    const activeTab = document.querySelector('.friends-tab.active');
    if (activeTab?.dataset?.tab === 'requests') {
      renderFriendRequests(document.getElementById('friendsTabContent'));
    }
  });
  // Richiesta accettata dall'altro utente
  socket.on('friend-accepted', (data) => {
    showToast(`🎉 ${data.kvName || data.username} ha accettato la tua richiesta!`);
    // Aggiorna lista amici
    fetch('/api/me/friends', { headers: { 'Authorization': 'Bearer ' + authToken } })
      .then(r => r.json()).then(d => { friendsList = d.friends || []; });
    // Se il modal amici è aperto, ricarica
    const activeTab = document.querySelector('.friends-tab.active');
    if (activeTab?.dataset?.tab === 'friends') {
      renderFriendsList(document.getElementById('friendsTabContent'));
    }
  });
}

// DM Chat 1:1 via socket.io
function openDmChat(friendId, friendUsername, friendFace, friendColor){
  document.getElementById('friendsModal')?.classList.remove('show');
  const modal = document.getElementById('dmModal') || createDmModal();
  document.getElementById('dmTitle').textContent = '💬 ' + friendUsername;
  document.getElementById('dmTargetId').value = friendId;
  document.getElementById('dmTargetName').value = friendUsername;
  document.getElementById('dmTargetFace').value = friendFace || '🎭';
  document.getElementById('dmTargetColor').value = friendColor || '#00d4ff';

  // Azzera badge non letti
  if (dmUnread[friendId]) {
    dmUnread[friendId] = 0;
    updateDmBadge(friendId, 0);
  }

  // Mostra history locale (in attesa di quella dal server)
  const myId = user.serverId || user.id;
  const history = dmHistory[friendId] || [];
  const msgsContainer = document.getElementById('dmMessages');
  if (history.length > 0) {
    msgsContainer.innerHTML = '';
    history.forEach(m => appendDmBubble(msgsContainer, m.text, m.out, m.out ? null : m.fromName, m.ts));
  } else {
    msgsContainer.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:20px;font-size:12px">Inizia la conversazione!</div>';
  }
  modal.classList.add('show');

  // Richiedi history dal server (sovrascrive quella locale se più completa)
  if (socket && socket.connected) socket.emit('dm-open', { withUserId: friendId });

  setTimeout(() => {
    msgsContainer.scrollTop = msgsContainer.scrollHeight;
    document.getElementById('dmInput').focus();
  }, 100);

  // Notifica server: open DM
  if (socket && socket.connected) {
    socket.emit('dm-open', { withUserId: friendId });
  }
}

function createDmModal(){
  const div = document.createElement('div');
  div.id = 'dmModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <div class="modal-hdr">
        <div class="modal-title" id="dmTitle">💬 Chat</div>
        <button class="modal-close" onclick="document.getElementById('dmModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="dmTargetId">
        <input type="hidden" id="dmTargetName">
        <input type="hidden" id="dmTargetFace">
        <input type="hidden" id="dmTargetColor">
        <div class="dm-chat-container">
          <div class="dm-messages" id="dmMessages"></div>
          <div class="dm-input-bar">
            <input type="text" id="dmInput" placeholder="Scrivi un messaggio..." onkeydown="if(event.key==='Enter')sendDm()" maxlength="500">
            <button onclick="sendDm()">➤</button>
          </div>
        </div>
      </div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

function sendDm(){
  const input = document.getElementById('dmInput');
  const text = input.value.trim();
  if (!text) return;
  const targetId = document.getElementById('dmTargetId').value;
  if (!targetId || !socket || !socket.connected) {
    showToast('❌ Connessione persa');
    return;
  }

  const myId = user.serverId || user.id;
  const msg = { from: myId, to: targetId, text, ts: Date.now(), fromName: user.name || user.username || 'Anonimo', fromFace: user.face || '🎭' };
  socket.emit('dm-send', msg);

  // Append local
  dmHistory[targetId] = dmHistory[targetId] || [];
  dmHistory[targetId].push({ text, out: true, ts: msg.ts });
  const c = document.getElementById('dmMessages');
  appendDmBubble(c, text, true, null, msg.ts);
  c.scrollTop = c.scrollHeight;
  input.value = '';
}

// Crea una bubble DM con nome e timestamp
function appendDmBubble(container, text, isOut, fromName, ts){
  const time = ts ? new Date(ts).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }) : '';
  const nameHtml = !isOut && fromName ? `<div class="dm-msg-name">${esc(fromName)}</div>` : '';
  container.insertAdjacentHTML('beforeend',
    `<div class="dm-msg ${isOut ? 'out' : 'in'}">${nameHtml}<div class="dm-msg-text">${esc(text)}</div><div class="dm-msg-ts">${time}</div></div>`
  );
}

// Listener socket per DM ricevuti + history (registrato dopo connectSocket)
function registerDmListener(){
  if (!socket) return;

  socket.on('dm-receive', (data) => {
    const fromId = data.from;
    dmHistory[fromId] = dmHistory[fromId] || [];
    dmHistory[fromId].push({ text: data.text, out: false, ts: data.ts, fromName: data.fromName });
    // Se DM modal aperto su questo utente, mostra in tempo reale
    const dmModal = document.getElementById('dmModal');
    const currTargetId = document.getElementById('dmTargetId')?.value;
    if (dmModal && dmModal.classList.contains('show') && currTargetId === fromId) {
      const c = document.getElementById('dmMessages');
      appendDmBubble(c, data.text, false, data.fromName, data.ts);
      c.scrollTop = c.scrollHeight;
    } else {
      // Badge notifica + toast
      updateDmBadge(fromId, 1);
      showToast(`💬 ${data.fromName || 'amico'}: ${data.text.slice(0,40)}`);
    }
  });

  socket.on('dm-history', (data) => {
    // Popola la finestra DM con history dal server
    const dmModal = document.getElementById('dmModal');
    const currTargetId = document.getElementById('dmTargetId')?.value;
    if (!dmModal || !dmModal.classList.contains('show') || currTargetId !== data.withUserId) return;
    const c = document.getElementById('dmMessages');
    const myId = user.serverId || user.id;
    if (data.msgs && data.msgs.length > 0) {
      c.innerHTML = '';
      data.msgs.forEach(m => {
        const isOut = m.from === myId;
        appendDmBubble(c, m.text, isOut, isOut ? null : m.fromName, m.ts);
      });
      c.scrollTop = c.scrollHeight;
    }
  });
}

// Badge contatore messaggi non letti per ogni amico
var dmUnread = {};
function updateDmBadge(fromId, delta){
  dmUnread[fromId] = (dmUnread[fromId] || 0) + delta;
  // Aggiorna badge nella lista amici se il modal è aperto
  const badge = document.getElementById('dm-badge-' + fromId);
  if (badge) {
    badge.textContent = dmUnread[fromId] || '';
    badge.style.display = dmUnread[fromId] ? 'flex' : 'none';
  }
  // Badge totale sul tab
  const total = Object.values(dmUnread).reduce((a,b)=>a+b,0);
  const tabBadge = document.getElementById('friendsTabDmBadge');
  if (tabBadge) { tabBadge.textContent = total || ''; tabBadge.style.display = total ? 'flex' : 'none'; }
}

// ══════════════════════════════════════════
// TELEGRAM BOT & CONDIVISIONE
// ══════════════════════════════════════════
var TG_BOT_USERNAME = 'Kouverte_bot';
var TG_BOT_URL = 'https://t.me/' + TG_BOT_USERNAME;
var SITE_URL_FULL = 'https://www.kouverte.com';

function openTelegramBot(){
  // Nota: i link al bot Telegram sono ora gestiti tramite <a href> nell'HTML
  // perché i browser bloccano window.open() chiamato da JavaScript come popup.
  // Questa funzione viene usata SOLO come fallback se chiamata da codice
  // (es. dentro Telegram WebApp).
  closeContinua();
  const tg = window.Telegram?.WebApp;

  if (tg && tg.initData && tg.initData.length > 0 && tg.openTelegramLink) {
    tg.openTelegramLink(TG_BOT_URL);
    return;
  }

  // Fallback: navigation diretta
  try {
    window.location.assign(TG_BOT_URL);
  } catch(e) {
    prompt('Apri questo link nel browser:', TG_BOT_URL);
  }
}

function shareApp(){
  const shareText = '🎭 Ho scoperto KOUVERTE!\n\n💬 Chat anonima con video\n🔐 Stanze private con codice\n🌍 Utenti da tutto il mondo\n\nProvala qui:\n' + SITE_URL_FULL + '\n\nO sul bot: ' + TG_BOT_URL;

  if (navigator.share) {
    navigator.share({
      title: 'KOUVERTE - Chat Anonima',
      text: shareText,
      url: SITE_URL_FULL
    }).then(() => {
      showToast('📤 Condiviso!');
    }).catch(err => {
      if (err.name !== 'AbortError') fallbackShareApp(shareText);
    });
  } else {
    fallbackShareApp(shareText);
  }
  closeContinua();
}

function fallbackShareApp(text){
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Link copiato negli appunti!');
    }).catch(() => {
      window.open('https://t.me/share/url?url=' + encodeURIComponent(SITE_URL_FULL) + '&text=' + encodeURIComponent('🎭 Prova KOUVERTE - Chat Anonima'), '_blank');
    });
  } else {
    window.open('https://t.me/share/url?url=' + encodeURIComponent(SITE_URL_FULL) + '&text=' + encodeURIComponent('🎭 Prova KOUVERTE - Chat Anonima'), '_blank');
  }
}

function shareCodeOnTelegram(code){
  if (!code) return;
  const text = `🎭 Unisciti alla mia stanza KOUVERTE!\n\n🔐 Codice: ${code}\n\n👉 ${SITE_URL_FULL}\n(Tocca "🔑 Entra con Codice")\n\nO usa il bot: ${TG_BOT_URL}`;
  const url = 'https://t.me/share/url?url=' + encodeURIComponent(SITE_URL_FULL) + '&text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

// Rileva codice da URL hash (es: #code=ABC123) per join automatico
function autoJoinFromUrl(){
  const hash = window.location.hash;
  if (hash.startsWith('#code=')) {
    const code = hash.substring(6).toUpperCase();
    if (/^[A-Z0-9]{6}$/.test(code)) {
      setTimeout(() => {
        openJoinCodeRoom();
        document.getElementById('joinRoomCode').value = code;
      }, 1500);
    }
  } else if (hash === '#create') {
    setTimeout(() => openCreateCodeRoom(), 1500);
  } else if (hash === '#join') {
    setTimeout(() => openJoinCodeRoom(), 1500);
  }
}

// ══════════════════════════════════════════
// STANZE A CODICE - Crea / Entra
// ══════════════════════════════════════════
var currentRoomCode = null;
var selectedEmoji = '🎉';

function openCreateCodeRoom(){
  document.getElementById('modalCreateRoom').classList.add('show');
  document.getElementById('newRoomName').value = '';
  document.getElementById('codeResult').style.display = 'none';
  document.getElementById('createRoomBtn').textContent = 'Genera Codice';
  document.getElementById('createRoomBtn').onclick = createCodeRoom;
  currentRoomCode = null;

  // Reset emoji selection
  document.querySelectorAll('.emoji-opt').forEach(el => {
    el.classList.remove('selected');
    el.onclick = () => {
      document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedEmoji = el.dataset.emoji;
    };
  });
  const firstEmoji = document.querySelector('.emoji-opt');
  if (firstEmoji) {
    firstEmoji.classList.add('selected');
    selectedEmoji = firstEmoji.dataset.emoji;
  }

  setTimeout(() => document.getElementById('newRoomName').focus(), 100);
}

function openJoinCodeRoom(){
  document.getElementById('modalJoinRoom').classList.add('show');
  document.getElementById('joinRoomCode').value = '';
  setTimeout(() => document.getElementById('joinRoomCode').focus(), 100);
}

function closeModal(id){
  document.getElementById(id).classList.remove('show');
}

function generateRoomCode(){
  // Genera codice 6 caratteri: lettere maiuscole + numeri
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function selectDuration(el) {
  document.querySelectorAll('#durationPicker .dur-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

function createCodeRoom(){
  const name = document.getElementById('newRoomName').value.trim();
  if (!name) { showToast('⚠️ Inserisci un nome per la stanza'); document.getElementById('newRoomName').focus(); return; }
  if (name.length < 3) { showToast('⚠️ Il nome deve avere almeno 3 caratteri'); return; }

  const code = generateRoomCode();
  currentRoomCode = code;
  const password = (document.getElementById('newRoomPassword')?.value || '').trim() || null;

  // Duration picker
  const durEl = document.querySelector('#durationPicker .dur-opt.selected');
  const durationMin = durEl ? parseInt(durEl.dataset.min || '0', 10) : 0;

  const customRoom = {
    id: 'code_' + code,
    name: selectedEmoji + ' ' + name,
    emoji: selectedEmoji,
    desc: 'Stanza privata - Codice: ' + code,
    tier: 'code',
    color: '#00d4ff',
    dot1: '#00d4ff', dot2: '#ff6b9d', dot3: '#f97316',
    code, ownerId: user.id,
    hasPassword: !!password,
    durationMin: durationMin || null
  };

  let myCodeRooms = getLS('kv4_code_rooms') || [];
  myCodeRooms.push(customRoom);
  setLS('kv4_code_rooms', myCodeRooms);

  if (socket?.connected) {
    socket.emit('create-code-room', { room: { ...customRoom, password } });
  }

  document.getElementById('generatedCode').textContent = code;
  const pwdLine = password ? `<div style="font-size:11px;color:#10b981;margin-top:4px">🔒 Password impostata</div>` : '';
  const codeRes = document.getElementById('codeResult');
  codeRes.style.display = 'block';
  // Aggiungi riga password se non già presente
  if (!document.getElementById('codePwdInfo')) {
    const d = document.createElement('div'); d.id = 'codePwdInfo'; d.innerHTML = pwdLine;
    codeRes.insertBefore(d, codeRes.firstChild);
  }
  document.getElementById('createRoomBtn').textContent = 'Entra nella stanza';
  document.getElementById('createRoomBtn').onclick = () => { closeModal('modalCreateRoom'); enterCodeRoom(customRoom); };
  const durLabel = durationMin === 30 ? '30min' : durationMin === 60 ? '1h' : durationMin === 120 ? '2h' : durationMin === 1440 ? '24h' : '';
  showToast('✅ Stanza creata! Codice: ' + code + (password ? ' 🔒' : '') + (durLabel ? ` ⏳ ${durLabel}` : ''));
}

function copyRoomCode(){
  const code = currentRoomCode;
  if (!code) return;

  const shareText = `🎉 Unisciti alla mia stanza KOUVERTE!\n\nCodice: ${code}\n\nVai su www.kouverte.com → Entra con Codice`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('📋 Codice copiato!');
    }).catch(() => {
      fallbackCopy(shareText);
    });
  } else {
    fallbackCopy(shareText);
  }
}

function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('📋 Codice copiato!');
  } catch(e) {
    showToast('⚠️ Copia manualmente: ' + currentRoomCode);
  }
  document.body.removeChild(ta);
}

function joinCodeRoom(){
  const code = document.getElementById('joinRoomCode').value.trim().toUpperCase();
  if (!code || code.length !== 6) { showToast('⚠️ Inserisci un codice di 6 caratteri'); return; }

  const pwdInput = document.getElementById('joinRoomPassword');
  const password = pwdInput ? pwdInput.value.trim() : null;

  const myCodeRooms = getLS('kv4_code_rooms') || [];
  let foundRoom = myCodeRooms.find(r => r.code === code);

  if (!foundRoom) {
    foundRoom = {
      id: 'code_' + code,
      name: '🔐 Stanza ' + code,
      emoji: '🔐',
      desc: 'Stanza privata - Codice: ' + code,
      tier: 'code', color: '#00d4ff',
      dot1: '#00d4ff', dot2: '#ff6b9d', dot3: '#f97316',
      code
    };
    myCodeRooms.push(foundRoom);
    setLS('kv4_code_rooms', myCodeRooms);
  }

  // Prima valida con il server (gestisce anche errore password)
  if (socket?.connected) {
    socket.once('code-room-error', ({ error }) => {
      // Se errore password: mostra il campo password
      if (error && error.includes('Password')) {
        const wrap = document.getElementById('joinPasswordWrap');
        if (wrap) { wrap.style.display = 'block'; document.getElementById('joinRoomPassword')?.focus(); }
        showToast('🔒 ' + error);
      } else {
        showToast('⚠️ ' + error);
      }
    });
    socket.once('code-room-joined', ({ room: serverRoom }) => {
      if (serverRoom) Object.assign(foundRoom, serverRoom);
      closeModal('modalJoinRoom');
      if (!ROOMS.find(r => r.id === foundRoom.id)) ROOMS.push(foundRoom);
      enterRoom(foundRoom.id);
    });
    socket.emit('join-code-room', { code, room: foundRoom, password: password || undefined });
    return;
  }

  // Fallback offline
  closeModal('modalJoinRoom');
  enterCodeRoom(foundRoom);
}

function enterCodeRoom(roomCfg){
  // Aggiungi temporaneamente alla lista ROOMS se non c'è
  if (!ROOMS.find(r => r.id === roomCfg.id)) {
    ROOMS.push(roomCfg);
  }

  // Notifica il server della stanza con codice
  if (socket && socket.connected) {
    socket.emit('join-code-room', { code: roomCfg.code, room: roomCfg });
  }

  // Usa la funzione esistente enterRoom
  enterRoom(roomCfg.id);
  showToast('🔐 Entrato in: ' + roomCfg.name);
}

// Carica le stanze a codice salvate localmente all'avvio
function loadSavedCodeRooms(){
  const myCodeRooms = getLS('kv4_code_rooms') || [];
  myCodeRooms.forEach(r => {
    if (!ROOMS.find(x => x.id === r.id)) {
      ROOMS.push(r);
    }
  });
}

// ══════════════════════════════════════════
// CONTINUA MENU FUNCTIONS
// ══════════════════════════════════════════

function openContinua(){
  document.getElementById('continuaOv').classList.add('open');
}

function closeContinua(){
  document.getElementById('continuaOv').classList.remove('open');
}

// ══════════════════════════════════════════
// ONESHOT - Abbinamento casuale rapido
// ══════════════════════════════════════════
function oneshot(){
  closeContinua();
  // Scegli una stanza random dalle stanze pubbliche
  const publicRooms = ROOMS.filter(r => r.tier === 'public');
  if (publicRooms.length === 0) {
    showToast('⚠️ Nessuna stanza disponibile');
    return;
  }
  const randomRoom = publicRooms[Math.floor(Math.random() * publicRooms.length)];

  // Mostra modal di conferma
  const modal = document.getElementById('oneshotModal') || createOneshotModal();
  document.getElementById('oneshotRoomName').textContent = randomRoom.name;
  document.getElementById('oneshotRoomEmoji').textContent = randomRoom.emoji;
  document.getElementById('oneshotEnterBtn').onclick = () => {
    modal.classList.remove('show');
    enterRoom(randomRoom.id);
  };
  document.getElementById('oneshotShuffleBtn').onclick = () => {
    modal.classList.remove('show');
    setTimeout(() => oneshot(), 200);
  };
  modal.classList.add('show');
}

function createOneshotModal(){
  const div = document.createElement('div');
  div.id = 'oneshotModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title">⚡ OneShot - Incontra ora</div>
        <button class="modal-close" onclick="document.getElementById('oneshotModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="text-align:center;padding:30px 20px">
        <div style="font-size:64px;margin-bottom:14px" id="oneshotRoomEmoji">🌍</div>
        <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:8px" id="oneshotRoomName">Mondo</div>
        <div style="font-size:13px;color:#9ca3af;margin-bottom:20px">Stanza random selezionata per te!</div>
        <button class="modal-btn modal-btn-primary" style="width:100%;padding:12px;margin-bottom:8px" id="oneshotEnterBtn">🚀 Entra qui</button>
        <button class="modal-btn modal-btn-secondary" style="width:100%;padding:12px" id="oneshotShuffleBtn">🎲 Stanza diversa</button>
      </div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

// ══════════════════════════════════════════
// CREATE ROOM / PRIVATE ROOM - Indirizza alle nuove funzioni
// ══════════════════════════════════════════
function createRoom(){
  closeContinua();
  openCreateCodeRoom();
}

function enterPrivateRoom(){
  closeContinua();
  openJoinCodeRoom();
}

// ══════════════════════════════════════════
// FAVORITI - Lista utenti
// ══════════════════════════════════════════
function showFavorites(){
  closeContinua();
  const favs = user.favorites || [];
  const modal = document.getElementById('listModal') || createListModal();

  document.getElementById('listModalTitle').textContent = '❤️ Utenti Favoriti';
  const body = document.getElementById('listModalBody');

  if (favs.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:30px 20px;color:#9ca3af">
        <div style="font-size:48px;margin-bottom:10px">💔</div>
        <div style="font-size:14px;margin-bottom:6px">Nessun utente nei preferiti</div>
        <div style="font-size:11px">Aggiungi utenti dai tuoi preferiti durante una chat</div>
      </div>
    `;
  } else {
    body.innerHTML = favs.map(f => `
      <div class="list-row">
        <div class="list-row-avatar">${f.face || '🎭'}</div>
        <div class="list-row-info">
          <div class="list-row-name">${esc(f.name || 'Anonimo')}</div>
          <div class="list-row-sub">Aggiunto ${f.addedAt ? new Date(f.addedAt).toLocaleDateString('it-IT') : 'di recente'}</div>
        </div>
        <button class="list-row-action" onclick="removeFavorite('${f.id}')" title="Rimuovi">✕</button>
      </div>
    `).join('');
  }
  modal.classList.add('show');
}

function removeFavorite(userId){
  if (!user.favorites) return;
  user.favorites = user.favorites.filter(f => f.id !== userId);
  saveUser();
  showToast('❤️ Rimosso dai preferiti');
  showFavorites();
}

// ══════════════════════════════════════════
// BLOCCATI - Lista utenti
// ══════════════════════════════════════════
function showBlocked(){
  closeContinua();
  const blocked = user.blocked || [];
  const modal = document.getElementById('listModal') || createListModal();

  document.getElementById('listModalTitle').textContent = '🚫 Utenti Bloccati';
  const body = document.getElementById('listModalBody');

  if (blocked.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:30px 20px;color:#9ca3af">
        <div style="font-size:48px;margin-bottom:10px">✅</div>
        <div style="font-size:14px;margin-bottom:6px">Nessun utente bloccato</div>
        <div style="font-size:11px">Blocca utenti molesti durante una chat</div>
      </div>
    `;
  } else {
    body.innerHTML = blocked.map(b => `
      <div class="list-row">
        <div class="list-row-avatar">${b.face || '🎭'}</div>
        <div class="list-row-info">
          <div class="list-row-name">${esc(b.name || 'Anonimo')}</div>
          <div class="list-row-sub">Bloccato ${b.blockedAt ? new Date(b.blockedAt).toLocaleDateString('it-IT') : 'di recente'}</div>
        </div>
        <button class="list-row-action unblock" onclick="unblockUser('${b.id}')" title="Sblocca">🔓</button>
      </div>
    `).join('');
  }
  modal.classList.add('show');
}

function unblockUser(userId){
  if (!user.blocked) return;
  user.blocked = user.blocked.filter(b => b.id !== userId);
  saveUser();
  showToast('🔓 Utente sbloccato');
  showBlocked();
}

function createListModal(){
  const div = document.createElement('div');
  div.id = 'listModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title" id="listModalTitle">Lista</div>
        <button class="modal-close" onclick="document.getElementById('listModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" id="listModalBody" style="max-height:400px;overflow-y:auto"></div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

function openWebcamSettings(){
  closeContinua();
  document.getElementById('webcamSettingsOv').classList.add('open');
  
  // Popolare la lista delle webcam disponibili
  navigator.mediaDevices.enumerateDevices().then(devices => {
    const cameras = devices.filter(d => d.kind === 'videoinput');
    const sel1 = document.getElementById('cameraSelect1');
    const sel2 = document.getElementById('cameraSelect2');
    
    sel1.innerHTML = '<option value="">Automatica</option>';
    sel2.innerHTML = '<option value="">Automatica</option>';
    
    cameras.forEach((cam, idx) => {
      const opt1 = document.createElement('option');
      opt1.value = cam.deviceId;
      opt1.textContent = cam.label || 'Webcam ' + (idx + 1);
      sel1.appendChild(opt1);
      
      const opt2 = opt1.cloneNode(true);
      sel2.appendChild(opt2);
    });
  }).catch(e => console.error('[Webcam] Errore enumerating devices:', e));
}

function closeWebcamSettings(){
  document.getElementById('webcamSettingsOv').classList.remove('open');
}

async function switchCamera(n){
  const sel = document.getElementById('cameraSelect' + n);
  const deviceId = sel.value;
  console.log('[Webcam] Switching camera ' + n + ' to:', deviceId);

  // Salva la preferenza
  const prefs = getLS('kv4_webcam_prefs') || {};
  prefs['camera' + n] = deviceId;
  setLS('kv4_webcam_prefs', prefs);

  // Re-inizializza lo stream solo se è la camera principale
  if (n === 1 && webrtcEnabled) {
    try {
      // Stop existing tracks
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }

      // Get resolution preference
      const resSel = document.getElementById('resolutionSelect1');
      const resolution = resSel?.value || '720';
      const height = parseInt(resolution);
      const width = Math.round(height * 16 / 9);

      // Re-acquire with new device
      const constraints = {
        audio: { echoCancellation: true, noiseSuppression: true },
        video: deviceId ? {
          deviceId: { exact: deviceId },
          width: { ideal: width },
          height: { ideal: height }
        } : {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user'
        }
      };

      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      const myVideo = document.getElementById('myVideo');
      if (myVideo) {
        myVideo.srcObject = localStream;
        myVideo.play().catch(()=>{});
      }

      // Replace tracks in all peer connections
      Object.values(peerConnections).forEach(pc => {
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sender) sender.replaceTrack(track);
        });
      });

      showToast('🎥 Webcam aggiornata!');
    } catch (err) {
      console.error('[Webcam] Errore switch:', err);
      showToast('⚠️ Impossibile cambiare webcam');
    }
  } else {
    showToast('💾 Preferenza salvata');
  }
}

async function setResolution(n){
  const sel = document.getElementById('resolutionSelect' + n);
  const res = sel.value;
  console.log('[Webcam] Setting resolution ' + n + ':', res + 'p');

  // Salva preferenza
  const prefs = getLS('kv4_webcam_prefs') || {};
  prefs['resolution' + n] = res;
  setLS('kv4_webcam_prefs', prefs);

  // Riaplica con nuova risoluzione
  if (n === 1 && localStream && webrtcEnabled) {
    const camSel = document.getElementById('cameraSelect1');
    await switchCamera(1); // Re-init con stessa camera ma nuova risoluzione
  } else {
    showToast('📹 Risoluzione ' + res + 'p salvata');
  }
}

function toggleAudio(){
  const toggle = document.getElementById('audioToggle');
  if(localStream){
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(t => t.enabled = toggle.checked);
    // Sincronizza con il bottone mic principale
    const micBtn = document.getElementById('myMicBtn');
    if (micBtn) {
      if (toggle.checked) {
        micBtn.classList.remove('off');
        micBtn.textContent = '🎤';
      } else {
        micBtn.classList.add('off');
        micBtn.textContent = '🔇';
      }
    }
    showToast(toggle.checked ? '🎤 Microfono attivo' : '🔇 Microfono mutato');
  } else {
    showToast('⚠️ Stream non disponibile');
  }
}

function testCamera(){
  if(!localStream){
    showToast('⚠️ Webcam non inizializzata. Ricarica la pagina.');
    return;
  }
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();

  const videoOk = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
  const audioOk = audioTracks.length > 0 && audioTracks[0].readyState === 'live';

  if (videoOk && audioOk) {
    showToast('✅ Webcam + Microfono OK!');
  } else if (videoOk) {
    showToast('✅ Webcam OK · ⚠️ Microfono assente');
  } else if (audioOk) {
    showToast('⚠️ Webcam assente · ✅ Microfono OK');
  } else {
    showToast('❌ Nessun dispositivo funzionante');
  }
}

// ══════════════════════════════════════════
// IMPOSTAZIONI - Modal completo
// ══════════════════════════════════════════
function openSettings(){
  closeContinua();
  const modal = document.getElementById('settingsModal') || createSettingsModal();
  loadSettingsValues();
  modal.classList.add('show');
}

function createSettingsModal(){
  const div = document.createElement('div');
  div.id = 'settingsModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title">⚙️ Impostazioni</div>
        <button class="modal-close" onclick="document.getElementById('settingsModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="max-height:60vh;overflow-y:auto">

        <div class="settings-group">
          <div class="settings-group-title">🔔 Notifiche & Suoni</div>
          <label class="settings-row">
            <span>Suono nuovo messaggio</span>
            <input type="checkbox" id="setSound" onchange="updateSetting('sound', this.checked)">
          </label>
          <label class="settings-row">
            <span>Vibrazione (mobile)</span>
            <input type="checkbox" id="setVibrate" onchange="updateSetting('vibrate', this.checked)">
          </label>
          <label class="settings-row">
            <span>Notifica utenti che entrano</span>
            <input type="checkbox" id="setJoinNotify" onchange="updateSetting('joinNotify', this.checked)">
          </label>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">🎨 Aspetto</div>
          <label class="settings-row">
            <span>🌙 Tema Scuro (default) / ☀️ Chiaro</span>
            <input type="checkbox" id="setDarkMode" onchange="toggleTheme(this.checked)">
          </label>
          <label class="settings-row">
            <span>Animazioni</span>
            <input type="checkbox" id="setAnimations" onchange="updateSetting('animations', this.checked)">
          </label>
          <label class="settings-row">
            <span>Mostra emoji nelle chat</span>
            <input type="checkbox" id="setEmojis" onchange="updateSetting('emojis', this.checked)">
          </label>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">🎥 Privacy Video</div>
          <label class="settings-row">
            <span>Camera attiva all'avvio</span>
            <input type="checkbox" id="setCamAutostart" onchange="updateSetting('camAutostart', this.checked)">
          </label>
          <label class="settings-row">
            <span>Microfono attivo all'avvio</span>
            <input type="checkbox" id="setMicAutostart" onchange="updateSetting('micAutostart', this.checked)">
          </label>
          <label class="settings-row">
            <span>Richiedi conferma per condividere video</span>
            <input type="checkbox" id="setVideoConfirm" onchange="updateSetting('videoConfirm', this.checked)">
          </label>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">🔒 Privacy & Sicurezza</div>
          <label class="settings-row">
            <span>Mostra "online" agli altri</span>
            <input type="checkbox" id="setShowOnline" onchange="updateSetting('showOnline', this.checked)">
          </label>
          <label class="settings-row">
            <span>Permetti messaggi diretti</span>
            <input type="checkbox" id="setAllowDM" onchange="updateSetting('allowDM', this.checked)">
          </label>
          <button class="modal-btn modal-btn-secondary" style="width:100%;margin-top:10px" onclick="clearChatHistory()">🗑️ Cancella cronologia locale</button>
          <button class="modal-btn modal-btn-secondary" style="width:100%;margin-top:8px;background:#fbbf24;color:#000;font-weight:700" onclick="regenerateBackupCodes()">🔑 Rigenera codici di recupero password</button>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">🌐 Lingua</div>
          <label class="settings-row">
            <span>Lingua interfaccia</span>
            <select id="setLanguage" class="settings-select-small" onchange="updateSetting('language', this.value)">
              <option value="it">🇮🇹 Italiano</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </label>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">📱 App</div>
          <div style="font-size:11px;color:#9ca3af;line-height:1.6;padding:8px">
            Versione: <strong>2.5.0</strong><br>
            Build: KOUVERTE Web v2025<br>
            Server: ${SITE_URL_FULL}
          </div>
        </div>

      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" onclick="resetSettings()">🔄 Ripristina</button>
        <button class="modal-btn modal-btn-primary" onclick="document.getElementById('settingsModal').classList.remove('show');showToast('✅ Impostazioni salvate')">Salva</button>
      </div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

function loadSettingsValues(){
  const s = getLS('kv4_settings') || getDefaultSettings();
  document.getElementById('setSound').checked = s.sound;
  document.getElementById('setVibrate').checked = s.vibrate;
  document.getElementById('setJoinNotify').checked = s.joinNotify;
  document.getElementById('setAnimations').checked = s.animations;
  document.getElementById('setEmojis').checked = s.emojis;
  document.getElementById('setCamAutostart').checked = s.camAutostart;
  document.getElementById('setMicAutostart').checked = s.micAutostart;
  document.getElementById('setVideoConfirm').checked = s.videoConfirm;
  document.getElementById('setShowOnline').checked = s.showOnline;
  document.getElementById('setAllowDM').checked = s.allowDM;
  document.getElementById('setLanguage').value = s.language;
  // Tema: NON checked = scuro (default), checked = chiaro
  const darkBox = document.getElementById('setDarkMode');
  if (darkBox) darkBox.checked = s.theme === 'light';
}

function getDefaultSettings(){
  return {
    sound: true, vibrate: true, joinNotify: false,
    animations: true, emojis: true,
    camAutostart: false, micAutostart: false, videoConfirm: true,
    showOnline: true, allowDM: true,
    language: 'it',
    theme: 'dark'
  };
}

function updateSetting(key, value){
  const s = getLS('kv4_settings') || getDefaultSettings();
  s[key] = value;
  setLS('kv4_settings', s);

  // Applica subito alcune impostazioni
  if (key === 'animations') {
    document.body.style.setProperty('--anim-speed', value ? '1' : '0');
  }
}

function toggleTheme(isLight){
  const theme = isLight ? 'light' : 'dark';
  applyTheme(theme);
  updateSetting('theme', theme);
  showToast(isLight ? '☀️ Tema chiaro attivato' : '🌙 Tema scuro attivato');
}

function applyTheme(theme){
  document.body.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

// Applica tema all'avvio
(function(){
  const s = getLS('kv4_settings');
  if (s && s.theme) applyTheme(s.theme);
})();

function resetSettings(){
  if (confirm('Ripristinare tutte le impostazioni predefinite?')) {
    setLS('kv4_settings', getDefaultSettings());
    loadSettingsValues();
    showToast('🔄 Impostazioni ripristinate');
  }
}

function clearChatHistory(){
  if (confirm('Cancellare TUTTA la cronologia chat locale? Questa azione è irreversibile.')) {
    // Pulisce solo i dati chat locali
    const keysToKeep = ['kv4_user', 'kv4_settings'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(k => {
      if (k.startsWith('kv4_') && !keysToKeep.includes(k)) {
        localStorage.removeItem(k);
      }
    });
    showToast('🗑️ Cronologia cancellata');
  }
}

function openVIP(){
  closeContinua();
  const ov = document.getElementById('paywallOv');
  if (ov) {
    ov.classList.add('open');
  } else {
    showToast('👑 Diventa VIP: contatta @Kouverte_bot per le opzioni');
  }
}

// ══════════════════════════════════════════
// INFO PUNTI - Modal completo
// ══════════════════════════════════════════
function showInfo(){
  closeContinua();
  const modal = document.getElementById('infoModal') || createInfoModal();
  document.getElementById('infoUserCoins').textContent = user.coins || 0;
  document.getElementById('infoUserXp').textContent = user.xp || 0;
  document.getElementById('infoUserMsgs').textContent = user.msgCount || 0;
  modal.classList.add('show');
}

function createInfoModal(){
  const div = document.createElement('div');
  div.id = 'infoModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title">ℹ️ Info Punti & XP</div>
        <button class="modal-close" onclick="document.getElementById('infoModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="max-height:60vh;overflow-y:auto">

        <div class="info-stats">
          <div class="info-stat-card">
            <div class="info-stat-icon">🪙</div>
            <div class="info-stat-value" id="infoUserCoins">0</div>
            <div class="info-stat-label">Monete</div>
          </div>
          <div class="info-stat-card">
            <div class="info-stat-icon">⭐</div>
            <div class="info-stat-value" id="infoUserXp">0</div>
            <div class="info-stat-label">XP</div>
          </div>
          <div class="info-stat-card">
            <div class="info-stat-icon">💬</div>
            <div class="info-stat-value" id="infoUserMsgs">0</div>
            <div class="info-stat-label">Messaggi</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-section-title">🪙 Come guadagnare monete</div>
          <div class="info-list">
            <div class="info-item"><span class="info-item-icon">💬</span><span>Invia messaggi: <strong>+1 moneta</strong></span></div>
            <div class="info-item"><span class="info-item-icon">📅</span><span>Login giornaliero: <strong>+20 monete</strong></span></div>
            <div class="info-item"><span class="info-item-icon">🔥</span><span>Streak 7 giorni: <strong>+100 monete</strong></span></div>
            <div class="info-item"><span class="info-item-icon">👥</span><span>Invita amici: <strong>+50 monete</strong></span></div>
            <div class="info-item"><span class="info-item-icon">🎰</span><span>Ruota fortuna: <strong>fino a 500</strong></span></div>
            <div class="info-item"><span class="info-item-icon">🏆</span><span>Sblocca badge: <strong>+10-50</strong></span></div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-section-title">⭐ Come guadagnare XP</div>
          <div class="info-list">
            <div class="info-item"><span class="info-item-icon">💬</span><span>Ogni messaggio: <strong>+5 XP</strong></span></div>
            <div class="info-item"><span class="info-item-icon">🎉</span><span>Entrare in stanza: <strong>+10 XP</strong></span></div>
            <div class="info-item"><span class="info-item-icon">🔥</span><span>Streak settimanale: <strong>+50 XP</strong></span></div>
            <div class="info-item"><span class="info-item-icon">🎊</span><span>Aiutare nuovi utenti: <strong>+20 XP</strong></span></div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-section-title">🎁 Cosa puoi sbloccare</div>
          <div class="info-list">
            <div class="info-item"><span class="info-item-icon">🖼️</span><span><strong>Cornici premium</strong> per il tuo avatar</span></div>
            <div class="info-item"><span class="info-item-icon">😀</span><span><strong>Sticker speciali</strong> da inviare in chat</span></div>
            <div class="info-item"><span class="info-item-icon">🎭</span><span><strong>Maschere uniche</strong> per la tua identità</span></div>
            <div class="info-item"><span class="info-item-icon">⭐</span><span><strong>Status Premium</strong> con badge esclusivo</span></div>
            <div class="info-item"><span class="info-item-icon">🏆</span><span><strong>Badge livello</strong> per mostrare i tuoi titoli</span></div>
          </div>
        </div>

      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-primary" style="width:100%" onclick="document.getElementById('infoModal').classList.remove('show')">Ho capito</button>
      </div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

// ══════════════════════════════════════════
// LOGOUT - Sicuro con backup opzioni
// ══════════════════════════════════════════
function logout(){
  closeContinua();
  const modal = document.getElementById('logoutModal') || createLogoutModal();
  modal.classList.add('show');
}

function createLogoutModal(){
  const div = document.createElement('div');
  div.id = 'logoutModal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title">↪️ Uscita</div>
        <button class="modal-close" onclick="document.getElementById('logoutModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body" style="text-align:center;padding:24px 20px">
        <div style="font-size:48px;margin-bottom:14px">👋</div>
        <div style="font-size:15px;color:#fff;font-weight:600;margin-bottom:8px">Vuoi davvero uscire?</div>
        <div style="font-size:12px;color:#9ca3af;line-height:1.5;margin-bottom:16px">
          Le tue impostazioni e monete saranno mantenute.<br>
          Potrai accedere di nuovo in qualsiasi momento.
        </div>
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:10px;margin-bottom:14px">
          <div style="font-size:11px;color:#fca5a5;font-weight:600">⚠️ Opzione avanzata:</div>
          <label style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer;font-size:12px;color:#cbd5e1">
            <input type="checkbox" id="logoutClearAll">
            Cancella TUTTI i dati (monete, badge, cronologia)
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" onclick="document.getElementById('logoutModal').classList.remove('show')">Annulla</button>
        <button class="modal-btn modal-btn-primary" style="background:#ef4444" onclick="confirmLogout()">Esci</button>
      </div>
    </div>
  `;
  div.onclick = (e) => { if (e.target === div) div.classList.remove('show'); };
  document.body.appendChild(div);
  return div;
}

function confirmLogout(){
  const clearAll = document.getElementById('logoutClearAll')?.checked;

  // SEMPRE cancellare token autenticazione e dati account
  authToken = null;
  isLoggedIn = false;
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }

  if (clearAll) {
    // Reset totale: cancella tutto
    localStorage.clear();
  } else {
    // Reset auth ma mantieni settings + crea nuovo utente anonimo
    const settings = getLS('kv4_settings');
    localStorage.clear();
    if (settings) setLS('kv4_settings', settings);
    // NON ripristina kv4_user → al reload viene creato nuovo anonimo
    // NON ripristina kv4_auth_token → richiede nuovo login
  }

  // Pulisci eventuali variabili in memoria
  if (typeof user === 'object' && user) {
    user.username = null;
    user.serverEmail = null;
    user.serverId = null;
  }

  showToast('👋 Disconnesso! Per rientrare fai login con email e password.');
  setTimeout(() => location.reload(), 1200);
}

// ══════════════════════════════════════════
// LOGO & AVATAR SETTINGS
// ══════════════════════════════════════════
const FRAME_STYLES = [
  { id: 'none', name: 'Nessuna', emoji: '✨', color: '#64748b' },
  { id: 'silver', name: 'Silver', emoji: '⭐', color: '#94a3b8' },
  { id: 'purple', name: 'Purple', emoji: '💜', color: '#a855f7' },
  { id: 'gold', name: 'Gold', emoji: '✨', color: '#fbbf24' },
  { id: 'flame', name: 'Flame', emoji: '🔥', color: '#f97316' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', color: '#38bdf8' },
  { id: 'neon', name: 'Neon', emoji: '⚡', color: '#00ffff' },
  { id: 'emerald', name: 'Emerald', emoji: '💚', color: '#10b981' },
  { id: 'ruby', name: 'Ruby', emoji: '❤️', color: '#ef4444' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', color: '#ff00ff' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🪐', color: '#8b5cf6' },
  { id: 'royal', name: 'Royal', emoji: '👑', color: '#fbbf24' },
  { id: 'skull', name: 'Skull', emoji: '💀', color: '#9ca3af' }
];

function openLogoSettings(){
  closeContinua();
  let modal = document.getElementById('logoSettingsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'logoSettingsModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }

  const frameHTML = (window.FRAME_STYLES || FRAME_STYLES).map(f => `
    <button class="frame-selector-btn" onclick="changeFrame('${f.id}')" style="--fc:${f.color}${user.activeFrame === f.id ? ';border:3px solid #fff;transform:scale(1.1)' : ''}">
      <div style="font-size:28px;margin-bottom:4px">${f.emoji}</div>
      <div style="font-size:11px;white-space:nowrap">${f.name}</div>
    </button>
  `).join('');

  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px">
      <div class="modal-hdr">
        <div class="modal-title">🎨 Logo & Avatar</div>
        <button class="modal-close" onclick="document.getElementById('logoSettingsModal').classList.remove('show')">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:24px">
          <div style="font-size:13px;color:#a0aec0;margin-bottom:12px;font-weight:600">📌 CORNICE PROFILO</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:8px">
            ${frameHTML}
          </div>
        </div>

        <div style="border-top:1px solid #5b21b6;padding-top:16px;margin-bottom:24px">
          <div style="font-size:13px;color:#a0aec0;margin-bottom:12px;font-weight:600">😊 AVATAR PERSONALIZZATO</div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="file" id="avatarInput" accept="image/*" style="display:none" onchange="handleAvatarUpload(this)">
            <button class="btn" onclick="document.getElementById('avatarInput').click()" style="flex:1">📸 Carica Foto</button>
            <button class="btn" onclick="resetAvatar()" style="background:#5b21b6">🔄 Ripristina</button>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:8px;line-height:1.4">💡 Puoi caricare una foto personalizzata come avatar. Verrà visualizzata al posto dell'emoji.</div>
        </div>

        <div style="border-top:1px solid #5b21b6;padding-top:16px">
          <div style="font-size:13px;color:#a0aec0;margin-bottom:12px;font-weight:600">🎭 CAMBIA EMOJI</div>
          <div style="display:flex;gap:8px">
            <input type="text" id="customEmoji" placeholder="Inserisci una emoji" maxlength="2" style="flex:1;background:#1a0f2e;border:1px solid #5b21b6;color:#fff;padding:8px;border-radius:6px;font-size:14px">
            <button class="btn" onclick="changeEmoji()" style="background:#00d4ff">Salva Emoji</button>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
}

function changeFrame(frameId){
  user.activeFrame = frameId;
  saveUser();
  updateProfileUI();
  showToast('🎨 Cornice cambiata a: ' + FRAME_STYLES.find(f => f.id === frameId)?.name);
  openLogoSettings(); // Riapri per mostrare la selezione aggiornata
}

function changeEmoji(){
  const input = document.getElementById('customEmoji');
  if (!input.value.trim()) {
    showToast('⚠️ Inserisci un\'emoji');
    return;
  }
  user.face = input.value.trim();
  saveUser();
  updateProfileUI();
  showToast('😊 Emoji cambiata!');
  openLogoSettings();
}

function handleAvatarUpload(input){
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Foto troppo grande (max 5MB)'); return; }
  if (!file.type.startsWith('image/')) { showToast('⚠️ Seleziona un\'immagine'); return; }

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    // Crop circolare centrato, output 240×240 (profilo) e 48×48 (thumbnail chat)
    function cropCircle(size, quality) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const ctx = cv.getContext('2d');
      // Clip circolare
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
      ctx.clip();
      // Calcola crop centrato (aspect ratio preservato)
      const s = Math.min(img.width, img.height);
      const ox = (img.width  - s) / 2;
      const oy = (img.height - s) / 2;
      ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size);
      return cv.toDataURL('image/jpeg', quality);
    }
    user.customAvatar = cropCircle(240, 0.82);  // profilo
    user.photoThumb   = cropCircle(48,  0.65);  // thumbnail chat
    saveUser();
    updateProfileUI();
    // Aggiorna "Personalizza Avatar" se aperto
    const prevEl = document.getElementById('avatarPreviewImg');
    if (prevEl) prevEl.src = user.customAvatar;
    showToast('📸 Foto caricata!');
    // Chiudi modal e riapri settings
    document.getElementById('avatarMenuOv')?.classList.remove('show');
    setTimeout(() => openLogoSettings(), 200);
  };
  img.onerror = () => showToast('⚠️ Impossibile leggere l\'immagine');
  img.src = url;
  // Reset input per riselezionare lo stesso file
  input.value = '';
}

function resetAvatar(){
  user.customAvatar = null;
  user.photoThumb   = null;
  saveUser();
  updateProfileUI();
  showToast('🔄 Avatar ripristinato');
  openLogoSettings();
}

// Apre il file picker da qualsiasi punto
function triggerAvatarUpload(){
  let inp = document.getElementById('avatarInput');
  if (!inp) {
    inp = document.createElement('input');
    inp.type = 'file'; inp.id = 'avatarInput'; inp.accept = 'image/*';
    inp.style.display = 'none';
    inp.onchange = () => handleAvatarUpload(inp);
    document.body.appendChild(inp);
  }
  inp.click();
}

// CSS per il modale logo settings
if (!document.getElementById('logoSettingsCss')) {
  const style = document.createElement('style');
  style.id = 'logoSettingsCss';
  style.textContent = `
    .frame-selector-btn {
      background:#1a0f2e;
      border:2px solid;
      border-color:var(--fc);
      border-radius:12px;
      padding:12px 8px;
      cursor:pointer;
      transition:all 0.2s;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:4px;
      color:#fff;
      font-weight:500;
      font-size:12px;
    }
    .frame-selector-btn:hover {
      background:rgba(124,58,247,0.2);
      transform:scale(1.05);
    }
  `;
  document.head.appendChild(style);
}



// ═══ REFERRAL SYSTEM ═══
let _refLink = '';
let _refCode = '';

async function openReferralModal() {
  document.getElementById('refModalOverlay').classList.add('open');
  await loadReferralData();
}

function closeReferralModal(e) {
  if (e.target === document.getElementById('refModalOverlay')) {
    document.getElementById('refModalOverlay').classList.remove('open');
  }
}

async function loadReferralData() {
  try {
    const token = localStorage.getItem('kv_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch('/api/me/referral', { headers });
    if (!res.ok) throw new Error('no auth');
    const d = await res.json();
    _refLink = d.link;
    _refCode = d.code;
    document.getElementById('refLinkText').textContent = d.link;
    document.getElementById('refInvitedCount').textContent = d.invited_count || 0;
    document.getElementById('refEarnedFrames').textContent = d.invited_count || 0;

    // Show ambassador badge if has invites
    if (d.invited_count > 0) {
      unlockAmbassadorBadge();
    }
  } catch {
    // Guest: generate a simple shareable link
    const guestCode = 'guest_' + Math.random().toString(36).slice(2,8);
    _refLink = (window.location.origin || 'https://www.kouverte.com') + '/app.html?ref=' + guestCode;
    document.getElementById('refLinkText').textContent = _refLink;
    document.getElementById('refInvitedCount').textContent = '0';
    document.getElementById('refEarnedFrames').textContent = '0';
  }
}

function copyRefLink() {
  if (!_refLink) return;
  navigator.clipboard.writeText(_refLink).then(() => {
    const btn = document.getElementById('refCopyBtn');
    btn.textContent = '✓ Copiato!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copia'; btn.classList.remove('copied'); }, 2000);
    showToast('🔗 Link copiato negli appunti!');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = _refLink;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('🔗 Link copiato!');
  });
}

function shareRefWhatsApp() {
  const text = encodeURIComponent('🌊 Kouverte — chat anonima italiana con video HD. Entra gratis: ' + _refLink);
  window.open('https://wa.me/?text=' + text, '_blank');
}

function shareRefTelegram() {
  const text = encodeURIComponent('🌊 Kouverte — chat anonima gratis. Entra ora: ' + _refLink);
  window.open('https://t.me/share/url?url=' + encodeURIComponent(_refLink) + '&text=' + text, '_blank');
}

function shareRefNative() {
  if (navigator.share) {
    navigator.share({
      title: 'Kouverte — Chat Anonima Italiana',
      text: '🌊 Entra in Kouverte — chat anonima gratis con video HD!',
      url: _refLink
    });
  } else {
    copyRefLink();
  }
}

function unlockAmbassadorBadge() {
  // Add badge to user profile if not already there
  try {
    const profileData = JSON.parse(localStorage.getItem('kv_profile') || '{}');
    if (!profileData.badges) profileData.badges = [];
    if (!profileData.badges.includes('ambassador')) {
      profileData.badges.push('ambassador');
      localStorage.setItem('kv_profile', JSON.stringify(profileData));
    }
  } catch {}
}

// Handle incoming referral on app load
(function handleIncomingRef() {
  const ref = new URLSearchParams(window.location.search).get('ref') ||
              sessionStorage.getItem('kouverte_ref');
  if (ref) {
    sessionStorage.setItem('kouverte_ref', ref);
    // Will be sent on next registration/login
  }
})();

// ============================================================
// SPEED DATING TIMER
// Conta 3 minuti in stanza, poi suggerisce di cambiare
// ============================================================
let _sdInterval = null;
let _sdSeconds = 0;
const SD_DURATION = 3 * 60; // 3 minuti

function startSpeedDatingTimer() {
  clearInterval(_sdInterval);
  _sdSeconds = SD_DURATION;
  const el = document.getElementById('sdTimer');
  const val = document.getElementById('sdTimerVal');
  if (!el) return;
  el.style.display = 'flex';
  el.style.color = '#00d4ff';
  el.style.borderColor = 'rgba(0,212,255,.3)';

  _sdInterval = setInterval(() => {
    _sdSeconds--;
    if (_sdSeconds <= 0) {
      clearInterval(_sdInterval);
      if (val) val.textContent = '0:00';
      el.style.color = '#ff6b9d';
      el.style.borderColor = 'rgba(255,107,157,.5)';
      el.style.background = 'rgba(255,107,157,.15)';
      // Notifica: cambia stanza
      showToast('⚡ Speed Dating! Prova un\'altra stanza per incontrare nuove persone.');
      window.trackEvent?.('speed_dating_timeout', { room_id: room?.id });
      return;
    }
    const m = Math.floor(_sdSeconds / 60);
    const s = _sdSeconds % 60;
    if (val) val.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    // Colore rosso negli ultimi 30 secondi
    if (_sdSeconds <= 30) {
      el.style.color = '#ff6b9d';
      el.style.borderColor = 'rgba(255,107,157,.4)';
    }
  }, 1000);
}

function stopSpeedDatingTimer() {
  clearInterval(_sdInterval);
  const el = document.getElementById('sdTimer');
  if (el) el.style.display = 'none';
}

function sdTimerClick() {
  if (_sdSeconds <= 0) {
    // Suggerisci stanza casuale
    const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];
    if (randomRoom && randomRoom.id !== room?.id) {
      showToast(`🎲 Proviamo ${randomRoom.name}!`);
      setTimeout(() => enterRoom(randomRoom.id), 800);
    }
  } else {
    showToast(`⚡ Speed Dating: ${Math.floor(_sdSeconds/60)}:${(_sdSeconds%60).toString().padStart(2,'0')} rimasti. Cambia stanza quando vuoi!`);
  }
}

// ============================================================
// PWA — Service Worker + Install Prompt + Push Notifications
// ============================================================

// --- Service Worker registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[PWA] SW registrato:', reg.scope);
      window._swRegistration = reg;

      // Notifica update disponibile
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nuovo SW disponibile');
          }
        });
      });
    } catch (err) {
      console.warn('[PWA] SW registration failed:', err);
    }
  });
}

// --- A2HS (Add to Home Screen) Install Prompt ---
let _deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;

  // Mostra il banner solo se non già installata e non già dismessa
  const dismissed = localStorage.getItem('pwa_install_dismissed');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!dismissed && !isStandalone) {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.add('visible');
  }
});

// App già installata — nascondi il banner
window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.remove('visible');
  _deferredInstallPrompt = null;
  console.log('[PWA] App installata!');
});

async function triggerPwaInstall() {
  if (!_deferredInstallPrompt) {
    // iOS: mostra istruzioni manuali
    alert('Per installare su iPhone:\n1. Tocca il pulsante di condivisione (□↑)\n2. Seleziona "Aggiungi a schermata Home"');
    return;
  }
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.remove('visible');
  _deferredInstallPrompt.prompt();
  const { outcome } = await _deferredInstallPrompt.userChoice;
  console.log('[PWA] Install outcome:', outcome);
  _deferredInstallPrompt = null;
}

function dismissPwaInstall() {
  localStorage.setItem('pwa_install_dismissed', '1');
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.remove('visible');
}

// --- Voice Messages (hold-to-record) ---
let voiceRecorder = null;
let voiceChunks = [];
let voiceRecordStart = 0;
let voiceRecordTimer = null;

function initVoiceRecordBtn() {
  const btn = document.getElementById('voiceRecordBtn');
  if (!btn) return;

  function startRecording(e) {
    e.preventDefault();
    if (!room) { showToast('Entra in una stanza prima 🎙️'); return; }
    if (!navigator.mediaDevices?.getUserMedia) { showToast('Microfono non supportato'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        voiceChunks = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
        voiceRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 });
        voiceRecorder.ondataavailable = e => { if (e.data.size > 0) voiceChunks.push(e.data); };
        voiceRecorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const duration = Math.round((Date.now() - voiceRecordStart) / 1000);
          if (duration < 1) { voiceChunks = []; btn.classList.remove('recording'); return; }
          const blob = new Blob(voiceChunks, { type: mimeType.split(';')[0] });
          sendVoiceMsg(blob, mimeType.split(';')[0], duration);
          voiceChunks = [];
        };
        voiceRecorder.start(250);
        voiceRecordStart = Date.now();
        btn.classList.add('recording');
        btn.textContent = '⏹️';
        // Max 60 secondi
        voiceRecordTimer = setTimeout(() => stopRecording(), 60000);
      })
      .catch(err => {
        console.warn('[Voice] mic access denied:', err);
        showToast('🎙️ Accesso al microfono negato');
      });
  }

  function stopRecording(e) {
    if (e) e.preventDefault();
    clearTimeout(voiceRecordTimer);
    if (voiceRecorder && voiceRecorder.state === 'recording') {
      voiceRecorder.stop();
      btn.classList.remove('recording');
      btn.textContent = '🎙️';
    }
  }

  // Touch events (mobile hold-to-record)
  btn.addEventListener('touchstart', startRecording, { passive: false });
  btn.addEventListener('touchend', stopRecording, { passive: false });
  btn.addEventListener('touchcancel', stopRecording, { passive: false });
  // Mouse events (desktop hold-to-record)
  btn.addEventListener('mousedown', startRecording);
  btn.addEventListener('mouseup', stopRecording);
  btn.addEventListener('mouseleave', stopRecording);
}

function sendVoiceMsg(blob, mimeType, duration) {
  if (!room || !blob) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result.split(',')[1];
    if (!base64) return;
    // Render localmente subito
    appendVoiceMsg({
      userId: user.id, name: user.name, color: user.color,
      face: user.face, audio: base64, mimeType, duration, ts: Date.now()
    }, true);
    // Invia al server
    socket.emit('voice-msg', {
      roomId: room.id, audio: base64, mimeType, duration,
      userId: user.id, name: user.name, color: user.color, face: user.face
    });
  };
  reader.readAsDataURL(blob);
}

function appendVoiceMsg(msg, isOwn) {
  const msgs = document.getElementById('chatMsgs');
  if (!msgs) return;
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg-wrap' + (isOwn ? ' own' : '');
  // Generiamo barre wave casuali decorative
  const barsN = 18;
  let barsHtml = '';
  for (let i = 0; i < barsN; i++) {
    const h = 4 + Math.floor(Math.random() * 16);
    barsHtml += `<div class="voice-bar" style="height:${h}px"></div>`;
  }
  const audioSrc = `data:${msg.mimeType};base64,${msg.audio}`;
  const durLabel = msg.duration >= 60
    ? Math.floor(msg.duration/60) + ':' + String(msg.duration%60).padStart(2,'0')
    : '0:' + String(msg.duration).padStart(2,'0');
  const audioId = 'va_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  wrap.innerHTML = `
    <div class="chat-avatar" style="background:${msg.color||'#00d4ff'}33;color:${msg.color||'#00d4ff'};font-size:15px">${msg.face||'🎭'}</div>
    <div class="chat-msg-inner">
      <div class="chat-name">${escHtml(msg.name||'Anonimo')}</div>
      <div class="voice-bubble">
        <button class="voice-play-btn" id="vpb_${audioId}" onclick="toggleVoicePlay('${audioId}')">▶</button>
        <div class="voice-waveform"><div class="voice-bars" id="vbars_${audioId}">${barsHtml}</div></div>
        <span class="voice-dur" id="vdur_${audioId}">${durLabel}</span>
        <audio id="vaudio_${audioId}" src="${audioSrc}" preload="none" style="display:none"></audio>
      </div>
    </div>`;
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function toggleVoicePlay(audioId) {
  const audio = document.getElementById('vaudio_' + audioId);
  const btn = document.getElementById('vpb_' + audioId);
  const durEl = document.getElementById('vdur_' + audioId);
  const barsEl = document.getElementById('vbars_' + audioId);
  if (!audio) return;
  if (audio.paused) {
    // Pausa tutti gli altri
    document.querySelectorAll('.voice-bubble audio').forEach(a => {
      if (a !== audio && !a.paused) {
        a.pause();
        const oid = a.id.replace('vaudio_','');
        const ob = document.getElementById('vpb_' + oid);
        if (ob) { ob.textContent = '▶'; ob.classList.remove('playing'); }
      }
    });
    audio.play().catch(()=>{});
    btn.textContent = '⏸'; btn.classList.add('playing');
    // Aggiorna timer
    audio.ontimeupdate = () => {
      const rem = Math.max(0, audio.duration - audio.currentTime);
      if (!isNaN(rem)) {
        const s = Math.ceil(rem);
        durEl.textContent = '0:' + String(s).padStart(2,'0');
      }
      // Colora barre proporzionalmente al progresso
      const bars = barsEl.querySelectorAll('.voice-bar');
      const prog = audio.duration ? audio.currentTime / audio.duration : 0;
      bars.forEach((b, i) => {
        b.classList.toggle('active', i / bars.length <= prog);
      });
    };
    audio.onended = () => {
      btn.textContent = '▶'; btn.classList.remove('playing');
      barsEl.querySelectorAll('.voice-bar').forEach(b => b.classList.remove('active'));
      const tot = Math.round(audio.duration||0);
      durEl.textContent = '0:' + String(tot).padStart(2,'0');
    };
  } else {
    audio.pause();
    btn.textContent = '▶'; btn.classList.remove('playing');
  }
}

// --- Profilo Animato: 3D Tilt + Particles + Count-up ---

let _tiltRafId = null;
let _tiltTargetX = 0, _tiltTargetY = 0;
let _tiltCurrentX = 0, _tiltCurrentY = 0;
let _particlesRaf = null;

function initProfileTilt() {
  const scene = document.getElementById('profTiltScene');
  const card  = document.getElementById('profTiltCard');
  if (!scene || !card) return;

  // Lerp il tilt per smoothness
  function applyTilt() {
    _tiltCurrentX += (_tiltTargetX - _tiltCurrentX) * 0.12;
    _tiltCurrentY += (_tiltTargetY - _tiltCurrentY) * 0.12;
    card.style.transform = `rotateX(${_tiltCurrentX}deg) rotateY(${_tiltCurrentY}deg)`;
    // Shine segue la rotazione
    const shine = Math.abs(_tiltCurrentX) + Math.abs(_tiltCurrentY);
    const cx = 50 + _tiltCurrentY * 2;
    const cy = 50 - _tiltCurrentX * 2;
    card.style.setProperty('--shine-cx', cx + '%');
    card.style.setProperty('--shine-cy', cy + '%');
    _tiltRafId = requestAnimationFrame(applyTilt);
  }
  function startTiltLoop() {
    if (!_tiltRafId) applyTilt();
  }
  function stopTiltLoop() {
    _tiltTargetX = 0; _tiltTargetY = 0;
    // lascia smorzare da solo, poi cancella
    setTimeout(() => { if (_tiltRafId) { cancelAnimationFrame(_tiltRafId); _tiltRafId = null; } }, 600);
  }

  // Mouse (desktop)
  scene.addEventListener('mousemove', e => {
    startTiltLoop();
    const r = scene.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    _tiltTargetY =  nx * 14;
    _tiltTargetX = -ny * 10;
  });
  scene.addEventListener('mouseleave', () => stopTiltLoop());

  // Touch (mobile)
  scene.addEventListener('touchmove', e => {
    startTiltLoop();
    const t = e.touches[0];
    const r = scene.getBoundingClientRect();
    const nx = (t.clientX - r.left) / r.width  - 0.5;
    const ny = (t.clientY - r.top)  / r.height - 0.5;
    _tiltTargetY =  nx * 10;
    _tiltTargetX = -ny * 8;
  }, { passive: true });
  scene.addEventListener('touchend', () => stopTiltLoop());

  // Giroscopio (solo se profilo visibile)
  if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener('deviceorientation', e => {
      const profileEl = document.getElementById('profile');
      if (!profileEl?.classList.contains('active')) return;
      startTiltLoop();
      _tiltTargetY = Math.max(-10, Math.min(10, (e.gamma || 0) / 4));
      _tiltTargetX = Math.max(-8,  Math.min(8,  ((e.beta  || 0) - 40) / 6));
    });
  }
}

function initBannerParticles() {
  const canvas = document.getElementById('bannerParticles');
  if (!canvas) return;
  const banner = canvas.parentElement;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = banner.offsetWidth  || 360;
    canvas.height = banner.offsetHeight || 150;
  }
  resize();

  const COLORS = ['#00d4ff','#ff6b9d','#00e5b8','rgba(255,255,255,.8)'];
  const P_COUNT = 28;
  const particles = Array.from({ length: P_COUNT }, () => spawnParticle(canvas));

  function spawnParticle(cv, fromBottom) {
    return {
      x: Math.random() * (cv?.width || 360),
      y: fromBottom ? (cv?.height || 150) + 4 : Math.random() * (cv?.height || 150),
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.45 + 0.15),
      alpha: Math.random() * 0.55 + 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: fromBottom ? 1 : Math.random()
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      ctx.save();
      ctx.globalAlpha = p.alpha * Math.min(1, p.life * 3);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.life -= 0.004;
      if (p.life <= 0 || p.y < -4) particles[i] = spawnParticle(canvas, true);
    });
    _particlesRaf = requestAnimationFrame(draw);
  }

  // Avvia/ferma con visibilità del profilo
  const profileEl = document.getElementById('profile');
  if (profileEl) {
    new MutationObserver(() => {
      if (profileEl.classList.contains('active')) {
        resize();
        if (!_particlesRaf) draw();
      } else {
        cancelAnimationFrame(_particlesRaf); _particlesRaf = null;
      }
    }).observe(profileEl, { attributes: true, attributeFilter: ['class'] });
    if (profileEl.classList.contains('active')) draw();
  }
}

function countUpStat(elId, target, duration) {
  const el = document.getElementById(elId);
  if (!el) return;
  const start = Date.now();
  const from  = 0;
  const diff  = target - from;
  if (diff <= 0) { el.textContent = target; return; }
  function tick() {
    const t = Math.min(1, (Date.now() - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
    el.textContent = Math.round(from + diff * ease);
    if (t < 1) requestAnimationFrame(tick);
  }
  tick();
}

function triggerProfileAnimations() {
  // Count-up sulle stat cards
  setTimeout(() => {
    const msgs  = (typeof user !== 'undefined' && user) ? (user.msgCount || 0)  : 0;
    const rooms = (typeof user !== 'undefined' && user) ? (user.roomsJoined || 0) : 0;
    const badges = (typeof user !== 'undefined' && user) ? (user.badges?.length || 0) : 0;
    countUpStat('stMsgs',   msgs,   900);
    countUpStat('stRooms',  rooms,  750);
    countUpStat('stBadges', badges, 600);
  }, 120);

  // Glow default sull'avatar se nessuna cornice speciale
  const avatar = document.getElementById('profAvatarHero');
  if (avatar) {
    const hasFrame = [...avatar.classList].some(c => c.startsWith('frame-'));
    avatar.classList.toggle('glow-default', !hasFrame);
  }

  // Video preview card per nuovi utenti
  syncProfVideoCard?.();

  // Particles (se non già avviate)
  if (!_particlesRaf) {
    const canvas = document.getElementById('bannerParticles');
    if (canvas) {
      const banner = canvas.parentElement;
      canvas.width  = banner.offsetWidth  || 360;
      canvas.height = banner.offsetHeight || 150;
      initBannerParticles._started = false; // force restart
    }
  }
}

// --- Push Notifications ---
const VAPID_PUBLIC_KEY = 'BHfw5QpQadjL3KfUbjDUQVdkfWfDi_-zmcufuuRWvDoDJ6gahQ5a5b2aWrwa6QuhhaAyo-5BCHgnOlxT8cxl7nc';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribePushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    alert('Il tuo browser non supporta le notifiche push.');
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    dismissPushBanner();
    return;
  }
  try {
    const reg = window._swRegistration || await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    const token = localStorage.getItem('kv_token');
    const anonUserId = (typeof user !== 'undefined' && user?.id) ? user.id : null;
    if (token) {
      // Utente registrato: usa endpoint JWT
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subscription })
      });
    } else if (anonUserId) {
      // Utente anonimo: usa endpoint senza JWT, identifica per userId locale
      await fetch('/api/push/subscribe-anon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: anonUserId, subscription })
      });
    }
    localStorage.setItem('push_subscribed', '1');
    dismissPushBanner();
    console.log('[PWA] Push subscription salvata');
  } catch (err) {
    console.warn('[PWA] Push subscribe error:', err);
  }
}

function dismissPushBanner() {
  localStorage.setItem('push_banner_dismissed', '1');
  const banner = document.getElementById('pushNotifyBanner');
  if (banner) banner.classList.remove('visible');
}

// Mostra banner push dopo 30s — sia per utenti registrati che anonimi
setTimeout(() => {
  const subscribed = localStorage.getItem('push_subscribed');
  const dismissed = localStorage.getItem('push_banner_dismissed');
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const hasUserId = (typeof user !== 'undefined' && user?.id);
  if (!subscribed && !dismissed && hasUserId && 'Notification' in window && Notification.permission === 'default') {
    const banner = document.getElementById('pushNotifyBanner');
    if (banner) banner.classList.add('visible');
  }
  // Se già in modalità PWA, mostra subito il banner push (più utile)
  if (isInstalled && !subscribed && !dismissed && hasUserId) {
    const banner = document.getElementById('pushNotifyBanner');
    if (banner) banner.classList.add('visible');
  }
}, 30000);

// Gestisci messaggi dal SW (es. PUSH_CLICK per navigazione)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PUSH_CLICK' && event.data?.url) {
      window.location.href = event.data.url;
    }
  });
}

// ════════════════════════════════════════════════════════
// ROOM ALERT — campanellino "avvisami quando è viva"
// ════════════════════════════════════════════════════════
// Cache locale dei campanellini attivi (persiste in localStorage)
function getRoomAlerts(){
  return getLS('kv4_room_alerts') || {};
}
function setRoomAlerts(map){
  setLS('kv4_room_alerts', map);
}
function isRoomAlertActive(roomId){
  return !!(getRoomAlerts()[roomId]);
}
function getRoomAlertIcon(roomId){
  return isRoomAlertActive(roomId) ? '🔔' : '🔕';
}

async function toggleRoomAlert(roomId, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const userId = user?.id;
  if(!userId){ showToast('❌ Devi avere un profilo per usare gli alert'); return; }

  const alerts = getRoomAlerts();
  const isActive = !!alerts[roomId];

  // Se si vuole attivare: assicurarsi che le notifiche push siano abilitate
  if(!isActive){
    if(!('Notification' in window) || !('serviceWorker' in navigator)){
      showToast('❌ Il tuo browser non supporta le notifiche');
      return;
    }
    let perm = Notification.permission;
    if(perm === 'denied'){
      showToast('🔕 Le notifiche sono bloccate — abilitale dalle impostazioni del browser');
      return;
    }
    if(perm === 'default'){
      perm = await Notification.requestPermission();
      if(perm !== 'granted'){
        showToast('Notifiche non autorizzate');
        return;
      }
    }
    // Ottieni subscription push
    let sub;
    try {
      const reg = window._swRegistration || await navigator.serviceWorker.ready;
      sub = await reg.pushManager.getSubscription();
      if(!sub){
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        // Salva subscription generale (per DM/altri push)
        if(!localStorage.getItem('push_subscribed')){
          await fetch('/api/push/subscribe-anon', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ userId, subscription: sub.toJSON() })
          }).catch(()=>{});
          localStorage.setItem('push_subscribed','1');
        }
      }
    } catch(e){
      console.warn('[RoomAlert] Subscribe error:', e);
      showToast('❌ Errore attivazione notifiche');
      return;
    }
    // Registra alert per questa stanza
    try {
      await fetch('/api/push/subscribe-room-alert', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId, subscription: sub.toJSON(), roomId })
      });
    } catch(e){ console.warn('[RoomAlert] save error:', e); }
    alerts[roomId] = true;
    setRoomAlerts(alerts);
    // Aggiorna icona
    const btn = document.getElementById('bell_' + roomId);
    if(btn) btn.textContent = '🔔';
    showToast('🔔 Ti avviseremo quando la stanza si anima!');
  } else {
    // Disattiva alert
    try {
      await fetch('/api/push/subscribe-room-alert', {
        method:'DELETE', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId, roomId })
      });
    } catch(e){ console.warn('[RoomAlert] unsub error:', e); }
    delete alerts[roomId];
    setRoomAlerts(alerts);
    const btn = document.getElementById('bell_' + roomId);
    if(btn) btn.textContent = '🔕';
    showToast('🔕 Alert disattivato per questa stanza');
  }
}



function openAppVideoLightbox(){
  const lb = document.getElementById('appVidLightbox');
  const v  = document.getElementById('appLightboxVid');
  lb.classList.add('open');
  if (v) { v.currentTime = 0; v.play().catch(()=>{}); }
  document.body.style.overflow = 'hidden';
}
function closeAppVideoLightbox(){
  const lb = document.getElementById('appVidLightbox');
  const v  = document.getElementById('appLightboxVid');
  lb.classList.remove('open');
  if (v) v.pause();
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAppVideoLightbox(); });

// Mostra/nascondi card video profilo in base all'esperienza utente
function syncProfVideoCard(){
  const card = document.getElementById('profVideoCard');
  if (!card) return;
  const msgCount = (typeof user !== 'undefined' && user) ? (user.msgCount || 0) : 0;
  const dismissed = localStorage.getItem('kv_prof_video_dismissed');
  // Mostra ai nuovi utenti (meno di 10 messaggi) che non hanno dismissato
  const show = !dismissed && msgCount < 10;
  card.style.display = show ? 'block' : 'none';
  if (show) {
    // Avvia anteprima video silenziosa
    const v = document.getElementById('profVideoThumb');
    if (v) v.play().catch(()=>{});
  }
}

// Keep-alive: pinga /health ogni 10 minuti per evitare lo sleep del free tier
(function startKeepAlive() {
  const INTERVAL = 10 * 60 * 1000; // 10 minuti
  setInterval(() => {
    fetch('/health', { method: 'GET', cache: 'no-store' }).catch(() => {});
  }, INTERVAL);
})();

// ══════════════════════════════════════════════════════════════
// PANNELLO DIAGNOSTICO / RISOLVI PROBLEMI
// ══════════════════════════════════════════════════════════════

function openDiagnostic() {
  const overlay = document.getElementById('diagOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  const checks = document.getElementById('diagChecks');
  if (checks && checks.innerHTML === '') runDiagnostics();
}

function closeDiagnostic() {
  const overlay = document.getElementById('diagOverlay');
  if (overlay) overlay.classList.remove('open');
}

async function runDiagnostics() {
  const container = document.getElementById('diagChecks');
  const tipsBox   = document.getElementById('diagTipsBox');
  if (!container) return;

  const CHECKS = [
    { id:'internet',    icon:'🌐', name:'Connessione Internet' },
    { id:'server',      icon:'🖥️', name:'Server Kouverte' },
    { id:'realtime',    icon:'⚡', name:'Connessione in Tempo Reale' },
    { id:'camera',      icon:'📷', name:'Fotocamera' },
    { id:'mic',         icon:'🎤', name:'Microfono' },
    { id:'webrtc',      icon:'📡', name:'Video Chat (WebRTC)' },
    { id:'storage',     icon:'💾', name:'Salvataggio Locale' },
    { id:'notify',      icon:'🔔', name:'Notifiche Push' },
  ];

  container.innerHTML = CHECKS.map(c => `
    <div class="diag-check-item checking" id="diag-${c.id}">
      <div class="diag-check-icon">${c.icon}</div>
      <div class="diag-check-info">
        <div class="diag-check-name">${c.name}</div>
        <div class="diag-check-status" id="diag-${c.id}-status">Controllo...</div>
      </div>
      <div class="diag-check-badge" id="diag-${c.id}-badge">⟳</div>
    </div>
  `).join('');
  if (tipsBox) { tipsBox.innerHTML = ''; tipsBox.className = 'diag-tips-box'; }

  const tips = [];

  // 1. Internet
  await _diagCheck('internet', async () => {
    if (!navigator.onLine) throw new Error('Dispositivo offline');
    return 'Online ✓';
  }, tips, 'Controlla la connessione Wi-Fi o dati mobili.');

  // 2. Server — timeout lungo per gestire il risveglio del free tier (fino a 60s)
  await _diagCheck('server', async () => {
    // Prima prova veloce (5s)
    const tryFetch = (ms) => {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), ms);
      return fetch('/health', { signal: ctrl.signal }).finally(() => clearTimeout(tid));
    };
    // Aggiorna badge a "in risveglio" se la prima prova è lenta
    const wakeTimer = setTimeout(() => {
      const el = document.getElementById('diag-server');
      if (el) { el.className = 'diag-check-item checking'; const b = el.querySelector('.diag-badge'); if(b) b.textContent='⏳'; const s = el.querySelector('.diag-status'); if(s) s.textContent='In risveglio… (~50s)'; }
    }, 5100);
    try {
      let r;
      try { r = await tryFetch(5000); }
      catch(e) {
        // Seconda prova con timeout 55s (server in sleep su free tier)
        r = await tryFetch(55000);
      }
      clearTimeout(wakeTimer);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return 'Risponde ✓';
    } catch (e) {
      clearTimeout(wakeTimer);
      if (e.name === 'AbortError') throw new Error('Timeout — server in sleep, ricarica tra 1 minuto');
      throw new Error('Non raggiungibile');
    }
  }, tips, 'Il server free va in sleep dopo 15min inattività. Aspetta 60s e riprova, oppure ricarica la pagina.');

  // 3. WebSocket / Socket.io
  await _diagCheck('realtime', async () => {
    const s = (typeof socket !== 'undefined') ? socket : null;
    if (!s) throw new Error('Socket non inizializzato');
    if (!s.connected) throw new Error('Disconnesso — ricarica la pagina');
    return `Connesso (${s.id ? s.id.slice(0,8) : '?'}...)`;
  }, tips, 'Ricarica la pagina per riconnetterti al server.');

  // 4. Camera
  await _diagCheck('camera', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
      throw new Error('API non supportata dal browser');
    const devs = await navigator.mediaDevices.enumerateDevices();
    const cams = devs.filter(d => d.kind === 'videoinput');
    if (!cams.length) throw new Error('Nessuna fotocamera trovata');
    return `${cams.length} fotocamera${cams.length > 1 ? 'e' : ''} trovata${cams.length > 1 ? 'e' : ''} ✓`;
  }, tips, 'Collega una webcam e concedi i permessi quando richiesto dal browser.');

  // 5. Microfono
  await _diagCheck('mic', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
      throw new Error('API non supportata dal browser');
    const devs = await navigator.mediaDevices.enumerateDevices();
    const mics = devs.filter(d => d.kind === 'audioinput');
    if (!mics.length) throw new Error('Nessun microfono trovato');
    return `${mics.length} microfono${mics.length > 1 ? 'i' : ''} trovato${mics.length > 1 ? 'i' : ''} ✓`;
  }, tips, 'Controlla che il microfono sia collegato e i permessi browser siano concessi.');

  // 6. WebRTC
  await _diagCheck('webrtc', async () => {
    if (!window.RTCPeerConnection) throw new Error('Non supportato da questo browser');
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.close();
    return 'Supportato ✓';
  }, tips, 'Aggiorna Chrome, Firefox o Safari per abilitare il video chat.');

  // 7. localStorage
  await _diagCheck('storage', async () => {
    try {
      localStorage.setItem('_diag_test', '1');
      localStorage.removeItem('_diag_test');
      return 'Funziona ✓';
    } catch {
      throw new Error('Bloccato — modalità privata?');
    }
  }, tips, 'Prova ad uscire dalla modalità in incognito per salvare le preferenze.');

  // 8. Notifiche
  await _diagCheck('notify', async () => {
    if (!('Notification' in window)) throw new Error('Non supportato dal browser');
    const perm = Notification.permission;
    if (perm === 'granted') return 'Abilitate ✓';
    if (perm === 'denied') { const e = new Error('Bloccate — modifica le impostazioni browser'); e._warn = true; throw e; }
    return 'Non ancora richieste';
  }, tips, 'Per le notifiche: Impostazioni browser → Notifiche → Permetti per kouverte.com');

  // Mostra suggerimenti
  if (tipsBox && tips.length) {
    tipsBox.className = 'diag-tips-box visible';
    tipsBox.innerHTML = `
      <div class="diag-tips-title">💡 Suggerimenti per risolvere</div>
      ${tips.map(t => `<div class="diag-tip">${t}</div>`).join('')}
    `;
  }
}

async function _diagCheck(id, fn, tipsArr, errorTip) {
  const item   = document.getElementById(`diag-${id}`);
  const status = document.getElementById(`diag-${id}-status`);
  const badge  = document.getElementById(`diag-${id}-badge`);
  if (!item) return;
  try {
    const result = await fn();
    item.className = 'diag-check-item ok';
    if (status) status.textContent = result;
    if (badge)  badge.textContent  = '✓';
  } catch (e) {
    const isWarn = e._warn === true;
    item.className = `diag-check-item ${isWarn ? 'warn' : 'error'}`;
    if (status) status.textContent = e.message;
    if (badge)  badge.textContent  = isWarn ? '⚠' : '✗';
    if (errorTip && tipsArr) tipsArr.push(errorTip);
  }
}
