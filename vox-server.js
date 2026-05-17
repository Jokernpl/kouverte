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

// Bitcoin Payment Config
const BITCOIN_ADDRESS = process.env.BITCOIN_ADDRESS || 'bc1qssg5wplzn8a0euf8sp03uthwyuep48k7zw9c00';
const BTC_RATE = 0.00005; // 1 credito = 0.00005 BTC (1 BTC = 20,000 crediti)
const BITCOIN_MIN_CONFIRMATIONS = parseInt(process.env.BITCOIN_MIN_CONFIRMATIONS || '4');

app.use(express.json({ limit: '10mb' }));

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
app.use(express.static(__dirname, {
    dotfiles: 'deny',
    index: ['index.html']
}));

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
            users: [
                { id: 'u_test1', username: 'Voci Notturne', firstName: 'Night', verified: true, created_at: 1777900000000, credits: 50 },
                { id: 'u_test2', username: 'Single Italiani', firstName: 'Solo', verified: true, created_at: 1777900000000, credits: 50 },
                { id: 'u_test3', username: 'Deep Talks', firstName: 'Deep', verified: true, created_at: 1777900000000, credits: 50 },
                { id: 'u_test_login', email: 'test1@kouverte.local', username: 'TestUser', firstName: 'Test', verified: false, created_at: 1777900000000, credits: 50 }
            ],
            stories: [],
            reactions: [],
            duels: [],
            votes: [],
            messages: [],
            voice_rooms: [
                { id: 'room_1', name: 'Voci Notturne', desc: 'Chat vocale di notte', icon: '🌙', users_count: 6, created_at: 1777900000000 },
                { id: 'room_2', name: 'Single Italiani', desc: 'Persone sole che cercano connessione', icon: '❤️', users_count: 6, created_at: 1777900000000 },
                { id: 'room_3', name: 'Deep Talks', desc: 'Conversazioni profonde', icon: '🧠', users_count: 4, created_at: 1777900000000 }
            ],
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
            bitcoin_payments: []
        };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Atomic write per evitare corruzione DB su kill
let dbDirty = false;
function saveDB(db) {
    const tmp = DB_FILE + '.tmp';
    const data = JSON.stringify(db, null, 2);
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, DB_FILE);
    dbDirty = false;
}
function markDirty() { dbDirty = true; }

let DB = loadDB();

// Initialize test user password hash on startup
(async () => {
    const testUser = DB.users.find(u => u.email === 'test1@kouverte.local');
    if (testUser && !testUser.password_hash) {
        try {
            testUser.password_hash = await bcrypt.hash('Test123456', 10);
            markDirty();
        } catch(e) { console.error('Failed to hash test password:', e); }
    }
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

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
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
        created_at: u.created_at
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
    res.json({ ok: true, service: 'VO✕', version: '1.0' });
});

// Register — rate limited 3/15min per IP
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
        const user = {
            id: genId('u'),
            email: emailIn,
            username: usernameIn,
            password_hash,
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

        saveDB(DB);

        const token = generateToken(user.id);
        res.json({ ok: true, token, user: publicUser(user) });
    } catch(e) {
        res.status(500).json({ error: 'Errore registrazione' });
    }
});

// Login — rate limited 5/15min per IP
app.post('/api/auth/login', rateLimit('login', 10, 15 * 60 * 1000), async (req, res) => {
    const emailIn = sanitizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!emailIn || !password) return res.status(400).json({ error: 'Email e password richieste' });
    if (typeof password !== 'string' || password.length > 200) return res.status(400).json({ error: 'Password non valida' });

    const user = DB.users.find(u => u.email === emailIn);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Email o password non corretti' });

    try {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Email o password non corretti' });

        user.last_seen = now();
        markDirty();

        const token = generateToken(user.id);
        res.json({ ok: true, token, user: publicUser(user) });
    } catch(e) {
        res.status(500).json({ error: 'Errore login' });
    }
});

// Get current user
app.get('/api/auth/me', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ user: { id: user.id, email: user.email, username: user.username, profile: user.profile, stats: user.stats } });
});

// Lista utenti (per chiamate)
app.get('/api/users/list', (req, res) => {
    const users = DB.users.map(u => ({ id: u.id, username: u.username }));
    res.json({ users });
});

// Get profile by username
app.get('/api/profile/:username', (req, res) => {
    const user = DB.users.find(u => u.username === req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const userStories = DB.stories.filter(s => s.user_id === user.id && s.expires_at > now());
    res.json({
        username: user.username,
        avatar_letter: user.profile.avatar_letter,
        bio: user.profile.bio,
        stats: user.stats,
        clips: user.profile.clips.map(c => ({
            ...c,
            story_preview: userStories.find(s => s.id === c.audio_id)
        }))
    });
});

// Update profile
app.post('/api/profile/update', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const { bio } = req.body || {};
    if (bio !== undefined) user.profile.bio = sanitizeBio(bio);
    user.updated_at = now();
    markDirty();
    res.json({ ok: true, profile: user.profile });
});

// Save voice clip
app.post('/api/profile/clip/save', verifyToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const { slot, audioData, durationMs, mood } = req.body || {};
    if (slot === undefined || !audioData) return res.status(400).json({ error: 'slot e audioData richiesti' });
    if (slot < 0 || slot > 2) return res.status(400).json({ error: 'slot 0-2' });

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

    user.profile.clips[slot] = { slot, title: user.profile.clips[slot].title, audio_id: story.id, duration: durationMs };
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

// Get story audio
app.get('/api/stories/:id/audio', (req, res) => {
    const story = DB.stories.find(s => s.id === req.params.id);
    if (!story) return res.status(404).json({ error: 'Story non trovata' });
    if (story.expires_at < now()) return res.status(410).json({ error: 'Story scaduta' });
    res.json({ audioData: story.audio_data });
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

app.post('/api/duels', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const theme = req.body?.theme;
    if (!theme || typeof theme !== 'string') return res.status(400).json({ error: 'theme richiesto' });

    const duel = {
        id: genId('duel'),
        theme: theme.replace(/[<>]/g, '').slice(0, 100),
        user1_id: userId,
        user2_id: userId,
        clip1_id: null,
        clip2_id: null,
        expires_at: now() + 2 * 60 * 60 * 1000,
        created_at: now()
    };
    DB.duels.push(duel);
    saveDB(DB);
    res.json({ ok: true, duelId: duel.id });
});

app.post('/api/duels/:id/join', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const duel = DB.duels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duello non trovato' });
    if (duel.user2_id !== duel.user1_id) return res.status(400).json({ error: 'Duello pieno' });
    if (duel.user1_id === userId) return res.status(400).json({ error: 'Non puoi joinare il tuo duello' });
    duel.user2_id = userId;
    saveDB(DB);
    res.json({ ok: true });
});

app.post('/api/duels/:id/vote', verifyToken, (req, res) => {
    const { clipId } = req.body || {};
    if (!clipId) return res.status(400).json({ error: 'clipId richiesto' });

    const userId = req.user.userId;
    const existing = DB.votes.find(v => v.duel_id === req.params.id && v.user_id === userId);
    if (existing) return res.status(409).json({ error: 'Hai già votato' });

    DB.votes.push({
        id: genId('vote'),
        duel_id: req.params.id,
        clip_id: clipId,
        user_id: userId,
        created_at: now()
    });
    saveDB(DB);
    res.json({ ok: true });
});

app.get('/api/duels', (req, res) => {
    const duels = DB.duels.filter(d => d.expires_at > now()).map(d => {
        const u1 = DB.users.find(u => u.id === d.user1_id);
        const u2 = DB.users.find(u => u.id === d.user2_id);
        const total_votes = DB.votes.filter(v => v.duel_id === d.id).length;
        return {
            ...d,
            user1_name: u1 ? u1.username : '...',
            user2_name: u2 ? u2.username : 'In attesa...',
            total_votes
        };
    }).sort((a, b) => b.created_at - a.created_at).slice(0, 20);
    res.json({ duels });
});

// ============ BITCOIN VERIFY (frontend polling) ============
// Called by app.html after user says "Ho pagato" — checks blockchain confirmations
app.post('/api/bitcoin/verify', async (req, res) => {
    const { kind, id, amount_btc, address } = req.body || {};
    if (!kind || !id) return res.status(400).json({ confirmed: false, error: 'kind e id richiesti' });

    const btcAddr = address || BITCOIN_ADDRESS;
    const btcAmt  = parseFloat(amount_btc) || 0;

    try {
        const check = await checkBlockchainConfirmations(btcAmt, btcAddr, BITCOIN_MIN_CONFIRMATIONS);
        if (check.verified) {
            // Save confirmed payment record
            if (!DB.bitcoin_payments) DB.bitcoin_payments = [];
            DB.bitcoin_payments.push({
                id: genId('btc'),
                kind, item_id: id,
                btc_amount: btcAmt,
                btc_address: btcAddr,
                tx_hash: check.txHash,
                confirmations: check.confirmations,
                status: 'confirmed',
                confirmed_at: now()
            });
            markDirty();
        }
        res.json({ confirmed: check.verified, confirmations: check.confirmations || 0, required: BITCOIN_MIN_CONFIRMATIONS });
    } catch (e) {
        res.json({ confirmed: false, confirmations: 0, error: e.message });
    }
});

// ============ FEED & LIKE API ============

app.get('/api/users/feed', (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const limit = 20;
    const nowMs = Date.now();

    const users = (DB.users || [])
        .filter(u => u.id && u.username && !u.id.startsWith('u_test'))
        .map(u => {
            const clips = (u.profile?.clips || []).filter(c => c.audio_id);
            const activeClip = clips.map(c => DB.stories?.find(s => s.id === c.audio_id && s.expires_at > nowMs)).find(Boolean);
            return {
                id: u.id,
                username: u.username,
                firstName: u.firstName || u.username,
                avatar_letter: u.profile?.avatar_letter || (u.username || 'K').charAt(0).toUpperCase(),
                bio: u.profile?.bio || '',
                clip_id: activeClip?.id || null,
                clip_duration: activeClip?.duration_ms || 0,
                likes_received: u.stats?.likes_received || 0,
                created_at: u.created_at || nowMs
            };
        })
        .sort((a, b) => b.likes_received - a.likes_received || b.created_at - a.created_at);

    const start = page * limit;
    res.json({ users: users.slice(start, start + limit), total: users.length, has_more: start + limit < users.length });
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

    const match = DB.likes.find(l => l.from === toId && l.to === fromId);
    if (match) {
        DB.matches = DB.matches || [];
        const exists = DB.matches.find(m => (m.u1===fromId&&m.u2===toId)||(m.u1===toId&&m.u2===fromId));
        if (!exists) DB.matches.push({ id: genId('match'), u1: fromId, u2: toId, created_at: Date.now() });
    }
    markDirty();
    res.json({ ok: true, liked: true, match: !!match });
});

app.get('/api/users/:id/liked-by-me', verifyToken, (req, res) => {
    DB.likes = DB.likes || [];
    const liked = !!DB.likes.find(l => l.from === req.user.userId && l.to === req.params.id);
    res.json({ liked });
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

    // Aggiorna crediti utente
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
    const activeDuels = DB.duels.filter(d => d.expires_at > now()).length;
    const totalRevenue = 0;
    res.json({ totalUsers, activeStories, totalReactions, activeDuels, totalRevenue });
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

app.get('/api/admin/duels', verifyAdmin, (req, res) => {
    const duels = DB.duels.map(d => {
        const u1 = DB.users.find(u => u.id === d.user1_id);
        const u2 = DB.users.find(u => u.id === d.user2_id);
        const total_votes = DB.votes.filter(v => v.duel_id === d.id).length;
        return {
            id: d.id, theme: d.theme,
            user1_id: d.user1_id, user2_id: d.user2_id,
            expires_at: d.expires_at, created_at: d.created_at,
            user1_name: u1 ? u1.username : '...',
            user2_name: u2 ? u2.username : 'In attesa...',
            total_votes
        };
    }).sort((a, b) => b.created_at - a.created_at).slice(0, 50);
    res.json({ duels });
});

app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const userId = req.params.id;
    DB.reactions = DB.reactions.filter(r => {
        const story = DB.stories.find(s => s.id === r.story_id);
        return story && story.user_id !== userId;
    });
    DB.stories = DB.stories.filter(s => s.user_id !== userId);
    DB.votes = DB.votes.filter(v => {
        const duel = DB.duels.find(d => d.id === v.duel_id);
        return duel && duel.user1_id !== userId && duel.user2_id !== userId;
    });
    DB.duels = DB.duels.filter(d => d.user1_id !== userId && d.user2_id !== userId);
    // FIX: cleanup orfani crediti, inventario, transazioni
    DB.user_credits = (DB.user_credits || []).filter(c => c.user_id !== userId);
    DB.user_inventory = (DB.user_inventory || []).filter(i => i.user_id !== userId);
    DB.transactions = (DB.transactions || []).filter(t => t.user_id !== userId);
    DB.users = DB.users.filter(u => u.id !== userId);
    saveDB(DB);
    res.json({ ok: true });
});

app.delete('/api/admin/stories/:id', verifyAdmin, (req, res) => {
    DB.reactions = DB.reactions.filter(r => r.story_id !== req.params.id);
    DB.stories = DB.stories.filter(s => s.id !== req.params.id);
    saveDB(DB);
    res.json({ ok: true });
});

app.delete('/api/admin/duels/:id', verifyAdmin, (req, res) => {
    DB.votes = DB.votes.filter(v => v.duel_id !== req.params.id);
    DB.duels = DB.duels.filter(d => d.id !== req.params.id);
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

io.on('connection', (socket) => {
    console.log('[WEBRTC] Utente connesso:', socket.id);

    // Register user with socket
    socket.on('register-user', (data) => {
        const { userId, username } = data;
        activeCalls.set(userId, socket.id);
        userSockets.set(username, socket.id);
        console.log(`[SOCKET] ${username} (${userId}) registrato come ${socket.id}`);
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
    socket.on('voice-offer', (data) => {
        const { roomSlug, to, from, offer } = data;
        socket.to('voice-room-' + roomSlug).emit('voice-offer', { from, offer });
    });

    socket.on('voice-answer', (data) => {
        const { roomSlug, to, from, answer } = data;
        socket.to('voice-room-' + roomSlug).emit('voice-answer', { from, answer });
    });

    socket.on('voice-ice', (data) => {
        const { roomSlug, to, from, candidate } = data;
        socket.to('voice-room-' + roomSlug).emit('voice-ice', { from, candidate });
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

    socket.on('disconnect', () => {
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

        socket.broadcast.emit('user-disconnected', socket.id);
    });
});

// ============ START ============

server.listen(PORT, HOST, () => {
    console.log('');
    console.log('🎙  VO✕ · Voice Stories');
    console.log('────────────────────────────────────');
    console.log('   Server:  http://' + HOST + ':' + PORT);
    console.log('   Pubblico: http://109.55.120.242:' + PORT);
    console.log('   Data file:', DB_FILE);
    console.log('────────────────────────────────────');
});
