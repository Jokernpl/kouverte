// ============================================================
// VO✕ · Voice Stories Platform (Versione JSON - Nessun modulo nativo)
// Node.js puro + Express + Socket.io
// Porta: 8082
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { checkBlockchainConfirmations } = require('./bitcoin-service');
const webpush = require('web-push');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 8082;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

// JWT Config — fail fast in produzione se non c'è secret
if (IS_PROD && !process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is required in production!');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'kouverte-vox-dev-secret-' + crypto.randomBytes(16).toString('hex');
const JWT_EXPIRES = '7d';

// Web Push / VAPID Config
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC  || 'BHfw5QpQadjL3KfUbjDUQVdkfWfDi_-zmcufuuRWvDoDJ6gahQ5a5b2aWrwa6QuhhaAyo-5BCHgnOlxT8cxl7nc';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'TquEMw0x3SDmqbSChx_BgZ0Jx1SwPcdNrFSoEQGKAGM';
webpush.setVapidDetails('mailto:info@kouverte.com', VAPID_PUBLIC, VAPID_PRIVATE);

// ============================================================
// STRIPE CONFIG
// Set env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// STRIPE_PUBLISHABLE_KEY usato lato client (vedi /api/stripe/config)
// ============================================================
const STRIPE_SECRET_KEY      = process.env.STRIPE_SECRET_KEY || null;
const STRIPE_WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET || null;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || null;
const stripe = STRIPE_SECRET_KEY ? Stripe(STRIPE_SECRET_KEY) : null;

// Pacchetti Stripe: coins (monete in-app) + abbonamenti premium
const STRIPE_PACKS = {
    coins_300:  { id: 'coins_300',  type: 'coins',   coins: 300,  eur: 299,   label: 'Starter',   desc: '300 monete', icon: '🪙' },
    coins_900:  { id: 'coins_900',  type: 'coins',   coins: 900,  eur: 699,   label: 'Popular',   desc: '900 monete + 10% bonus', icon: '💰', popular: true },
    coins_2500: { id: 'coins_2500', type: 'coins',   coins: 2500, eur: 1699,  label: 'Mega',      desc: '2500 monete + 25% bonus', icon: '💎' },
    premium_30: { id: 'premium_30', type: 'premium', days: 30,    eur: 199,   label: 'Premium 30gg', desc: 'Niente pubblicità + messaggi illimitati + badge ⭐', icon: '⭐' },
    premium_365:{ id: 'premium_365',type: 'premium', days: 365,   eur: 1499,  label: 'Premium Annuale',  desc: 'Un anno di Premium — risparmi', icon: '🌟' }
};

// Bitcoin Payment Config
const BITCOIN_ADDRESS = process.env.BITCOIN_ADDRESS || 'bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00';
const BTC_RATE = 0.00005; // 1 credito = 0.00005 BTC (1 BTC = 20,000 crediti)
const BITCOIN_MIN_CONFIRMATIONS = parseInt(process.env.BITCOIN_MIN_CONFIRMATIONS || '4');

// Il webhook Stripe richiede body RAW (non JSON parsato) per la verifica firma.
// Escludiamo quella route dal middleware json globale.
app.use((req, res, next) => {
    if (req.path === '/api/stripe/webhook') return next();
    express.json({ limit: '10mb' })(req, res, next);
});

// Trust proxy in production (per req.ip corretto dietro Render/ngrok)
app.set('trust proxy', 1);

// CORS più restrittivo in prod
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*'];

// Block accesso a file sensibili PRIMA di static (FIX critico: vox-data.json era esposto!)
const BLOCKED_PATHS = [
    '/vox-data.json', '/vox-data.bak.json', '/vox-data.json.tmp',
    '/.env', '/package.json', '/package-lock.json',
    '/node_modules', '/.git', '/simulation-users.js',
    '/vox-server.js', '/tg-bot.js', '/render.yaml',
    '/.claude', '/CONFIGURA_NGROK_E_AVVIA.ps1', '/AVVIA_LIVE_NGROK.bat',
    '/AVVIA_KOUVERTE_VOX.bat', '/AVVIA_TUNNEL_AUTOMATICO.bat'
];
app.use((req, res, next) => {
    const reqPath = req.path.toLowerCase();
    if (BLOCKED_PATHS.some(b => reqPath === b.toLowerCase() || reqPath.startsWith(b.toLowerCase() + '/'))) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});
// Uploads dir (audio + avatars on filesystem, NOT in JSON DB)
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const AUDIO_DIR   = path.join(UPLOADS_DIR, 'audio');
const AVATAR_DIR  = path.join(UPLOADS_DIR, 'avatars');
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(AVATAR_DIR, { recursive: true });

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '1d', fallthrough: true }));

// Version endpoint per verificare quale build e' in esecuzione
const BUILD_VERSION = 'webrtc-routing-v2-' + Date.now();
app.get('/_version', (req, res) => {
    res.json({ version: BUILD_VERSION, startedAt: new Date().toISOString() });
});


// Favicon: redirige /favicon.ico al nostro SVG (per crawler Google/Bing vecchi)
app.get('/favicon.ico', (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(__dirname, 'icon.svg'));
});

// Landing page esplicita alla root
app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── OG Preview dinamica per stanza ──────────────────────────────────────────
// Quando un bot social (WhatsApp, Telegram, Twitter) carica ?room=X,
// restituisce una mini-HTML con i meta tag corretti per quella stanza.
const ROOM_OG = {
    mondo:     { name:'Mondo',       emoji:'🌍', img:'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop', color:'#a78bfa' },
    italia:    { name:'Italia',      emoji:'🇮🇹', img:'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&h=630&fit=crop', color:'#10b981' },
    roma:      { name:'Roma',        emoji:'🏛️', img:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=630&fit=crop', color:'#f59e0b' },
    milano:    { name:'Milano',      emoji:'🏙️', img:'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=1200&h=630&fit=crop', color:'#60a5fa' },
    napoli:    { name:'Napoli',      emoji:'⚓', img:'https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop', color:'#06b6d4' },
    palermo:   { name:'Palermo',     emoji:'☀️', img:'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop', color:'#f97316' },
    sicilia:   { name:'Sicilia',     emoji:'🏝️', img:'https://images.unsplash.com/photo-1523365154888-8a758819b722?w=1200&h=630&fit=crop', color:'#eab308' },
    campania:  { name:'Campania',    emoji:'🌋', img:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&h=630&fit=crop', color:'#ef4444' },
    confessionale: { name:'Confessionale', emoji:'🕯️', img:'https://images.unsplash.com/photo-1490127252417-7c393f993ee4?w=1200&h=630&fit=crop', color:'#8b5cf6' },
    flirt:         { name:'Flirt 🔞',      emoji:'🌹', img:'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&h=630&fit=crop', color:'#ff2d6e' },
};

function isBot(ua) {
    return /bot|crawl|facebook|twitter|telegram|whatsapp|slack|linkedin|discord|preview|scraper/i.test(ua || '');
}

app.get('/app.html', (req, res, next) => {
    const roomId = req.query.room;
    const og = roomId && ROOM_OG[roomId];
    // Solo per bot sociali con una stanza valida
    if (!og || !isBot(req.headers['user-agent'])) return next();

    const title = `Chat ${og.name} Gratis — Kouverte`;
    const desc  = `Entra nella stanza ${og.name} su Kouverte. Chat anonima italiana 🇮🇹 — niente registrazione, gratis.`;
    const url   = `https://www.kouverte.com/app.html?room=${roomId}`;

    res.set('Cache-Control', 'public, max-age=300');
    res.send(`<!DOCTYPE html><html lang="it"><head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og.img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${og.img}">
<meta http-equiv="refresh" content="0;url=${url}">
<link rel="canonical" href="${url}">
</head><body><a href="${url}">${og.emoji} ${title}</a></body></html>`);
});

// ── Clean URL per pagine città ──────────────────────────────────────────────
const CITY_PAGES = ['napoli','roma','milano','palermo','sicilia','italia','torino','bologna','firenze','bari','genova','catania','verona','venezia'];
CITY_PAGES.forEach(city => {
    app.get(`/${city}`, (req, res) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(__dirname, `${city}.html`));
    });
});

// ── Profilo utente pubblico /u/:username ─────────────────────────────────────
app.get('/u/:username', (req, res) => {
    const username = req.params.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!username) return res.status(404).redirect('/');
    const user = DB.users ? DB.users.find(u => u.username === username) : null;
    if (!user) {
        res.set('Cache-Control', 'no-cache');
        return res.redirect('/');
    }
    const kv = user.kvData || {};
    const face = kv.face || '🎭';
    const msgCount = kv.msgCount || 0;
    const level = Math.max(1, Math.floor(1 + Math.log2(msgCount + 1) * 2.2));
    const displayName = kv.name || user.username;
    const bio = user.profile?.bio || '';
    const title = `${face} ${displayName} — Profilo Kouverte`;
    const desc = bio
        ? `${displayName}: "${bio.slice(0, 120)}" · Livello ${level} su Kouverte, la chat italiana anonima.`
        : `Conosci ${displayName} su Kouverte. Livello ${level}. Chat anonima italiana, gratis.`;
    // Per bot social: OG meta immediata
    if (isBot(req.headers['user-agent'] || '')) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.send(`<!DOCTYPE html><html lang="it"><head>
<meta charset="UTF-8"><title>${title}</title>
<meta name="description" content="${desc.replace(/"/g,'&quot;').replace(/</g,'&lt;')}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${title.replace(/"/g,'&quot;')}">
<meta property="og:description" content="${desc.replace(/"/g,'&quot;').replace(/</g,'&lt;')}">
<meta property="og:url" content="https://www.kouverte.com/u/${username}">
<meta property="og:image" content="https://www.kouverte.com/og-image.png">
<meta name="twitter:card" content="summary">
<meta http-equiv="refresh" content="0;url=/u/${username}">
</head><body><p>${face} ${displayName} — <a href="/app.html">Chatta su Kouverte</a></p></body></html>`);
    }
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'profile-public.html'));
});

// NO-CACHE per HTML/JS/CSS principali: gli update arrivano subito al refresh
app.use((req, res, next) => {
    const p = req.path;
    if (p === '/app.html' || p === '/' || p === '/index.html' || p === '/sw.js' || p === '/manifest.json') {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});
// Cache asset statici — no-cache per JS/CSS (si aggiornano spesso), lunga per immagini/font
app.use((req, res, next) => {
    const url = req.url.split('?')[0];
    if (/\.(css|js)$/.test(url) && !url.includes('socket.io')) {
        // Sempre fresco: browser richiede il file ad ogni caricamento,
        // ma può usare il cached se ETag/Last-Modified coincidono (304)
        res.set('Cache-Control', 'no-cache');
    } else if (/\.(png|jpg|jpeg|webp|svg|ico|woff2|mp4)$/.test(url)) {
        res.set('Cache-Control', 'public, max-age=2592000'); // 30 giorni (immagini non cambiano)
    }
    next();
});
app.use(express.static(__dirname, {
    dotfiles: 'deny',
    index: ['index.html'],
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (['.html', '.js', '.css'].includes(ext)) {
            // Mai cache su HTML/JS/CSS — browser verifica sempre col server (ETag)
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
        } else if (['.png','.jpg','.jpeg','.webp','.svg','.ico','.gif','.woff','.woff2','.ttf','.otf','.eot'].includes(ext)) {
            // Static media/font: cache 1 anno (file con hash o updated via deploy)
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// ── Live Reload SSE (solo in dev) ─────────────────────────────────────────────
// Quando nodemon riavvia il server, la connessione SSE cade e il browser
// ricarica automaticamente la pagina.
if (!IS_PROD) {
    app.get('/live-reload', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.write('data: connected\n\n');
        // Keep-alive ping ogni 25s per evitare timeout
        const ping = setInterval(() => res.write(': ping\n\n'), 25000);
        req.on('close', () => clearInterval(ping));
    });
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ALLOWED_ORIGINS[0] === '*' ? '*' : ALLOWED_ORIGINS, methods: ['GET', 'POST'] }
});

// Database JSON (file invece di SQLite)
const DB_FILE = path.join(__dirname, 'vox-data.json');
const DB_BACKUP = path.join(__dirname, 'vox-data.bak.json');

function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        return {
            users: [],
            stories: [],
            reactions: [],
            messages: [],
            battles: [],
            user_balance: {},
            voice_rooms: [],
            shop_products: [
                // ===== COSMETICS (5) =====
                { id: 'item_frame_neon', name: 'Neon Blue Frame', desc: 'Avatar frame luminescente blu', price_credits: 150, category: 'cosmetic', item_type: 'avatar_frame', icon: '⭐', item_data: '{"color":"#00ffff","glow":8}', active: true },
                { id: 'item_theme_aurora', name: 'Aurora Theme', desc: 'Tema scuro con aurora boreale', price_credits: 199, category: 'cosmetic', item_type: 'theme', icon: '🌌', item_data: '{"theme":"aurora","animated":true}', active: true },
                { id: 'item_effect_echo', name: 'Echo Reverb Effect', desc: 'Effetto vocale riverbero spaziale', price_credits: 99, category: 'cosmetic', item_type: 'voice_effect', icon: '🎧', item_data: '{"effect":"echo","strength":75}', active: true },
                { id: 'item_particles_stardust', name: 'Stardust Particle Trail', desc: 'Particelle luminose intorno al nome', price_credits: 249, category: 'cosmetic', item_type: 'particles', icon: '💫', item_data: '{"type":"stardust","color":"#ffcc00"}', active: true },
                { id: 'item_effect_glitch', name: 'Glitch Animation', desc: 'Effetto glitch su testo profilo', price_credits: 129, category: 'cosmetic', item_type: 'animation', icon: '⚡', item_data: '{"animation":"glitch_v1"}', active: true },

                // ===== RARITY COLLECTIBLES (6) =====
                { id: 'item_rarity_sword', name: '⚔️ Spada Leggendaria', desc: 'Arma mitica della leggenda', price_credits: 2500, category: 'rarity', item_type: 'collectible', icon: '⚔️', item_data: '{"rarity":"legendary","rarity_score":9500,"power":95,"unique":true}', active: true },
                { id: 'item_rarity_medal', name: '🏆 Medaglia d\'Oro', desc: 'Trofeo per i grandi della voce', price_credits: 1500, category: 'rarity', item_type: 'collectible', icon: '🏆', item_data: '{"rarity":"epic","rarity_score":7500,"power":70}', active: true },
                { id: 'item_rarity_crystal', name: '💎 Cristallo Cosmico', desc: 'Cristallo puro dall\'universo infinito', price_credits: 3500, category: 'rarity', item_type: 'collectible', icon: '💎', item_data: '{"rarity":"legendary","rarity_score":9800,"power":98,"animated":true}', active: true },
                { id: 'item_rarity_crown', name: '👑 Corona Regale', desc: 'Corona dei veri re della voce', price_credits: 2000, category: 'rarity', item_type: 'collectible', icon: '👑', item_data: '{"rarity":"epic","rarity_score":7800,"power":75}', active: true },
                { id: 'item_rarity_scroll', name: '📜 Pergamena Antica', desc: 'Testo mistico di saggezza vocale', price_credits: 1200, category: 'rarity', item_type: 'collectible', icon: '📜', item_data: '{"rarity":"rare","rarity_score":5500,"power":55}', active: true },
                { id: 'item_rarity_star', name: '🌟 Stella d\'Argento', desc: 'Stella brillante del firmamento', price_credits: 899, category: 'rarity', item_type: 'collectible', icon: '🌟', item_data: '{"rarity":"rare","rarity_score":5000,"power":50}', active: true },

                // ===== SEASONAL LIMITED (4) =====
                { id: 'item_season_spring', name: '🌸 Spring Flower Crown', desc: 'Corona fiorita della primavera 2025', price_credits: 299, category: 'seasonal', item_type: 'seasonal_cosmetic', icon: '🌸', item_data: '{"season":"spring_2025","expires_at":"2025-06-21T23:59:59Z"}', active: true },
                { id: 'item_season_summer', name: '☀️ Summer Sun Badge', desc: 'Badge dorato dell\'estate 2025', price_credits: 199, category: 'seasonal', item_type: 'seasonal_cosmetic', icon: '☀️', item_data: '{"season":"summer_2025","expires_at":"2025-09-21T23:59:59Z"}', active: true },
                { id: 'item_season_autumn', name: '🍂 Autumn Leaf Aura', desc: 'Aura dorata dell\'autunno 2025', price_credits: 249, category: 'seasonal', item_type: 'seasonal_cosmetic', icon: '🍂', item_data: '{"season":"autumn_2025","expires_at":"2025-12-21T23:59:59Z"}', active: true },
                { id: 'item_season_winter', name: '❄️ Winter Snowflake Effect', desc: 'Effetto fiocco di neve 2025-26', price_credits: 199, category: 'seasonal', item_type: 'seasonal_cosmetic', icon: '❄️', item_data: '{"season":"winter_2025","expires_at":"2026-03-21T23:59:59Z"}', active: true },

                // ===== ACHIEVEMENTS (3 - unlock da milestone, non comprare) =====
                { id: 'item_achieve_voice', name: '🎤 Voice Master Badge', desc: 'Sblocca con 50 storie pubblicate', price_credits: 0, category: 'achievement', item_type: 'achievement_badge', icon: '🎤', item_data: '{"unlock_condition":"stories>=50"}', active: true },
                { id: 'item_achieve_charmer', name: '💗 Charmer Badge', desc: 'Sblocca con 1000 reazioni ricevute', price_credits: 0, category: 'achievement', item_type: 'achievement_badge', icon: '💗', item_data: '{"unlock_condition":"reactions>=1000"}', active: true },
                { id: 'item_achieve_streak', name: '🔥 Streak Master Badge', desc: 'Sblocca con 7 giorni consecutivi', price_credits: 0, category: 'achievement', item_type: 'achievement_badge', icon: '🔥', item_data: '{"unlock_condition":"streak>=7"}', active: true },

                // ===== SUBSCRIPTIONS (2) =====
                { id: 'item_vip_pro', name: '👑 VIP PRO · 1 mese', desc: 'Storie durano 14 giorni, +20% XP gain', price_credits: 599, category: 'subscription', item_type: 'vip_pro', icon: '👑', item_data: '{"duration_days":30,"perks":["stories_14d","xp_bonus_20"]}', active: true },
                { id: 'item_vip_elite', name: '💎 VIP ELITE · 1 mese', desc: 'Storie 30 giorni, +50% XP, Boost illimitato', price_credits: 1299, category: 'subscription', item_type: 'vip_elite', icon: '💎', item_data: '{"duration_days":30,"perks":["stories_30d","xp_bonus_50","unlimited_boost"]}', active: true },

                // ===== POWER-UPS (2 - temporary, 24h) =====
                { id: 'item_powerup_xp2x', name: '⚡ 2x XP Potion', desc: 'Raddoppia XP per 24 ore', price_credits: 299, category: 'powerup', item_type: 'potion', icon: '⚡', item_data: '{"effect":"xp_multiplier","multiplier":2,"duration_hours":24}', active: true },
                { id: 'item_powerup_duration', name: '📈 Story Longevity Boost', desc: 'Prossima storia dura 14 giorni', price_credits: 249, category: 'powerup', item_type: 'boost', icon: '📈', item_data: '{"effect":"story_duration","days":14}', active: true },

                // Legacy items (keep for compatibility)
                { id: 'vox_vip', name: 'Kouverte Vox VIP · 1 mese', desc: 'Storie che durano 7 giorni, badge esclusivo', price_credits: 999, category: 'subscription', item_type: 'vip_month', icon: '👑', item_data: '{"duration_days":30}' },
                { id: 'vox_boost', name: 'Boost · 2 ore', desc: 'La tua storia in cima al feed', price_credits: 199, category: 'boost', item_type: 'boost_2h', icon: '🚀', item_data: '{"duration_minutes":120}' },
                { id: 'vox_theme', name: 'Tema Dark Neon', desc: 'Profilo con bordi neon', price_credits: 499, category: 'cosmetic', item_type: 'theme', icon: '💜', item_data: '{"theme":"neon"}' }
            ],
            user_inventory: [],
            transactions: [],
            user_credits: [],
            bitcoin_payments: [],
            scopa_stats: {}
        };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// ============================================================
// PERSISTENZA: file LOCALE + backup REDIS (Upstash) + GitHub Gist
// Risolve il problema di Render filesystem ephemeral
// ============================================================
const REDIS_DB_KEY = 'kouverte:vox:db';
let _serverRedis = null;
let lastRedisSave = 0;
let lastGistSave = 0;

function getServerRedis() {
    if (_serverRedis !== null) return _serverRedis;
    // TRIM env vars per rimuovere whitespace/newline aggiunti accidentalmente
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/^["']|["']$/g, '');
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim().replace(/^["']|["']$/g, '');
    if (!url || !token) {
        _serverRedis = false;
        console.log('[DB] Redis non configurato - URL/Token vuoti dopo trim');
        return null;
    }
    try {
        const { Redis } = require('@upstash/redis');
        _serverRedis = new Redis({ url, token });
        console.log('[DB] ✅ Redis Upstash connesso (url:', url.substring(0,30), ', token len:', token.length, ')');
        return _serverRedis;
    } catch(e) {
        console.error('[DB] Redis init error:', e.message);
        _serverRedis = false;
        return null;
    }
}

// Backup su GitHub Gist (alternativa free se no Redis)
async function backupToGist(db) {
    const ghToken = process.env.GITHUB_GIST_TOKEN;
    const gistId = process.env.GITHUB_GIST_ID;
    if (!ghToken || !gistId) return false;
    try {
        const body = JSON.stringify({
            files: {
                'kouverte-data.json': {
                    content: JSON.stringify({
                        savedAt: Date.now(),
                        db: db
                    })
                }
            }
        });
        const res = await fetch('https://api.github.com/gists/' + gistId, {
            method: 'PATCH',
            headers: {
                'Authorization': 'token ' + ghToken,
                'Content-Type': 'application/json',
                'User-Agent': 'kouverte-server'
            },
            body
        });
        return res.ok;
    } catch(e) {
        console.error('[DB] Gist backup error:', e.message);
        return false;
    }
}

async function restoreFromGist() {
    const ghToken = process.env.GITHUB_GIST_TOKEN;
    const gistId = process.env.GITHUB_GIST_ID;
    if (!ghToken || !gistId) return null;
    try {
        const res = await fetch('https://api.github.com/gists/' + gistId, {
            headers: {
                'Authorization': 'token ' + ghToken,
                'User-Agent': 'kouverte-server'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        const content = data.files?.['kouverte-data.json']?.content;
        if (!content) return null;
        return JSON.parse(content);
    } catch(e) {
        console.error('[DB] Gist restore error:', e.message);
        return null;
    }
}

// Atomic write per evitare corruzione DB su kill
let dbDirty = false;
function saveDB(db) {
    const tmp = DB_FILE + '.tmp';
    const data = JSON.stringify(db, null, 2);
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, DB_FILE);
    dbDirty = false;

    // Backup su Redis (async, non blocca, max ogni 5 secondi)
    const now_ms = Date.now();
    if (now_ms - lastRedisSave > 5000) {
        lastRedisSave = now_ms;
        const r = getServerRedis();
        if (r) {
            const backup = { db, savedAt: now_ms, source: 'vox-server' };
            console.log('[DB] Backup Redis in corso... users:', (db.users || []).length);
            r.set(REDIS_DB_KEY, JSON.stringify(backup))
              .then(() => console.log('[DB] ✅ Backup Redis OK'))
              .catch(e => console.error('[DB] ❌ Redis save error:', e.message));
        } else {
            console.warn('[DB] Skip Redis backup - non disponibile');
        }
    }

    // Backup su GitHub Gist (max ogni 30 secondi, evita rate limit)
    if (now_ms - lastGistSave > 30000) {
        lastGistSave = now_ms;
        backupToGist(db).catch(()=>{});
    }
}
function markDirty() { dbDirty = true; }

// ════════════════════════════════════════════════════════════════
// DEVICE BINDING — crediti gratis legati al DISPOSITIVO (anti-reset)
// Conta i messaggi gratis per dispositivo: cambiando nome / "nuovo
// account" / svuotando lo storage il conteggio NON si azzera.
// Identità: (1) token persistente del client `kv4_device`  (2) hash di IP+UA.
// L'IP è salvato SOLO hashato (mai in chiaro) → privacy/GDPR.
// L'IP è applicato in modo conservativo (solo a device nuovo, con decadenza)
// per limitare i falsi positivi da NAT (più persone dietro lo stesso IP).
// ════════════════════════════════════════════════════════════════
const _crypto = require('crypto');
const FREE_LIMIT_SRV   = 100;                  // deve combaciare col client FREE_LIMIT
const DEVICE_SALT      = process.env.DEVICE_SALT || 'kv-dev-salt-v1';
const IP_BIND_ENABLED  = process.env.IP_BIND_DISABLED ? false : true;
const IP_DECAY_MS      = 48 * 3600 * 1000;     // l'IP "scade" dopo 48h di inattività (limita NAT)
const DEVICE_MAX       = 50000;                // tetto voci salvate (prune delle più vecchie)
const socketDevice     = {};                   // socket.id -> { tok, ipua }
function _devHash(s){ return _crypto.createHash('sha256').update(DEVICE_SALT + '|' + s).digest('hex').slice(0, 24); }
function _devClientIp(socket){
  const h = (socket && socket.handshake && socket.handshake.headers) || {};
  const xff = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return String(h['cf-connecting-ip'] || xff || (socket && socket.handshake && socket.handshake.address) || '').replace(/^::ffff:/, '');
}
function _devGet(key){ return (key && DB.devices && DB.devices[key]) ? DB.devices[key] : null; }
function _devSet(key, used){
  if(!key) return null;
  DB.devices = DB.devices || {};
  const now = Date.now();
  const d = DB.devices[key] || { u:0, f:now, l:now };
  d.u = Math.max(d.u || 0, used || 0);
  d.l = now;
  DB.devices[key] = d; markDirty();
  return d;
}
function _devPrune(){
  const m = DB.devices; if(!m) return;
  const keys = Object.keys(m);
  if(keys.length <= DEVICE_MAX) return;
  keys.map(k => [k, m[k].l || 0]).sort((a,b) => a[1]-b[1])
      .slice(0, keys.length - DEVICE_MAX).forEach(([k]) => { delete m[k]; });
}
// Riconcilia i crediti gratis di un client col suo dispositivo.
// Ritorna il numero di messaggi gratis "usati" autorevole per quel device.
function reconcileDevice(socket, deviceToken, clientFreeUsed){
  const tok  = (typeof deviceToken === 'string' && deviceToken) ? ('tok:' + deviceToken.slice(0, 48)) : null;
  const ua   = String(((socket.handshake && socket.handshake.headers) || {})['user-agent'] || '').slice(0, 160);
  const ipua = 'ipua:' + _devHash(_devClientIp(socket) + '|' + ua);
  const cUsed = Math.max(0, Math.min(FREE_LIMIT_SRV, parseInt(clientFreeUsed) || 0));

  const tokDev = tok ? _devGet(tok) : null;
  const ipDev  = _devGet(ipua);

  let eff = cUsed;
  if (tokDev) eff = Math.max(eff, tokDev.u || 0);              // il token è la fonte primaria
  const fresh  = !tokDev || (tokDev.u || 0) === 0;             // device nuovo o mai usato
  const recent = ipDev && (Date.now() - (ipDev.l || 0) < IP_DECAY_MS);
  if (IP_BIND_ENABLED && fresh && recent) eff = Math.max(eff, ipDev.u || 0); // IP solo come rete di sicurezza

  if (tok) _devSet(tok, eff);
  _devSet(ipua, eff);
  _devPrune();
  socketDevice[socket.id] = { tok, ipua };
  return eff;
}

// Restore da Redis o Gist allo startup (il piu recente vince)
async function tryRestoreFromRedis() {
    let bestBackup = null;
    let bestSource = '';

    // 1. Prova Redis
    const r = getServerRedis();
    if (r) {
        try {
            const data = await r.get(REDIS_DB_KEY);
            if (data) {
                const backup = typeof data === 'string' ? JSON.parse(data) : data;
                if (backup.db && backup.savedAt) {
                    bestBackup = backup;
                    bestSource = 'Redis';
                    console.log('[DB] Redis backup trovato:', new Date(backup.savedAt).toISOString());
                }
            }
        } catch(e) {
            console.error('[DB] Redis read error:', e.message);
        }
    }

    // 2. Prova GitHub Gist (se piu recente di Redis)
    try {
        const gistBackup = await restoreFromGist();
        if (gistBackup && gistBackup.savedAt && gistBackup.db) {
            console.log('[DB] Gist backup trovato:', new Date(gistBackup.savedAt).toISOString());
            if (!bestBackup || gistBackup.savedAt > bestBackup.savedAt) {
                bestBackup = gistBackup;
                bestSource = 'Gist';
            }
        }
    } catch(e) {}

    if (!bestBackup) {
        console.log('[DB] Nessun backup remoto trovato');
        return false;
    }

    // Check timestamp file
    let fileTime = 0;
    try {
        if (fs.existsSync(DB_FILE)) {
            fileTime = fs.statSync(DB_FILE).mtimeMs;
        }
    } catch(e) {}

    if (bestBackup.savedAt > fileTime) {
        console.log('[DB] ✅ Ripristinato da', bestSource, 'backup');
        console.log('[DB] Utenti ripristinati:', (bestBackup.db.users || []).length);
        fs.writeFileSync(DB_FILE, JSON.stringify(bestBackup.db, null, 2));
        return true;
    }
    console.log('[DB] File locale piu recente di backup remoto');
    return false;
}

let DB = loadDB();

// All'avvio, se file locale è vuoto/nuovo, prova restore da Redis
(async () => {
    if (!DB.users || DB.users.length === 0 || (DB.users.length === 1 && DB.users[0].email === 'test1@kouverte.local')) {
        const restored = await tryRestoreFromRedis();
        if (restored) {
            DB = loadDB();
            console.log('[DB] Database ricaricato da backup Redis');
        }
    }
})();

// Initialize test user password hash on startup
(async () => {
    const testUser = DB.users.find(u => u.email === 'test1@kouverte.local');
    if (testUser && !testUser.password_hash) {
        try {
            testUser.password_hash = await bcrypt.hash('Test123456', 10);
            markDirty();
        } catch(e) { console.error('Failed to hash test password:', e); }
    }

    // CLEANUP: rimuovi tutti gli utenti seed (fake) e i loro dati associati
    // Solo utenti reali da qui in poi.
    try {
        const seedIds = (DB.users || []).filter(u => u.seed).map(u => u.id);
        if (seedIds.length > 0) {
            const seedIdSet = new Set(seedIds);
            DB.users = (DB.users || []).filter(u => !u.seed);
            // Cleanup dati associati ai seed users
            DB.likes = (DB.likes || []).filter(l => !seedIdSet.has(l.from) && !seedIdSet.has(l.to));
            DB.matches = (DB.matches || []).filter(m => !seedIdSet.has(m.u1) && !seedIdSet.has(m.u2));
            DB.stories = (DB.stories || []).filter(s => !seedIdSet.has(s.user_id));
            DB.reactions = (DB.reactions || []).filter(r => !seedIdSet.has(r.user_id));
            DB.messages = (DB.messages || []).filter(m => !seedIdSet.has(m.from) && !seedIdSet.has(m.to));
            DB.user_credits = (DB.user_credits || []).filter(c => !seedIdSet.has(c.user_id));
            DB.user_inventory = (DB.user_inventory || []).filter(i => !seedIdSet.has(i.user_id));
            DB.battles = (DB.battles || []).filter(b => !seedIdSet.has(b.userA) && !seedIdSet.has(b.userB));
            DB.referrals = (DB.referrals || []).filter(r => !seedIdSet.has(r.from) && !seedIdSet.has(r.to));
            seedIds.forEach(id => { if (DB.user_balance) delete DB.user_balance[id]; });
            saveDB(DB);
            console.log(`[CLEANUP] Rimossi ${seedIds.length} utenti seed (fake) e dati associati`);
        }
    } catch(e) { console.error('Seed cleanup failed:', e.message); }
})();

// Crea/aggiorna account bob2015 (admin con accesso illimitato)
const ALL_FRAMES = ['none','silver','purple','emerald','ruby','gold','flame','diamond','neon','galaxy','rainbow','royal','skull','ivory'];
const BOB_EMAIL    = 'bob2015.gc@gmail.com';
const BOB_USERNAME = 'bob2015';
const BOB_PASSWORD = 'Nirone90';
(async () => {
    // Cerca per username O per vecchia email locale
    let bob = DB.users.find(u => u.username === BOB_USERNAME)
           || DB.users.find(u => u.email === 'bob2015@kouverte.local');

    const ph = await bcrypt.hash(BOB_PASSWORD, 10);

    DB.user_frames   = DB.user_frames   || {};
    DB.user_premium  = DB.user_premium  || {};
    DB.user_credits  = DB.user_credits  || [];

    if (!bob) {
        const uid = genId('u');
        bob = {
            id: uid,
            email: BOB_EMAIL,
            username: BOB_USERNAME,
            password_hash: ph,
            is_admin: true,
            is_moderator: true,
            profile: { avatar_letter: 'B', bio: '', clips: [
                { slot:0, title:'Chi sono', audio_id:null, duration:0 },
                { slot:1, title:'Mi piace', audio_id:null, duration:0 },
                { slot:2, title:'Cerco',    audio_id:null, duration:0 }
            ]},
            stats: { stories_count:0, matches_count:0, likes_received:0, duels_participated:0 },
            created_at: now(), updated_at: now()
        };
        DB.users.push(bob);
        console.log('[ADMIN] Account bob2015 creato');
    } else {
        // Aggiorna sempre tutti i campi critici
        bob.email         = BOB_EMAIL;
        bob.username      = BOB_USERNAME;
        bob.password_hash = ph;
        bob.is_admin      = true;
        bob.is_moderator  = true;
        bob.updated_at    = now();
        console.log('[ADMIN] Account bob2015 aggiornato');
    }

    const uid = bob.id;

    // Tutte le cornici
    DB.user_frames[uid] = [...ALL_FRAMES];

    // Premium 100 anni
    DB.user_premium[uid] = { expires_at: Date.now() + 100*365*24*60*60*1000, activatedAt: Date.now() };

    // Credits: rimuovi vecchi e metti 999999
    DB.user_credits = DB.user_credits.filter(c => c.user_id !== uid);
    DB.user_credits.push({ user_id: uid, credits: 999999, updated_at: now() });

    saveDB(DB);
    console.log(`[ADMIN] bob2015 → email:${BOB_EMAIL} frames:${ALL_FRAMES.length} credits:999999 premium:100y`);
})();

// Salva periodicamente solo se dirty
setInterval(() => { if (dbDirty) saveDB(DB); }, 10000);
// Backup ogni 5 minuti
setInterval(() => {
    try { if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, DB_BACKUP); } catch(e) {}
}, 5 * 60 * 1000);

// Graceful shutdown: salva su Ctrl+C
process.on('SIGINT', () => { try { saveDB(DB); } catch(e) {} process.exit(0); });
process.on('SIGTERM', () => { try { saveDB(DB); } catch(e) {} process.exit(0); });

// ============ JWT MIDDLEWARE ============
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token richiesto' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch(e) {
        res.status(401).json({ error: 'Token non valido' });
    }
}

// Admin middleware
function verifyAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token richiesto' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = DB.users.find(u => u.id === decoded.userId);
        if (!user || !user.is_admin) return res.status(403).json({ error: 'Forbidden: admin only' });
        req.user = decoded;
        next();
    } catch(e) {
        res.status(401).json({ error: 'Token non valido' });
    }
}

function generateToken(userId, rememberMe) {
    // Se rememberMe = true → token dura 30 giorni invece di 7
    const expiresIn = rememberMe ? '30d' : JWT_EXPIRES;
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

function genId(prefix) {
    return prefix + '_' + crypto.randomBytes(6).toString('hex');
}

function now() {
    return Date.now();
}

// ============ INPUT VALIDATION ============
const USERNAME_RE = /^[a-z0-9_]{3,20}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUsername(u) {
    if (typeof u !== 'string') return null;
    const clean = u.trim().toLowerCase();
    return USERNAME_RE.test(clean) ? clean : null;
}
function sanitizeEmail(e) {
    if (typeof e !== 'string') return null;
    const clean = e.trim().toLowerCase();
    return EMAIL_RE.test(clean) && clean.length <= 100 ? clean : null;
}
function sanitizeBio(b) {
    if (typeof b !== 'string') return '';
    return b.replace(/[<>]/g, '').slice(0, 500);
}
function publicUser(u) {
    if (!u) return null;
    return {
        id: u.id, email: u.email, username: u.username,
        profile: u.profile, stats: u.stats,
        created_at: u.created_at,
        battle_wins: u.battle_wins || 0,
        battle_losses: u.battle_losses || 0,
        is_champion: !!(u.champion_until && u.champion_until > now()),
        kvData: u.kvData || null  // Include game data (coins, XP, level, badges, etc.)
    };
}

// ============ RATE LIMITING (in-memory) ============
const rateLimitStore = new Map();
function rateLimit(key, maxRequests, windowMs) {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
        const k = key + ':' + ip;
        const nowMs = Date.now();
        const entry = rateLimitStore.get(k) || { count: 0, resetAt: nowMs + windowMs };
        if (nowMs > entry.resetAt) { entry.count = 0; entry.resetAt = nowMs + windowMs; }
        entry.count++;
        rateLimitStore.set(k, entry);
        if (entry.count > maxRequests) {
            return res.status(429).json({ error: 'Troppe richieste, riprova tra qualche minuto' });
        }
        next();
    };
}
// Cleanup map ogni 10 min
setInterval(() => {
    const t = Date.now();
    for (const [k, v] of rateLimitStore.entries()) {
        if (t > v.resetAt) rateLimitStore.delete(k);
    }
}, 10 * 60 * 1000);

// ============ PER-USER MUTEX (per prevenire double-spend shop) ============
const userLocks = new Map();
async function withUserLock(userId, fn) {
    while (userLocks.get(userId)) {
        await new Promise(r => setTimeout(r, 5));
    }
    userLocks.set(userId, true);
    try { return await fn(); }
    finally { userLocks.delete(userId); }
}

// ============ API PUBBLICHE ============

// Health
app.get('/api/health', (req, res) => {
    // Stato persistenza (per diagnostica — nessuna credenziale esposta)
    const hasRedisEnv = !!((process.env.UPSTASH_REDIS_REST_URL||'').trim() && (process.env.UPSTASH_REDIS_REST_TOKEN||'').trim());
    const hasGistEnv = !!(process.env.GITHUB_GIST_TOKEN && process.env.GITHUB_GIST_ID);
    res.json({
        ok: true,
        service: 'Kouverte',
        version: '1.0',
        persistence: {
            redis: hasRedisEnv,
            gist: hasGistEnv,
            // true = i dati sopravvivono ai riavvii; false = DB si perde ad ogni deploy
            safe: hasRedisEnv || hasGistEnv
        },
        users: (DB.users || []).length
    });
});

// Register — rate limited 3/15min per IP
// ============ LEADERBOARD SETTIMANALE ============
app.get('/api/leaderboard/weekly', (req, res) => {
    const nowMs = now();
    const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
    DB.battles = DB.battles || [];

    // Top Champions: utenti con più vittorie negli ultimi 7gg
    const winsByUser = {};
    const sumScoreByUser = {};
    DB.battles.filter(b => b.status === 'ended' && b.endedAt >= weekAgo).forEach(b => {
        if (b.winnerId) winsByUser[b.winnerId] = (winsByUser[b.winnerId] || 0) + 1;
        sumScoreByUser[b.userA] = (sumScoreByUser[b.userA] || 0) + (b.scoreA || 0);
        sumScoreByUser[b.userB] = (sumScoreByUser[b.userB] || 0) + (b.scoreB || 0);
    });

    // Top Boosters: utenti che hanno boostato più sats negli ultimi 7gg
    const boostsByUser = {};
    DB.battles.filter(b => (b.boosts || []).length).forEach(b => {
        (b.boosts || []).filter(x => x.at >= weekAgo).forEach(x => {
            boostsByUser[x.userId] = (boostsByUser[x.userId] || 0) + (x.amount || 0);
        });
    });

    const mapUser = (id) => {
        const u = DB.users.find(x => x.id === id);
        if (!u) return null;
        return {
            id: u.id,
            firstName: u.firstName || u.username,
            username: u.username,
            avatar: (u.firstName || u.username || '?').charAt(0).toUpperCase(),
            is_champion: !!(u.champion_until && u.champion_until > nowMs)
        };
    };

    const topChampions = Object.entries(winsByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, wins]) => ({ user: mapUser(id), wins, sats_earned: sumScoreByUser[id] || 0 }))
        .filter(x => x.user);

    const topBoosters = Object.entries(boostsByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, sats]) => ({ user: mapUser(id), sats_boosted: sats }))
        .filter(x => x.user);

    res.json({ ok: true, period: 'week', topChampions, topBoosters });
});

// ============ LEADERBOARD CHAT (messaggi settimanali) ============

// Calcola timestamp del lunedì corrente alle 00:00 UTC
function currentWeekStart() {
    const d = new Date();
    const day = d.getUTCDay(); // 0=dom, 1=lun, ...
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(d);
    mon.setUTCDate(d.getUTCDate() + diffToMon);
    mon.setUTCHours(0, 0, 0, 0);
    return mon.getTime();
}

function getWeeklyStats() {
    const weekStart = currentWeekStart();
    DB.weekly_chat = DB.weekly_chat || { weekStart: 0, users: {} };
    // Nuovo lunedì → azzera classifica
    if (DB.weekly_chat.weekStart < weekStart) {
        DB.weekly_chat = { weekStart, users: {} };
        markDirty();
    }
    return DB.weekly_chat;
}

// Incrementa contatore messaggi settimanali per un utente
function trackWeeklyMsg(userId, name, face, color) {
    if (!userId) return;
    const stats = getWeeklyStats();
    if (!stats.users[userId]) {
        stats.users[userId] = { name: name || 'Anonimo', face: face || '🎭', color: color || '#00d4ff', msgs: 0, updatedAt: Date.now() };
    }
    const u = stats.users[userId];
    u.msgs++;
    u.name = name || u.name;          // aggiorna nome se cambiato
    u.face = face || u.face;
    u.color = color || u.color;
    u.updatedAt = Date.now();
    markDirty();
}

// ============================================================
// 🏆 CLASSIFICA CITTÀ LIVE — messaggi per stanza al giorno
// ============================================================
function getItalianDateStr() {
    // UTC+2 in estate (CEST), UTC+1 in inverno (CET) — approssimazione UTC+1
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
}

function trackDailyCity(roomId) {
    const today = getItalianDateStr();
    DB.daily_city = DB.daily_city || {};
    if (!DB.daily_city[today]) DB.daily_city[today] = {};
    DB.daily_city[today][roomId] = (DB.daily_city[today][roomId] || 0) + 1;
    // Pulizia: max 7 giorni
    const days = Object.keys(DB.daily_city).sort();
    while (days.length > 7) delete DB.daily_city[days.shift()];
    markDirty();
    // Broadcast classifica aggiornata a tutti i connessi
    const today2 = DB.daily_city[getItalianDateStr()] || {};
    const ranked = Object.entries(today2).map(([id, n]) => ({ id, msgs: n })).sort((a, b) => b.msgs - a.msgs);
    io.emit('city-stats-update', { cities: ranked });
}

app.get('/api/leaderboard/cities', (req, res) => {
    const today = getItalianDateStr();
    DB.daily_city = DB.daily_city || {};
    const stats = DB.daily_city[today] || {};
    const ranked = Object.entries(stats).map(([id, msgs]) => ({ id, msgs })).sort((a, b) => b.msgs - a.msgs);
    res.json({ today, cities: ranked });
});

// ============================================================
// 🌙 KOUVERTE NOTTE — evento serale quotidiano alle 23:00
// ============================================================
const NOTTE_THEMES = [
    "Qual è la cosa più imbarazzante che ti è successa?",
    "Cosa non hai mai detto a nessuno?",
    "Il tuo segreto più piccolo?",
    "Cosa cambieresti della tua vita adesso?",
    "La cosa più coraggiosa che hai fatto?",
    "Di cosa ti vergogni di più?",
    "Cosa ti manca di più in questo momento?",
    "Qual è il tuo sogno nel cassetto?",
    "La cosa più stupida che hai fatto per amore?",
    "Cosa ti tiene sveglio la notte?",
    "Un consiglio a te stesso di 10 anni fa?",
    "Il momento in cui ti sei sentito più solo?",
    "La persona che vorresti risentire?",
    "Cosa non riesci a perdonarti?",
    "Il tuo desiderio più assurdo?"
];
const NOTTE_DURATION_MS = 15 * 60 * 1000; // 15 minuti
let notteActive = false;

function getTodayNotteTheme() {
    const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return NOTTE_THEMES[day % NOTTE_THEMES.length];
}

function startKouverteNotte() {
    if (notteActive) return;
    notteActive = true;
    const theme = getTodayNotteTheme();
    const endsAt = Date.now() + NOTTE_DURATION_MS;
    const sessionId = 'notte_' + Date.now();
    DB.current_notte = { id: sessionId, theme, startedAt: Date.now(), endsAt, votes: {}, messages: [] };
    DB.notte_sessions = DB.notte_sessions || [];
    DB.notte_sessions = DB.notte_sessions.slice(-30); // max 30 sessioni
    DB.notte_sessions.push(DB.current_notte);
    markDirty();

    io.emit('notte-start', { sessionId, theme, endsAt });
    console.log(`[🌙 NOTTE] Iniziata! Tema: ${theme}`);

    // Push a tutti i subscriber
    const payload = JSON.stringify({
        title: '🌙 Kouverte Notte è iniziata!',
        body: theme,
        icon: '/icon-192.png',
        url: '/app.html?notte=1',
        tag: 'kouverte-notte'
    });
    (DB.push_subscriptions || []).forEach(sub => {
        webpush.sendNotification(sub.subscription, payload).catch(() => {});
    });

    setTimeout(endKouverteNotte, NOTTE_DURATION_MS);
}

function endKouverteNotte() {
    if (!notteActive) return;
    notteActive = false;
    const session = DB.current_notte;
    if (!session) return;

    // Trova messaggio con più voti
    let winner = null, maxVotes = 0;
    for (const msg of session.messages || []) {
        const v = (session.votes[msg.id] || []).length;
        if (v > maxVotes) { maxVotes = v; winner = { ...msg, votes: v }; }
    }

    if (winner) {
        const wu = (DB.users || []).find(u => u.id === winner.userId);
        if (wu) {
            wu.kvData = wu.kvData || {};
            wu.kvData.notteWins = (wu.kvData.notteWins || 0) + 1;
            wu.kvData.coins = (wu.kvData.coins || 0) + 150;
            if (!(wu.kvData.badges || []).includes('notte_winner')) {
                wu.kvData.badges = [...(wu.kvData.badges || []), 'notte_winner'];
            }
        }
    }
    // Tutti i partecipanti: +20 monete
    const participants = new Set((session.messages || []).map(m => m.userId).filter(Boolean));
    for (const uid of participants) {
        const u = (DB.users || []).find(u => u.id === uid);
        if (u) { u.kvData = u.kvData || {}; u.kvData.coins = (u.kvData.coins || 0) + 20; }
    }
    markDirty();
    io.emit('notte-end', {
        winner: winner || null,
        totalMessages: (session.messages || []).length,
        participants: participants.size
    });
    DB.current_notte = null;
    console.log(`[🌙 NOTTE] Finita! ${participants.size} partecipanti, vincitore: ${winner?.text?.slice(0, 30) || 'nessuno'}`);
}

// Controlla ogni minuto se è ora (23:00 ora italiana)
setInterval(() => {
    const now = new Date(Date.now() + 60 * 60 * 1000); // UTC+1
    if (now.getUTCHours() === 22 && now.getUTCMinutes() === 0) startKouverteNotte();
    if (DB.current_notte && Date.now() > DB.current_notte.endsAt && notteActive) endKouverteNotte();
}, 60 * 1000);

// Stato Notte per chi entra in ritardo
app.get('/api/notte/status', (req, res) => {
    if (DB.current_notte && Date.now() < DB.current_notte.endsAt) {
        const s = DB.current_notte;
        res.json({ active: true, theme: s.theme, endsAt: s.endsAt, sessionId: s.id,
            totalMessages: s.messages.length });
    } else {
        // Anticipazione: manda timer per prossima notte
        const now = new Date(Date.now() + 60 * 60 * 1000);
        const next = new Date(now); next.setUTCHours(22, 0, 0, 0);
        if (now.getUTCHours() >= 22) next.setUTCDate(next.getUTCDate() + 1);
        res.json({ active: false, nextAt: next.getTime() - 60 * 60 * 1000 });
    }
});

// Endpoint: top 10 per messaggi nell'ultima settimana
app.get('/api/leaderboard/chat', (req, res) => {
    const stats = getWeeklyStats();
    const top = Object.entries(stats.users)
        .map(([id, u]) => ({ id, name: u.name, face: u.face, color: u.color, msgs: u.msgs }))
        .filter(u => u.msgs > 0)
        .sort((a, b) => b.msgs - a.msgs)
        .slice(0, 25);
    const resetDate = new Date(stats.weekStart + 7 * 24 * 60 * 60 * 1000).toISOString();
    res.json({ ok: true, weekStart: stats.weekStart, resetDate, top });
});

// ============ BATTLE EVENTS (calendario ricorrente) ============
// Eventi settimanali con countdown live. Tutti i tempi in Europe/Rome (UTC+1/2).
// Day: 0=Domenica, 1=Lunedì, ..., 6=Sabato
const BATTLE_EVENTS = [
    { id: 'fri_prime', title: '🔥 FRIDAY PRIME', desc: 'Battle royale del weekend', day: 5, hour: 21, durationMin: 120, prize_sats: 5000 },
    { id: 'sat_night', title: '🌙 SATURDAY NIGHT', desc: 'Notte di sfide vocali', day: 6, hour: 22, durationMin: 180, prize_sats: 10000 },
    { id: 'sun_chill', title: '☕ SUNDAY CHILL', desc: 'Battle rilassate domenicali', day: 0, hour: 18, durationMin: 90, prize_sats: 2000 },
    { id: 'wed_warm', title: '⚡ WEDNESDAY WARM-UP', desc: 'Mid-week training battles', day: 3, hour: 20, durationMin: 60, prize_sats: 1500 }
];

function nextOccurrence(event, fromMs) {
    const from = new Date(fromMs);
    const target = new Date(from);
    const daysAhead = (event.day - from.getDay() + 7) % 7;
    target.setDate(from.getDate() + daysAhead);
    target.setHours(event.hour, 0, 0, 0);
    if (target.getTime() <= fromMs) target.setDate(target.getDate() + 7);
    return target.getTime();
}

app.get('/api/battle-events', (req, res) => {
    const nowMs = now();
    const events = BATTLE_EVENTS.map(e => {
        const startsAt = nextOccurrence(e, nowMs);
        const endsAt = startsAt + (e.durationMin * 60 * 1000);
        const isLive = nowMs >= (startsAt - 60 * 60 * 1000) && nowMs <= endsAt; // live within window
        return { ...e, startsAt, endsAt, isLive };
    }).sort((a, b) => a.startsAt - b.startsAt);
    res.json({ ok: true, events });
});

// ============ REFERRAL ============
const REFERRAL_REWARD_SATS = 500;

app.get('/api/me/referral', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const user = DB.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    if (!user.referral_code) {
        user.referral_code = 'ref_' + (user.username || user.id.slice(-6)).toLowerCase() + Math.floor(Math.random() * 1000);
        markDirty();
    }
    const link = (process.env.PUBLIC_URL || 'https://www.kouverte.com') + '/app.html?ref=' + user.referral_code;
    DB.referrals = DB.referrals || [];
    const invited = DB.referrals.filter(r => r.from === userId);
    const earned = invited.reduce((a, r) => a + (r.reward_sats || 0), 0);
    res.json({
        ok: true,
        code: user.referral_code,
        link,
        invited_count: invited.length,
        earned_sats: earned,
        reward_per_referral: REFERRAL_REWARD_SATS
    });
});

// ============ PUBLIC STATS (landing page) ============
app.get('/api/stats/public', (req, res) => {
    try {
        // Online users: socket.io connected clients
        const onlineUsers = io.engine ? io.engine.clientsCount : 0;

        // Active voice rooms: rooms with at least 1 participant
        const activeRooms = DB.voice_rooms
            ? Object.values(DB.voice_rooms).filter(r => r && r.participants && r.participants.length > 0).length
            : 0;

        // Messages today: sum messages in all text rooms sent in last 24h
        const since = Date.now() - 24 * 60 * 60 * 1000;
        let msgsToday = 0;
        if (DB.rooms) {
            Object.values(DB.rooms).forEach(msgs => {
                if (Array.isArray(msgs)) {
                    msgsToday += msgs.filter(m => m && m.created_at && m.created_at > since).length;
                }
            });
        }

        // Total registered users
        const totalUsers = DB.users ? DB.users.length : 0;

        res.json({
            ok: true,
            online_users: onlineUsers,
            active_rooms: activeRooms,
            messages_today: msgsToday,
            total_users: totalUsers
        });
    } catch (e) {
        res.json({ ok: false, online_users: 0, active_rooms: 0, messages_today: 0, total_users: 0 });
    }
});

// ============ PUSH NOTIFICATIONS ============

// Helper: invia push a uno userId specifico (fire & forget)
async function pushToUser(userId, { title, body, url, tag }) {
    DB.push_subscriptions = DB.push_subscriptions || [];
    const subs = DB.push_subscriptions.filter(s => s.userId === userId);
    if (!subs.length) return;
    const payload = JSON.stringify({ title, body, icon: '/icon-192.png', badge: '/favicon-32.png', url: url || '/app.html', tag: tag || 'kouverte' });
    const toRemove = [];
    for (const sub of subs) {
        try { await webpush.sendNotification(sub.subscription, payload); }
        catch (e) { if (e.statusCode === 410 || e.statusCode === 404) toRemove.push(sub.subscription.endpoint); }
    }
    if (toRemove.length) {
        DB.push_subscriptions = DB.push_subscriptions.filter(s => !toRemove.includes(s.subscription.endpoint));
        markDirty();
    }
}

// Ritorna la VAPID public key (usata dal frontend per subscribe)
app.get('/api/push/vapid-key', (req, res) => {
    res.json({ ok: true, publicKey: VAPID_PUBLIC });
});

// Salva subscription push di un utente
app.post('/api/push/subscribe', verifyToken, (req, res) => {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Subscription non valida' });
    }
    DB.push_subscriptions = DB.push_subscriptions || [];
    const userId = req.user.userId;
    // Rimuovi vecchie subscription dello stesso utente/endpoint
    DB.push_subscriptions = DB.push_subscriptions.filter(
        s => !(s.userId === userId && s.subscription.endpoint === subscription.endpoint)
    );
    DB.push_subscriptions.push({ userId, subscription, createdAt: Date.now() });
    markDirty();
    res.json({ ok: true });
});

// Salva subscription push per utenti anonimi (senza JWT)
app.post('/api/push/subscribe-anon', (req, res) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Parametri mancanti' });
    }
    // Sanity check: userId deve essere un id Kouverte locale (formato kv_xxx)
    if (String(userId).length > 60) return res.status(400).json({ error: 'userId non valido' });
    DB.push_subscriptions = DB.push_subscriptions || [];
    DB.push_subscriptions = DB.push_subscriptions.filter(
        s => !(s.userId === userId && s.subscription.endpoint === subscription.endpoint)
    );
    DB.push_subscriptions.push({ userId, subscription, createdAt: Date.now(), anon: true });
    markDirty();
    res.json({ ok: true });
});

// ── Room alert subscriptions — notifica quando la stanza si anima ──────────────
DB.room_alert_subs = DB.room_alert_subs || [];
const roomAlertCooldown = {}; // { "roomId:userId": timestampMs } — in-memory anti-spam

app.post('/api/push/subscribe-room-alert', (req, res) => {
    const { userId, subscription, roomId } = req.body;
    if (!userId || !subscription?.endpoint || !roomId) {
        return res.status(400).json({ error: 'Parametri mancanti' });
    }
    if (String(userId).length > 60 || String(roomId).length > 40) {
        return res.status(400).json({ error: 'Parametri non validi' });
    }
    DB.room_alert_subs = DB.room_alert_subs || [];
    // Rimuovi iscrizione precedente per stessa coppia userId+roomId
    DB.room_alert_subs = DB.room_alert_subs.filter(
        s => !(s.userId === userId && s.roomId === roomId)
    );
    DB.room_alert_subs.push({ userId, subscription, roomId, createdAt: Date.now() });
    markDirty();
    res.json({ ok: true });
});

app.delete('/api/push/subscribe-room-alert', (req, res) => {
    const { userId, roomId } = req.body;
    if (!userId || !roomId) return res.status(400).json({ error: 'Parametri mancanti' });
    DB.room_alert_subs = (DB.room_alert_subs || []).filter(
        s => !(s.userId === userId && s.roomId === roomId)
    );
    markDirty();
    res.json({ ok: true });
});

app.get('/api/push/room-alert-status', (req, res) => {
    const { userId, roomId } = req.query;
    if (!userId || !roomId) return res.status(400).json({ error: 'Parametri mancanti' });
    const sub = (DB.room_alert_subs || []).find(s => s.userId === userId && s.roomId === roomId);
    res.json({ subscribed: !!sub });
});

// Invia push a un utente specifico (uso interno/admin)
app.post('/api/push/send', verifyToken, async (req, res) => {
    const { targetUserId, title, body, url } = req.body;
    if (!targetUserId || !title || !body) {
        return res.status(400).json({ error: 'Parametri mancanti' });
    }
    DB.push_subscriptions = DB.push_subscriptions || [];
    const subs = DB.push_subscriptions.filter(s => s.userId === targetUserId);
    if (subs.length === 0) return res.json({ ok: true, sent: 0 });

    const payload = JSON.stringify({ title, body, icon: '/icon-192.png', url: url || '/app.html', tag: 'kouverte-msg' });
    let sent = 0;
    const toRemove = [];
    for (const sub of subs) {
        try {
            await webpush.sendNotification(sub.subscription, payload);
            sent++;
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                toRemove.push(sub.subscription.endpoint);
            }
        }
    }
    if (toRemove.length > 0) {
        DB.push_subscriptions = DB.push_subscriptions.filter(s => !toRemove.includes(s.subscription.endpoint));
        markDirty();
    }
    res.json({ ok: true, sent });
});

app.post('/api/auth/register', rateLimit('register', 5, 15 * 60 * 1000), async (req, res) => {
    const emailIn = sanitizeEmail(req.body?.email);
    const usernameIn = sanitizeUsername(req.body?.username);
    const password = req.body?.password;

    if (!emailIn) return res.status(400).json({ error: 'Email non valida' });
    if (!usernameIn) return res.status(400).json({ error: 'Username non valido (3-20 caratteri, solo lettere/numeri/underscore)' });
    if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password min 6 caratteri' });
    if (password.length > 200) return res.status(400).json({ error: 'Password troppo lunga' });

    if (DB.users.find(u => u.email === emailIn)) {
        return res.status(409).json({ error: 'Email già registrata' });
    }
    if (DB.users.find(u => u.username === usernameIn)) {
        return res.status(409).json({ error: 'Username già in uso' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        // Genera 5 backup codes per il recupero password
        const backupCodes = [];
        const backupCodeHashes = [];
        for (let i = 0; i < 5; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 caratteri hex
            backupCodes.push(code);
            backupCodeHashes.push(await bcrypt.hash(code, 8)); // hash per sicurezza
        }
        const user = {
            id: genId('u'),
            email: emailIn,
            username: usernameIn,
            password_hash,
            backup_code_hashes: backupCodeHashes, // codici hashed
            is_admin: false,
            profile: {
                avatar_letter: usernameIn.charAt(0).toUpperCase(),
                bio: '',
                clips: [
                    { slot: 0, title: 'Chi sono', audio_id: null, duration: 0 },
                    { slot: 1, title: 'Mi piace', audio_id: null, duration: 0 },
                    { slot: 2, title: 'Cerco', audio_id: null, duration: 0 }
                ]
            },
            stats: {
                stories_count: 0,
                matches_count: 0,
                likes_received: 0,
                duels_participated: 0
            },
            created_at: now(),
            updated_at: now()
        };
        DB.users.push(user);

        // Give 50 initial credits
        DB.user_credits = DB.user_credits || [];
        DB.user_credits.push({
            user_id: user.id,
            credits: 50,
            updated_at: now()
        });

        // Referral reward: se è stato passato un codice valido, accredita sats al referrer
        const refCode = (req.body?.ref || '').toString().trim();
        if (refCode) {
            const referrer = DB.users.find(u => u.referral_code === refCode);
            if (referrer && referrer.id !== user.id) {
                user.referred_by = referrer.id;
                DB.referrals = DB.referrals || [];
                DB.referrals.push({
                    id: genId('rfr'),
                    from: referrer.id,
                    to: user.id,
                    reward_sats: REFERRAL_REWARD_SATS,
                    created_at: now()
                });
                addBalance(referrer.id, REFERRAL_REWARD_SATS);
                notifyTelegramUser(referrer.id, `🎉 Hai invitato un nuovo utente! +${REFERRAL_REWARD_SATS} sats accreditati.`);
            }
        }

        saveDB(DB);

        // Notifica admin @losangelesbroker su ogni nuova iscrizione
        notifyAdminNewUser(user);

        const token = generateToken(user.id);
        res.json({
            ok: true,
            token,
            user: publicUser(user),
            backupCodes // SOLO al register: codici in chiaro per recupero password
        });
    } catch(e) {
        res.status(500).json({ error: 'Errore registrazione' });
    }
});

// Recupero password con OTP Telegram
app.post('/api/auth/recover-with-otp', rateLimit('recover-otp', 10, 15 * 60 * 1000), async (req, res) => {
    const usernameIn = sanitizeUsername(req.body?.username || '');
    const emailIn = sanitizeEmail(req.body?.email || '');
    const otp = String(req.body?.otp || '').trim();
    const newPassword = req.body?.newPassword;

    if (!usernameIn && !emailIn) return res.status(400).json({ error: 'Username o email richiesti' });
    if (!otp || !/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'OTP deve essere 6 cifre' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Nuova password min 6 caratteri' });

    // Trova utente
    const user = DB.users.find(u =>
        (usernameIn && u.username === usernameIn) ||
        (emailIn && u.email === emailIn)
    );
    if (!user) return res.status(401).json({ error: 'Account non trovato' });

    // L'OTP è salvato da tg-bot.js con chiave: kouverte:reset_otp:<identifier>
    // Cerca per username e per email
    const identifiers = [user.username, user.email].filter(Boolean);
    let validOtp = false;
    let foundKey = null;

    // Prova Redis
    const r = getServerRedis();
    if (r) {
        for (const id of identifiers) {
            const key = 'kouverte:reset_otp:' + id.toLowerCase();
            try {
                const data = await r.get(key);
                if (data) {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    if (parsed.otp === otp) {
                        validOtp = true;
                        foundKey = key;
                        break;
                    }
                }
            } catch(e) {}
        }
    }

    // Fallback memoria locale del bot (stesso processo se mono-process, altrimenti non funziona)
    if (!validOtp && global._resetOTPs) {
        for (const id of identifiers) {
            const key = 'kouverte:reset_otp:' + id.toLowerCase();
            const data = global._resetOTPs.get(key);
            if (data && data.otp === otp && data.expiresAt > Date.now()) {
                validOtp = true;
                foundKey = key;
                break;
            }
        }
    }

    if (!validOtp) {
        return res.status(401).json({ error: 'OTP non valido o scaduto. Richiedi un nuovo /reset al bot Telegram.' });
    }

    try {
        user.password_hash = await bcrypt.hash(newPassword, 10);
        markDirty();

        // Invalida OTP
        if (r && foundKey) try { await r.del(foundKey); } catch(e){}
        if (global._resetOTPs && foundKey) global._resetOTPs.delete(foundKey);

        const newToken = generateToken(user.id);
        res.json({ ok: true, token: newToken, user: publicUser(user) });
    } catch(e) {
        res.status(500).json({ error: 'Errore reset password' });
    }
});

// Recupero password con backup code
app.post('/api/auth/recover-with-code', rateLimit('recover', 10, 15 * 60 * 1000), async (req, res) => {
    const usernameIn = sanitizeUsername(req.body?.username);
    const emailIn = sanitizeEmail(req.body?.email);
    const code = String(req.body?.code || '').toUpperCase().trim();
    const newPassword = req.body?.newPassword;

    if (!usernameIn && !emailIn) return res.status(400).json({ error: 'Username o email richiesti' });
    if (!code || code.length !== 8) return res.status(400).json({ error: 'Codice di recupero non valido (8 caratteri)' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Nuova password min 6 caratteri' });

    // Trova utente
    const user = DB.users.find(u =>
        (usernameIn && u.username === usernameIn) ||
        (emailIn && u.email === emailIn)
    );
    if (!user) {
        // Non rivelare se esiste o no per sicurezza
        return res.status(401).json({ error: 'Username/email o codice non corretti' });
    }

    // Verifica backup codes
    const codeHashes = user.backup_code_hashes || [];
    let matchedIndex = -1;
    for (let i = 0; i < codeHashes.length; i++) {
        try {
            const ok = await bcrypt.compare(code, codeHashes[i]);
            if (ok) { matchedIndex = i; break; }
        } catch(e) {}
    }

    if (matchedIndex === -1) {
        return res.status(401).json({ error: 'Username/email o codice non corretti' });
    }

    try {
        // Aggiorna password e rimuovi il codice usato
        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.backup_code_hashes.splice(matchedIndex, 1);
        markDirty();

        const newToken = generateToken(user.id);
        res.json({
            ok: true,
            token: newToken,
            user: publicUser(user),
            remainingCodes: user.backup_code_hashes.length
        });
    } catch(e) {
        res.status(500).json({ error: 'Errore reset password' });
    }
});

// Genera nuovi backup codes (richiede login)
app.post('/api/me/regenerate-backup-codes', verifyToken, async (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    try {
        const newCodes = [];
        const newHashes = [];
        for (let i = 0; i < 5; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            newCodes.push(code);
            newHashes.push(await bcrypt.hash(code, 8));
        }
        user.backup_code_hashes = newHashes;
        markDirty();
        res.json({ ok: true, backupCodes: newCodes });
    } catch(e) {
        res.status(500).json({ error: 'Errore generazione codici' });
    }
});

// Forgot password — sends reset token via Telegram bot if linked, otherwise returns error
app.post('/api/auth/forgot-password', rateLimit('forgot', 5, 15 * 60 * 1000), (req, res) => {
    const emailIn = sanitizeEmail(req.body?.email);
    if (!emailIn) return res.status(400).json({ error: 'Email non valida' });
    const user = DB.users.find(u => u.email === emailIn);
    // Always return same message to prevent email enumeration
    const okResp = { ok: true, message: 'Se l\'email è registrata, riceverai le istruzioni di recupero' };
    if (!user) return res.json(okResp);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = now() + 60 * 60 * 1000;
    DB.password_resets = DB.password_resets || [];
    DB.password_resets = DB.password_resets.filter(r => r.user_id !== user.id);
    DB.password_resets.push({ user_id: user.id, token, expires_at: expires, created_at: now() });
    markDirty();

    const resetUrl = (process.env.PUBLIC_URL || 'https://www.kouverte.com') + '/app.html#reset=' + token;
    if (user.telegramId) {
        notifyTelegramUser(user.id, `🔐 Richiesta reset password\n\nClicca per impostare una nuova password (valido 60 min):\n${resetUrl}`);
    }
    return res.json(okResp);
});

// Reset password with token
app.post('/api/auth/reset-password', rateLimit('reset', 10, 15 * 60 * 1000), async (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token e password richiesti' });
    if (typeof password !== 'string' || password.length < 6 || password.length > 200) {
        return res.status(400).json({ error: 'Password 6-200 caratteri' });
    }
    DB.password_resets = DB.password_resets || [];
    const entry = DB.password_resets.find(r => r.token === token);
    if (!entry || entry.expires_at < now()) return res.status(400).json({ error: 'Token scaduto o non valido' });

    const user = DB.users.find(u => u.id === entry.user_id);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    try {
        user.password_hash = await bcrypt.hash(password, 10);
        DB.password_resets = DB.password_resets.filter(r => r.token !== token);
        markDirty();
        const newToken = generateToken(user.id);
        res.json({ ok: true, token: newToken, user: publicUser(user) });
    } catch(e) {
        res.status(500).json({ error: 'Errore reset password' });
    }
});

// Login — rate limited 5/15min per IP
// Accetta sia email che username nel campo "email" o "username"
app.post('/api/auth/login', rateLimit('login', 10, 15 * 60 * 1000), async (req, res) => {
    const identifier = String(req.body?.email || req.body?.username || '').trim().toLowerCase();
    const password = req.body?.password;
    if (!identifier || !password) return res.status(400).json({ error: 'Email/username e password richiesti' });
    if (typeof password !== 'string' || password.length > 200) return res.status(400).json({ error: 'Password non valida' });

    // Cerca per email OR username
    const isEmail = identifier.includes('@');
    let user;
    if (isEmail) {
        const emailClean = sanitizeEmail(identifier);
        if (!emailClean) return res.status(400).json({ error: 'Email non valida' });
        user = DB.users.find(u => u.email === emailClean);
    } else {
        const userClean = sanitizeUsername(identifier);
        if (!userClean) return res.status(400).json({ error: 'Username non valido' });
        user = DB.users.find(u => u.username === userClean);
    }

    if (!user || !user.password_hash) return res.status(401).json({ error: 'Email/username o password non corretti' });

    try {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Email/username o password non corretti' });

        user.last_seen = now();
        markDirty();

        // rememberMe: true (default) → token 30 giorni; false → 7 giorni
        const rememberMe = req.body?.rememberMe !== false;
        const token = generateToken(user.id, rememberMe);
        res.json({ ok: true, token, user: publicUser(user), expiresIn: rememberMe ? '30d' : '7d' });
    } catch(e) {
        res.status(500).json({ error: 'Errore login' });
    }
});

// Diagnostica storage e Redis
app.get('/api/storage/status', async (req, res) => {
    const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
    const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
    const urlValue = process.env.UPSTASH_REDIS_REST_URL || '';
    const r = getServerRedis();

    // Test ping a Redis se disponibile
    let pingResult = 'not_tested';
    if (r) {
        try {
            const ping = await r.ping();
            pingResult = String(ping);
        } catch(e) {
            pingResult = 'error: ' + e.message;
        }
    }

    res.json({
        redisConfigured: hasRedisUrl && hasRedisToken,
        redisActive: !!r,
        redisPing: pingResult,
        urlLength: urlValue.length,
        urlPrefix: urlValue.substring(0, 20),
        usersCount: (DB.users || []).length,
        dbFileExists: fs.existsSync(DB_FILE),
        dbFileSize: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
        nodeEnv: process.env.NODE_ENV || 'development',
        env_keys_set: Object.keys(process.env).filter(k => k.includes('UPSTASH') || k.includes('REDIS')).length,
        all_upstash_keys: Object.keys(process.env).filter(k => k.includes('UPSTASH'))
    });
});

// Trigger backup manuale per debug
app.get('/api/storage/backup-now', (req, res) => {
    saveDB(DB);
    res.json({ ok: true, msg: 'saveDB triggered, check logs' });
});

// Get current user
app.get('/api/auth/me', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ user: { id: user.id, email: user.email, username: user.username, profile: user.profile, stats: user.stats, kvData: user.kvData || null } });
});

// Refresh token: emette nuovo token mantenendo durata rememberMe
// Chiamato automaticamente quando il token sta per scadere
app.post('/api/auth/refresh-token', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    user.last_seen = now();
    markDirty();

    // Genera nuovo token con durata 30 giorni (rememberMe sempre true per refresh)
    const rememberMe = req.body?.rememberMe !== false;
    const newToken = generateToken(user.id, rememberMe);

    // Calcola tempo a scadenza per il client
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // secondi
    res.json({
        ok: true,
        token: newToken,
        expiresInSeconds: expiresIn,
        expiresAt: now() + expiresIn * 1000
    });
});

// ============================================================
// KOUVERTE: Sync dati gioco (monete, XP, badge, cornici, etc.)
// ============================================================
app.post('/api/kv/sync', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const data = req.body?.data;
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Dati richiesti' });

    // Whitelist dei campi salvabili (sicurezza)
    const ALLOWED_FIELDS = [
        'name', 'face', 'color', 'msgCount', 'freeUsed',
        'isPremium', 'premExpiry', 'roomsVisited', 'badges',
        'ownedFrames', 'activeFrame', 'coins', 'streak',
        'lastLogin', 'lastSpin', 'tempFrames', 'boostUntil',
        'confessUsedOn', 'favorites', 'blocked', 'xp', 'level',
        'bio', 'statusEmoji', 'statusText', 'banner', 'dailyMissions',
        'shopItems', 'active_nickFx', 'active_bubble', 'active_enterSound',
        'active_msgFx', 'active_roomTheme',
        'welcomePackReceived', 'welcomePackAt' // anti-abuso bonus benvenuto
    ];

    // Costruisci dati safe
    const safeData = {};
    for (const key of ALLOWED_FIELDS) {
        if (data[key] !== undefined) {
            safeData[key] = data[key];
        }
    }
    safeData._syncedAt = now();

    // ANTI-ABUSO welcome pack: se il server ha gia' welcomePackReceived=true
    // l'utente NON puo' "resettare" il flag a false per re-ricevere il bonus.
    // welcomePackReceived e' write-once true (NON puo' tornare a false dal client).
    const prevKv = user.kvData || {};
    if (prevKv.welcomePackReceived === true) {
        safeData.welcomePackReceived = true;
        if (prevKv.welcomePackAt) safeData.welcomePackAt = prevKv.welcomePackAt;
    }

    user.kvData = safeData;
    markDirty();

    res.json({ ok: true, syncedAt: safeData._syncedAt });
});

// Get dati gioco salvati
app.get('/api/kv/sync', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ ok: true, data: user.kvData || null });
});

// Lista utenti (per chiamate)
app.get('/api/users/list', (req, res) => {
    const users = DB.users.map(u => ({ id: u.id, username: u.username }));
    res.json({ users });
});

// Ricerca utenti per username (autocomplete)
app.get('/api/users/search', (req, res) => {
    const q = String(req.query.q || '').toLowerCase().trim();
    if (q.length < 2) return res.json({ users: [] });
    const matches = DB.users
        .filter(u => u.username && u.username.toLowerCase().includes(q))
        .slice(0, 20)
        .map(u => ({
            id: u.id,
            username: u.username,
            avatar_letter: u.profile?.avatar_letter || u.username.charAt(0).toUpperCase(),
            kvFace: u.kvData?.face || '🎭',
            kvColor: u.kvData?.color || '#a855f7',
            kvActiveFrame: u.kvData?.activeFrame || 'none',
            kvName: u.kvData?.name || u.username
        }));
    res.json({ users: matches });
});

// ─── helper: mappa userId → socketId per notifiche real-time ───────────────
// (condiviso con DM — usa lo stesso global.dmServerIds)
function getUserSocketId(userId) {
    if (!global.dmServerIds) return null;
    return global.dmServerIds.get(userId) || global.dmUsers?.get(userId) || null;
}

// Lista amici dell'utente (richiede auth)
app.get('/api/me/friends', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    const friendIds = user.friends || [];
    const friends = friendIds.map(fid => {
        const f = DB.users.find(u => u.id === fid);
        if (!f) return null;
        const onlineSid = getUserSocketId(fid);
        return {
            id: f.id,
            username: f.username,
            kvFace: f.kvData?.face || '🎭',
            kvColor: f.kvData?.color || '#a855f7',
            kvActiveFrame: f.kvData?.activeFrame || 'none',
            kvName: f.kvData?.name || f.username,
            online: !!(onlineSid)
        };
    }).filter(Boolean);
    res.json({ friends });
});

// Richieste in entrata (pending)
app.get('/api/me/friends/requests', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    const incoming = (user.friendRequests || []).map(r => {
        const from = DB.users.find(u => u.id === r.from);
        if (!from) return null;
        return {
            from: from.id,
            username: from.username,
            kvFace: from.kvData?.face || '🎭',
            kvColor: from.kvData?.color || '#00d4ff',
            kvName: from.kvData?.name || from.username,
            ts: r.ts
        };
    }).filter(Boolean);
    res.json({ requests: incoming });
});

// Invia richiesta di amicizia (sostituisce /add diretto)
app.post('/api/me/friends/request', verifyToken, (req, res) => {
    const me = DB.users.find(u => u.id === req.user.userId);
    if (!me) return res.status(404).json({ error: 'Utente non trovato' });
    const friendId = String(req.body?.friendId || '');
    if (!friendId) return res.status(400).json({ error: 'friendId richiesto' });
    if (friendId === me.id) return res.status(400).json({ error: 'Non puoi aggiungere te stesso' });
    const friend = DB.users.find(u => u.id === friendId);
    if (!friend) return res.status(404).json({ error: 'Utente non trovato' });

    // Già amici?
    if ((me.friends || []).includes(friendId)) return res.json({ ok: true, status: 'already_friends' });

    // Richiesta già inviata?
    friend.friendRequests = friend.friendRequests || [];
    if (friend.friendRequests.find(r => r.from === me.id)) return res.json({ ok: true, status: 'already_sent' });

    // Se B ha già inviato una richiesta ad A → accetta automaticamente
    me.friendRequests = me.friendRequests || [];
    if (me.friendRequests.find(r => r.from === friendId)) {
        // Accetta cross-request
        me.friendRequests = me.friendRequests.filter(r => r.from !== friendId);
        me.friends = me.friends || [];
        friend.friends = friend.friends || [];
        if (!me.friends.includes(friendId)) me.friends.push(friendId);
        if (!friend.friends.includes(me.id)) friend.friends.push(me.id);
        markDirty();
        // Notifica real-time entrambi
        const friendSock = getUserSocketId(friendId);
        if (friendSock) io.to(friendSock).emit('friend-accepted', { userId: me.id, username: me.username, kvFace: me.kvData?.face || '🎭', kvColor: me.kvData?.color || '#00d4ff' });
        return res.json({ ok: true, status: 'auto_accepted' });
    }

    // Aggiungi richiesta a B
    friend.friendRequests.push({ from: me.id, ts: Date.now() });
    markDirty();

    // Notifica real-time a B se online
    const targetSock = getUserSocketId(friendId);
    if (targetSock) {
        io.to(targetSock).emit('friend-request', {
            from: me.id,
            username: me.username,
            kvFace: me.kvData?.face || '🎭',
            kvColor: me.kvData?.color || '#00d4ff',
            kvName: me.kvData?.name || me.username
        });
    } else {
        // Push notification offline
        pushToUser(friendId, {
            title: `👋 ${me.kvData?.name || me.username} vuole essere tuo amico`,
            body: 'Apri Kouverte per accettare la richiesta',
            url: '/app.html',
            tag: 'friend-req-' + me.id
        });
    }
    res.json({ ok: true, status: 'sent' });
});

// Accetta richiesta di amicizia
app.post('/api/me/friends/accept', verifyToken, (req, res) => {
    const me = DB.users.find(u => u.id === req.user.userId);
    if (!me) return res.status(404).json({ error: 'Utente non trovato' });
    const fromId = String(req.body?.fromId || '');
    if (!fromId) return res.status(400).json({ error: 'fromId richiesto' });
    const other = DB.users.find(u => u.id === fromId);
    if (!other) return res.status(404).json({ error: 'Utente non trovato' });

    // Rimuovi richiesta dal pending
    me.friendRequests = (me.friendRequests || []).filter(r => r.from !== fromId);

    // Aggiungi amicizia bilaterale
    me.friends = me.friends || [];
    other.friends = other.friends || [];
    if (!me.friends.includes(fromId)) me.friends.push(fromId);
    if (!other.friends.includes(me.id)) other.friends.push(me.id);
    markDirty();

    // Notifica chi ha inviato la richiesta
    const otherSock = getUserSocketId(fromId);
    if (otherSock) {
        io.to(otherSock).emit('friend-accepted', {
            userId: me.id,
            username: me.username,
            kvFace: me.kvData?.face || '🎭',
            kvColor: me.kvData?.color || '#00d4ff',
            kvName: me.kvData?.name || me.username
        });
    }
    res.json({ ok: true });
});

// Rifiuta/ignora richiesta
app.post('/api/me/friends/reject', verifyToken, (req, res) => {
    const me = DB.users.find(u => u.id === req.user.userId);
    if (!me) return res.status(404).json({ error: 'Utente non trovato' });
    const fromId = String(req.body?.fromId || '');
    me.friendRequests = (me.friendRequests || []).filter(r => r.from !== fromId);
    markDirty();
    res.json({ ok: true });
});

// Compat: vecchio endpoint /add — ora manda richiesta invece di aggiungere direttamente
app.post('/api/me/friends/add', verifyToken, (req, res, next) => {
    req.url = '/api/me/friends/request';
    next('route');
});

// Rimuovi amico
app.post('/api/me/friends/remove', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    const friendId = String(req.body?.friendId || '');
    if (!friendId) return res.status(400).json({ error: 'friendId richiesto' });
    user.friends = (user.friends || []).filter(id => id !== friendId);
    // Rimuovi anche dall'altro lato
    const other = DB.users.find(u => u.id === friendId);
    if (other) other.friends = (other.friends || []).filter(id => id !== user.id);
    markDirty();
    res.json({ ok: true, friendsCount: user.friends.length });
});

// Ottieni voice note di un utente (per riproduzione nel profilo)
app.get('/api/voice-note/:userId', (req, res) => {
    const u = (DB.users || []).find(u => u.id === req.params.userId);
    if (!u || !u.kvData?.voiceNote) return res.status(404).json({ error: 'Nota vocale non trovata' });
    res.json({ audio: u.kvData.voiceNote, ts: u.kvData.voiceNoteTs });
});

// Get profile by username
app.get('/api/profile/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    const user = DB.users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const kv = user.kvData || {};
    const msgCount = kv.msgCount || 0;
    const level = Math.max(1, Math.floor(1 + Math.log2(msgCount + 1) * 2.2));

    // Weekly rank for this user
    const wStats = getWeeklyStats();
    const sorted = Object.entries(wStats.users)
        .filter(([, u]) => u.msgs > 0)
        .sort(([, a], [, b]) => b.msgs - a.msgs);
    const wIdx = sorted.findIndex(([id, u]) => id === user.id || (kv.name && u.name === kv.name));
    const weeklyRank = wIdx >= 0 ? wIdx + 1 : null;
    const weeklyMsgs = wIdx >= 0 ? sorted[wIdx][1].msgs : 0;

    const userStories = (DB.stories || []).filter(s => s.user_id === user.id && s.expires_at > now());
    res.json({
        username: user.username,
        displayName: kv.name || user.username,
        avatar_letter: user.profile?.avatar_letter || user.username.charAt(0).toUpperCase(),
        face: kv.face || '🎭',
        color: kv.color || '#a855f7',
        bio: user.profile?.bio || '',
        statusEmoji: kv.statusEmoji || '',
        statusText: kv.statusText || '',
        isPremium: !!(kv.isPremium || user.is_premium),
        activeFrame: kv.activeFrame || 'none',
        badges: kv.badges || [],
        msgCount,
        level,
        weeklyRank,
        weeklyMsgs,
        joinedAt: user.created_at,
        stats: user.stats,
        notteWins: kv.notteWins || 0,
        voiceNote: kv.voiceNote ? { hasNote: true, ts: kv.voiceNoteTs } : null,
        clips: (user.profile?.clips || []).map(c => ({
            ...c,
            story_preview: userStories.find(s => s.id === c.audio_id)
        }))
    });
});

// Update profile
// Cambia username (1 volta ogni 7 giorni per evitare squatting)
app.post('/api/profile/username', verifyToken, rateLimit('username-change', 3, 24 * 60 * 60 * 1000), (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    const next = sanitizeUsername(req.body?.username);
    if (!next) return res.status(400).json({ error: 'Username non valido (3-20 caratteri, lettere/numeri/_)' });
    if (next === user.username) return res.json({ ok: true, username: user.username });
    if (DB.users.find(u => u.username === next && u.id !== user.id)) {
        return res.status(409).json({ error: 'Username già in uso' });
    }
    // Limite anti-squatting: max 1 cambio ogni 7 giorni
    const last = user.username_changed_at || 0;
    if (now() - last < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.ceil((7 * 24 * 60 * 60 * 1000 - (now() - last)) / (24 * 60 * 60 * 1000));
        return res.status(429).json({ error: `Puoi cambiare username ogni 7 giorni (attendi ${days}g)` });
    }
    user.username = next;
    user.username_changed_at = now();
    markDirty();
    res.json({ ok: true, username: next });
});

app.post('/api/profile/update', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    if (!user.profile) user.profile = { avatar_letter: (user.username||'K').charAt(0).toUpperCase(), bio: '', clips: [
        { slot: 0, title: 'Chi sono', audio_id: null, duration: 0 },
        { slot: 1, title: 'Mi piace', audio_id: null, duration: 0 },
        { slot: 2, title: 'Cerco',    audio_id: null, duration: 0 }
    ]};

    const { bio, gender, birth_year, display_name, looking_for, city, lat, lng } = req.body || {};
    if (bio !== undefined)         user.profile.bio = sanitizeBio(bio);
    if (display_name !== undefined) user.profile.display_name = String(display_name).replace(/[<>]/g, '').slice(0, 40);
    if (gender !== undefined && ['m','f','x'].includes(gender)) user.profile.gender = gender;
    if (looking_for !== undefined && ['m','f','x','all'].includes(looking_for)) user.profile.looking_for = looking_for;
    if (city !== undefined) user.profile.city = String(city).replace(/[<>]/g, '').slice(0, 60);
    if (lat !== undefined && lng !== undefined) {
        const la = parseFloat(lat), ln = parseFloat(lng);
        if (Number.isFinite(la) && Number.isFinite(ln) && la >= -90 && la <= 90 && ln >= -180 && ln <= 180) {
            user.profile.lat = la; user.profile.lng = ln;
            user.profile.geo_updated_at = now();
        }
    }
    if (birth_year !== undefined) {
        const y = parseInt(birth_year);
        const thisYear = new Date().getFullYear();
        if (y >= 1925 && y <= thisYear - 18) user.profile.birth_year = y;
    }
    user.updated_at = now();
    markDirty();
    res.json({ ok: true, profile: user.profile });
});

// Feed voci pubbliche: lista profili con almeno 1 clip vocale registrata
// Usato per homepage carousel + schermata Voci full-screen
app.get('/api/voices/feed', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const validStories = (DB.stories || []).filter(s => s.expires_at > now() && s.audio_url);
    const storyById = {};
    validStories.forEach(s => { storyById[s.id] = s; });

    const voices = [];
    for (const user of (DB.users || [])) {
        if (!user.profile?.clips) continue;
        const kv = user.kvData || {};
        const clips = user.profile.clips
            .filter(c => c.audio_id && storyById[c.audio_id])
            .map(c => ({
                slot: c.slot,
                title: c.title,
                duration: c.duration || 0,
                audio_url: storyById[c.audio_id].audio_url,
                mood: storyById[c.audio_id].mood || 'vibe'
            }));
        if (clips.length === 0) continue;
        voices.push({
            userId: user.id,
            username: user.username,
            displayName: kv.name || user.profile?.display_name || user.username,
            face: kv.face || '🎭',
            color: kv.color || '#a855f7',
            city: user.profile?.city || '',
            gender: user.profile?.gender || 'x',
            clips,
            isPremium: !!(kv.isPremium || user.is_premium),
            level: Math.max(1, Math.floor(1 + Math.log2((kv.msgCount || 0) + 1) * 2.2))
        });
    }

    // Ordina per: premium first, poi per ricchezza di clip (3 > 2 > 1), poi shuffle
    voices.sort((a, b) => {
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        if (a.clips.length !== b.clips.length) return b.clips.length - a.clips.length;
        return Math.random() - 0.5;
    });

    res.json({ voices: voices.slice(0, limit), total: voices.length });
});

// Save voice clip — writes file to /uploads/audio, NOT base64 in DB
app.post('/api/profile/clip/save', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    if (!user.profile) user.profile = { avatar_letter: (user.username||'K').charAt(0).toUpperCase(), bio: '', clips: [
        { slot: 0, title: 'Chi sono', audio_id: null, duration: 0 },
        { slot: 1, title: 'Mi piace', audio_id: null, duration: 0 },
        { slot: 2, title: 'Cerco',    audio_id: null, duration: 0 }
    ]};
    if (!user.stats) user.stats = { stories_count: 0, matches_count: 0, likes_received: 0 };

    const { slot, audioData, durationMs, mood } = req.body || {};
    if (slot === undefined || !audioData) return res.status(400).json({ error: 'slot e audioData richiesti' });
    if (slot < 0 || slot > 2) return res.status(400).json({ error: 'slot 0-2' });

    // Parse data URL: "data:audio/webm;base64,..."
    const match = String(audioData).match(/^data:audio\/(webm|ogg|mp4|mpeg|wav);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Formato audio non valido' });
    const ext = match[1] === 'mpeg' ? 'mp3' : match[1];
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length > 2 * 1024 * 1024) return res.status(413).json({ error: 'Audio troppo grande (max 2MB)' });

    const storyId = genId('story');
    const filename = `${storyId}.${ext}`;
    try {
        fs.writeFileSync(path.join(AUDIO_DIR, filename), buf);
    } catch (e) {
        return res.status(500).json({ error: 'Errore salvataggio file' });
    }

    const expiresAt = now() + 24 * 60 * 60 * 1000;
    const story = {
        id: storyId,
        user_id: user.id,
        audio_url: '/uploads/audio/' + filename,
        duration_ms: durationMs || 0,
        mood: mood || 'vibe',
        expires_at: expiresAt,
        created_at: now()
    };
    DB.stories.push(story);

    user.profile.clips[slot] = { slot, title: user.profile.clips[slot]?.title || ['Chi sono','Mi piace','Cerco'][slot], audio_id: story.id, duration: durationMs };
    user.stats.stories_count++;
    user.updated_at = now();
    saveDB(DB);

    res.json({ ok: true, story_id: story.id, clip: user.profile.clips[slot] });
});

// Post story (legacy - backward compatibility)
app.post('/api/stories', verifyToken, (req, res) => {
    const { audioData, durationMs, mood, slot } = req.body || {};
    if (!audioData) return res.status(400).json({ error: 'audioData richiesto' });

    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const expiresAt = now() + 24 * 60 * 60 * 1000;
    const story = {
        id: genId('story'),
        user_id: user.id,
        audio_data: audioData,
        duration_ms: durationMs || 0,
        mood: mood || 'vibe',
        expires_at: expiresAt,
        created_at: now()
    };
    DB.stories.push(story);

    if (slot !== undefined && slot >= 0 && slot <= 2) {
        user.profile.clips[slot] = { slot, title: user.profile.clips[slot].title, audio_id: story.id, duration: durationMs };
    }
    user.stats.stories_count++;
    user.updated_at = now();
    saveDB(DB);

    res.json({ ok: true, storyId: story.id, expiresAt });
});

// Feed stories (non scadute)
app.get('/api/stories', (req, res) => {
    const validStories = DB.stories.filter(s => s.expires_at > now());
    const stories = validStories.map(s => {
        const user = DB.users.find(u => u.id === s.user_id);
        return {
            id: s.id,
            user_id: s.user_id,
            userId: s.user_id,
            username: user ? user.username : 'unknown',
            durationMs: s.duration_ms,
            mood: s.mood,
            createdAt: s.created_at,
            expiresAt: s.expires_at
        };
    }).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
    res.json({ stories });
});

// Get story audio (returns URL if on disk, base64 if legacy)
app.get('/api/stories/:id/audio', (req, res) => {
    const story = DB.stories.find(s => s.id === req.params.id);
    if (!story) return res.status(404).json({ error: 'Story non trovata' });
    if (story.expires_at < now()) return res.status(410).json({ error: 'Story scaduta' });
    res.json({
        audioUrl:  story.audio_url || null,
        audioData: story.audio_url || story.audio_data || null
    });
});

// React to story
app.post('/api/stories/:id/react', (req, res) => {
    const { emoji } = req.body || {};
    if (!emoji) return res.status(400).json({ error: 'emoji richiesta' });
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    
    const existing = DB.reactions.find(r => r.story_id === req.params.id && r.ip_hash === ipHash);
    if (!existing) {
        DB.reactions.push({
            id: DB.reactions.length + 1,
            story_id: req.params.id,
            emoji,
            ip_hash: ipHash,
            created_at: now()
        });
        saveDB(DB);
    }
    
    const count = DB.reactions.filter(r => r.story_id === req.params.id).length;
    res.json({ ok: true, reactions: count });
});

// ============ DUELS ============

// Legacy /api/duels endpoints rimossi — sostituiti da /api/battles (Voice Battles in Arena)

// ============ BITCOIN VERIFY (frontend polling) ============
// Server-side pricing tables — single source of truth
const FRAME_PRICES_EUR = {
    ivory: 0, gold: 3, emerald: 5, ruby: 5, sapphire: 8,
    amethyst: 8, topaz: 12, onyx: 15, platinum: 20, diamond: 50
};
const PREMIUM_PRICES_EUR = { pro: 5, elite: 10, infinity: 20 };

// Cached EUR/BTC rate (CoinGecko, refreshed every 5 min)
let _btcRateEur = 95000;
let _btcRateAt  = 0;
async function getBtcRateEur() {
    const ageMs = Date.now() - _btcRateAt;
    if (ageMs < 5 * 60 * 1000) return _btcRateEur;
    try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
        const d = await r.json();
        if (d?.bitcoin?.eur) { _btcRateEur = d.bitcoin.eur; _btcRateAt = Date.now(); }
    } catch (e) {}
    return _btcRateEur;
}

function grantItemToUser(userId, kind, id) {
    if (kind === 'frame') {
        DB.user_frames = DB.user_frames || {};
        DB.user_frames[userId] = DB.user_frames[userId] || ['ivory'];
        if (!DB.user_frames[userId].includes(id)) DB.user_frames[userId].push(id);
    } else if (kind === 'premium') {
        DB.user_premium = DB.user_premium || {};
        DB.user_premium[userId] = { plan: id, expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    }
    markDirty();
}

// Strict verify: token required, server-side pricing, server-only btc address
app.post('/api/bitcoin/verify', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { kind, id } = req.body || {};
    if (!kind || !id) return res.status(400).json({ confirmed: false, error: 'kind e id richiesti' });

    let priceEur = 0;
    if (kind === 'frame') priceEur = FRAME_PRICES_EUR[id];
    else if (kind === 'premium') priceEur = PREMIUM_PRICES_EUR[id];
    else return res.status(400).json({ confirmed: false, error: 'kind non valido' });

    if (priceEur === undefined) return res.status(400).json({ confirmed: false, error: 'id non valido' });
    if (priceEur === 0) {
        grantItemToUser(userId, kind, id);
        return res.json({ confirmed: true, confirmations: 0, required: 0, free: true });
    }

    const rate = await getBtcRateEur();
    const expectedBtc = parseFloat((priceEur / rate).toFixed(8));

    try {
        const check = await checkBlockchainConfirmations(expectedBtc, BITCOIN_ADDRESS, BITCOIN_MIN_CONFIRMATIONS);
        if (check.verified) {
            DB.bitcoin_payments = DB.bitcoin_payments || [];
            DB.bitcoin_payments.push({
                id: genId('btc'),
                user_id: userId,
                kind, item_id: id,
                price_eur: priceEur,
                btc_amount: expectedBtc,
                btc_address: BITCOIN_ADDRESS,
                tx_hash: check.txHash,
                confirmations: check.confirmations,
                status: 'confirmed',
                confirmed_at: now()
            });
            grantItemToUser(userId, kind, id);
        }
        res.json({
            confirmed: check.verified,
            confirmations: check.confirmations || 0,
            required: BITCOIN_MIN_CONFIRMATIONS,
            expected_btc: expectedBtc
        });
    } catch (e) {
        res.json({ confirmed: false, confirmations: 0, error: e.message });
    }
});

// ============================================================
// KOUVERTE BTC PAYMENTS (anonymous app — no JWT)
// Premium €5/mese = 30gg unlimited + tutte cornici premium
// ============================================================
// Tier pricing (marketing: micro-pack + mensile + annuale)
const KV_TIERS = {
    mini:    { eur: 1,  label: 'Pacchetto Continua', durationDays: 0,   extraMessages: 200 },
    monthly: { eur: 3,  label: 'Premium 30 giorni',  durationDays: 30,  extraMessages: 0 },
    yearly:  { eur: 19, label: 'VIP 1 anno',         durationDays: 365, extraMessages: 0 }
};
// Backward compat
const KV_PREMIUM_PRICE_EUR = KV_TIERS.monthly.eur;

app.post('/api/btc/quote-premium', async (req, res) => {
    const { userId, tier: tierIn } = req.body || {};
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId required' });
    const tier = (tierIn && KV_TIERS[tierIn]) ? tierIn : 'monthly';
    const tierCfg = KV_TIERS[tier];

    const rate = await getBtcRateEur();
    const baseSats = Math.ceil((tierCfg.eur / rate) * 1e8);
    const uniqueSats = baseSats + Math.floor(Math.random() * 500); // 0-499 sats per uniqueness
    const id = 'kv_btc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1h

    DB.kv_btc_invoices = DB.kv_btc_invoices || [];
    // Pulisci invoice scaduti (>24h)
    DB.kv_btc_invoices = DB.kv_btc_invoices.filter(i => Date.now() - i.createdAt < 24 * 60 * 60 * 1000);
    DB.kv_btc_invoices.push({
        id, userId, kind: 'premium', tier, sats: uniqueSats, eur: tierCfg.eur,
        durationDays: tierCfg.durationDays, extraMessages: tierCfg.extraMessages,
        status: 'pending', createdAt: Date.now(), expiresAt
    });
    markDirty();

    res.json({
        id,
        tier,
        tierLabel: tierCfg.label,
        address: BITCOIN_ADDRESS,
        sats: uniqueSats,
        btc: (uniqueSats / 1e8).toFixed(8),
        eur: tierCfg.eur,
        expiresAt,
        requiredConfirmations: BITCOIN_MIN_CONFIRMATIONS
    });
});

app.post('/api/btc/check-status', async (req, res) => {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    DB.kv_btc_invoices = DB.kv_btc_invoices || [];
    const inv = DB.kv_btc_invoices.find(i => i.id === id);
    if (!inv) return res.status(404).json({ status: 'not_found' });
    if (inv.status === 'paid') return res.json({ status: 'paid', activated: true });
    if (Date.now() > inv.expiresAt) {
        inv.status = 'expired';
        markDirty();
        return res.json({ status: 'expired' });
    }

    const btcAmount = (inv.sats / 1e8).toFixed(8);
    try {
        const check = await checkBlockchainConfirmations(btcAmount, BITCOIN_ADDRESS, BITCOIN_MIN_CONFIRMATIONS);
        if (check.found && check.verified) {
            inv.status = 'paid';
            inv.paidAt = Date.now();
            inv.txHash = check.txHash;
            if (inv.kind === 'premium') {
                DB.kv_premium = DB.kv_premium || {};
                DB.kv_premium[inv.userId] = {
                    activatedAt: Date.now(),
                    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
                    invoiceId: id,
                    txHash: check.txHash
                };
            }
            markDirty();
            return res.json({ status: 'paid', activated: true, txHash: check.txHash });
        }
        res.json({
            status: 'pending',
            confirmations: check.confirmations || 0,
            required: BITCOIN_MIN_CONFIRMATIONS
        });
    } catch (e) {
        res.json({ status: 'pending', error: e.message, confirmations: 0 });
    }
});

// ============================================================
// BOT USER STATS — espone referral count e premium status dal bot
// Letto direttamente da Upstash Redis se configurato, altrimenti dal file
// ============================================================
let _redisClient = null;
function getRedisClient(){
    if (_redisClient !== null) return _redisClient;
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        _redisClient = false; // marca come "non disponibile"
        return null;
    }
    try {
        const { Redis } = require('@upstash/redis');
        _redisClient = new Redis({
            url:   process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        return _redisClient;
    } catch(e) { _redisClient = false; return null; }
}

async function readBotDB(){
    const r = getRedisClient();
    if (r) {
        try {
            const data = await r.get('kouverte:bot:db');
            if (data) return typeof data === 'string' ? JSON.parse(data) : data;
        } catch(e) {}
    }
    // Fallback file
    try {
        const p = path.join(__dirname, 'kouverte-bot.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch(e) {}
    return { users: {} };
}

app.get('/api/bot/user-stats', async (req, res) => {
    const chatId = String(req.query.chatId || '').trim();
    if (!chatId || !/^\d+$/.test(chatId)) return res.status(400).json({ error: 'chatId numerico richiesto' });
    try {
        const botDB = await readBotDB();
        const u = botDB.users?.[chatId];
        if (!u) return res.json({ chatId, invited: 0, isPremium: false, ownedFrames: [] });
        res.json({
            chatId,
            invited: (u.invitedUsers || []).length,
            isPremium: !!u.isPremium && (u.premiumExpiry || 0) > Date.now(),
            premiumExpiry: u.premiumExpiry || 0,
            ownedFrames: u.ownedFrames || [],
            joinedAt: u.joinedAt
        });
    } catch(e) {
        res.json({ chatId, invited: 0, isPremium: false, error: e.message });
    }
});

app.get('/api/me/premium-status', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    DB.kv_premium = DB.kv_premium || {};
    const p = DB.kv_premium[userId];
    if (p && Date.now() < p.expiresAt) {
        return res.json({ premium: true, expiresAt: p.expiresAt, activatedAt: p.activatedAt });
    }
    res.json({ premium: false });
});

// ============================================================
// STRIPE PAYMENTS
// ============================================================

// Espone la publishable key al frontend (non è un segreto)
app.get('/api/stripe/config', (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Stripe non configurato. Imposta STRIPE_SECRET_KEY.' });
    res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

// Crea una Checkout Session Stripe
app.post('/api/stripe/create-checkout', rateLimit('stripe-checkout', 10, 15 * 60 * 1000), async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Pagamenti con carta non disponibili al momento.' });
    const { packId, userId } = req.body || {};
    if (!packId || !userId) return res.status(400).json({ error: 'packId e userId richiesti' });
    const pack = STRIPE_PACKS[packId];
    if (!pack) return res.status(400).json({ error: 'Pacchetto non valido' });

    const origin = req.headers.origin || 'https://www.kouverte.com';
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    unit_amount: pack.eur, // già in centesimi
                    product_data: {
                        name: `Kouverte · ${pack.label}`,
                        description: pack.desc,
                        images: ['https://www.kouverte.com/icon-512.png']
                    }
                },
                quantity: 1
            }],
            metadata: { packId, userId, type: pack.type },
            success_url: `${origin}/app.html?stripe_ok=1&pack=${packId}`,
            cancel_url:  `${origin}/app.html?stripe_cancel=1`,
            locale: 'it',
            allow_promotion_codes: true
        });
        res.json({ url: session.url, sessionId: session.id });
    } catch(e) {
        console.error('[Stripe] create-checkout error:', e.message);
        res.status(500).json({ error: 'Errore creazione pagamento: ' + e.message });
    }
});

// Webhook Stripe — deve ricevere il body RAW (non JSON parsato)
// Registrare PRIMA del middleware json() generico usando express.raw()
app.post('/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        if (!stripe) return res.status(503).send('Stripe non configurato');
        const sig = req.headers['stripe-signature'];
        if (!sig || !STRIPE_WEBHOOK_SECRET) {
            console.warn('[Stripe] Webhook ricevuto senza firma o senza secret configurato');
            return res.status(400).send('Webhook signature missing');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch(e) {
            console.error('[Stripe] Webhook signature error:', e.message);
            return res.status(400).send(`Webhook Error: ${e.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { packId, userId, type } = session.metadata || {};
            const pack = STRIPE_PACKS[packId];
            if (!pack || !userId) {
                console.warn('[Stripe] Webhook: metadata mancanti', session.id);
                return res.json({ received: true });
            }

            // Trova utente nel DB
            const user = (DB.users || []).find(u => u.id === userId);
            if (!user) {
                console.warn('[Stripe] Webhook: utente non trovato', userId);
                return res.json({ received: true });
            }

            // Salva transazione
            DB.stripe_payments = DB.stripe_payments || [];
            // Evita doppia esecuzione (idempotenza)
            if (DB.stripe_payments.find(p => p.sessionId === session.id)) {
                return res.json({ received: true });
            }
            DB.stripe_payments.push({
                sessionId: session.id, packId, userId, type: pack.type,
                eur: pack.eur, paidAt: Date.now()
            });

            if (pack.type === 'coins') {
                // Accredita monete
                user.kvData = user.kvData || {};
                user.kvData.coins = (user.kvData.coins || 0) + pack.coins;
                console.log(`[Stripe] +${pack.coins} monete → utente ${userId}`);
            } else if (pack.type === 'premium') {
                // Attiva/prolunga premium
                DB.kv_premium = DB.kv_premium || {};
                const existing = DB.kv_premium[userId];
                const base = (existing && existing.expiresAt > Date.now()) ? existing.expiresAt : Date.now();
                DB.kv_premium[userId] = {
                    activatedAt: Date.now(),
                    expiresAt: base + pack.days * 24 * 60 * 60 * 1000,
                    sessionId: session.id,
                    source: 'stripe'
                };
                user.kvData = user.kvData || {};
                user.kvData.isPremium = true;
                user.kvData.premExpiry = DB.kv_premium[userId].expiresAt;
                console.log(`[Stripe] Premium ${pack.days}gg → utente ${userId}, scade ${new Date(DB.kv_premium[userId].expiresAt).toISOString()}`);
            }
            markDirty();
        }
        res.json({ received: true });
    }
);

// Endpoint sync saldo dopo pagamento Stripe — restituisce coins + premium correnti
app.get('/api/stripe/balance', (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId richiesto' });
    const user = (DB.users || []).find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    const kv = user.kvData || {};
    DB.kv_premium = DB.kv_premium || {};
    const prem = DB.kv_premium[userId];
    const isPremium = !!(kv.isPremium || (prem && prem.expiresAt > Date.now()));
    const premExpiry = isPremium ? (prem?.expiresAt || kv.premExpiry || 0) : 0;
    res.json({ coins: kv.coins || 0, isPremium, premExpiry });
});

// Legacy ownership endpoint (JWT) — left for compat
app.get('/api/me/items', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.user_frames = DB.user_frames || {};
    DB.user_premium = DB.user_premium || {};
    const frames = DB.user_frames[userId] || ['ivory'];
    let premium = DB.user_premium[userId] || null;
    if (premium && premium.expires_at < Date.now()) premium = null;

    // Daily likes left (10/day for free, 100 for premium)
    DB.daily_likes = DB.daily_likes || {};
    const today = new Date().toISOString().slice(0, 10);
    const used = DB.daily_likes[userId]?.[today] || 0;
    const maxLikes = premium ? 100 : 10;
    const daily_likes_left = Math.max(0, maxLikes - used);

    res.json({ frames, premium, daily_likes_left, max_likes: maxLikes });
});

// ============ FEED & LIKE API ============

app.get('/api/users/feed', (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const limit = 20;
    const nowMs = Date.now();
    const thisYear = new Date().getFullYear();

    // Filtri opzionali da query string
    const filterGender = req.query.gender; // 'm' | 'f' | 'x' | undefined
    const ageMin = parseInt(req.query.age_min) || 18;
    const ageMax = parseInt(req.query.age_max) || 99;
    const hasClipOnly = req.query.has_clip === '1';
    const myLat = parseFloat(req.query.lat);
    const myLng = parseFloat(req.query.lng);
    const maxKm = parseInt(req.query.max_km);
    const wantsGeo = Number.isFinite(myLat) && Number.isFinite(myLng) && Number.isFinite(maxKm) && maxKm > 0;

    const haversineKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2-lat1) * Math.PI/180;
        const dLon = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const users = (DB.users || [])
        .filter(u => u.id && u.username && !u.id.startsWith('u_test'))
        .map(u => {
            const clips = (u.profile?.clips || []).filter(c => c.audio_id);
            const activeClip = clips.map(c => DB.stories?.find(s => s.id === c.audio_id && s.expires_at > nowMs)).find(Boolean);
            const age = u.profile?.birth_year ? (thisYear - u.profile.birth_year) : null;
            const distKm = (wantsGeo && Number.isFinite(u.profile?.lat) && Number.isFinite(u.profile?.lng))
                ? haversineKm(myLat, myLng, u.profile.lat, u.profile.lng) : null;
            return {
                id: u.id,
                username: u.username,
                firstName: u.firstName || u.username,
                display_name: u.profile?.display_name || null,
                avatar_letter: u.profile?.avatar_letter || (u.username || 'K').charAt(0).toUpperCase(),
                avatar_url: u.avatar_url || null,
                bio: u.profile?.bio || '',
                gender: u.profile?.gender || null,
                age,
                clip_id: activeClip?.id || null,
                clip_duration: activeClip?.duration_ms || 0,
                likes_received: u.stats?.likes_received || 0,
                city: u.profile?.city || null,
                distance_km: distKm !== null ? Math.round(distKm) : null,
                is_seed: !!u.seed,
                created_at: u.created_at || nowMs
            };
        })
        .filter(u => {
            if (hasClipOnly && !u.clip_id) return false;
            if (filterGender && u.gender && u.gender !== filterGender) return false;
            if (u.age !== null) {
                if (u.age < ageMin || u.age > ageMax) return false;
            }
            if (wantsGeo && u.distance_km !== null && u.distance_km > maxKm) return false;
            return true;
        })
        .sort((a, b) => b.likes_received - a.likes_received || b.created_at - a.created_at);

    // Filter out blocked users (in both directions)
    const token = req.headers.authorization?.split(' ')[1];
    let myId = null;
    if (token) {
        try { myId = jwt.verify(token, JWT_SECRET).userId; } catch(e) {}
    }
    let filtered = users;
    if (myId) {
        DB.blocks = DB.blocks || [];
        const blockedIds = new Set(DB.blocks.filter(b => b.from === myId).map(b => b.to));
        const blockerIds = new Set(DB.blocks.filter(b => b.to === myId).map(b => b.from));
        filtered = users.filter(u => !blockedIds.has(u.id) && !blockerIds.has(u.id) && u.id !== myId);
    }
    const start = page * limit;
    res.json({ users: filtered.slice(start, start + limit), total: filtered.length, has_more: start + limit < filtered.length });
});

app.post('/api/users/:id/like', verifyToken, (req, res) => {
    const fromId = req.user.userId;
    const toId = req.params.id;
    if (fromId === toId) return res.status(400).json({ error: 'Non puoi mettere like a te stesso' });
    const toUser = DB.users.find(u => u.id === toId);
    if (!toUser) return res.status(404).json({ error: 'Utente non trovato' });

    DB.likes = DB.likes || [];
    const idx = DB.likes.findIndex(l => l.from === fromId && l.to === toId);
    if (idx !== -1) {
        DB.likes.splice(idx, 1);
        if (toUser.stats) toUser.stats.likes_received = Math.max(0, (toUser.stats.likes_received || 1) - 1);
        markDirty();
        return res.json({ ok: true, liked: false });
    }
    DB.likes.push({ from: fromId, to: toId, created_at: Date.now() });
    if (!toUser.stats) toUser.stats = {};
    toUser.stats.likes_received = (toUser.stats.likes_received || 0) + 1;

    const fromUser = DB.users.find(u => u.id === fromId);
    const fromName = fromUser?.username || fromUser?.firstName || 'qualcuno';
    const toName   = toUser.username || toUser.firstName || 'utente';

    const match = DB.likes.find(l => l.from === toId && l.to === fromId);
    if (match) {
        DB.matches = DB.matches || [];
        const exists = DB.matches.find(m => (m.u1===fromId&&m.u2===toId)||(m.u1===toId&&m.u2===fromId));
        if (!exists) DB.matches.push({ id: genId('match'), u1: fromId, u2: toId, created_at: Date.now() });
        notifyTelegramUser(fromId, `🎉 Match con ${toName}! Apri Kouverte per scrivere.`);
        notifyTelegramUser(toId,   `🎉 Match con ${fromName}! Apri Kouverte per scrivere.`);
        pushToUser(fromId, { title: '💘 Match!', body: `Hai fatto match con ${toName}! Inizia a chattare.`, url: '/app.html?tab=matches', tag: 'match-new' });
        pushToUser(toId,   { title: '💘 Match!', body: `${fromName} ha fatto match con te! Scriviti.`, url: '/app.html?tab=matches', tag: 'match-new' });
        // Realtime in-app match event to the OTHER user (the one who liked first earlier)
        const otherSocketId = activeCalls.get(toId);
        if (otherSocketId) io.to(otherSocketId).emit('match:new', { userId: fromId, username: fromName });
    } else {
        notifyTelegramUser(toId, `❤️ ${fromName} ti ha messo like su Kouverte!`);
    }
    markDirty();
    res.json({ ok: true, liked: true, match: !!match });
});

app.get('/api/users/:id/liked-by-me', verifyToken, (req, res) => {
    DB.likes = DB.likes || [];
    const liked = !!DB.likes.find(l => l.from === req.user.userId && l.to === req.params.id);
    res.json({ liked });
});

// ============ TELEGRAM NOTIFICATIONS QUEUE ============
const BOT_NOTIFY_SECRET = process.env.BOT_NOTIFY_SECRET || 'kouverte-internal';

// ── Notifica privata solo a @losangelesbroker ─────────────────────────────
// Imposta ADMIN_TELEGRAM_ID nelle env vars di Render con il tuo chat ID Telegram.
// Per trovarlo: scrivi /myid al bot @Kouverte_bot
function notifyAdminNewUser(user) {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    const token   = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!adminId || !token) return;
    const totalUsers = DB.users ? DB.users.length : '?';
    const text = `👤 *Nuovo utente iscritto!*\n\n` +
        `🏷 @${user.username}\n` +
        `📧 ${user.email.replace(/(.{2}).*(@.*)/, '$1***$2')}\n` +
        `📅 ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}\n` +
        `👥 Totale iscritti: *${totalUsers}*`;
    _tgApiPost(token, 'sendMessage', { chat_id: adminId, text, parse_mode: 'Markdown' });
}

function _tgApiPost(token, method, payload) {
    try {
        const https = require('https');
        const body  = JSON.stringify(payload);
        const req   = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${token}/${method}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, () => {});
        req.on('error', e => console.error('[ADMIN_NOTIFY]', e.message));
        req.write(body);
        req.end();
    } catch(e) { console.error('[ADMIN_NOTIFY]', e.message); }
}

function notifyTelegramUser(userId, message) {
    const user = DB.users?.find(u => u.id === userId);
    if (!user) return;
    const telegramId = user.telegramId || (typeof user.id === 'string' && user.id.startsWith('tg_') ? user.id.slice(3) : null);
    if (!telegramId) return;
    DB.pending_notifications = DB.pending_notifications || [];
    DB.pending_notifications.push({ telegram_id: telegramId, message, created_at: Date.now() });
    markDirty();
}

// Bot polls this every 30s to fetch & flush notifications
app.get('/api/notifications/pending', (req, res) => {
    const secret = req.headers['x-bot-secret'];
    if (secret !== BOT_NOTIFY_SECRET) return res.status(403).json({ error: 'Forbidden' });
    const pending = DB.pending_notifications || [];
    DB.pending_notifications = [];
    if (pending.length) markDirty();
    res.json({ notifications: pending });
});

// ============ BLOCK / REPORT API ============

app.post('/api/users/:id/block', verifyToken, (req, res) => {
    const fromId = req.user.userId;
    const toId = req.params.id;
    if (fromId === toId) return res.status(400).json({ error: 'Non puoi bloccare te stesso' });
    DB.blocks = DB.blocks || [];
    const exists = DB.blocks.find(b => b.from === fromId && b.to === toId);
    if (exists) {
        DB.blocks = DB.blocks.filter(b => !(b.from === fromId && b.to === toId));
        markDirty();
        return res.json({ ok: true, blocked: false });
    }
    DB.blocks.push({ from: fromId, to: toId, created_at: Date.now() });
    DB.likes = (DB.likes || []).filter(l => !((l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId)));
    DB.matches = (DB.matches || []).filter(m => !((m.u1 === fromId && m.u2 === toId) || (m.u1 === toId && m.u2 === fromId)));
    markDirty();
    res.json({ ok: true, blocked: true });
});

app.post('/api/users/:id/report', verifyToken, (req, res) => {
    const fromId = req.user.userId;
    const toId = req.params.id;
    const { reason } = req.body || {};
    if (!reason || typeof reason !== 'string') return res.status(400).json({ error: 'Motivo richiesto' });
    DB.reports = DB.reports || [];
    DB.reports.push({
        id: genId('rep'),
        from: fromId, to: toId,
        reason: String(reason).replace(/[<>]/g, '').slice(0, 500),
        created_at: Date.now(),
        status: 'pending'
    });
    markDirty();
    res.json({ ok: true });
});

// ============ MATCH INBOX & MESSAGES ============

app.get('/api/matches', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.matches = DB.matches || [];
    DB.match_messages = DB.match_messages || {};
    const myMatches = DB.matches
        .filter(m => m.u1 === userId || m.u2 === userId)
        .map(m => {
            const otherId = m.u1 === userId ? m.u2 : m.u1;
            const other = DB.users.find(u => u.id === otherId);
            if (!other) return null;
            const msgs = DB.match_messages[m.id] || [];
            const lastMsg = msgs[msgs.length - 1];
            return {
                match_id: m.id,
                user_id: otherId,
                username: other.username || other.firstName || 'utente',
                avatar_letter: other.profile?.avatar_letter || (other.username || 'K').charAt(0).toUpperCase(),
                created_at: m.created_at,
                last_message: lastMsg?.text || null,
                last_message_at: lastMsg?.created_at || m.created_at,
                unread: msgs.filter(x => x.from !== userId && !x.read_by?.includes(userId)).length
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.last_message_at - a.last_message_at);
    res.json({ matches: myMatches });
});

app.get('/api/matches/:matchId/messages', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const match = (DB.matches || []).find(m => m.id === req.params.matchId);
    if (!match || (match.u1 !== userId && match.u2 !== userId)) return res.status(404).json({ error: 'Match non trovato' });
    DB.match_messages = DB.match_messages || {};
    const msgs = DB.match_messages[req.params.matchId] || [];
    let dirty = false;
    msgs.forEach(m => {
        if (m.from !== userId) {
            m.read_by = m.read_by || [];
            if (!m.read_by.includes(userId)) { m.read_by.push(userId); dirty = true; }
        }
    });
    if (dirty) markDirty();
    res.json({ messages: msgs });
});

app.post('/api/matches/:matchId/messages', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Testo richiesto' });
    if (text.length > 1000) return res.status(400).json({ error: 'Messaggio troppo lungo' });

    const match = (DB.matches || []).find(m => m.id === req.params.matchId);
    if (!match || (match.u1 !== userId && match.u2 !== userId)) return res.status(404).json({ error: 'Match non trovato' });

    DB.match_messages = DB.match_messages || {};
    DB.match_messages[req.params.matchId] = DB.match_messages[req.params.matchId] || [];
    const msg = {
        id: genId('mm'),
        match_id: req.params.matchId,
        from: userId,
        text: text.trim().replace(/[<>]/g, '').slice(0, 1000),
        created_at: now(),
        read_by: [userId]
    };
    DB.match_messages[req.params.matchId].push(msg);

    const otherId = match.u1 === userId ? match.u2 : match.u1;
    const fromUser = DB.users.find(u => u.id === userId);
    const fromName = fromUser?.username || fromUser?.firstName || 'qualcuno';
    notifyTelegramUser(otherId, `💬 ${fromName}: "${msg.text.slice(0, 80)}"`);
    pushToUser(otherId, { title: `💬 ${fromName}`, body: msg.text.slice(0, 100), url: '/app.html?tab=matches', tag: 'match-msg' });

    markDirty();
    res.json({ ok: true, message: msg });
});

// ============ VOICE BATTLES (Arena) ============
// Sats-based 1v1 voice battles. Spectators pay sats to boost their favorite.
// Pot distribution: winner 70%, loser 20%, platform 10%.

const BATTLE_DURATION_MS = 3 * 60 * 1000; // 3 min
const BOOST_TIERS = { 10: 10, 50: 50, 200: 200 }; // sats
const battleTimers = new Map();

function getBalance(userId) {
    DB.user_balance = DB.user_balance || {};
    return DB.user_balance[userId] || 0;
}
function addBalance(userId, sats) {
    DB.user_balance = DB.user_balance || {};
    DB.user_balance[userId] = (DB.user_balance[userId] || 0) + sats;
    markDirty();
}
function deductBalance(userId, sats) {
    DB.user_balance = DB.user_balance || {};
    const cur = DB.user_balance[userId] || 0;
    if (cur < sats) return false;
    DB.user_balance[userId] = cur - sats;
    markDirty();
    return true;
}

function publicBattle(b) {
    if (!b) return null;
    const uA = DB.users.find(u => u.id === b.userA);
    const uB = DB.users.find(u => u.id === b.userB);
    const champ = (u) => !!(u && u.champion_until && u.champion_until > now());
    return {
        id: b.id,
        status: b.status,
        userA: uA ? { id: uA.id, username: uA.username, firstName: uA.firstName, avatarFrame: uA.avatarFrame, is_champion: champ(uA), wins: uA.battle_wins || 0, losses: uA.battle_losses || 0 } : null,
        userB: uB ? { id: uB.id, username: uB.username, firstName: uB.firstName, avatarFrame: uB.avatarFrame, is_champion: champ(uB), wins: uB.battle_wins || 0, losses: uB.battle_losses || 0 } : null,
        scoreA: b.scoreA || 0,
        scoreB: b.scoreB || 0,
        pot: (b.scoreA || 0) + (b.scoreB || 0),
        startedAt: b.startedAt,
        endsAt: b.endsAt,
        winnerId: b.winnerId || null,
        boostsCount: (b.boosts || []).length
    };
}

const CHAMPION_DURATION_MS = 24 * 60 * 60 * 1000;
function endBattle(battleId) {
    DB.battles = DB.battles || [];
    const b = DB.battles.find(x => x.id === battleId);
    if (!b || b.status !== 'live') return;
    b.status = 'ended';
    b.endedAt = now();
    const pot = (b.scoreA || 0) + (b.scoreB || 0);
    let winnerId = null, loserId = null;
    if (b.scoreA > b.scoreB) { winnerId = b.userA; loserId = b.userB; }
    else if (b.scoreB > b.scoreA) { winnerId = b.userB; loserId = b.userA; }
    b.winnerId = winnerId;
    if (winnerId) {
        const winnerCut = Math.floor(pot * 0.70);
        const loserCut = Math.floor(pot * 0.20);
        addBalance(winnerId, winnerCut);
        if (loserId) addBalance(loserId, loserCut);
        b.payout = { winner: winnerCut, loser: loserCut, platform: pot - winnerCut - loserCut };
        // W/L stats + Champion badge
        const winner = DB.users.find(u => u.id === winnerId);
        const loser = DB.users.find(u => u.id === loserId);
        if (winner) { winner.battle_wins = (winner.battle_wins || 0) + 1; winner.champion_until = now() + CHAMPION_DURATION_MS; }
        if (loser) { loser.battle_losses = (loser.battle_losses || 0) + 1; }
        const winName = winner?.firstName || 'qualcuno';
        notifyTelegramUser(winnerId, `👑 Hai vinto la battle! +${winnerCut} sats · Champion badge 24h attivo`);
        if (loserId) notifyTelegramUser(loserId, `⚔️ Battle finita. Consolation: +${loserCut} sats`);
    } else {
        // Pareggio o nessun boost: rimborso 100% ai partecipanti su pot diviso
        if (pot > 0) {
            const half = Math.floor(pot / 2);
            addBalance(b.userA, half);
            addBalance(b.userB, pot - half);
        }
        b.payout = { tie: true };
    }
    markDirty();
    if (battleTimers.has(battleId)) {
        clearTimeout(battleTimers.get(battleId));
        battleTimers.delete(battleId);
    }
    io.to('battle-' + battleId).emit('battle:ended', publicBattle(b));
}

// Get my sats balance
app.get('/api/me/balance', verifyToken, (req, res) => {
    res.json({ ok: true, sats: getBalance(req.user.userId) });
});

// Create battle invite
app.post('/api/battles/create', verifyToken, rateLimit('battle-create', 10, 60 * 60 * 1000), (req, res) => {
    const userId = req.user.userId;
    const { opponentId } = req.body || {};
    if (!opponentId || opponentId === userId) return res.status(400).json({ error: 'Avversario non valido' });
    const opp = DB.users.find(u => u.id === opponentId);
    if (!opp) return res.status(404).json({ error: 'Avversario non trovato' });
    DB.battles = DB.battles || [];
    // Already pending/live between these two?
    const existing = DB.battles.find(b =>
        (b.status === 'pending' || b.status === 'live') &&
        ((b.userA === userId && b.userB === opponentId) || (b.userA === opponentId && b.userB === userId))
    );
    if (existing) return res.status(409).json({ error: 'Battle già in corso con questo utente', battle: publicBattle(existing) });
    const battle = {
        id: genId('battle'),
        userA: userId,
        userB: opponentId,
        scoreA: 0,
        scoreB: 0,
        boosts: [],
        status: 'pending',
        createdAt: now()
    };
    DB.battles.push(battle);
    markDirty();
    const fromName = DB.users.find(u => u.id === userId)?.firstName || 'qualcuno';
    notifyTelegramUser(opponentId, `⚔️ ${fromName} ti ha sfidato in una Voice Battle! Apri Kouverte per accettare.`);
    // Realtime in-app notif via socket
    const oppSocketId = activeCalls.get(opponentId);
    if (oppSocketId) io.to(oppSocketId).emit('battle:invited', { battleId: battle.id, fromName, fromUserId: userId });
    res.json({ ok: true, battle: publicBattle(battle) });
});

// Accept battle → goes live, auto-end after BATTLE_DURATION_MS
app.post('/api/battles/:id/accept', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.battles = DB.battles || [];
    const b = DB.battles.find(x => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: 'Battle non trovata' });
    if (b.userB !== userId) return res.status(403).json({ error: 'Non sei l\'avversario' });
    if (b.status !== 'pending') return res.status(400).json({ error: 'Battle non in attesa' });
    b.status = 'live';
    b.startedAt = now();
    b.endsAt = b.startedAt + BATTLE_DURATION_MS;
    markDirty();
    battleTimers.set(b.id, setTimeout(() => endBattle(b.id), BATTLE_DURATION_MS));
    io.to('battle-' + b.id).emit('battle:started', publicBattle(b));
    res.json({ ok: true, battle: publicBattle(b) });
});

// Creator cancels their own pending invite
app.post('/api/battles/:id/cancel', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.battles = DB.battles || [];
    const b = DB.battles.find(x => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: 'Battle non trovata' });
    if (b.userA !== userId) return res.status(403).json({ error: 'Solo il creatore può cancellare' });
    if (b.status !== 'pending') return res.status(400).json({ error: 'Solo battle in attesa' });
    b.status = 'cancelled';
    markDirty();
    res.json({ ok: true });
});

app.post('/api/battles/:id/decline', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.battles = DB.battles || [];
    const b = DB.battles.find(x => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: 'Battle non trovata' });
    if (b.userB !== userId && b.userA !== userId) return res.status(403).json({ error: 'Non autorizzato' });
    if (b.status !== 'pending') return res.status(400).json({ error: 'Battle non in attesa' });
    b.status = 'declined';
    markDirty();
    res.json({ ok: true });
});

// List live battles
app.get('/api/battles/live', (req, res) => {
    DB.battles = DB.battles || [];
    const live = DB.battles.filter(b => b.status === 'live').map(publicBattle);
    res.json({ ok: true, battles: live });
});

// My pending invites (as opponent)
app.get('/api/battles/pending', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.battles = DB.battles || [];
    const pending = DB.battles
        .filter(b => b.status === 'pending' && b.userB === userId)
        .map(publicBattle);
    res.json({ ok: true, battles: pending });
});

// My outgoing pending invites (as creator)
app.get('/api/battles/outgoing', verifyToken, (req, res) => {
    const userId = req.user.userId;
    DB.battles = DB.battles || [];
    const outgoing = DB.battles
        .filter(b => b.status === 'pending' && b.userA === userId)
        .map(publicBattle);
    res.json({ ok: true, battles: outgoing });
});

app.get('/api/battles/:id', (req, res) => {
    DB.battles = DB.battles || [];
    const b = DB.battles.find(x => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: 'Battle non trovata' });
    res.json({ ok: true, battle: publicBattle(b) });
});

// Convert existing internal credits → sats (1 credit = 5000 sats)
const CREDITS_TO_SATS = 5000;
app.post('/api/sats/convert-credits', verifyToken, rateLimit('sats-convert', 20, 60 * 60 * 1000), (req, res) => {
    const userId = req.user.userId;
    const { credits } = req.body || {};
    const c = Number(credits);
    if (!Number.isFinite(c) || c <= 0 || c > 10000) return res.status(400).json({ error: 'Crediti non validi (1-10000)' });
    let row = DB.user_credits.find(r => r.user_id === userId);
    if (!row || row.credits < c) return res.status(402).json({ error: 'Crediti insufficienti' });
    row.credits -= c;
    row.updated_at = now();
    const sats = c * CREDITS_TO_SATS;
    addBalance(userId, sats);
    DB.transactions = DB.transactions || [];
    DB.transactions.push({ id: genId('txn'), user_id: userId, type: 'sats_convert', credits: -c, sats: +sats, created_at: now() });
    markDirty();
    res.json({ ok: true, sats: getBalance(userId), credits: row.credits, converted: sats });
});

// Topup sats via BTC — creates a pending payment with kind='sats'
// Tier-based: 1000/5000/25000 sats. Rate fissa: 1 sat = 0.00000001 BTC + 5% markup piattaforma.
const SATS_PACKS = {
    1000:  { sats: 1000,  btc: '0.00001050' },
    5000:  { sats: 5000,  btc: '0.00005250' },
    25000: { sats: 25000, btc: '0.00026250' }
};
app.post('/api/sats/topup-btc', verifyToken, rateLimit('sats-topup', 10, 60 * 60 * 1000), (req, res) => {
    const userId = req.user.userId;
    const { pack } = req.body || {};
    const p = SATS_PACKS[Number(pack)];
    if (!p) return res.status(400).json({ error: 'Pack non valido (1000/5000/25000)' });
    const paymentId = genId('btc_sats');
    const expiresAt = now() + 15 * 60 * 1000;
    if (!DB.bitcoin_payments) DB.bitcoin_payments = [];
    DB.bitcoin_payments.push({
        id: paymentId,
        user_id: userId,
        kind: 'sats',
        sats_requested: p.sats,
        btc_amount: p.btc,
        status: 'pending',
        created_at: now(),
        expires_at: expiresAt
    });
    markDirty();
    const paymentUri = `bitcoin:${BITCOIN_ADDRESS}?amount=${p.btc}&label=Kouverte%20Sats&message=Topup%20${paymentId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUri)}`;
    res.json({
        paymentId,
        btcAddress: BITCOIN_ADDRESS,
        btcAmount: p.btc,
        sats: p.sats,
        qrCodeUrl,
        expiresAt,
        instructions: `Invia ${p.btc} BTC entro 15 min per ricevere ${p.sats} sats`
    });
});

// ============ LIGHTNING NETWORK (LNbits) ============
const lightning = require('./lightning-service.js');

// Crea invoice LN per topup sats (immediato dopo pagamento)
app.post('/api/sats/topup-ln', verifyToken, rateLimit('sats-ln', 15, 60 * 60 * 1000), async (req, res) => {
    if (!lightning.ENABLED) return res.status(503).json({ error: 'Lightning non attivo. Imposta LNBITS_URL/LNBITS_INVOICE_KEY/LIGHTNING_ENABLED=1.' });
    const userId = req.user.userId;
    const { pack } = req.body || {};
    const p = SATS_PACKS[Number(pack)];
    if (!p) return res.status(400).json({ error: 'Pack non valido' });
    try {
        const inv = await lightning.createInvoice(p.sats, `Kouverte topup ${p.sats} sats`);
        const paymentId = genId('ln_sats');
        DB.bitcoin_payments = DB.bitcoin_payments || [];
        DB.bitcoin_payments.push({
            id: paymentId,
            user_id: userId,
            kind: 'sats_ln',
            sats_requested: p.sats,
            bolt11: inv.bolt11,
            payment_hash: inv.paymentHash,
            status: 'pending',
            created_at: now(),
            expires_at: now() + 60 * 60 * 1000 // 1h
        });
        markDirty();
        res.json({ paymentId, bolt11: inv.bolt11, sats: p.sats });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Polling status invoice LN
app.get('/api/sats/topup-ln/:paymentId', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const payment = (DB.bitcoin_payments || []).find(p => p.id === req.params.paymentId && p.user_id === userId);
    if (!payment) return res.status(404).json({ error: 'Pagamento non trovato' });
    if (payment.status === 'confirmed') return res.json({ status: 'confirmed', sats: payment.sats_requested });
    try {
        const r = await lightning.checkInvoice(payment.payment_hash);
        if (r.paid) {
            addBalance(userId, payment.sats_requested);
            payment.status = 'confirmed';
            payment.confirmed_at = now();
            DB.transactions = DB.transactions || [];
            DB.transactions.push({
                id: genId('txn'), user_id: userId, type: 'lightning_sats',
                sats: payment.sats_requested, status: 'completed', created_at: now()
            });
            markDirty();
            notifyTelegramUser(userId, `⚡ Topup LN confermato: +${payment.sats_requested} sats istantanei.`);
            return res.json({ status: 'confirmed', sats: payment.sats_requested });
        }
        return res.json({ status: 'pending' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Boost: deduct sats from spectator balance, add to chosen side score
const MAX_BOOST_PER_USER_PER_BATTLE = 5000; // anti-whale: 5k sats max per spettatore per battle
app.post('/api/battles/:id/boost', verifyToken, rateLimit('battle-boost', 60, 60 * 1000), (req, res) => {
    const userId = req.user.userId;
    const { side, amount } = req.body || {};
    const sats = Number(amount);
    if (!BOOST_TIERS[sats]) return res.status(400).json({ error: 'Tier boost non valido (10/50/200)' });
    if (side !== 'A' && side !== 'B') return res.status(400).json({ error: 'Lato non valido' });
    DB.battles = DB.battles || [];
    const b = DB.battles.find(x => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: 'Battle non trovata' });
    if (b.status !== 'live') return res.status(400).json({ error: 'Battle non attiva' });
    if (userId === b.userA || userId === b.userB) return res.status(403).json({ error: 'I partecipanti non possono boostare' });
    // Anti-cheat: cap sats per utente per battle
    const myBoosted = (b.boosts || []).filter(x => x.userId === userId).reduce((a, x) => a + (x.amount || 0), 0);
    if (myBoosted + sats > MAX_BOOST_PER_USER_PER_BATTLE) {
        return res.status(403).json({ error: `Limite raggiunto: max ${MAX_BOOST_PER_USER_PER_BATTLE} sats per battle (boostato finora: ${myBoosted})` });
    }
    if (!deductBalance(userId, sats)) return res.status(402).json({ error: 'Saldo sats insufficiente' });
    if (side === 'A') b.scoreA = (b.scoreA || 0) + sats;
    else b.scoreB = (b.scoreB || 0) + sats;
    b.boosts = b.boosts || [];
    b.boosts.push({ userId, side, amount: sats, at: now() });
    markDirty();
    io.to('battle-' + b.id).emit('battle:boost', { battleId: b.id, side, amount: sats, scoreA: b.scoreA, scoreB: b.scoreB, byUserId: userId });
    res.json({ ok: true, scoreA: b.scoreA, scoreB: b.scoreB, balance: getBalance(userId) });
});

// ============ SHOP API ============

// FIX: protetto da verifyToken — usa userId dal token, mai dal body/query
app.get('/api/shop/credits', verifyToken, (req, res) => {
    const userId = req.user.userId;
    let row = DB.user_credits.find(c => c.user_id === userId);

    if (!row) {
        // Sincronizza da user.credits se la tabella user_credits non esiste
        const user = DB.users.find(u => u.id === userId);
        const initialCredits = user?.credits || 0;
        row = { user_id: userId, credits: initialCredits, updated_at: now() };
        DB.user_credits.push(row);
        markDirty();
    }
    res.json({ credits: row.credits });
});

// FIX: protetto da verifyToken + mutex per prevenire double-spend
app.post('/api/shop/buy', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId richiesto' });

    try {
        const result = await withUserLock(userId, () => {
            const product = DB.shop_products.find(p => p.id === productId && p.active !== false);
            if (!product) return { status: 404, body: { error: 'Prodotto non trovato' } };

            let creditsRow = DB.user_credits.find(c => c.user_id === userId);
            if (!creditsRow) {
                creditsRow = { user_id: userId, credits: 0, updated_at: now() };
                DB.user_credits.push(creditsRow);
            }

            if (creditsRow.credits < product.price_credits) {
                return { status: 402, body: { error: 'Crediti insufficienti', needed: product.price_credits, available: creditsRow.credits } };
            }

            creditsRow.credits -= product.price_credits;
            creditsRow.updated_at = now();

            let expiresAt = null;
            if (product.item_type === 'vip_month') expiresAt = now() + 30 * 24 * 60 * 60 * 1000;
            if (product.item_type === 'boost_2h') expiresAt = now() + 2 * 60 * 60 * 1000;

            const invId = genId('inv');
            DB.user_inventory.push({
                id: invId,
                user_id: userId,
                product_id: productId,
                purchased_at: now(),
                expires_at: expiresAt,
                active: 1
            });

            DB.transactions.push({
                id: genId('txn'),
                user_id: userId,
                product_id: productId,
                amount_cents: product.price_credits * 100,
                currency: 'EUR',
                status: 'completed',
                created_at: now()
            });

            saveDB(DB);
            return { status: 200, body: { ok: true, inventoryId: invId, remainingCredits: creditsRow.credits, product: product.name } };
        });
        return res.status(result.status).json(result.body);
    } catch(e) {
        return res.status(500).json({ error: 'Errore acquisto' });
    }
});

// ============ BITCOIN PAYMENT API ============

app.post('/api/shop/bitcoin-payment', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const { credits } = req.body || {};

    if (!credits || credits <= 0 || credits > 100000) {
        return res.status(400).json({ error: 'Crediti non validi' });
    }

    const btcAmount = (credits * BTC_RATE).toFixed(8);
    const paymentId = genId('btc_pay');
    const expiresAt = now() + 15 * 60 * 1000; // 15 minuti

    // Salva la richiesta di pagamento
    if (!DB.bitcoin_payments) DB.bitcoin_payments = [];
    DB.bitcoin_payments.push({
        id: paymentId,
        user_id: userId,
        credits_requested: credits,
        btc_amount: btcAmount,
        status: 'pending',
        created_at: now(),
        expires_at: expiresAt
    });
    markDirty();

    // URL per il QR code con lightning/onchain
    const paymentUri = `bitcoin:${BITCOIN_ADDRESS}?amount=${btcAmount}&label=Kouverte%20Vox&message=Payment%20${paymentId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUri)}`;

    res.json({
        paymentId,
        btcAddress: BITCOIN_ADDRESS,
        btcAmount,
        credits,
        qrCodeUrl,
        expiresAt,
        instructions: `Invia esattamente ${btcAmount} BTC a ${BITCOIN_ADDRESS} entro 15 minuti`
    });
});

app.get('/api/shop/bitcoin-status/:paymentId', verifyToken, (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.userId;

    if (!DB.bitcoin_payments) DB.bitcoin_payments = [];
    const payment = DB.bitcoin_payments.find(p => p.id === paymentId && p.user_id === userId);

    if (!payment) {
        return res.status(404).json({ error: 'Pagamento non trovato' });
    }

    res.json({
        id: payment.id,
        status: payment.status,
        btcAmount: payment.btc_amount,
        credits: payment.credits_requested,
        expiresAt: payment.expires_at,
        confirmedAt: payment.confirmed_at || null
    });
});

// ═══════════════════════════════════════════════���════════════════
// ██  CLAN API  ██
// ═══════════════════���═══════════════════════════��════════════════
function _saveClanDB(){if(!DB.clans)DB.clans=[];saveDB();}

app.get('/api/clans',(req,res)=>{
    if(!DB.clans)DB.clans=[];
    const clans=DB.clans.map(c=>({id:c.id,name:c.name,tag:c.tag,emoji:c.emoji,memberCount:(c.members||[]).length,xp:c.xp||0}));
    clans.sort((a,b)=>b.xp-a.xp);
    res.json({clans:clans.slice(0,20)});
});

app.post('/api/clans/create',(req,res)=>{
    const {name,tag,emoji,userId}=req.body||{};
    if(!name||!tag||!userId)return res.status(400).json({error:'Dati mancanti'});
    if(!DB.clans)DB.clans=[];
    if(DB.clans.find(c=>c.tag.toUpperCase()===tag.toUpperCase()))return res.status(409).json({error:'Tag già in uso'});
    const existing=DB.clans.find(c=>(c.members||[]).includes(userId));
    if(existing)return res.status(409).json({error:'Sei già in un clan'});
    const clan={id:'clan_'+Date.now(),name:name.slice(0,20),tag:tag.slice(0,4).toUpperCase(),emoji:emoji||'⚔️',ownerId:userId,members:[userId],xp:0,createdAt:Date.now()};
    DB.clans.push(clan);_saveClanDB();
    res.json({id:clan.id,name:clan.name,tag:clan.tag,emoji:clan.emoji});
});

app.post('/api/clans/join',(req,res)=>{
    const {clanId,userId}=req.body||{};
    if(!clanId||!userId)return res.status(400).json({error:'Dati mancanti'});
    if(!DB.clans)DB.clans=[];
    const existing=DB.clans.find(c=>(c.members||[]).includes(userId));
    if(existing)return res.status(409).json({error:'Sei già in un clan. Esci prima.'});
    const clan=DB.clans.find(c=>c.id===clanId);
    if(!clan)return res.status(404).json({error:'Clan non trovato'});
    clan.members=clan.members||[];
    clan.members.push(userId);_saveClanDB();
    res.json({ok:true});
});

app.post('/api/clans/leave',(req,res)=>{
    const {userId}=req.body||{};
    if(!DB.clans||!userId)return res.json({ok:true});
    DB.clans.forEach(c=>{c.members=(c.members||[]).filter(id=>id!==userId);});
    // rimuovi clan vuoti
    DB.clans=DB.clans.filter(c=>(c.members||[]).length>0);
    _saveClanDB();res.json({ok:true});
});


// ── Verifica abbonamento 1€/mese via TxID ────────────────────────────────
app.post('/api/shop/verify-sub', async (req, res) => {
    const { txid } = req.body || {};
    if (!txid || txid.length < 20) {
        return res.status(400).json({ ok: false, error: 'TxID non valido' });
    }
    const SUB_ADDRESS = 'bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00';
    const SUB_MIN_SAT = 1200; // 0.000012 BTC ≈ 1€
    try {
        const txUrl = `https://blockstream.info/api/tx/${txid.trim()}`;
        const txRes = await fetch(txUrl);
        if (!txRes.ok) {
            return res.json({ ok: false, error: 'Transazione non trovata sulla blockchain' });
        }
        const tx = await txRes.json();
        if (!tx.status || !tx.status.confirmed) {
            return res.json({ ok: false, error: 'Transazione non ancora confermata, riprova tra qualche minuto' });
        }
        const out = (tx.vout || []).find(o =>
            o.scriptpubkey_address === SUB_ADDRESS && o.value >= SUB_MIN_SAT
        );
        if (!out) {
            return res.json({ ok: false, error: `Nessun output per ${SUB_ADDRESS} con importo ≥ ${SUB_MIN_SAT} satoshi` });
        }
        // Registra l'uso del txid per prevenire riuso
        if (!DB.sub_txids) DB.sub_txids = {};
        if (DB.sub_txids[txid]) {
            return res.json({ ok: false, error: 'Questa transazione è già stata usata per un abbonamento' });
        }
        DB.sub_txids[txid] = { usedAt: Date.now(), address: SUB_ADDRESS };
        saveDB();
        return res.json({ ok: true });
    } catch(e) {
        console.error('verify-sub error:', e.message);
        return res.status(500).json({ ok: false, error: 'Errore server durante la verifica' });
    }
});

// ── DM INBOX (REST) ──────────────────────────────────────────────────────────
app.get('/api/dm/inbox', (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId richiesto' });
    const uid = userId.slice(0, 60);
    DB.dm_messages = DB.dm_messages || [];
    const mine = DB.dm_messages.filter(m => m.from === uid || m.to === uid);
    const convMap = {};
    mine.forEach(m => {
        const partnerId = m.from === uid ? m.to : m.from;
        const key = m.key || [uid, partnerId].sort().join('_');
        if (!convMap[key]) convMap[key] = { partnerId, messages: [] };
        convMap[key].messages.push(m);
    });
    const convs = Object.values(convMap).map(c => {
        const msgs = c.messages.sort((a, b) => a.ts - b.ts);
        const last = msgs[msgs.length - 1];
        const partnerMsg = msgs.find(m => m.from === c.partnerId);
        return {
            partnerId: c.partnerId,
            partnerName: (partnerMsg?.fromName || last?.fromName || 'Anonimo').slice(0, 30),
            partnerFace: (partnerMsg?.fromFace || last?.fromFace || '🎭').slice(0, 4),
            lastText: (last?.text || '').slice(0, 80),
            lastTs: last?.ts || 0,
            msgCount: msgs.length
        };
    }).sort((a, b) => b.lastTs - a.lastTs).slice(0, 50);
    res.json({ ok: true, convs });
});

// ── COIN LEADERBOARD ─────────────────────────────────────────────────────────
app.post('/api/coin-score', (req, res) => {
    const { userId, name, face, score } = req.body || {};
    if (!userId || score === undefined) return res.status(400).json({ error: 'userId e score richiesti' });
    DB.coin_lb = DB.coin_lb || [];
    const sc = parseInt(score) || 0;
    const idx = DB.coin_lb.findIndex(e => e.userId === userId);
    const entry = { userId, name: String(name || 'Anonimo').slice(0, 20), face: String(face || '🎭').slice(0, 4), score: sc, updatedAt: Date.now() };
    if (idx >= 0) DB.coin_lb[idx] = entry;
    else DB.coin_lb.push(entry);
    markDirty();
    res.json({ ok: true });
});
app.get('/api/coin-leaderboard', (req, res) => {
    DB.coin_lb = DB.coin_lb || [];
    const top = [...DB.coin_lb].sort((a, b) => b.score - a.score).slice(0, 20);
    res.json({ ok: true, top });
});

// ── TORNEO SETTIMANALE ────────────────────────────────────────────────────────
const TORNEO_PRIZE = 500; // Coin
const TORNEO_COST  = 50;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function _torneoReset() {
    const now = Date.now();
    DB.torneo = DB.torneo || { participants: [], weekStart: now, prize: TORNEO_PRIZE, cost: TORNEO_COST };
    if (now - DB.torneo.weekStart > WEEK_MS) {
        DB.torneo = { participants: [], weekStart: now, prize: TORNEO_PRIZE, cost: TORNEO_COST };
        markDirty();
    }
}
app.get('/api/torneo', (req, res) => {
    _torneoReset();
    const { userId } = req.query;
    const isJoined = userId ? !!(DB.torneo.participants.find(p => p.userId === userId)) : false;
    res.json({
        ok: true,
        endTime: DB.torneo.weekStart + WEEK_MS,
        participantCount: DB.torneo.participants.length,
        prize: TORNEO_PRIZE,
        cost: TORNEO_COST,
        isJoined
    });
});
app.post('/api/torneo/join', (req, res) => {
    _torneoReset();
    const { userId, name, face } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId richiesto' });
    if (DB.torneo.participants.find(p => p.userId === userId))
        return res.json({ ok: true, alreadyJoined: true, participantCount: DB.torneo.participants.length });
    DB.torneo.participants.push({ userId, name: String(name || 'Anonimo').slice(0, 20), face: String(face || '🎭').slice(0, 4), joinedAt: Date.now() });
    markDirty();
    res.json({ ok: true, alreadyJoined: false, participantCount: DB.torneo.participants.length });
});

app.post('/api/admin/bitcoin-confirm', verifyAdmin, async (req, res) => {
    const { paymentId } = req.body || {};

    if (!paymentId) return res.status(400).json({ error: 'paymentId richiesto' });
    if (!DB.bitcoin_payments) DB.bitcoin_payments = [];

    const payment = DB.bitcoin_payments.find(p => p.id === paymentId);
    if (!payment) return res.status(404).json({ error: 'Pagamento non trovato' });
    if (payment.status !== 'pending') return res.status(409).json({ error: 'Pagamento già confermato o scaduto' });

    // ✅ VERIFICA BLOCKCHAIN: 4 CONFERME RICHIESTE
    console.log(`🔍 Verifying Bitcoin payment ${paymentId}: ${payment.btc_amount} BTC to ${BITCOIN_ADDRESS}`);

    const blockchainCheck = await checkBlockchainConfirmations(
        payment.btc_amount,
        BITCOIN_ADDRESS,
        BITCOIN_MIN_CONFIRMATIONS
    );

    if (!blockchainCheck.verified) {
        return res.status(402).json({
            error: 'Insufficient blockchain confirmations',
            current_confirmations: blockchainCheck.confirmations,
            required_confirmations: BITCOIN_MIN_CONFIRMATIONS,
            tx_hash: blockchainCheck.txHash || 'Not found',
            blockchain_error: blockchainCheck.error || 'Unknown error'
        });
    }

    console.log(`✅ Bitcoin verified: ${blockchainCheck.confirmations} confirmations, TxHash: ${blockchainCheck.txHash}`);

    // Branch: sats topup vs credits topup
    if (payment.kind === 'sats') {
        addBalance(payment.user_id, payment.sats_requested);
        payment.status = 'confirmed';
        payment.confirmed_at = now();
        payment.tx_hash = blockchainCheck.txHash;
        payment.confirmations_verified = blockchainCheck.confirmations;
        payment.verified_at = now();
        DB.transactions.push({
            id: genId('txn'),
            user_id: payment.user_id,
            type: 'bitcoin_sats',
            btc_amount: payment.btc_amount,
            sats: payment.sats_requested,
            status: 'completed',
            created_at: now()
        });
        saveDB(DB);
        notifyTelegramUser(payment.user_id, `⚡ Topup confermato: +${payment.sats_requested} sats nel tuo balance Arena.`);
        return res.json({ ok: true, message: `Pagamento confermato. ${payment.sats_requested} sats aggiunti.` });
    }

    // Aggiorna crediti utente (flow originale)
    let creditsRow = DB.user_credits.find(c => c.user_id === payment.user_id);
    if (!creditsRow) {
        creditsRow = { user_id: payment.user_id, credits: 0, updated_at: now() };
        DB.user_credits.push(creditsRow);
    }

    creditsRow.credits += payment.credits_requested;
    creditsRow.updated_at = now();

    // Aggiorna lo stato del pagamento
    payment.status = 'confirmed';
    payment.confirmed_at = now();
    payment.tx_hash = blockchainCheck.txHash;
    payment.confirmations_verified = blockchainCheck.confirmations;
    payment.verified_at = now();

    DB.transactions.push({
        id: genId('txn'),
        user_id: payment.user_id,
        type: 'bitcoin',
        btc_amount: payment.btc_amount,
        credits: payment.credits_requested,
        status: 'completed',
        created_at: now()
    });

    saveDB(DB);

    res.json({ ok: true, message: `Pagamento confermato. ${payment.credits_requested} crediti aggiunti.` });
});

// ============ SHOP CATEGORIES & INVENTORY ============

app.get('/api/shop/categories', (req, res) => {
    if (!DB.shop_products) DB.shop_products = [];

    const categories = {};
    DB.shop_products.forEach(product => {
        if (!categories[product.category]) {
            categories[product.category] = { count: 0, icon: '🛍️' };
        }
        if (product.active !== false) {
            categories[product.category].count++;
        }
    });

    // Add emoji for each category
    const icons = {
        'cosmetic': '🎭',
        'rarity': '⭐',
        'seasonal': '📅',
        'achievement': '🏆',
        'subscription': '👑',
        'powerup': '⚡',
        'boost': '🚀'
    };

    const result = Object.entries(categories).map(([name, data]) => ({
        name,
        count: data.count,
        icon: icons[name] || '🛍️'
    }));

    res.json({ categories: result });
});

app.get('/api/shop/products', (req, res) => {
    if (!DB.shop_products) DB.shop_products = [];

    const category = req.query.category;
    let products = DB.shop_products.filter(p => p.active !== false);

    if (category) {
        products = products.filter(p => p.category === category);
    }

    res.json({ products });
});

app.get('/api/shop/inventory', verifyToken, (req, res) => {
    const userId = req.user.userId;
    if (!DB.user_inventory) DB.user_inventory = [];

    const inventory = DB.user_inventory
        .filter(inv => inv.user_id === userId && inv.active === 1)
        .map(inv => {
            const product = DB.shop_products?.find(p => p.id === inv.product_id);
            return {
                id: inv.id,
                product_id: inv.product_id,
                name: product?.name || 'Unknown',
                category: product?.category || 'unknown',
                icon: product?.icon || '🛍️',
                rarity_level: inv.rarity_level || null,
                equipped: inv.equipped || 0,
                purchased_at: inv.purchased_at,
                expires_at: inv.expires_at
            };
        });

    res.json({ inventory });
});

app.post('/api/shop/inventory/equip', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { inventoryId, equipped } = req.body || {};

    if (!inventoryId) return res.status(400).json({ error: 'inventoryId richiesto' });
    if (!DB.user_inventory) DB.user_inventory = [];

    const invItem = DB.user_inventory.find(i => i.id === inventoryId && i.user_id === userId);
    if (!invItem) return res.status(404).json({ error: 'Item non trovato' });

    const product = DB.shop_products.find(p => p.id === invItem.product_id);
    if (!product || product.category !== 'cosmetic') {
        return res.status(400).json({ error: 'Solo i cosmetics possono essere equipaggiati' });
    }

    // Se equipping, rimuovi equipped da altri cosmetics
    if (equipped) {
        DB.user_inventory.forEach(i => {
            if (i.user_id === userId && i.equipped && i.id !== inventoryId) {
                const p = DB.shop_products.find(prod => prod.id === i.product_id);
                if (p && p.category === 'cosmetic') {
                    i.equipped = 0;
                }
            }
        });
    }

    invItem.equipped = equipped ? 1 : 0;
    markDirty();

    res.json({ ok: true, message: `Cosmetic ${equipped ? 'equipaggiato' : 'rimosso'}.` });
});

app.get('/api/shop/leaderboard/rarity', (req, res) => {
    if (!DB.user_inventory || !DB.shop_products) {
        return res.json({ leaderboard: [] });
    }

    // Calcola rarity score per utente
    const userScores = {};
    DB.user_inventory.forEach(inv => {
        if (inv.active !== 1) return;
        const product = DB.shop_products.find(p => p.id === inv.product_id);
        if (!product || product.category !== 'rarity') return;

        const itemData = JSON.parse(product.item_data || '{}');
        const score = itemData.rarity_score || 0;

        if (!userScores[inv.user_id]) {
            userScores[inv.user_id] = { total_score: 0, items_count: 0 };
        }
        userScores[inv.user_id].total_score += score;
        userScores[inv.user_id].items_count++;
    });

    // Top 10
    const leaderboard = Object.entries(userScores)
        .map(([userId, data]) => {
            const user = DB.users.find(u => u.id === userId);
            return {
                rank: 0,
                userId,
                username: user?.username || 'Anonymous',
                total_rarity_score: data.total_score,
                collectibles_owned: data.items_count
            };
        })
        .sort((a, b) => b.total_rarity_score - a.total_rarity_score)
        .slice(0, 10)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

    res.json({ leaderboard });
});

// ============ ADMIN API ============

// FIX: tutti gli admin endpoint richiedono verifyAdmin
app.get('/api/admin/stats', verifyAdmin, (req, res) => {
    const totalUsers = DB.users.length;
    const activeStories = DB.stories.filter(s => s.expires_at > now()).length;
    const totalReactions = DB.reactions.length;
    const activeBattles = (DB.battles || []).filter(b => b.status === 'live').length;
    const totalRevenue = 0;
    res.json({ totalUsers, activeStories, totalReactions, activeBattles, totalRevenue });
});

// Segnalazioni per moderazione (admin)
app.get('/api/admin/reports', verifyAdmin, (req, res) => {
    DB.reports = DB.reports || [];
    const nameOf = (id) => {
        const u = DB.users.find(x => x.id === id);
        return u ? (u.username || u.email || id) : id;
    };
    const reports = DB.reports
        .slice(-200).reverse()
        .map(r => ({
            id: r.id, to: r.to, toName: nameOf(r.to),
            from: r.from, fromName: r.anon ? 'anonimo' : nameOf(r.from),
            reason: r.reason, roomId: r.roomId || null,
            status: r.status || 'pending', created_at: r.created_at
        }));
    // Conteggio per utente segnalato (per individuare i recidivi)
    const tally = {};
    DB.reports.forEach(r => { tally[r.to] = (tally[r.to] || 0) + 1; });
    res.json({ reports, tally });
});
// Segna una segnalazione come gestita
app.post('/api/admin/reports/:id/resolve', verifyAdmin, (req, res) => {
    DB.reports = DB.reports || [];
    const r = DB.reports.find(x => x.id === req.params.id);
    if (r) { r.status = 'resolved'; r.resolved_at = Date.now(); markDirty(); }
    res.json({ ok: true });
});

app.get('/api/admin/users', verifyAdmin, (req, res) => {
    // FIX: NON spreadiamo l'utente intero — leakerebbe password_hash. Whitelist dei campi.
    const users = DB.users.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        is_admin: !!u.is_admin,
        created_at: u.created_at,
        last_seen: u.last_seen,
        story_count: DB.stories.filter(s => s.user_id === u.id).length
    })).sort((a, b) => b.created_at - a.created_at);
    res.json({ users });
});

app.get('/api/admin/stories', verifyAdmin, (req, res) => {
    const stories = DB.stories.map(s => {
        const user = DB.users.find(u => u.id === s.user_id);
        const reactions_count = DB.reactions.filter(r => r.story_id === s.id).length;
        return {
            id: s.id,
            user_id: s.user_id,
            duration_ms: s.duration_ms,
            mood: s.mood,
            expires_at: s.expires_at,
            created_at: s.created_at,
            username: user ? user.username : 'unknown',
            reactions_count
        };
    }).sort((a, b) => b.created_at - a.created_at).slice(0, 100);
    res.json({ stories });
});

// ICE servers (STUN + TURN) — config via env per audio robusto su NAT simmetrici
// Setup TURN (opzionale ma raccomandato per produzione):
//   TURN_URL=turn:turn.example.com:3478
//   TURN_USERNAME=<utente>
//   TURN_CREDENTIAL=<password>
// Provider gratuiti/economici: Metered.ca (50GB free/mese), Twilio NTS, coturn self-hosted.
app.get('/api/ice-servers', (req, res) => {
    const ice = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
    ];
    if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
        ice.push({
            urls: process.env.TURN_URL,
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_CREDENTIAL
        });
    }
    // Aggiuntivi via env CSV: TURN_EXTRA_URLS=turns:foo:5349,turn:bar:3478
    if (process.env.TURN_EXTRA_URLS && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
        process.env.TURN_EXTRA_URLS.split(',').forEach(u => {
            const url = u.trim();
            if (url) ice.push({ urls: url, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
        });
    }
    res.json({ iceServers: ice });
});

// Lightning: status pubblico (frontend usa questo per nascondere tab se non attivo)
app.get('/api/lightning/status', (req, res) => {
    res.json({ enabled: !!lightning.ENABLED, provider: lightning.PROVIDER });
});

// Lightning: smoke test connessione provider
app.post('/api/admin/lightning-test', verifyAdmin, async (req, res) => {
    if (!lightning.ENABLED) {
        return res.json({
            ok: false,
            enabled: false,
            provider: lightning.PROVIDER,
            hint: 'Imposta LIGHTNING_ENABLED=1 + COINOS_TOKEN (o LNBITS_URL+LNBITS_INVOICE_KEY) e fai redeploy.'
        });
    }
    try {
        const inv = await lightning.createInvoice(10, 'Kouverte test');
        res.json({
            ok: true,
            enabled: true,
            provider: lightning.PROVIDER,
            bolt11_preview: (inv.bolt11 || '').slice(0, 40) + '…',
            payment_hash: inv.paymentHash,
            note: 'Invoice di test da 10 sat generato. Non pagarlo — è solo per verifica connessione.'
        });
    } catch(e) {
        res.json({ ok: false, enabled: true, provider: lightning.PROVIDER, error: e.message });
    }
});

// Seed users disabilitato — solo utenti reali
app.post('/api/admin/seed-users', verifyAdmin, (req, res) => {
    res.status(410).json({ ok: false, error: 'Seed users disabilitato. Solo utenti reali su questa piattaforma.' });
});

// ── PREMIUM SUBSCRIPTION (Telegram Stars) ──
const PREMIUM_PRICE_STARS = 100; // 100 Telegram Stars ≈ 1€
const FRAME_PRICES = { gold: 30, diamond: 50, flame: 40 }; // in Stars

app.post('/api/create-invoice', async (req, res) => {
    const { userId, plan } = req.body || {};
    if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
    const BOT_TOKEN_ACTIVE = process.env.BOT_TOKEN || '8782933185:AAF1NkjD1HQzwwBRCFBjK2ez0sjHyn5RujU';
    try {
        const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN_ACTIVE}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'KOUVERTE Premium',
                description: 'Messaggi illimitati + cornici Gold, Diamond, Fiamma per 30 giorni',
                payload: JSON.stringify({ userId, type: 'premium', plan: 'monthly' }),
                currency: 'XTR', // Telegram Stars
                prices: [{ label: 'Premium 30 giorni', amount: PREMIUM_PRICE_STARS }]
            })
        });
        const data = await r.json();
        if (data.ok) return res.json({ ok: true, invoiceLink: data.result });
        return res.status(500).json({ ok: false, error: data.description });
    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
});

app.post('/api/buy-frame', async (req, res) => {
    const { userId, frameId } = req.body || {};
    if (!userId || !frameId) return res.status(400).json({ ok: false, error: 'userId + frameId required' });
    const price = FRAME_PRICES[frameId];
    if (!price) return res.status(400).json({ ok: false, error: 'Cornice non vendibile' });
    const BOT_TOKEN_ACTIVE = process.env.BOT_TOKEN || '8782933185:AAF1NkjD1HQzwwBRCFBjK2ez0sjHyn5RujU';
    const frameNames = { gold:'Gold ✨', diamond:'Diamond 💎', flame:'Fiamma 🔥' };
    try {
        const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN_ACTIVE}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Cornice ' + (frameNames[frameId] || frameId),
                description: 'Cornice profilo esclusiva per KOUVERTE Chat',
                payload: JSON.stringify({ userId, type: 'frame', frameId }),
                currency: 'XTR',
                prices: [{ label: 'Cornice ' + frameId, amount: price }]
            })
        });
        const data = await r.json();
        if (data.ok) return res.json({ ok: true, invoiceLink: data.result });
        return res.status(500).json({ ok: false, error: data.description });
    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
});

// NOTA: pre_checkout_query e successful_payment gestiti da tg-bot.js (polling mode)
// Non serve un webhook endpoint — il bot è in polling e riceve tutto direttamente.

app.get('/api/admin/battles', verifyAdmin, (req, res) => {
    const battles = (DB.battles || []).map(publicBattle).sort((a, b) => (b?.startedAt || 0) - (a?.startedAt || 0)).slice(0, 50);
    res.json({ battles });
});

app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const userId = req.params.id;
    DB.reactions = DB.reactions.filter(r => {
        const story = DB.stories.find(s => s.id === r.story_id);
        return story && story.user_id !== userId;
    });
    DB.stories = DB.stories.filter(s => s.user_id !== userId);
    DB.battles = (DB.battles || []).filter(b => b.userA !== userId && b.userB !== userId);
    // FIX: cleanup orfani crediti, inventario, transazioni
    DB.user_credits = (DB.user_credits || []).filter(c => c.user_id !== userId);
    DB.user_inventory = (DB.user_inventory || []).filter(i => i.user_id !== userId);
    DB.transactions = (DB.transactions || []).filter(t => t.user_id !== userId);
    DB.users = DB.users.filter(u => u.id !== userId);
    saveDB(DB);
    res.json({ ok: true });
});

// Ban endpoint — solo il moderatore (bob2015 / is_moderator) può usarlo
app.post('/api/admin/ban-user', verifyToken, (req, res) => {
    const caller = DB.users.find(u => u.id === req.user.userId);
    if (!caller || !caller.is_moderator) return res.status(403).json({ error: 'Non autorizzato' });
    const { targetUserId, reason } = req.body || {};
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId richiesto' });
    const target = DB.users.find(u => u.id === targetUserId);
    if (!target) return res.status(404).json({ error: 'Utente non trovato' });
    if (target.is_moderator || target.is_admin) return res.status(403).json({ error: 'Non puoi bannare un admin' });
    target.banned = true;
    target.ban_reason = String(reason || 'Violazione regolamento').slice(0, 200);
    target.banned_at = Date.now();
    target.banned_by = caller.id;
    markDirty();
    // Kick the banned user from all socket connections
    const bannedSid = activeCalls.get(targetUserId) || userSockets.get(target.username);
    if (bannedSid) {
        const bannedSocket = io.sockets.sockets.get(bannedSid);
        if (bannedSocket) {
            bannedSocket.emit('you-are-banned', { reason: target.ban_reason });
            bannedSocket.disconnect(true);
        }
    }
    console.log(`[BAN] ${caller.username} ha bannato ${target.username} (${targetUserId}): ${target.ban_reason}`);
    res.json({ ok: true, username: target.username });
});

app.delete('/api/admin/stories/:id', verifyAdmin, (req, res) => {
    DB.reactions = DB.reactions.filter(r => r.story_id !== req.params.id);
    DB.stories = DB.stories.filter(s => s.id !== req.params.id);
    saveDB(DB);
    res.json({ ok: true });
});

app.delete('/api/admin/battles/:id', verifyAdmin, (req, res) => {
    DB.battles = (DB.battles || []).filter(b => b.id !== req.params.id);
    saveDB(DB);
    res.json({ ok: true });
});

// ============ TELEGRAM AUTH ============
// Valida initData firmata da Telegram (HMAC-SHA256)
const TG_BOT_TOKEN = process.env.BOT_TOKEN || '';
function validateTelegramInitData(initData) {
    if (!initData || !TG_BOT_TOKEN) return null;
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        params.delete('hash');
        const dataCheckString = [...params.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
        const secret = crypto.createHmac('sha256', 'WebAppData').update(TG_BOT_TOKEN).digest();
        const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
        if (computedHash !== hash) return null;
        const userJson = params.get('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        return null;
    }
}

app.post('/api/tg/auth', rateLimit('tg-auth', 10, 5 * 60 * 1000), (req, res) => {
    const { initData } = req.body || {};
    const tgUser = validateTelegramInitData(initData);

    // FIX: rimosso fallback insicuro. In produzione richiede HMAC valido.
    // In dev (no BOT_TOKEN), restituisce errore esplicito.
    if (!tgUser) {
        if (IS_PROD || TG_BOT_TOKEN) {
            return res.status(401).json({ error: 'Auth Telegram fallita: initData non valido' });
        }
        return res.status(503).json({ error: 'Telegram auth non configurato (BOT_TOKEN mancante)' });
    }

    // Crea/aggiorna utente VOX collegato a Telegram
    const tgIdRaw = String(tgUser.id || tgUser.telegramId || '').replace(/[^0-9]/g, '');
    if (!tgIdRaw) return res.status(400).json({ error: 'Telegram user ID mancante' });
    const userId = 'tg_' + tgIdRaw;
    const usernameSrc = tgUser.username || ('u' + tgIdRaw);
    const username = (sanitizeUsername(usernameSrc) || ('u' + tgIdRaw)).slice(0, 20);
    const firstName = String(tgUser.first_name || tgUser.firstName || 'Utente').replace(/[<>]/g, '').slice(0, 50);

    let user = (DB.users || []).find(u => u.id === userId);
    if (!user) {
        user = {
            id: userId,
            username,
            firstName,
            telegramId: tgIdRaw,
            verified: true,
            is_admin: false,
            created_at: now()
        };
        DB.users = DB.users || [];
        DB.users.push(user);
        saveDB(DB);
    } else {
        user.username = username;
        user.firstName = firstName;
        user.verified = true;
        user.last_seen = now();
        markDirty();
    }
    // Emetti JWT così l'utente TG può usare endpoint protetti
    const token = generateToken(user.id);
    res.json({ ok: true, validated: true, token, user: { id: user.id, username: user.username, firstName: user.firstName } });
});

// Telegram Login Widget auth (web, non Mini App)
// Hash: HMAC-SHA256(data_check_string, SHA256(BOT_TOKEN))
app.post('/api/auth/telegram-widget', rateLimit('tg-widget', 10, 5 * 60 * 1000), async (req, res) => {
    try {
        const BOT_TOKEN_ACTIVE = process.env.BOT_TOKEN || '8782933185:AAF1NkjD1HQzwwBRCFBjK2ez0sjHyn5RujU';
        const data = req.body || {};
        const { hash } = data;
        if (!hash) return res.status(400).json({ error: 'Hash mancante' });

        const rest = { ...data };
        delete rest.hash;
        const dataCheckString = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('\n');
        const secretKey = crypto.createHash('sha256').update(BOT_TOKEN_ACTIVE).digest();
        const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (computedHash !== hash) return res.status(401).json({ error: 'Auth Telegram non valida' });

        const authDate = parseInt(rest.auth_date || '0');
        if (Math.floor(Date.now() / 1000) - authDate > 86400) return res.status(401).json({ error: 'Auth scaduta, riprova' });

        const tgIdRaw = String(rest.id || '').replace(/[^0-9]/g, '');
        if (!tgIdRaw) return res.status(400).json({ error: 'ID Telegram mancante' });

        const userId = 'tg_' + tgIdRaw;
        const rawUsername = rest.username || ('u' + tgIdRaw);
        const username = (sanitizeUsername(rawUsername) || ('u' + tgIdRaw)).slice(0, 20);
        const firstName = String(rest.first_name || 'Utente').replace(/[<>"']/g, '').slice(0, 50);
        const photoUrl = String(rest.photo_url || '').replace(/[<>"']/g, '').slice(0, 200);

        DB.users = DB.users || [];
        let user = DB.users.find(u => u.id === userId);
        if (!user) {
            user = {
                id: userId,
                username,
                firstName,
                telegramId: tgIdRaw,
                photo_url: photoUrl || null,
                verified: true,
                is_admin: false,
                is_moderator: false,
                created_at: now()
            };
            DB.users.push(user);
            DB.user_credits = DB.user_credits || [];
            DB.user_credits.push({ user_id: userId, credits: 50, updated_at: now() });
            saveDB(DB);
        } else {
            user.username = username;
            user.firstName = firstName;
            if (photoUrl) user.photo_url = photoUrl;
            user.verified = true;
            user.last_seen = now();
            markDirty();
        }

        const token = generateToken(user.id);
        res.json({ ok: true, token, user: publicUser(user) });
    } catch (err) {
        console.error('[tg-widget]', err);
        res.status(500).json({ error: 'Errore interno' });
    }
});

// Stats Scopa per utente (free games rimanenti + crediti)
app.get('/api/scopa/stats', verifyToken, (req, res) => {
    const uid = req.user.id;
    DB.scopa_stats = DB.scopa_stats || {};
    const stats = DB.scopa_stats[uid] || { gamesPlayed:0, wins:0 };
    const cr = (DB.user_credits||[]).find(c => c.user_id === uid);
    const freeLeft = Math.max(0, SCOPA_FREE_GAMES - stats.gamesPlayed);
    res.json({ ok:true, gamesPlayed: stats.gamesPlayed, wins: stats.wins, freeGamesLeft: freeLeft, credits: cr?.credits ?? 0 });
});

app.post('/api/cleanup', (req, res) => {
    const before = DB.stories.length;
    DB.stories = DB.stories.filter(s => s.expires_at > now());
    saveDB(DB);
    res.json({ ok: true, deleted: before - DB.stories.length });
});

// Fix old users without credits (give them 50 each) — admin only
app.post('/api/admin/fix-credits', verifyAdmin, (req, res) => {
    DB.user_credits = DB.user_credits || [];
    let fixed = 0;

    DB.users.forEach(user => {
        const credRow = DB.user_credits.find(c => c.user_id === user.id);
        if (!credRow) {
            DB.user_credits.push({
                user_id: user.id,
                credits: 50,
                updated_at: now()
            });
            fixed++;
        } else if (credRow.credits === 0) {
            credRow.credits = 50;
            fixed++;
        }
    });

    saveDB(DB);
    res.json({ ok: true, fixed });
});

// Seed test data — disabilitato in produzione, admin-only altrimenti
app.get('/api/admin/seed', verifyAdmin, async (req, res) => {
    if (IS_PROD) return res.status(403).json({ error: 'Seed disabilitato in produzione' });
    const testUsers = [
        { email: 'test1@kouverte.local', username: 'TestUser1', password: 'Test123456' },
        { email: 'test2@kouverte.local', username: 'TestUser2', password: 'Test123456' },
        { email: 'test3@kouverte.local', username: 'TestUser3', password: 'Test123456' },
        { email: 'test4@kouverte.local', username: 'TestUser4', password: 'Test123456' },
        { email: 'test5@kouverte.local', username: 'TestUser5', password: 'Test123456' }
    ];

    const moods = ['vibe', 'hot', 'deep', 'fun'];
    const results = [];

    for (const testUser of testUsers) {
        const existing = DB.users.find(u => u.email === testUser.email);
        if (existing) {
            results.push({ email: testUser.email, status: 'already_exists' });
            continue;
        }

        try {
            const password_hash = await bcrypt.hash(testUser.password, 10);
            const user = {
                id: genId('u'),
                email: testUser.email,
                username: testUser.username.toLowerCase(),
                password_hash,
                profile: {
                    avatar_letter: testUser.username.charAt(0),
                    bio: `Sono ${testUser.username}. Love voice dating! 🎙️`,
                    clips: [
                        { slot: 0, title: 'Chi sono', audio_id: null, duration: 0 },
                        { slot: 1, title: 'Mi piace', audio_id: null, duration: 0 },
                        { slot: 2, title: 'Cerco', audio_id: null, duration: 0 }
                    ]
                },
                stats: {
                    stories_count: 2 + Math.floor(Math.random() * 3),
                    matches_count: Math.floor(Math.random() * 5),
                    likes_received: Math.floor(Math.random() * 20),
                    duels_participated: Math.floor(Math.random() * 2)
                },
                created_at: now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                updated_at: now()
            };

            // Add 2-3 test stories per user
            const storyCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < storyCount; i++) {
                const mood = moods[Math.floor(Math.random() * moods.length)];
                const story = {
                    id: genId('story'),
                    user_id: user.id,
                    audio_data: 'data:audio/webm;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=',
                    duration_ms: 3000 + Math.random() * 7000,
                    mood,
                    expires_at: now() + 24 * 60 * 60 * 1000,
                    created_at: now() - Math.random() * 6 * 60 * 60 * 1000
                };
                DB.stories.push(story);
                if (i === 0) {
                    user.profile.clips[0].audio_id = story.id;
                    user.profile.clips[0].duration = story.duration_ms;
                }
            }

            DB.users.push(user);

            // Give 50 initial credits to test user
            DB.user_credits = DB.user_credits || [];
            DB.user_credits.push({
                user_id: user.id,
                credits: 50,
                updated_at: now()
            });

            results.push({ email: testUser.email, username: testUser.username, password: testUser.password, status: 'created' });
        } catch(e) {
            results.push({ email: testUser.email, status: 'error', error: e.message });
        }
    }

    saveDB(DB);
    res.json({ ok: true, users: results });
});

// ============ ROOMS · text rooms a tema (chat scritte) ============
// Slug rooms validi (frontend e backend allineati)
const VALID_ROOMS = ['cinema','notte','cuori','viaggi','musica','confess'];
DB.rooms = DB.rooms || {}; // { slug: [{id,userId,username,text,created_at}] }

function purgeOldRoomMsgs() {
    const cutoff = now() - 60 * 60 * 1000; // 1 ora
    let cleaned = false;
    VALID_ROOMS.forEach(slug => {
        if (DB.rooms[slug]) {
            const before = DB.rooms[slug].length;
            DB.rooms[slug] = DB.rooms[slug].filter(m => m.created_at > cutoff);
            if (DB.rooms[slug].length < before) cleaned = true;
        }
    });
    if (cleaned) saveDB(DB);
}

app.get('/api/rooms/:slug/msgs', (req, res) => {
    const slug = req.params.slug;
    if (!VALID_ROOMS.includes(slug)) return res.status(404).json({ error: 'Stanza non trovata' });
    purgeOldRoomMsgs();
    const msgs = (DB.rooms[slug] || []).slice(-100);
    // Conteggio "online" approssimato: utenti unici che hanno scritto negli ultimi 10 min
    const recentCutoff = now() - 10 * 60 * 1000;
    const online = new Set((DB.rooms[slug] || []).filter(m => m.created_at > recentCutoff).map(m => m.userId)).size;
    res.json({ msgs, online: Math.max(1, online) });
});

app.post('/api/rooms/:slug/msgs', verifyToken, (req, res) => {
    const slug = req.params.slug;
    const userId = req.user.userId;
    const { text } = req.body || {};
    if (!VALID_ROOMS.includes(slug)) return res.status(404).json({ error: 'Stanza non trovata' });
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text richiesto' });
    if (text.length > 280) return res.status(400).json({ error: 'Messaggio troppo lungo' });

    const user = DB.users.find(u => u.id === userId);
    const username = user ? user.username : 'anon';

    // Anti-spam: max 5 msg in 10 secondi per utente
    const tenSecAgo = now() - 10000;
    const recentByUser = (DB.rooms[slug] || []).filter(m => m.userId === userId && m.created_at > tenSecAgo).length;
    if (recentByUser >= 5) return res.status(429).json({ error: 'Stai scrivendo troppo veloce, rallenta' });

    DB.rooms[slug] = DB.rooms[slug] || [];
    const msg = {
        id: 'msg_' + crypto.randomBytes(6).toString('hex'),
        userId,
        username: String(username).slice(0, 30),
        // FIX XSS: rimuovi tag HTML potenziali
        text: text.replace(/[<>]/g, '').trim().slice(0, 280),
        created_at: now()
    };
    DB.rooms[slug].push(msg);
    if (DB.rooms[slug].length > 500) DB.rooms[slug] = DB.rooms[slug].slice(-500);
    markDirty();
    res.json({ ok: true, msg });
});

app.get('/api/rooms', (req, res) => {
    const result = VALID_ROOMS.map(slug => {
        const msgs = DB.rooms[slug] || [];
        const recentCutoff = now() - 10 * 60 * 1000;
        const online = new Set(msgs.filter(m => m.created_at > recentCutoff).map(m => m.userId)).size;
        return { slug, total: msgs.length, online: Math.max(1, online) };
    });
    res.json({ rooms: result });
});

app.post('/api/admin/reset', verifyAdmin, (req, res) => {
    if (IS_PROD) return res.status(403).json({ error: 'Reset disabilitato in produzione' });
    DB = {
        users: [],
        stories: [],
        reactions: [],
        duels: [],
        votes: [],
        shop_products: [
            { id: 'vox_vip', name: 'VO✕ VIP · 1 mese', desc: 'Storie che durano 7 giorni, badge esclusivo', price_credits: 999, category: 'subscription', item_type: 'vip_month', icon: '👑', item_data: '{"duration_days":30}' },
            { id: 'vox_boost', name: 'Boost · 2 ore', desc: 'La tua storia in cima al feed', price_credits: 199, category: 'boost', item_type: 'boost_2h', icon: '🚀', item_data: '{"duration_minutes":120}' },
            { id: 'vox_theme', name: 'Tema Dark Neon', desc: 'Profilo con bordi neon', price_credits: 499, category: 'cosmetic', item_type: 'theme', icon: '💜', item_data: '{"theme":"neon"}' }
        ],
        user_inventory: [],
        transactions: [],
        user_credits: []
    };
    saveDB(DB);
    res.json({ ok: true });
});

// ============ VOICE ROOMS · Live public/themed voice spaces ============
// Voice rooms schema: similar to text rooms but for live voice
const VOICE_ROOM_THEMES = [
    { slug: 'voci-notturne', label: '🌙 Voci Notturne', desc: 'Chat vocale di notte' },
    { slug: 'single-italiani', label: '💔 Single Italiani', desc: 'Persone sole che cercano connessione' },
    { slug: 'deep-talks', label: '🧠 Deep Talks', desc: 'Conversazioni profonde' },
    { slug: 'vibes-musicali', label: '🎵 Vibes Musicali', desc: 'Cantano e parlano di musica' },
    { slug: 'travel-lovers', label: '✈️ Travel Lovers', desc: 'Gente che ama viaggiare' },
    { slug: 'late-night', label: '🌃 Late Night', desc: 'Per gli insonnaci' },
    { slug: 'shop-lounge', label: '🛍️ Shop Lounge', desc: 'Parla di cosmetic e rarity, scambia opinioni' }
];

DB.voice_rooms = DB.voice_rooms || {};
VOICE_ROOM_THEMES.forEach(theme => {
    DB.voice_rooms[theme.slug] = DB.voice_rooms[theme.slug] || {
        slug: theme.slug,
        label: theme.label,
        desc: theme.desc,
        participants: [], // [{userId, username, socketId, joinedAt}]
        created_at: now()
    };
});

app.get('/api/voice-rooms', (req, res) => {
    const rooms = VOICE_ROOM_THEMES.map(theme => {
        const room = DB.voice_rooms[theme.slug];
        return {
            slug: theme.slug,
            label: theme.label,
            desc: theme.desc,
            participants_count: room.participants.length,
            is_active: room.participants.length > 0
        };
    });
    res.json({ rooms });
});

app.post('/api/voice-rooms/:slug/join', verifyToken, (req, res) => {
    const slug = req.params.slug;
    const room = DB.voice_rooms[slug];
    if (!room) return res.status(404).json({ error: 'Voice room not found' });

    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // FIX: rimuovi user da TUTTE le altre stanze prima di joinare la nuova
    VOICE_ROOM_THEMES.forEach(t => {
        if (t.slug !== slug && DB.voice_rooms[t.slug]) {
            const before = DB.voice_rooms[t.slug].participants.length;
            DB.voice_rooms[t.slug].participants = DB.voice_rooms[t.slug].participants.filter(p => p.userId !== user.id);
            if (DB.voice_rooms[t.slug].participants.length < before) {
                io.to('voice-room-' + t.slug).emit('user-left-voice-room', { userId: user.id, username: user.username, timestamp: now() });
            }
        }
    });

    const existing = room.participants.find(p => p.userId === user.id);
    if (!existing) {
        room.participants.push({
            userId: user.id,
            username: user.username,
            joinedAt: now()
        });
        // FIX: notifica via socket gli altri partecipanti
        io.to('voice-room-' + slug).emit('user-joined-voice-room', { userId: user.id, username: user.username, timestamp: now() });
    }

    saveDB(DB);
    res.json({ ok: true, room: { slug, label: room.label, participants_count: room.participants.length } });
});

app.post('/api/voice-rooms/:slug/leave', verifyToken, (req, res) => {
    const slug = req.params.slug;
    const room = DB.voice_rooms[slug];
    if (!room) return res.status(404).json({ error: 'Voice room not found' });

    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = room.participants.length;
    room.participants = room.participants.filter(p => p.userId !== user.id);
    saveDB(DB);
    if (room.participants.length < before) {
        // FIX: notifica via socket gli altri partecipanti
        io.to('voice-room-' + slug).emit('user-left-voice-room', { userId: user.id, username: user.username, timestamp: now() });
    }
    res.json({ ok: true });
});

app.get('/api/voice-rooms/:slug/participants', (req, res) => {
    const slug = req.params.slug;
    const room = DB.voice_rooms[slug];
    if (!room) return res.status(404).json({ error: 'Voice room not found' });

    const participants = room.participants.map(p => ({
        userId: p.userId,
        username: p.username,
        joinedAt: p.joinedAt
    }));

    res.json({ participants });
});

// ============ ONLINE NOW FEED · Who's available ============
app.get('/api/online-now', (req, res) => {
    const online = [];
    const STALE_THRESHOLD = now() - 30 * 60 * 1000; // 30 min

    VOICE_ROOM_THEMES.forEach(theme => {
        const room = DB.voice_rooms[theme.slug];
        // FIX: filtra utenti stale (>30 min in stanza senza activity)
        const before = room.participants.length;
        room.participants = room.participants.filter(p => p.joinedAt > STALE_THRESHOLD);
        if (room.participants.length < before) markDirty();

        room.participants.forEach(p => {
            if (!online.find(o => o.userId === p.userId)) {
                online.push({
                    userId: p.userId,
                    username: p.username,
                    status: 'in_voice_room',
                    room_slug: theme.slug,
                    room_label: theme.label,
                    joinedAt: p.joinedAt
                });
            }
        });
    });

    res.json({ online: online.sort((a, b) => b.joinedAt - a.joinedAt) });
});

// ============ WEBRTC SIGNALING ============

const activeCalls = new Map();
const userSockets = new Map();
const userVoiceRooms = new Map(); // userId -> {roomSlug, socketId}
const battleVoicePeers = {}; // battleId -> Map<socketId, {userId, role}>

// ===== CHAT ROOMS — stato GLOBALE (fuori dal connection handler!) =====
const chatRoomHistory = {}; // roomId -> ultimi 100 messaggi
const chatRoomUsers   = {}; // roomId -> Map<socketId, user>
function getTotalOnline() {
    let tot = 0;
    for (const users of Object.values(chatRoomUsers)) tot += users.size;
    tot += scopaWatchers ? scopaWatchers.size : 0;
    return tot;
}

// ══════════════════════════════════════════════════════════════════════════════
// ♠  SCOPA — Motore di gioco con carte napoletane
// ══════════════════════════════════════════════════════════════════════════════
const scopaQueue        = [];          // { socketId, userId, name, face, color }
const scopaGames        = new Map();   // gameId → gameState
const scopaPlrGame      = new Map();   // socketId → gameId
const scopaWatchers     = new Set();   // socketId di tutti nella lobby scopa
const scopaGraceTimers  = new Map();   // userId → { timer, gameId }  (grace period su disconnect)
const SCOPA_WIN    = 11;

function scopaBroadcastLobby(){
    const tables = [];
    let tNum = 0;
    for(const [, game] of scopaGames){
        if(game.state === 'finished') continue;
        tNum++;
        const [a, b] = game.playerOrder;
        tables.push({
            tableNum: tNum,
            players: [
                { name: game.playerInfo[a].name, face: game.playerInfo[a].face, score: game.totalScore[a] },
                { name: game.playerInfo[b].name, face: game.playerInfo[b].face, score: game.totalScore[b] }
            ],
            round: game.round || 1
        });
    }
    const queue = scopaQueue.map((p, i) => ({ name: p.name, face: p.face, position: i+1 }));
    const payload = { tables, queue };
    for(const sid of scopaWatchers){
        const s = io.sockets.sockets.get(sid);
        if(s) s.emit('scopa:lobby', payload);
    }
    // Aggiorna il contatore "in sala" sulla game card in home
    io.emit('room-online', { roomId: 'scopa', count: scopaWatchers.size });
    io.emit('global-online', { count: getTotalOnline() });
}

function scopaDeck() {
    const cards = [];
    for (const suit of ['coppe','denari','bastoni','spade']) {
        for (let v = 1; v <= 10; v++) cards.push({ suit, value: v, id: suit[0]+v });
    }
    return cards;
}
function scopaShuffle(a) {
    const d=[...a];
    for(let i=d.length-1;i>0;i--){const j=0|(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
    return d;
}
function scopaPrimVal(v){return{7:21,6:18,1:16,5:15,4:14,3:13,2:12}[v]||10;}
function scopaPrimiera(cards){
    let s=0;
    for(const suit of['coppe','denari','bastoni','spade']){
        const sc=cards.filter(c=>c.suit===suit);
        if(!sc.length)return -1;
        s+=Math.max(...sc.map(c=>scopaPrimVal(c.value)));
    }
    return s;
}
// Restituisce array di opzioni di cattura (ogni opzione = array di carte del tavolo)
function scopaCaptures(card, table){
    const v=card.value;
    const singles=table.filter(c=>c.value===v);
    if(singles.length) return singles.map(c=>[c]); // singola priorità
    // Combinazioni multi-carta (bitmask)
    const res=[];
    for(let mask=1;mask<(1<<table.length);mask++){
        const combo=table.filter((_,i)=>mask>>i&1);
        if(combo.length>=2&&combo.reduce((s,c)=>s+c.value,0)===v) res.push(combo);
    }
    return res;
}
function scopaRoundScore(game){
    const [a,b]=game.playerOrder;
    const ca=game.captured[a],cb=game.captured[b];
    const sa={scope:game.scope[a],settebello:0,carte:0,denari:0,primiera:0};
    const sb={scope:game.scope[b],settebello:0,carte:0,denari:0,primiera:0};
    if(ca.some(c=>c.suit==='denari'&&c.value===7)) sa.settebello=1;
    else sb.settebello=1;
    if(ca.length>cb.length) sa.carte=1; else if(cb.length>ca.length) sb.carte=1;
    const da=ca.filter(c=>c.suit==='denari').length, db=cb.filter(c=>c.suit==='denari').length;
    if(da>db) sa.denari=1; else if(db>da) sb.denari=1;
    const pa=scopaPrimiera(ca), pb=scopaPrimiera(cb);
    if(pa>=0&&pb>=0){if(pa>pb) sa.primiera=1; else if(pb>pa) sb.primiera=1;}
    else if(pa>=0) sa.primiera=1; else if(pb>=0) sb.primiera=1;
    sa.total=sa.scope+sa.settebello+sa.carte+sa.denari+sa.primiera;
    sb.total=sb.scope+sb.settebello+sb.carte+sb.denari+sb.primiera;
    return{[a]:sa,[b]:sb};
}
function scopaNewRound(game){
    game.round = (game.round || 1) + 1;
    const deck=scopaShuffle(scopaDeck());
    const[a,b]=game.playerOrder;
    game.hands={[a]:deck.splice(0,3),[b]:deck.splice(0,3)};
    game.table=deck.splice(0,4);
    game.deck=deck;
    game.captured={[a]:[],[b]:[]};
    game.scope={[a]:0,[b]:0};
    game.lastCapBy=null;
    game.state='playing';
    game.currentTurn=game.roundStarter;
}
function scopaPublic(game, forId){
    const opp=game.playerOrder.find(id=>id!==forId);
    return{
        gameId:game.gameId, myId:forId, oppId:opp,
        myInfo:game.playerInfo[forId], oppInfo:game.playerInfo[opp],
        myHand:game.hands[forId], oppHandCount:game.hands[opp].length,
        table:game.table, deckCount:game.deck.length,
        myScope:game.scope[forId], oppScope:game.scope[opp],
        myCaptured:game.captured[forId].length, oppCaptured:game.captured[opp].length,
        myDenari:game.captured[forId].filter(c=>c.suit==='denari').length,
        oppDenari:game.captured[opp].filter(c=>c.suit==='denari').length,
        myTotalScore:game.totalScore[forId], oppTotalScore:game.totalScore[opp],
        currentTurn:game.currentTurn, isMyTurn:game.currentTurn===forId,
        state:game.state
    };
}
function scopaEmitBoth(game){
    const[a,b]=game.playerOrder;
    const sa=io.sockets.sockets.get(game.socketIds[a]);
    const sb=io.sockets.sockets.get(game.socketIds[b]);
    if(sa) sa.emit('scopa:state', scopaPublic(game,a));
    if(sb) sb.emit('scopa:state', scopaPublic(game,b));
}
function scopaNextTurn(game){
    const[a,b]=game.playerOrder;
    game.currentTurn=game.currentTurn===a?b:a;
    if(game.hands[a].length===0&&game.hands[b].length===0){
        if(game.deck.length>=6){
            game.hands[a]=game.deck.splice(0,3);
            game.hands[b]=game.deck.splice(0,3);
        } else {
            if(game.table.length>0&&game.lastCapBy){
                game.captured[game.lastCapBy].push(...game.table);
                game.table=[];
            }
            scopaEndRound(game); return;
        }
    }
    scopaEmitBoth(game);
    // Se è il turno del bot, gioca dopo 1.2 secondi (pausa naturale)
    if(game.isBot && game.currentTurn && game.currentTurn.startsWith('bot_')){
        setTimeout(() => scopaBotPlay(game), 1200);
    }
}
const SCOPA_FREE_GAMES  = 3;
const SCOPA_ENTRY_COST  = 5;
const SCOPA_WIN_REWARD  = 20; // 10 × 2
const SCOPA_BOT_WAIT    = 20; // secondi prima di assegnare il bot
const scopaBotTimers    = new Map(); // userId → { timer, socketId, countdown[] }

function _scopaStats(userId){
    DB.scopa_stats = DB.scopa_stats || {};
    if(!DB.scopa_stats[userId]) DB.scopa_stats[userId] = { gamesPlayed:0, wins:0 };
    return DB.scopa_stats[userId];
}
function _scopaCredits(userId){
    DB.user_credits = DB.user_credits || [];
    let cr = DB.user_credits.find(c => c.user_id === userId);
    if(!cr){ cr = { user_id:userId, credits:0, updated_at:now() }; DB.user_credits.push(cr); }
    return cr;
}
// Ritorna { ok:bool, freeGame:bool, remaining:number }
function scopaDeductEntry(userId){
    const stats = _scopaStats(userId);
    if(stats.gamesPlayed < SCOPA_FREE_GAMES) return { ok:true, freeGame:true, remaining: SCOPA_FREE_GAMES - stats.gamesPlayed - 1 };
    const cr = _scopaCredits(userId);
    if(cr.credits < SCOPA_ENTRY_COST) return { ok:false, freeGame:false, credits:cr.credits };
    cr.credits -= SCOPA_ENTRY_COST;
    cr.updated_at = now();
    markDirty();
    return { ok:true, freeGame:false, credits:cr.credits };
}
function scopaRecordGame(p1Id, p2Id){
    _scopaStats(p1Id).gamesPlayed++;
    _scopaStats(p2Id).gamesPlayed++;
    markDirty();
}
function scopaAwardWin(winnerId, winnerSocketId){
    if(winnerId.startsWith('bot_')) return; // bot non riceve crediti
    const cr = _scopaCredits(winnerId);
    cr.credits += SCOPA_WIN_REWARD;
    cr.updated_at = now();
    _scopaStats(winnerId).wins++;
    markDirty();
    const ws = io.sockets.sockets.get(winnerSocketId);
    if(ws) ws.emit('scopa:credits-update', { delta: SCOPA_WIN_REWARD, total: cr.credits, reason:'win' });
}

// ── BOT AI ──────────────────────────────────────────────────────────────────

function scopaBotChooseMove(hand, table){
    // Per ogni carta in mano calcola le catture possibili
    let best = null; // { card, cardIdx, captured, score }
    for(let i=0;i<hand.length;i++){
        const card = hand[i];
        const opts = scopaCaptures(card, table);
        if(opts.length === 0) continue;
        // Scegli la cattura ottimale: preferisce scopa, poi più carte, poi valore più alto
        for(const combo of opts){
            const isScopa = combo.length === table.length;
            const score = (isScopa ? 1000 : 0) + combo.reduce((s,c)=>s+c.value,0) + combo.length*5;
            if(!best || score > best.score) best = { card, cardIdx:i, captured:combo, score };
        }
    }
    if(best) return best;
    // Nessuna cattura: gioca la carta di valore più basso (strategia difensiva)
    const minCard = hand.reduce((a,b) => a.value <= b.value ? a : b);
    return { card: minCard, cardIdx: hand.indexOf(minCard), captured: null, score: 0 };
}

function scopaBotPlay(game){
    if(!game || game.state !== 'playing') return;
    const botId = game.playerOrder.find(id => id.startsWith('bot_'));
    if(!botId || game.currentTurn !== botId) return;
    const hand = game.hands[botId];
    if(!hand || hand.length === 0) return;

    const move = scopaBotChooseMove(hand, game.table);
    if(move.captured && move.captured.length > 0){
        scopaExecCapture(game, botId, move.card, move.cardIdx, move.captured);
    } else {
        // Metti carta sul tavolo
        hand.splice(move.cardIdx, 1);
        game.table.push(move.card);
        game.lastCapBy = null;
        scopaNextTurn(game);
    }
}

function scopaStartBotMatch(player, socketId){
    // Rimuovi dalla coda se ancora presente
    const qi = scopaQueue.findIndex(p => p.userId === player.userId);
    if(qi !== -1) scopaQueue.splice(qi, 1);

    const s = io.sockets.sockets.get(socketId);
    if(!s) return;

    // Deduci ingresso per il giocatore umano
    const fee = scopaDeductEntry(player.userId);
    if(!fee.ok){
        s.emit('scopa:error', { msg:`Crediti insufficienti (serve ${SCOPA_ENTRY_COST}, hai ${fee.credits}). Ricarica nello Shop!` });
        return;
    }
    if(fee.freeGame) s.emit('scopa:credits-update',{ delta:0, freeGame:true, remaining:fee.remaining, reason:'free' });
    else s.emit('scopa:credits-update',{ delta:-SCOPA_ENTRY_COST, total:_scopaCredits(player.userId).credits, reason:'entry' });
    _scopaStats(player.userId).gamesPlayed++;
    markDirty();

    const botId = 'bot_' + Date.now().toString(36);
    const botInfo = { socketId:'BOT', userId:botId, name:'🤖 KouverteBot', face:'🤖', color:'#00d4ff', isBot:true };
    const deck = scopaShuffle(scopaDeck());
    const gameId = 'sc' + Date.now().toString(36);
    const game = {
        gameId, round:1, playerOrder:[player.userId, botId],
        playerInfo:{ [player.userId]:player, [botId]:botInfo },
        socketIds:{ [player.userId]:socketId, [botId]:'BOT' },
        hands:{ [player.userId]:deck.splice(0,3), [botId]:deck.splice(0,3) },
        table:deck.splice(0,4), deck,
        captured:{ [player.userId]:[], [botId]:[] },
        scope:{ [player.userId]:0, [botId]:0 },
        totalScore:{ [player.userId]:0, [botId]:0 },
        currentTurn:player.userId, roundStarter:player.userId,
        lastCapBy:null, state:'playing', isBot:true, botId
    };
    scopaGames.set(gameId, game);
    scopaPlrGame.set(socketId, gameId);
    s.emit('scopa:state', scopaPublic(game, player.userId));
    scopaBroadcastLobby();
    console.log(`[SCOPA] Bot game avviato: ${player.userId} vs ${botId}`);
}

function scopaEndRound(game){
    const[a,b]=game.playerOrder;
    const rs=scopaRoundScore(game);
    game.totalScore[a]+=rs[a].total;
    game.totalScore[b]+=rs[b].total;
    const sa=io.sockets.sockets.get(game.socketIds[a]);
    const sb=io.sockets.sockets.get(game.socketIds[b]);
    // Controlla vittoria
    const aWin=game.totalScore[a]>=SCOPA_WIN, bWin=game.totalScore[b]>=SCOPA_WIN;
    if(aWin||bWin){
        game.state='finished';
        const winner=(aWin&&game.totalScore[a]>=game.totalScore[b])?a:b;
        const payload={roundScore:rs,totalScore:game.totalScore,winner,winnerInfo:game.playerInfo[winner]};
        if(sa) sa.emit('scopa:game-over',payload);
        if(sb) sb.emit('scopa:game-over',payload);
        scopaPlrGame.delete(game.socketIds[a]);
        scopaPlrGame.delete(game.socketIds[b]);
        // Accredita 20 crediti al vincitore (10 × raddoppio)
        scopaAwardWin(winner, game.socketIds[winner]);
        setTimeout(scopaBroadcastLobby, 100);
    } else {
        // Nuova mano tra 3 secondi
        const payload={roundScore:rs,totalScore:game.totalScore};
        if(sa) sa.emit('scopa:round-end',payload);
        if(sb) sb.emit('scopa:round-end',payload);
        game.roundStarter=game.playerOrder[(game.playerOrder.indexOf(game.roundStarter)+1)%2];
        game.currentTurn=game.roundStarter;
        scopaNewRound(game);
        setTimeout(()=>scopaEmitBoth(game),3500);
    }
}
function scopaExecCapture(game, byId, card, cardIdx, captured){
    game.hands[byId].splice(cardIdx,1);
    const capIds=new Set(captured.map(c=>c.id));
    game.table=game.table.filter(c=>!capIds.has(c.id));
    game.captured[byId].push(card,...captured);
    game.lastCapBy=byId;
    const isScopa=game.table.length===0;
    const gameStillGoing=(game.hands[game.playerOrder[0]].length+game.hands[game.playerOrder[1]].length+game.deck.length)>0;
    if(isScopa&&gameStillGoing){
        game.scope[byId]++;
        const[a,b]=game.playerOrder;
        const sa=io.sockets.sockets.get(game.socketIds[a]);
        const sb=io.sockets.sockets.get(game.socketIds[b]);
        if(sa) sa.emit('scopa:scopa',{byPlayerId:byId});
        if(sb) sb.emit('scopa:scopa',{byPlayerId:byId});
    }
    scopaNextTurn(game);
}

io.on('connection', (socket) => {
    console.log('[WEBRTC] Utente connesso:', socket.id);

    // ── Device binding: lega i crediti gratis al dispositivo (anti-reset) ──
    socket.on('device-sync', (payload = {}) => {
        try {
            const eff = reconcileDevice(socket, payload.deviceToken, payload.freeUsed);
            socket.emit('device-credits', { freeUsed: eff, limit: FREE_LIMIT_SRV });
        } catch (e) { /* non bloccare mai la connessione per il device-binding */ }
    });
    socket.on('disconnect', () => { delete socketDevice[socket.id]; });

    // ── SCOPA socket handlers ──────────────────────────────────────
    socket.on('scopa:join', ({ userId, name, face, color }) => {
        if(!userId||typeof userId!=='string') return;
        const uid=userId.slice(0,60);
        scopaWatchers.add(socket.id);
        // Annulla grace timer se il giocatore si sta riconnettendo
        if(scopaGraceTimers.has(uid)){
            const gt=scopaGraceTimers.get(uid);
            clearTimeout(gt.timer);
            scopaGraceTimers.delete(uid);
        }
        // Rimuovi da coda se già presente
        const qi=scopaQueue.findIndex(p=>p.userId===uid);
        if(qi!==-1) scopaQueue.splice(qi,1);
        // Cerca partita attiva per socket.id (caso normale) o per userId (riconnessione)
        let existingGid=scopaPlrGame.get(socket.id);
        if(!existingGid){
            for(const [gid,g] of scopaGames){
                if(g.state!=='finished'&&g.playerOrder.includes(uid)){
                    // Giocatore riconnesso: aggiorna socket nel gioco
                    const oldSid=g.socketIds[uid];
                    if(oldSid) scopaPlrGame.delete(oldSid);
                    g.socketIds[uid]=socket.id;
                    scopaPlrGame.set(socket.id,gid);
                    existingGid=gid;
                    // Notifica avversario che il giocatore è tornato
                    const oppId=g.playerOrder.find(id=>id!==uid);
                    const oppSock=oppId?io.sockets.sockets.get(g.socketIds[oppId]):null;
                    if(oppSock) oppSock.emit('scopa:opp-reconnected',{name:g.playerInfo[uid].name});
                    break;
                }
            }
        }
        if(existingGid){
            const g=scopaGames.get(existingGid);
            if(g&&g.state!=='finished'){socket.emit('scopa:state',scopaPublic(g,uid));scopaBroadcastLobby();return;}
        }
        const player={socketId:socket.id,userId:uid,name:String(name||'Anonimo').slice(0,30),face:String(face||'🎭').slice(0,8),color:String(color||'#00d4ff').slice(0,20)};
        scopaQueue.push(player);

        // Annulla eventuale timer bot precedente per questo utente
        if(scopaBotTimers.has(uid)){ clearTimeout(scopaBotTimers.get(uid).timer); scopaBotTimers.delete(uid); }

        if(scopaQueue.length<2){
            scopaBroadcastLobby();
            // Avvia countdown bot: se dopo SCOPA_BOT_WAIT secondi è ancora solo, avvia partita vs bot
            let secondsLeft = SCOPA_BOT_WAIT;
            const cdInterval = setInterval(() => {
                secondsLeft--;
                const s = io.sockets.sockets.get(socket.id);
                if(s) s.emit('scopa:bot-countdown', { seconds: secondsLeft });
                if(secondsLeft <= 0) clearInterval(cdInterval);
            }, 1000);
            const botTimer = setTimeout(() => {
                clearInterval(cdInterval);
                scopaBotTimers.delete(uid);
                // Controlla che sia ancora in coda (non matchato nel frattempo)
                const stillInQueue = scopaQueue.findIndex(p => p.userId === uid) !== -1;
                if(stillInQueue) scopaStartBotMatch(player, socket.id);
            }, SCOPA_BOT_WAIT * 1000);
            scopaBotTimers.set(uid, { timer: botTimer, interval: cdInterval });
            return;
        }

        // Annulla timer bot per entrambi i giocatori matchati
        for(const p of [uid]) { if(scopaBotTimers.has(p)){ clearTimeout(scopaBotTimers.get(p).timer); clearInterval(scopaBotTimers.get(p).interval); scopaBotTimers.delete(p); } }
        // Match! Prendi i primi 2
        const p1=scopaQueue.shift(), p2=scopaQueue.shift();
        const s1=io.sockets.sockets.get(p1.socketId), s2=io.sockets.sockets.get(p2.socketId);
        if(!s1||!s2){if(s1)scopaQueue.unshift(p1);if(s2)scopaQueue.unshift(p2);scopaBroadcastLobby();return;}

        // Controlla e scala 5 crediti (prime 3 partite gratis)
        const fee1 = scopaDeductEntry(p1.userId);
        const fee2 = scopaDeductEntry(p2.userId);
        if(!fee1.ok){ s1.emit('scopa:error',{msg:`Crediti insufficienti (serve ${SCOPA_ENTRY_COST}, hai ${fee1.credits}). Ricarica nello Shop!`}); scopaQueue.unshift(p2); scopaBroadcastLobby(); return; }
        if(!fee2.ok){ s2.emit('scopa:error',{msg:`Crediti insufficienti (serve ${SCOPA_ENTRY_COST}, hai ${fee2.credits}). Ricarica nello Shop!`}); scopaQueue.unshift(p1); scopaBroadcastLobby(); return; }
        // Notifica costo/gratis ai due giocatori
        if(fee1.freeGame) s1.emit('scopa:credits-update',{delta:0, freeGame:true, remaining:fee1.remaining, reason:'free'});
        else s1.emit('scopa:credits-update',{delta:-SCOPA_ENTRY_COST, total:_scopaCredits(p1.userId).credits, reason:'entry'});
        if(fee2.freeGame) s2.emit('scopa:credits-update',{delta:0, freeGame:true, remaining:fee2.remaining, reason:'free'});
        else s2.emit('scopa:credits-update',{delta:-SCOPA_ENTRY_COST, total:_scopaCredits(p2.userId).credits, reason:'entry'});
        // Incrementa contatore partite
        scopaRecordGame(p1.userId, p2.userId);

        const deck=scopaShuffle(scopaDeck());
        const gameId='sc'+Date.now().toString(36);
        const game={
            gameId, round:1, playerOrder:[p1.userId,p2.userId],
            playerInfo:{[p1.userId]:p1,[p2.userId]:p2},
            socketIds:{[p1.userId]:p1.socketId,[p2.userId]:p2.socketId},
            hands:{[p1.userId]:deck.splice(0,3),[p2.userId]:deck.splice(0,3)},
            table:deck.splice(0,4), deck,
            captured:{[p1.userId]:[],[p2.userId]:[]},
            scope:{[p1.userId]:0,[p2.userId]:0},
            totalScore:{[p1.userId]:0,[p2.userId]:0},
            currentTurn:p1.userId, roundStarter:p1.userId,
            lastCapBy:null, state:'playing'
        };
        scopaGames.set(gameId,game);
        scopaPlrGame.set(p1.socketId,gameId);
        scopaPlrGame.set(p2.socketId,gameId);
        s1.emit('scopa:state',scopaPublic(game,p1.userId));
        s2.emit('scopa:state',scopaPublic(game,p2.userId));
        // Broadcast lobby aggiornato a tutti (coda rimanente + altri watcher)
        scopaBroadcastLobby();
    });

    socket.on('scopa:play-card', ({ gameId, cardId, captureIds }) => {
        const game=scopaGames.get(gameId);
        if(!game||game.state!=='playing') return;
        const myId=game.playerOrder.find(id=>game.socketIds[id]===socket.id);
        if(!myId||game.currentTurn!==myId) return;
        const hand=game.hands[myId];
        const idx=hand.findIndex(c=>c.id===cardId);
        if(idx===-1) return;
        const card=hand[idx];
        const opts=scopaCaptures(card,game.table);
        if(!opts.length){
            // Nessuna cattura: metti sul tavolo
            hand.splice(idx,1);
            game.table.push(card);
            scopaNextTurn(game); return;
        }
        if(captureIds&&captureIds.length){
            // Il client ha specificato le carte da catturare
            const sel=game.table.filter(c=>captureIds.includes(c.id));
            const sum=sel.reduce((s,c)=>s+c.value,0);
            if(sum!==card.value){socket.emit('scopa:error',{msg:'Cattura non valida'});return;}
            const selSet=new Set(sel.map(c=>c.id));
            const valid=opts.find(opt=>opt.length===sel.length&&opt.every(c=>selSet.has(c.id)));
            if(!valid){socket.emit('scopa:error',{msg:'Combinazione non valida'});return;}
            scopaExecCapture(game,myId,card,idx,sel); return;
        }
        if(opts.length===1){
            scopaExecCapture(game,myId,card,idx,opts[0]); return;
        }
        // Più opzioni: chiedi al client di scegliere
        socket.emit('scopa:choose',{cardId,options:opts});
    });

    socket.on('scopa:rematch', ({ gameId }) => {
        const game=scopaGames.get(gameId);
        if(!game||game.state!=='finished') return;
        const myId=game.playerOrder.find(id=>game.socketIds[id]===socket.id);
        if(!myId) return;
        game.rematchVotes=game.rematchVotes||new Set();
        game.rematchVotes.add(myId);
        const oppId=game.playerOrder.find(id=>id!==myId);
        const oppSock=io.sockets.sockets.get(game.socketIds[oppId]);
        if(oppSock) oppSock.emit('scopa:rematch-req',{by:game.playerInfo[myId].name});
        if(game.rematchVotes.size===2){
            game.totalScore={[game.playerOrder[0]]:0,[game.playerOrder[1]]:0};
            game.roundStarter=game.playerOrder[0];
            game.state='playing';
            game.rematchVotes=new Set();
            scopaNewRound(game);
            scopaEmitBoth(game);
        }
    });

    socket.on('scopa:leave', () => {
        const gid=scopaPlrGame.get(socket.id);
        if(gid){
            const game=scopaGames.get(gid);
            if(game){
                const myId=game.playerOrder.find(id=>game.socketIds[id]===socket.id);
                const oppId=game.playerOrder.find(id=>game.socketIds[id]!==socket.id);
                // Se avversario è bot, termina semplicemente (niente notifica)
                if(!oppId || !oppId.startsWith('bot_')){
                    const oppSock=oppId?io.sockets.sockets.get(game.socketIds[oppId]):null;
                    if(oppSock) oppSock.emit('scopa:opp-left',{});
                }
                scopaGames.delete(gid);
                scopaPlrGame.delete(socket.id);
                if(oppId && !oppId.startsWith('bot_')) scopaPlrGame.delete(game.socketIds[oppId]);
            }
        }
        const qi=scopaQueue.findIndex(p=>p.socketId===socket.id);
        if(qi!==-1) scopaQueue.splice(qi,1);
        // Annulla timer bot se presente
        for(const [uid,bt] of scopaBotTimers){
            if(io.sockets.sockets.get(bt.timer)?._socketId === socket.id || true){
                // cerca per socketId nel player
                const pl = scopaQueue.find(p=>p.socketId===socket.id);
                if(!pl){ clearTimeout(bt.timer); if(bt.interval) clearInterval(bt.interval); scopaBotTimers.delete(uid); break; }
            }
        }
        scopaWatchers.delete(socket.id);
        scopaBroadcastLobby();
    });

    // Register user with socket
    socket.on('register-user', (data) => {
        const { userId, username } = data;
        activeCalls.set(userId, socket.id);
        userSockets.set(username, socket.id);
        console.log(`[SOCKET] ${username} (${userId}) registrato come ${socket.id}`);
    });

    // Battle room join/leave (spectators + participants)
    socket.on('battle:join', (battleId) => {
        if (typeof battleId === 'string' && battleId.startsWith('battle_')) {
            socket.join('battle-' + battleId);
        }
    });
    socket.on('battle:leave', (battleId) => {
        if (typeof battleId === 'string' && battleId.startsWith('battle_')) {
            socket.leave('battle-' + battleId);
        }
    });

    // ===== Battle Voice (WebRTC mesh) =====
    // role: 'speaker' (participant A/B) o 'listener' (spettatore)
    socket.on('battle-voice:join', (data) => {
        const { battleId, userId, role } = data || {};
        if (typeof battleId !== 'string' || !battleId.startsWith('battle_')) return;
        if (role !== 'speaker' && role !== 'listener') return;
        battleVoicePeers[battleId] = battleVoicePeers[battleId] || new Map();
        // lista peer esistenti per il newcomer
        const existing = [];
        battleVoicePeers[battleId].forEach((p, sid) => {
            if (sid !== socket.id) existing.push({ socketId: sid, userId: p.userId, role: p.role });
        });
        battleVoicePeers[battleId].set(socket.id, { userId, role });
        socket.join('battle-voice-' + battleId);
        socket.emit('battle-voice:peer-list', { battleId, peers: existing });
        socket.to('battle-voice-' + battleId).emit('battle-voice:peer-joined', { battleId, socketId: socket.id, userId, role });
    });

    socket.on('battle-voice:leave', (data) => {
        const { battleId } = data || {};
        if (!battleId) return;
        if (battleVoicePeers[battleId]) {
            battleVoicePeers[battleId].delete(socket.id);
            if (battleVoicePeers[battleId].size === 0) delete battleVoicePeers[battleId];
        }
        socket.leave('battle-voice-' + battleId);
        socket.to('battle-voice-' + battleId).emit('battle-voice:peer-left', { battleId, socketId: socket.id });
    });

    socket.on('battle-voice:offer', (data) => {
        const { to, offer, battleId } = data || {};
        if (to) io.to(to).emit('battle-voice:offer', { from: socket.id, offer, battleId });
    });
    socket.on('battle-voice:answer', (data) => {
        const { to, answer, battleId } = data || {};
        if (to) io.to(to).emit('battle-voice:answer', { from: socket.id, answer, battleId });
    });
    socket.on('battle-voice:ice', (data) => {
        const { to, candidate, battleId } = data || {};
        if (to) io.to(to).emit('battle-voice:ice', { from: socket.id, candidate, battleId });
    });

    // Messaging
    socket.on('join', (data) => {
        const username = data.username;
        userSockets.set(username, socket.id);
        console.log(`[CHAT] ${username} registrato come ${socket.id}`);
    });

    socket.on('send_message', (data) => {
        const targetSocketId = userSockets.get(data.to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('message', {
                from: data.from,
                text: data.text,
                timestamp: Date.now()
            });
        }
    });

    // Voice Room presence
    socket.on('join-voice-room', (data) => {
        const { roomSlug, userId, username } = data;
        socket.join('voice-room-' + roomSlug);
        userVoiceRooms.set(userId, { roomSlug, socketId: socket.id });

        io.to('voice-room-' + roomSlug).emit('user-joined-voice-room', {
            userId,
            username,
            timestamp: Date.now()
        });
        console.log(`[VOICE] ${username} entrato nella stanza ${roomSlug}`);
    });

    socket.on('leave-voice-room', (data) => {
        const { roomSlug, userId, username } = data;
        socket.leave('voice-room-' + roomSlug);
        userVoiceRooms.delete(userId);

        io.to('voice-room-' + roomSlug).emit('user-left-voice-room', {
            userId,
            username,
            timestamp: Date.now()
        });
        console.log(`[VOICE] ${username} uscito dalla stanza ${roomSlug}`);
    });

    // WebRTC for voice rooms (multi-user)
    // Helper: trova il socketId del destinatario `to` (userId) nella chat room
    function findSocketByUserId(roomId, userId) {
        // DEBUG logging
        console.log(`[findSocketByUserId] Cercando userId=${userId} in roomId=${roomId}`);
        
        // Cerca prima nella chat room specificata
        if (roomId && chatRoomUsers[roomId]) {
            const usersInRoom = Array.from(chatRoomUsers[roomId].entries());
            console.log(`[findSocketByUserId] Room ${roomId} contiene ${usersInRoom.length} utenti:`, usersInRoom.map(([sid, u]) => `${u.id}(${sid.substr(0,8)}...)`).join(', '));
            
            for (const [sid, u] of usersInRoom) {
                if (u.id === userId) {
                    console.log(`[findSocketByUserId] ✅ Trovato! userId=${userId} è socketId=${sid}`);
                    return sid;
                }
            }
            console.log(`[findSocketByUserId] ❌ userId=${userId} NON trovato in room=${roomId}`);
        } else {
            console.log(`[findSocketByUserId] ❌ Room ${roomId} non esiste o è undefined`);
        }
        
        // Fallback: cerca in tutte le chat room
        console.log(`[findSocketByUserId] Fallback: cercando in tutte le chat room...`);
        for (const [rid, users] of Object.entries(chatRoomUsers)) {
            for (const [sid, u] of users.entries()) {
                if (u.id === userId) {
                    console.log(`[findSocketByUserId] ✅ Trovato in fallback! userId=${userId} è socketId=${sid} in room=${rid}`);
                    return sid;
                }
            }
        }
        console.log(`[findSocketByUserId] ❌ userId=${userId} NON trovato in nessuna room`);
        return null;
    }

    // ── CAM APERTE: annuncio stato cam a tutta la stanza ──
    socket.on('cam-state', (data) => {
        const { roomId, userId, socketId, on, name, face } = data || {};
        if (!roomId) return;
        // Inoltra a tutti gli altri nella stanza chat
        socket.to('chat-' + roomId).emit('cam-state', { userId, socketId, on, name, face });
    });

    // ── SAFETY: segnalazione utente (funziona anche per anonimi) ──
    socket.on('report-user', (data) => {
        const { reportedId, reporterId, roomId, reason, name } = data || {};
        if (!reportedId || !reporterId || reportedId === reporterId) return;
        // Persisti per moderazione
        DB.reports = DB.reports || [];
        DB.reports.push({
            id: genId('rep'), from: reporterId, to: reportedId,
            reason: String(reason || '').replace(/[<>]/g, '').slice(0, 200),
            roomId: roomId || null, anon: true, created_at: Date.now(), status: 'pending'
        });
        markDirty();
        // Conta segnalatori DISTINTI (in memoria, per sessione server)
        global.reportTally = global.reportTally || {};
        const tally = (global.reportTally[reportedId] = global.reportTally[reportedId] || new Set());
        tally.add(reporterId);
        console.log(`[REPORT] ${name || reportedId} segnalato da ${reporterId} (${reason}) — distinti: ${tally.size}`);
        // Soglia: 3 segnalatori distinti → rimuovi dalla stanza (kick soft)
        if (tally.size >= 3 && roomId && chatRoomUsers[roomId]) {
            const map = chatRoomUsers[roomId];
            for (const [sid, u] of [...map.entries()]) {
                if (u.id === reportedId) {
                    io.to(sid).emit('safety-kicked', { reason: 'Troppe segnalazioni dalla community' });
                    const s = io.sockets.sockets.get(sid);
                    if (s) s.leave('chat-' + roomId);
                    map.delete(sid);
                }
            }
            broadcastChatUsers(roomId);
            io.to('chat-' + roomId).emit('room-online', { roomId, count: map.size });
            delete global.reportTally[reportedId];
            console.log(`[REPORT] ${reportedId} rimosso da ${roomId} (soglia raggiunta)`);
        }
    });

    // ── CAM ROULETTE: matchmaking casuale ──────────────────
    socket.on('roulette-join', (data) => {
        const { userId, name, face } = data || {};
        if (!userId) return;
        global.rouletteQueue = global.rouletteQueue || [];
        global.roulettePairs = global.roulettePairs || new Map();
        // Sgancia da un eventuale abbinamento precedente (il vecchio partner si ri-accoda)
        const oldPartner = global.roulettePairs.get(socket.id);
        if (oldPartner) {
            global.roulettePairs.delete(socket.id);
            global.roulettePairs.delete(oldPartner);
            io.to(oldPartner).emit('roulette-partner-left', {});
        }
        // Togli da coda (evita duplicati)
        global.rouletteQueue = global.rouletteQueue.filter(e => e.sid !== socket.id);
        // Cerca un partner libero (diverso da me)
        const partner = global.rouletteQueue.find(e => e.userId !== userId);
        if (partner) {
            global.rouletteQueue = global.rouletteQueue.filter(e => e.sid !== partner.sid);
            global.roulettePairs.set(socket.id, partner.sid);
            global.roulettePairs.set(partner.sid, socket.id);
            const iAmCaller = socket.id < partner.sid; // deterministico, evita glare
            io.to(socket.id).emit('roulette-matched', { partnerId: partner.userId, partnerSocketId: partner.sid, partnerName: partner.name, partnerFace: partner.face, isCaller: iAmCaller });
            io.to(partner.sid).emit('roulette-matched', { partnerId: userId, partnerSocketId: socket.id, partnerName: name, partnerFace: face, isCaller: !iAmCaller });
            console.log(`[ROULETTE] match ${name} ↔ ${partner.name}`);
        } else {
            global.rouletteQueue.push({ sid: socket.id, userId, name, face });
            io.to(socket.id).emit('roulette-waiting', {});
        }
    });
    socket.on('roulette-leave', () => {
        global.rouletteQueue = (global.rouletteQueue || []).filter(e => e.sid !== socket.id);
        global.roulettePairs = global.roulettePairs || new Map();
        const partnerSid = global.roulettePairs.get(socket.id);
        if (partnerSid) {
            global.roulettePairs.delete(socket.id);
            global.roulettePairs.delete(partnerSid);
            io.to(partnerSid).emit('roulette-partner-left', {});
        }
    });

    // ── VIDEO PRIVATO: routing richieste ──────────────────
    socket.on('video-request', (data) => {
        const { to, toSocketId, from, fromSocketId, fromName, fromFace, roomId } = data;
        const targetSid = toSocketId || findSocketByUserId(roomId, to);
        console.log(`[VIDEO-REQ] ${fromName}(${(fromSocketId||'').slice(0,8)}) → ${to}(${(toSocketId||'').slice(0,8)||'lookup'})`);
        if (targetSid) {
            io.to(targetSid).emit('video-request', { from, fromSocketId, fromName, fromFace, roomId });
        }
    });

    socket.on('video-request-accepted', (data) => {
        const { to, toSocketId, from, fromSocketId, roomId } = data;
        const targetSid = toSocketId || findSocketByUserId(roomId, to);
        if (targetSid) {
            io.to(targetSid).emit('video-request-accepted', { from, fromSocketId });
        }
    });

    socket.on('video-request-declined', (data) => {
        const { to, toSocketId, from, roomId } = data;
        const targetSid = toSocketId || findSocketByUserId(roomId, to);
        if (targetSid) {
            io.to(targetSid).emit('video-request-declined', { from });
        }
    });

    socket.on('video-call-ended', (data) => {
        const { to, toSocketId, from, roomId } = data;
        const targetSid = toSocketId || findSocketByUserId(roomId, to);
        if (targetSid) {
            io.to(targetSid).emit('video-call-ended', { from });
        }
    });

    socket.on('voice-offer', (data) => {
        const { to, toSocketId, from, fromSocketId, roomId, roomSlug, offer } = data;
        const room = roomId || roomSlug;
        // Usa toSocketId diretto se disponibile (più preciso, funziona anche con userId duplicati)
        const targetSid = toSocketId || findSocketByUserId(room, to);
        console.log(`[VOICE-OFFER] from=${from}(${(fromSocketId||'').slice(0,8)}) to=${to}(${(toSocketId||'').slice(0,8)||'lookup'}) targetSid=${(targetSid||'NOT-FOUND').slice(0,8)}`);
        if (targetSid) {
            io.to(targetSid).emit('voice-offer', { from, fromSocketId, to, offer });
        } else {
            if (roomSlug) socket.to('voice-room-' + roomSlug).emit('voice-offer', { from, to, offer });
        }
    });

    socket.on('voice-answer', (data) => {
        const { to, toSocketId, from, fromSocketId, roomId, roomSlug, answer } = data;
        const room = roomId || roomSlug;
        const targetSid = toSocketId || findSocketByUserId(room, to);
        if (targetSid) {
            io.to(targetSid).emit('voice-answer', { from, fromSocketId, to, answer });
        } else {
            if (roomSlug) socket.to('voice-room-' + roomSlug).emit('voice-answer', { from, to, answer });
        }
    });

    socket.on('voice-ice', (data) => {
        const { to, toSocketId, from, fromSocketId, roomId, roomSlug, candidate } = data;
        const room = roomId || roomSlug;
        const targetSid = toSocketId || findSocketByUserId(room, to);
        if (targetSid) {
            io.to(targetSid).emit('voice-ice', { from, fromSocketId, to, candidate });
        } else {
            if (roomSlug) socket.to('voice-room-' + roomSlug).emit('voice-ice', { from, to, candidate });
        }
    });

    // Direct call (after match)
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', socket.id);
        console.log(`[WEBRTC] ${socket.id} unito alla stanza ${roomId}`);
    });

    socket.on('offer', (data) => {
        socket.to(data.room).emit('offer', { offer: data.offer, from: socket.id });
    });

    socket.on('answer', (data) => {
        socket.to(data.room).emit('answer', { answer: data.answer, from: socket.id });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.room).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
    });

    socket.on('call-user', (data) => {
        const targetSocketId = activeCalls.get(data.toUserId);
        if (targetSocketId) {
            socket.to(targetSocketId).emit('incoming-call', {
                fromUserId: data.fromUserId,
                fromUsername: data.fromUsername,
                roomId: data.roomId
            });
        }
    });

    socket.on('call-answered', (data) => {
        const callerSocketId = activeCalls.get(data.toUserId);
        if (callerSocketId) {
            socket.to(callerSocketId).emit('call-accepted', { roomId: data.roomId });
        }
    });

    socket.on('end-call', (data) => {
        socket.to(data.room).emit('call-ended');
    });

    // ===== DM 1:1 (Messaggi diretti tra amici) =====
    // Entrambe le map usano il serverDbId come chiave canonica
    if (!global.dmUsers) global.dmUsers = new Map();     // serverDbId → socketId
    if (!global.dmServerIds) global.dmServerIds = new Map(); // (compat alias)

    socket.on('dm-register', (data) => {
        if (!data) return;
        // Usa serverId come chiave canonica; fallback a userId per utenti anonimi
        const canonical = String(data.serverId || data.userId || '').slice(0, 60);
        if (canonical) {
            global.dmUsers.set(canonical, socket.id);
            global.dmServerIds.set(canonical, socket.id);
        }
        socket._dmUserId = canonical;
        socket._dmServerId = canonical;
    });

    socket.on('dm-send', (data) => {
        if (!data || !data.to || !data.text) return;
        const fromId = String(data.from || socket._dmUserId || '').slice(0, 60);
        const safe = {
            from:     fromId,
            to:       String(data.to).slice(0, 60),
            text:     String(data.text).slice(0, 500),
            ts:       Date.now(),
            fromName: String(data.fromName || '').slice(0, 30),
            fromFace: String(data.fromFace || '🎭').slice(0, 4)
        };
        // Salva messaggio nel DB per recapito offline
        DB.dm_messages = DB.dm_messages || [];
        const dmKey = [safe.from, safe.to].sort().join('_');
        DB.dm_messages.push({ ...safe, key: dmKey });
        // Tieni solo ultimi 200 msg per coppia
        const keyCounts = {};
        DB.dm_messages = DB.dm_messages.filter(m => {
            keyCounts[m.key] = (keyCounts[m.key] || 0) + 1;
            return keyCounts[m.key] <= 200;
        });
        markDirty();

        // Consegna real-time se destinatario online
        const targetSocketId = global.dmUsers.get(safe.to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('dm-receive', safe);
        } else {
            // Offline: push notification
            const toUser = DB.users ? DB.users.find(u => u.id === safe.to) : null;
            if (toUser) pushToUser(toUser.id, {
                title: `💌 ${safe.fromName || 'Messaggio privato'}`,
                body: safe.text.slice(0, 100),
                url: '/app.html',
                tag: 'dm-msg-' + safe.from
            });
        }
    });

    socket.on('dm-open', (data) => {
        if (!data?.withUserId) return;
        const myId = socket._dmUserId;
        if (!myId) return;
        const dmKey = [myId, String(data.withUserId)].sort().join('_');
        const msgs = (DB.dm_messages || [])
            .filter(m => m.key === dmKey).slice(-50)
            .map(m => ({ from: m.from, to: m.to, text: m.text, ts: m.ts, fromName: m.fromName, fromFace: m.fromFace }));
        socket.emit('dm-history', { withUserId: data.withUserId, msgs });
    });

    // ===== 🌙 KOUVERTE NOTTE socket handlers =====
    socket.on('notte-message', (data) => {
        if (!DB.current_notte || Date.now() > DB.current_notte.endsAt) return;
        if (!data?.text || typeof data.text !== 'string') return;
        const msgId = 'nm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
        const msg = {
            id: msgId,
            userId: String(data.userId || '').slice(0, 60),
            name:   String(data.name || 'Anonimo').slice(0, 30),
            face:   String(data.face || '🎭').slice(0, 4),
            color:  /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : '#00d4ff',
            text:   String(data.text).slice(0, 280),
            ts:     Date.now(),
            votes:  0
        };
        DB.current_notte.messages.push(msg);
        if (DB.current_notte.messages.length > 500) DB.current_notte.messages.shift();
        io.emit('notte-message', msg);
        markDirty();
    });

    socket.on('notte-vote', (data) => {
        if (!DB.current_notte || Date.now() > DB.current_notte.endsAt) return;
        const { msgId, voterId } = data || {};
        if (!msgId || !voterId) return;
        DB.current_notte.votes[msgId] = DB.current_notte.votes[msgId] || [];
        const already = DB.current_notte.votes[msgId].includes(String(voterId));
        if (already) {
            DB.current_notte.votes[msgId] = DB.current_notte.votes[msgId].filter(v => v !== String(voterId));
        } else {
            DB.current_notte.votes[msgId].push(String(voterId));
        }
        const voteCount = DB.current_notte.votes[msgId].length;
        io.emit('notte-vote-update', { msgId, votes: voteCount });
    });

    // ===== 🎤 PROFILO VOCE — salva/cancella nota vocale =====
    socket.on('voice-note-save', (data) => {
        if (!data?.userId || !data?.audio) return;
        const uid = String(data.userId).slice(0, 60);
        const u = (DB.users || []).find(u => u.id === uid);
        if (!u) return;
        // Valida: deve essere data:audio/...;base64, max 150KB
        const raw = String(data.audio);
        if (!raw.startsWith('data:audio/') || raw.length > 200000) return;
        u.kvData = u.kvData || {};
        u.kvData.voiceNote = raw;
        u.kvData.voiceNoteTs = Date.now();
        markDirty();
        socket.emit('voice-note-saved', { ok: true });
    });

    socket.on('voice-note-delete', (data) => {
        if (!data?.userId) return;
        const u = (DB.users || []).find(u => u.id === String(data.userId).slice(0,60));
        if (!u) return;
        u.kvData = u.kvData || {};
        delete u.kvData.voiceNote;
        delete u.kvData.voiceNoteTs;
        markDirty();
    });

    // ===== STANZE A CODICE (Custom Rooms) =====
    // codeRooms: codice -> { code, name, emoji, ownerId, createdAt }
    if (!global.codeRooms) global.codeRooms = new Map();

    socket.on('create-code-room', ({ room }) => {
        if (!room || !room.code || typeof room.code !== 'string') return;
        const code = String(room.code).toUpperCase().slice(0, 6);
        if (code.length !== 6) return;

        // Password opzionale: se fornita, viene hashata (bcrypt-light: sha256 base)
        const rawPwd = room.password ? String(room.password).slice(0, 50) : null;
        const pwdHash = rawPwd ? require('crypto').createHash('sha256').update(rawPwd + code).digest('hex').slice(0,16) : null;

        // Durata opzionale: 30min / 1h / 2h / 24h — default 60min
        const VALID_DURATIONS = [30, 60, 120, 1440]; // minuti
        const durationMin = VALID_DURATIONS.includes(Number(room.durationMin)) ? Number(room.durationMin) : 60;
        const expiresAt = Date.now() + durationMin * 60 * 1000;

        const safeRoom = {
            id: 'code_' + code,
            name: String(room.name || 'Stanza Privata').slice(0, 50),
            emoji: String(room.emoji || '🔐').slice(0, 4),
            code: code,
            pwdHash,
            hasPassword: !!pwdHash,
            ownerId: String(room.ownerId || '').slice(0, 40),
            tier: 'code',
            createdAt: Date.now(),
            expiresAt,           // null = nessuna scadenza
            durationMin
        };

        global.codeRooms.set(code, safeRoom);
        console.log(`[CODE-ROOM] Created: ${code} - ${safeRoom.name} (pwd: ${!!pwdHash})`);

        // Risposta al creatore: include il codice ma NON il pwdHash
        const { pwdHash: _, ...publicRoom } = safeRoom;
        socket.emit('code-room-created', { room: publicRoom });
    });

    socket.on('join-code-room', ({ code, room, password }) => {
        if (!code) return;
        const upperCode = String(code).toUpperCase();

        // Se la stanza non esiste sul server ma il client ha il codice, la creiamo
        if (!global.codeRooms.has(upperCode) && room) {
            const safeRoom = {
                id: 'code_' + upperCode,
                name: String(room.name || ('Stanza ' + upperCode)).slice(0, 50),
                emoji: String(room.emoji || '🔐').slice(0, 4),
                code: upperCode,
                pwdHash: null, hasPassword: false,
                ownerId: '',
                tier: 'code',
                createdAt: Date.now(),
                expiresAt: Date.now() + 60 * 60 * 1000,
                durationMin: 60
            };
            global.codeRooms.set(upperCode, safeRoom);
        }

        const codeRoom = global.codeRooms.get(upperCode);
        if (!codeRoom) { socket.emit('code-room-error', { error: 'Stanza non trovata' }); return; }

        // Controlla scadenza
        if (codeRoom.expiresAt && Date.now() > codeRoom.expiresAt) {
            global.codeRooms.delete(upperCode);
            socket.emit('code-room-error', { error: '⏳ Questa stanza è scaduta e non esiste più' });
            return;
        }

        // Verifica password se richiesta
        if (codeRoom.pwdHash) {
            const attempt = password ? require('crypto').createHash('sha256').update(String(password).slice(0,50) + upperCode).digest('hex').slice(0,16) : null;
            if (attempt !== codeRoom.pwdHash) {
                socket.emit('code-room-error', { error: 'Password errata 🔒' });
                return;
            }
        }

        const { pwdHash: _, ...publicRoom } = codeRoom;
        socket.emit('code-room-joined', { room: publicRoom });
        console.log(`[CODE-ROOM] User joining: ${upperCode}`);
    });

    // ===== CHAT ROOMS =====
    socket.on('join-chat-room', ({ roomId, user }) => {
        if (!roomId || typeof roomId !== 'string') return;
        // Lascia eventuali stanze chat precedenti
        for (const [rid, users] of Object.entries(chatRoomUsers)) {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                io.to('chat-' + rid).emit('room-online', { roomId: rid, count: users.size });
                // Broadcast lista aggiornata
                broadcastChatUsers(rid);
            }
        }
        socket.join('chat-' + roomId);
        chatRoomUsers[roomId] = chatRoomUsers[roomId] || new Map();
        chatRoomUsers[roomId].set(socket.id, user);
        // Invia storia recente
        const history = (chatRoomHistory[roomId] || []).slice(-50);
        socket.emit('chat-history', { roomId, messages: history });
        // Aggiorna contatori
        const count = chatRoomUsers[roomId].size;
        io.to('chat-' + roomId).emit('room-online', { roomId, count });
        io.emit('global-online', { count: getTotalOnline() });
        // Broadcast lista utenti aggiornata
        broadcastChatUsers(roomId);

        // ── Room alert: notifica utenti che hanno il campanellino attivo ────
        const ROOM_ALERT_THRESHOLD = 5; // notifica quando si raggiungono 5+ utenti
        const ROOM_ALERT_COOLDOWN  = 30 * 60 * 1000; // max 1 push ogni 30 min per coppia stanza+utente
        if (count >= ROOM_ALERT_THRESHOLD) {
            const joinedUserId = user?.id || '';
            const subs = (DB.room_alert_subs || []).filter(
                s => s.roomId === roomId && s.userId !== joinedUserId
            );
            for (const sub of subs) {
                const ck = `${roomId}:${sub.userId}`;
                const last = roomAlertCooldown[ck] || 0;
                if (Date.now() - last < ROOM_ALERT_COOLDOWN) continue;
                roomAlertCooldown[ck] = Date.now();
                const ogInfo = ROOM_OG[roomId] || { name: roomId, emoji: '💬' };
                webpush.sendNotification(sub.subscription, JSON.stringify({
                    title: `${ogInfo.emoji} ${ogInfo.name} è viva — ${count} online!`,
                    body: `Entra adesso in Chat ${ogInfo.name} su Kouverte`,
                    url: `/app.html?room=${roomId}`,
                    tag: 'room-alert-' + roomId,
                    icon: '/icon-192.png'
                })).catch(e => {
                    if (e.statusCode === 410 || e.statusCode === 404) {
                        DB.room_alert_subs = (DB.room_alert_subs || []).filter(
                            s => !(s.userId === sub.userId && s.roomId === sub.roomId)
                        );
                        markDirty();
                    }
                });
            }
        }
    });

    socket.on('leave-chat-room', ({ roomId }) => {
        if (!roomId) return;
        socket.leave('chat-' + roomId);
        if (chatRoomUsers[roomId]) {
            chatRoomUsers[roomId].delete(socket.id);
            const count = chatRoomUsers[roomId].size;
            io.to('chat-' + roomId).emit('room-online', { roomId, count });
            broadcastChatUsers(roomId);
        }
        io.emit('global-online', { count: getTotalOnline() });
    });

    // Funzione helper: broadcast lista utenti in stanza
    function broadcastChatUsers(roomId) {
        const map = chatRoomUsers[roomId];
        if (!map) return;
        const users = [];
        for (const [sid, u] of map.entries()) {
            users.push({ socketId: sid, ...u });
        }
        io.to('chat-' + roomId).emit('chat-users', { roomId, users });
    }

    socket.on('chat-message', ({ roomId, msg }) => {
        if (!roomId || !msg?.text) return;
        // Blocca utenti bannati
        const senderUser = msg.userId ? DB.users.find(u => u.id === msg.userId) : null;
        if (senderUser?.banned) { socket.emit('you-are-banned', { reason: senderUser.ban_reason || '' }); return; }
        // Sanitize base
        // Valida thumbnail foto: deve essere data:image/jpeg;base64,... max 6KB
        const thumbRaw = msg.photoThumb || null;
        let safeThumb = null;
        if (thumbRaw && typeof thumbRaw === 'string'
            && thumbRaw.startsWith('data:image/jpeg;base64,')
            && thumbRaw.length < 9000) {
            safeThumb = thumbRaw;
        }
        const clean = {
            userId:    String(msg.userId || 'anon').slice(0, 40),
            name:      String(msg.name   || 'Anonimo').slice(0, 30),
            color:     /^#[0-9a-f]{6}$/i.test(msg.color) ? msg.color : '#a855f7',
            face:      String(msg.face   || '🎭').slice(0, 4),
            mask:      String(msg.mask   || '🎭').slice(0, 4),
            activeFrame: /^[a-z]{1,20}$/i.test(msg.activeFrame || '') ? msg.activeFrame : 'none',
            active_nickFx: /^[a-z_]{1,20}$/i.test(msg.active_nickFx || '') ? msg.active_nickFx : null,
            active_bubble: /^[a-z_]{1,20}$/i.test(msg.active_bubble || '') ? msg.active_bubble : null,
            isPremium: !!msg.isPremium,
            msgCount:  Math.max(0, Math.min(99999, parseInt(msg.msgCount) || 0)),
            photoThumb: safeThumb,
            text:      String(msg.text).slice(0, 800),
            ts:        Date.now(),
            roomId,
            replyTo: msg.replyTo ? {
                userId: String(msg.replyTo.userId || '').slice(0, 40),
                name:   String(msg.replyTo.name   || 'Anonimo').slice(0, 30),
                color:  /^#[0-9a-f]{6}$/i.test(msg.replyTo.color) ? msg.replyTo.color : '#00d4ff',
                text:   String(msg.replyTo.text   || '').slice(0, 120)
            } : undefined
        };
        // Salva in storia (max 100 per stanza)
        chatRoomHistory[roomId] = chatRoomHistory[roomId] || [];
        chatRoomHistory[roomId].push(clean);
        if (chatRoomHistory[roomId].length > 100) chatRoomHistory[roomId].shift();
        // Broadcast a tutti nella stanza TRANNE chi ha inviato (il mittente si gestisce lato client)
        socket.to('chat-' + roomId).emit('chat-message', { roomId, msg: clean });
        // ── Device binding: conta il messaggio gratis sul dispositivo (anti-reset) ──
        // Non blocca MAI l'invio: aggiorna solo il conteggio autorevole e, al limite,
        // segnala al mittente di mostrare il paywall.
        if (!clean.isPremium) {
            const dev = socketDevice[socket.id];
            if (dev) {
                const cur = Math.max((_devGet(dev.tok) || {}).u || 0, (_devGet(dev.ipua) || {}).u || 0) + 1;
                if (dev.tok) _devSet(dev.tok, cur);
                _devSet(dev.ipua, cur);
                if (cur >= FREE_LIMIT_SRV) socket.emit('paywall-reached', { freeUsed: cur, limit: FREE_LIMIT_SRV });
            }
        }
        // Traccia per leaderboard settimanale + classifica città
        trackWeeklyMsg(clean.userId, clean.name, clean.face, clean.color);
        trackDailyCity(roomId);
    });

    // Messaggio vocale: trasmette audio base64 a tutti nella stanza
    socket.on('voice-msg', ({ roomId, audio, mimeType, userId, name, color, face, duration }) => {
        if (!roomId || !audio || typeof audio !== 'string') return;
        // Limita dimensione: base64 di 60s audio opus ≈ 200KB → max 400KB
        if (audio.length > 550000) return;
        const safeAudio = audio.replace(/[^A-Za-z0-9+/=]/g, '');
        const safeMime = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'].includes(mimeType)
            ? mimeType : 'audio/webm';
        const msg = {
            type: 'voice',
            userId: String(userId || 'anon').slice(0, 40),
            name: String(name || 'Anonimo').slice(0, 30),
            color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#a855f7',
            face: String(face || '🎭').slice(0, 4),
            audio: safeAudio,
            mimeType: safeMime,
            duration: Math.min(60, Math.max(0, parseInt(duration) || 0)),
            ts: Date.now(),
            roomId
        };
        // Salva in storia (come i messaggi testo)
        chatRoomHistory[roomId] = chatRoomHistory[roomId] || [];
        chatRoomHistory[roomId].push({ ...msg, audio: '[voice]' }); // non salvare blob in storia
        if (chatRoomHistory[roomId].length > 100) chatRoomHistory[roomId].shift();
        socket.to('chat-' + roomId).emit('voice-msg', { roomId, msg });
    });

    // ── Live Reactions ──────────────────────────────────────────────────────
    // ── REGALO VIRTUALE ──────────────────────────────────────
    socket.on('gift', ({ roomId, giftId, giftIcon, giftName, from, face }) => {
        if (!roomId || typeof roomId !== 'string' || roomId.length > 40) return;
        const safeGiftId   = typeof giftId   === 'string' ? giftId.slice(0, 30)   : '';
        const safeGiftIcon = typeof giftIcon === 'string' ? giftIcon.slice(0, 8)  : '🎁';
        const safeGiftName = typeof giftName === 'string' ? giftName.slice(0, 30) : 'Regalo';
        const safeFrom     = typeof from     === 'string' ? from.slice(0, 30)     : 'Qualcuno';
        const safeFace     = typeof face     === 'string' ? face.slice(0, 8)      : '🎭';
        // Rimbalza a tutti gli ALTRI utenti nella stanza (il mittente lo renderizza già in locale)
        socket.to('chat-' + roomId).emit('gift', {
            roomId, giftId: safeGiftId, giftIcon: safeGiftIcon, giftName: safeGiftName,
            from: safeFrom, face: safeFace
        });
    });

    socket.on('chat-reaction', ({ roomId, emoji, color, userId, name }) => {
        if (!roomId || typeof roomId !== 'string' || roomId.length > 40) return;
        // Valida emoji (deve essere una stringa corta)
        const safeEmoji = typeof emoji === 'string' ? [...emoji].slice(0, 2).join('') : '❤️';
        const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#ff6b9d';

        // Traccia reazioni recenti per fire mode (per stanza)
        global.roomRecentReactions = global.roomRecentReactions || {};
        const now = Date.now();
        global.roomRecentReactions[roomId] = (global.roomRecentReactions[roomId] || [])
            .filter(r => now - r.ts < 8000);
        global.roomRecentReactions[roomId].push({ ts: now, userId: String(userId||'').slice(0,40) });
        const count = global.roomRecentReactions[roomId].length;

        // Calcola combo: quante persone diverse hanno reagito negli ultimi 2 secondi
        const recent2s = global.roomRecentReactions[roomId].filter(r => now - r.ts < 2000);
        const uniqueUsers2s = new Set(recent2s.map(r => r.userId)).size;
        const combo = Math.min(uniqueUsers2s, 99);

        // Broadcast reazione a tutta la stanza (incluso mittente)
        io.to('chat-' + roomId).emit('chat-reaction', { roomId, emoji: safeEmoji, color: safeColor, combo });

        // Fire mode: 15+ reazioni negli ultimi 8 secondi → broadcast una volta
        const FIRE_THRESHOLD = 15;
        const FIRE_COOLDOWN  = 15000; // 15s tra un fire mode e l'altro
        global.roomFireCooldown = global.roomFireCooldown || {};
        const lastFire = global.roomFireCooldown[roomId] || 0;
        if (count >= FIRE_THRESHOLD && Date.now() - lastFire > FIRE_COOLDOWN) {
            global.roomFireCooldown[roomId] = Date.now();
            io.to('chat-' + roomId).emit('chat-fire-mode', { roomId, count });
            console.log(`[FIRE] ${roomId} — ${count} reazioni in 8s!`);
        }
    });

    socket.on('chat-typing', ({ roomId, user }) => {
        if (!roomId || !user) return;
        socket.to('chat-' + roomId).emit('chat-typing', { roomId, user });
    });

    socket.on('chat-stop-typing', ({ roomId, userId }) => {
        if (!roomId) return;
        socket.to('chat-' + roomId).emit('chat-stop-typing', { roomId, userId });
    });

    socket.on('disconnect', () => {
        // Pulizia roulette: togli da coda + sgancia partner
        if (global.rouletteQueue) global.rouletteQueue = global.rouletteQueue.filter(e => e.sid !== socket.id);
        if (global.roulettePairs) {
            const rp = global.roulettePairs.get(socket.id);
            if (rp) { global.roulettePairs.delete(socket.id); global.roulettePairs.delete(rp); io.to(rp).emit('roulette-partner-left', {}); }
        }
        // Rimuovi dalle chat rooms
        for (const [rid, users] of Object.entries(chatRoomUsers)) {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                io.to('chat-' + rid).emit('room-online', { roomId: rid, count: users.size });
                broadcastChatUsers(rid);
            }
        }
        // Rimuovi da DM tracking
        if (socket._dmUserId && global.dmUsers) global.dmUsers.delete(socket._dmUserId);
        if (socket._dmServerId && global.dmServerIds) global.dmServerIds.delete(socket._dmServerId);
        io.emit('global-online', { count: getTotalOnline() });
        // Clean up from activeCalls + DB voice_rooms
        for (const [userId, socketId] of activeCalls.entries()) {
            if (socketId === socket.id) {
                activeCalls.delete(userId);
                const roomData = userVoiceRooms.get(userId);
                if (roomData) {
                    // FIX: rimuovi anche dal DB.voice_rooms (era solo Map in memoria)
                    const room = DB.voice_rooms[roomData.roomSlug];
                    if (room) {
                        const p = room.participants.find(pp => pp.userId === userId);
                        const username = p?.username;
                        room.participants = room.participants.filter(pp => pp.userId !== userId);
                        markDirty();
                        io.to('voice-room-' + roomData.roomSlug).emit('user-left-voice-room', {
                            userId, username,
                            timestamp: Date.now()
                        });
                    }
                    userVoiceRooms.delete(userId);
                }
                break;
            }
        }

        // Clean up from userSockets
        for (const [username, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(username);
                break;
            }
        }

        // Clean up battle voice peers
        for (const battleId of Object.keys(battleVoicePeers)) {
            if (battleVoicePeers[battleId].has(socket.id)) {
                battleVoicePeers[battleId].delete(socket.id);
                io.to('battle-voice-' + battleId).emit('battle-voice:peer-left', { battleId, socketId: socket.id });
                if (battleVoicePeers[battleId].size === 0) delete battleVoicePeers[battleId];
            }
        }

        socket.broadcast.emit('user-disconnected', socket.id);
        // Scopa: cleanup in caso di disconnessione (con grace period per riconnessione)
        const scopaGid=scopaPlrGame.get(socket.id);
        if(scopaGid){
            const sg=scopaGames.get(scopaGid);
            if(sg&&sg.state!=='finished'){
                const dcId=sg.playerOrder.find(id=>sg.socketIds[id]===socket.id);
                if(dcId){
                    // Avvisa avversario della disconnessione temporanea
                    const oppId=sg.playerOrder.find(id=>id!==dcId);
                    const oppSock=oppId?io.sockets.sockets.get(sg.socketIds[oppId]):null;
                    if(oppSock) oppSock.emit('scopa:opp-disconnected',{});
                    // Grace period 30s: il giocatore può riconnettersi
                    const graceTimer=setTimeout(()=>{
                        scopaGraceTimers.delete(dcId);
                        const stillGame=scopaGames.get(scopaGid);
                        if(stillGame&&stillGame.state!=='finished'){
                            const oSock=oppId?io.sockets.sockets.get(stillGame.socketIds[oppId]):null;
                            if(oSock) oSock.emit('scopa:opp-left',{});
                            scopaGames.delete(scopaGid);
                            if(oppId) scopaPlrGame.delete(stillGame.socketIds[oppId]);
                        }
                        scopaBroadcastLobby();
                    },30000);
                    scopaGraceTimers.set(dcId,{timer:graceTimer,gameId:scopaGid});
                } else {
                    scopaGames.delete(scopaGid);
                }
            } else if(sg){
                scopaGames.delete(scopaGid);
            }
            scopaPlrGame.delete(socket.id);
        }
        const qsi=scopaQueue.findIndex(p=>p.socketId===socket.id);
        if(qsi!==-1) scopaQueue.splice(qsi,1);
        const wasWatcher=scopaWatchers.delete(socket.id);
        if(qsi!==-1||scopaGid||wasWatcher) scopaBroadcastLobby();
    });

});

// ─── Express global error handler (4 params = error middleware) ───────────────
app.use((err, req, res, next) => {
    console.error('[Express error]', req.method, req.path, err.message || err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'Errore interno del server' });
});

// ─── Process-level crash guards ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[CRASH] uncaughtException:', err);
    // Salva il DB prima di morire
    try { if (dbDirty) { require('fs').writeFileSync(DB_FILE, JSON.stringify(DB, null, 2)); } } catch(_) {}
});
process.on('unhandledRejection', (reason) => {
    console.error('[CRASH] unhandledRejection:', reason);
});

// ============ START ============

server.listen(PORT, HOST, () => {
    console.log('');
    console.log('🎙  VO✕ · Voice Stories');
    console.log('────────────────────────────────────');
    console.log('   Server:  http://' + HOST + ':' + PORT);
    console.log('   Data file:', DB_FILE);
    console.log('────────────────────────────────────');
});

// Avvia anche il bot Telegram nello stesso processo (richiesto su Render free tier)
// Disabilitabile con env BOT_DISABLED=1
// NB: tg-bot.js ha un fallback hardcoded del token, quindi avvia sempre se non disabled
let _botStatus = { running: false, reason: '', error: null };
const hasEnvToken = !!(process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN);
if (process.env.BOT_DISABLED === '1') {
    _botStatus = { running: false, reason: 'BOT_DISABLED=1', tokenSet: hasEnvToken };
    console.log('[BOT] Skipped (BOT_DISABLED=1)');
} else {
    try {
        const tg = require('./tg-bot.js');
        if (tg && tg.ok === false) {
            _botStatus = { running: false, reason: 'tg-bot-stub', error: tg.error, tokenSet: hasEnvToken };
            console.error('[BOT] tg-bot.js esportato stub: ' + tg.error);
        } else {
            _botStatus = { running: true, reason: 'started', tokenSet: hasEnvToken };
            console.log('[BOT] Telegram bot started in-process' + (hasEnvToken ? ' (env token)' : ' (hardcoded fallback token)'));
        }
    } catch (e) {
        _botStatus = { running: false, reason: 'crash', error: e.message, tokenSet: hasEnvToken };
        console.error('[BOT] Failed to start tg-bot:', e.message);
    }
}

// Endpoint diagnostico (sicuro: non rivela il token, solo se è settato)
app.get('/api/bot/status', async (req, res) => {
    // Usa il token effettivo dell'env (stesso che usa tg-bot.js)
    const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
    const out = {
        running: _botStatus.running,
        reason: _botStatus.reason,
        tokenSet: _botStatus.tokenSet,
        tokenPrefix: token ? token.substring(0, 12) + '...' : '',
        botUsername: process.env.BOT_USERNAME || 'Kouverte_bot',
        error: _botStatus.error ? String(_botStatus.error).slice(0, 200) : null,
        tokenValid: null,
        telegramSays: null
    };
    // Live test del token contro l'API Telegram
    if (token && token.length >= 30) {
        try {
            const r = await fetch('https://api.telegram.org/bot' + token + '/getMe');
            const d = await r.json();
            out.tokenValid = !!d.ok;
            out.telegramSays = d.ok ? `OK: @${d.result.username} (id ${d.result.id})` : d.description;
        } catch(e) {
            out.tokenValid = false;
            out.telegramSays = 'fetch error: ' + e.message;
        }
    }
    res.json(out);
});
