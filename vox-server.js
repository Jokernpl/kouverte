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

const app = express();
const PORT = process.env.PORT || 8082;
const HOST = process.env.HOST || '0.0.0.0';

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || 'kouverte-vox-secret-key-change-in-prod';
const JWT_EXPIRES = '30d';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Database JSON (file invece di SQLite)
const DB_FILE = path.join(__dirname, 'vox-data.json');

function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        return {
            users: [],
            stories: [],
            reactions: [],
            duels: [],
            votes: [],
            messages: [],
            shop_products: [
                { id: 'vox_vip', name: 'Kouverte Vox VIP · 1 mese', desc: 'Storie che durano 7 giorni, badge esclusivo', price_credits: 999, category: 'subscription', item_type: 'vip_month', icon: '👑', item_data: '{"duration_days":30}' },
                { id: 'vox_boost', name: 'Boost · 2 ore', desc: 'La tua storia in cima al feed', price_credits: 199, category: 'boost', item_type: 'boost_2h', icon: '🚀', item_data: '{"duration_minutes":120}' },
                { id: 'vox_theme', name: 'Tema Dark Neon', desc: 'Profilo con bordi neon', price_credits: 499, category: 'cosmetic', item_type: 'theme', icon: '💜', item_data: '{"theme":"neon"}' }
            ],
            user_inventory: [],
            transactions: [],
            user_credits: []
        };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

let DB = loadDB();

// Salva periodiacmente
setInterval(() => saveDB(DB), 10000);

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

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function genId(prefix) {
    return prefix + '_' + crypto.randomBytes(6).toString('hex');
}

function now() {
    return Date.now();
}

// ============ API PUBBLICHE ============

// Health
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'VO✕', version: '1.0' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    const { email, password, username } = req.body || {};
    if (!email || !password || !username) return res.status(400).json({ error: 'Email, password, username richiesti' });
    if (username.length < 3) return res.status(400).json({ error: 'Username min 3 caratteri' });
    if (password.length < 6) return res.status(400).json({ error: 'Password min 6 caratteri' });

    if (DB.users.find(u => u.email === email.toLowerCase())) {
        return res.status(409).json({ error: 'Email già registrata' });
    }
    if (DB.users.find(u => u.username === username.toLowerCase())) {
        return res.status(409).json({ error: 'Username già in uso' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const user = {
            id: genId('u'),
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password_hash,
            profile: {
                avatar_letter: username.charAt(0).toUpperCase(),
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
        saveDB(DB);

        const token = generateToken(user.id);
        res.json({ ok: true, token, user: { id: user.id, email: user.email, username: user.username } });
    } catch(e) {
        res.status(500).json({ error: 'Errore registrazione' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email e password richieste' });

    const user = DB.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Email o password non corretti' });

    try {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Email o password non corretti' });

        user.last_seen = now();
        saveDB(DB);

        const token = generateToken(user.id);
        res.json({ ok: true, token, user: { id: user.id, email: user.email, username: user.username, profile: user.profile, stats: user.stats } });
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
    if (bio) user.profile.bio = bio.slice(0, 500);
    user.updated_at = now();
    saveDB(DB);
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

app.post('/api/duels', (req, res) => {
    const { userId, theme } = req.body || {};
    if (!userId || !theme) return res.status(400).json({ error: 'userId e theme richiesti' });
    
    const duel = {
        id: genId('duel'),
        theme: theme.slice(0, 100),
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

app.post('/api/duels/:id/join', (req, res) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId richiesto' });
    const duel = DB.duels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duello non trovato' });
    if (duel.user2_id !== duel.user1_id) return res.status(400).json({ error: 'Duello pieno' });
    duel.user2_id = userId;
    saveDB(DB);
    res.json({ ok: true });
});

app.post('/api/duels/:id/vote', (req, res) => {
    const { clipId } = req.body || {};
    if (!clipId) return res.status(400).json({ error: 'clipId richiesto' });
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    
    const existing = DB.votes.find(v => v.duel_id === req.params.id && v.ip_hash === ipHash);
    if (existing) return res.status(409).json({ error: 'Hai già votato' });
    
    DB.votes.push({
        id: DB.votes.length + 1,
        duel_id: req.params.id,
        clip_id: clipId,
        ip_hash: ipHash,
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

// ============ SHOP API ============

app.get('/api/shop/credits', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId richiesto' });
    let row = DB.user_credits.find(c => c.user_id === userId);
    if (!row) {
        row = { user_id: userId, credits: 0, updated_at: now() };
        DB.user_credits.push(row);
        saveDB(DB);
    }
    res.json({ credits: row.credits });
});

app.get('/api/shop/products', (req, res) => {
    const products = DB.shop_products.filter(p => p.active !== false).sort((a, b) => a.price_credits - b.price_credits);
    res.json({ products });
});

app.post('/api/shop/buy', (req, res) => {
    const { userId, productId } = req.body || {};
    if (!userId || !productId) return res.status(400).json({ error: 'userId e productId richiesti' });
    
    const product = DB.shop_products.find(p => p.id === productId && p.active !== false);
    if (!product) return res.status(404).json({ error: 'Prodotto non trovato' });
    
    let creditsRow = DB.user_credits.find(c => c.user_id === userId);
    if (!creditsRow) {
        creditsRow = { user_id: userId, credits: 0, updated_at: now() };
        DB.user_credits.push(creditsRow);
    }
    
    if (creditsRow.credits < product.price_credits) {
        return res.status(402).json({ error: 'Crediti insufficienti', needed: product.price_credits });
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
    res.json({ ok: true, inventoryId: invId, remainingCredits: creditsRow.credits, product: product.name });
});

// ============ ADMIN API ============

app.get('/api/admin/stats', (req, res) => {
    const totalUsers = DB.users.length;
    const activeStories = DB.stories.filter(s => s.expires_at > now()).length;
    const totalReactions = DB.reactions.length;
    const activeDuels = DB.duels.filter(d => d.expires_at > now()).length;
    const totalRevenue = 0;
    res.json({ totalUsers, activeStories, totalReactions, activeDuels, totalRevenue });
});

app.get('/api/admin/users', (req, res) => {
    const users = DB.users.map(u => ({
        ...u,
        story_count: DB.stories.filter(s => s.user_id === u.id).length
    })).sort((a, b) => b.created_at - a.created_at);
    res.json({ users });
});

app.get('/api/admin/stories', (req, res) => {
    const stories = DB.stories.map(s => {
        const user = DB.users.find(u => u.id === s.user_id);
        const reactions_count = DB.reactions.filter(r => r.story_id === s.id).length;
        return {
            ...s,
            username: user ? user.username : 'unknown',
            reactions_count
        };
    }).sort((a, b) => b.created_at - a.created_at).slice(0, 100);
    res.json({ stories });
});

app.get('/api/admin/duels', (req, res) => {
    const duels = DB.duels.map(d => {
        const u1 = DB.users.find(u => u.id === d.user1_id);
        const u2 = DB.users.find(u => u.id === d.user2_id);
        const total_votes = DB.votes.filter(v => v.duel_id === d.id).length;
        return {
            ...d,
            user1_name: u1 ? u1.username : '...',
            user2_name: u2 ? u2.username : 'In attesa...',
            total_votes
        };
    }).sort((a, b) => b.created_at - a.created_at).slice(0, 50);
    res.json({ duels });
});

app.delete('/api/admin/users/:id', (req, res) => {
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
    DB.users = DB.users.filter(u => u.id !== userId);
    saveDB(DB);
    res.json({ ok: true });
});

app.delete('/api/admin/stories/:id', (req, res) => {
    DB.reactions = DB.reactions.filter(r => r.story_id !== req.params.id);
    DB.stories = DB.stories.filter(s => s.id !== req.params.id);
    saveDB(DB);
    res.json({ ok: true });
});

app.delete('/api/admin/duels/:id', (req, res) => {
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

app.post('/api/tg/auth', (req, res) => {
    const { initData, fallback } = req.body || {};
    let tgUser = validateTelegramInitData(initData);
    let validated = !!tgUser;

    // Se la validazione fallisce (nessun token configurato o initData non valido),
    // accetta comunque ma marca come non-validato (per dev senza bot token)
    if (!tgUser && fallback) tgUser = fallback;
    if (!tgUser) return res.status(400).json({ error: 'Auth Telegram fallita' });

    // Crea/aggiorna utente VOX collegato a Telegram
    const userId = 'tg_' + (tgUser.id || tgUser.telegramId || crypto.randomBytes(4).toString('hex'));
    const username = tgUser.username || ('u' + (tgUser.id || tgUser.telegramId || ''));
    const firstName = tgUser.first_name || tgUser.firstName || 'Utente';

    let user = (DB.users || []).find(u => u.id === userId);
    if (!user) {
        user = {
            id: userId,
            username,
            firstName,
            telegramId: tgUser.id || tgUser.telegramId,
            verified: validated,
            created_at: now()
        };
        DB.users = DB.users || [];
        DB.users.push(user);
        saveDB(DB);
    } else {
        user.username = username;
        user.firstName = firstName;
        if (validated) user.verified = true;
        user.last_seen = now();
        saveDB(DB);
    }
    res.json({ ok: true, validated, user });
});

app.post('/api/cleanup', (req, res) => {
    const before = DB.stories.length;
    DB.stories = DB.stories.filter(s => s.expires_at > now());
    saveDB(DB);
    res.json({ ok: true, deleted: before - DB.stories.length });
});

// Seed test data
app.get('/api/admin/seed', async (req, res) => {
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

app.post('/api/rooms/:slug/msgs', (req, res) => {
    const slug = req.params.slug;
    const { userId, username, text } = req.body || {};
    if (!VALID_ROOMS.includes(slug)) return res.status(404).json({ error: 'Stanza non trovata' });
    if (!userId || !text) return res.status(400).json({ error: 'userId e text richiesti' });
    if (text.length > 280) return res.status(400).json({ error: 'Messaggio troppo lungo' });

    // Anti-spam minimale: max 5 msg in 10 secondi per utente
    const tenSecAgo = now() - 10000;
    const recentByUser = (DB.rooms[slug] || []).filter(m => m.userId === userId && m.created_at > tenSecAgo).length;
    if (recentByUser >= 5) return res.status(429).json({ error: 'Stai scrivendo troppo veloce, rallenta' });

    DB.rooms[slug] = DB.rooms[slug] || [];
    const msg = {
        id: 'msg_' + crypto.randomBytes(6).toString('hex'),
        userId,
        username: (username || 'anon').slice(0, 30),
        text: text.trim().slice(0, 280),
        created_at: now()
    };
    DB.rooms[slug].push(msg);
    if (DB.rooms[slug].length > 500) DB.rooms[slug] = DB.rooms[slug].slice(-500);
    saveDB(DB);
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

app.post('/api/admin/reset', (req, res) => {
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

// ============ WEBRTC SIGNALING ============

const activeCalls = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('[WEBRTC] Utente connesso:', socket.id);

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

    socket.on('register-user', (userId) => {
        activeCalls.set(userId, socket.id);
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
        for (const [userId, socketId] of activeCalls.entries()) {
            if (socketId === socket.id) {
                activeCalls.delete(userId);
                break;
            }
        }
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
