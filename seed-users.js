// SEED USERS · script una-tantum per popolare il feed Esplora
// Esecuzione: node seed-users.js
// Aggiunge ~30 profili italiani realistici al vox-data.json
// I profili NON hanno clip audio (verranno caricati nel tempo) ma hanno
// bio, città, prompts text, age, gender, looking_for completi.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'vox-data.json');

function genId(prefix) {
    return prefix + '_' + crypto.randomBytes(6).toString('hex');
}
function now() { return Date.now(); }

const SEEDS = [
    { firstName: 'Giulia',    age: 26, gender: 'f', city: 'Milano',   looking_for: 'm', bio: 'Architetto di giorno, vinile collector di sera. Cerco curiosità autentica.' },
    { firstName: 'Marco',     age: 32, gender: 'm', city: 'Roma',     looking_for: 'f', bio: 'Caffè ristretto e maratone. Crypto da 5 anni. Cerco una conversazione vera.' },
    { firstName: 'Sara',      age: 28, gender: 'f', city: 'Torino',   looking_for: 'all', bio: 'Psicologa, lettrice insaziabile. La voce dice più degli occhi.' },
    { firstName: 'Alessio',   age: 35, gender: 'm', city: 'Bologna',  looking_for: 'f', bio: 'Chef. Cucino quello che cresce nel mio orto. Cerco qualcuno con cui dividere la tavola.' },
    { firstName: 'Chiara',    age: 24, gender: 'f', city: 'Napoli',   looking_for: 'm', bio: 'Studentessa di filosofia. Tramonti, jazz e domande senza risposta.' },
    { firstName: 'Luca',      age: 29, gender: 'm', city: 'Firenze',  looking_for: 'f', bio: 'Fotografo freelance. Viaggio per vivere. Cerco una compagna di avventure.' },
    { firstName: 'Martina',   age: 31, gender: 'f', city: 'Verona',   looking_for: 'all', bio: 'Veterinaria. Animali, vino rosso e silenzi che parlano.' },
    { firstName: 'Davide',    age: 27, gender: 'm', city: 'Genova',   looking_for: 'f', bio: 'Sviluppatore Bitcoin. Mare in inverno. Cerco una persona che pensi in grande.' },
    { firstName: 'Elena',     age: 30, gender: 'f', city: 'Palermo',  looking_for: 'm', bio: 'Insegnante di yoga. Cucino, ballo, leggo. La risata è la mia metrica.' },
    { firstName: 'Riccardo',  age: 33, gender: 'm', city: 'Padova',   looking_for: 'f', bio: 'Avvocato. Suono il piano. Cerco profondità senza pesantezza.' },
    { firstName: 'Federica',  age: 25, gender: 'f', city: 'Catania',  looking_for: 'all', bio: 'Designer UX. Surf, montagna, podcast. Voglio una storia, non un appuntamento.' },
    { firstName: 'Tommaso',   age: 36, gender: 'm', city: 'Trieste',  looking_for: 'f', bio: 'Skipper. Vivo in barca metà anno. Cerco chi non ha paura del vento.' },
    { firstName: 'Valeria',   age: 29, gender: 'f', city: 'Bari',     looking_for: 'm', bio: 'Make-up artist. Concerti, mostre, viaggi low-cost. Spirito ribelle.' },
    { firstName: 'Andrea',    age: 28, gender: 'm', city: 'Brescia',  looking_for: 'all', bio: 'Personal trainer. Bitcoin maxi. Cerco una mente che corra come il mio corpo.' },
    { firstName: 'Beatrice',  age: 32, gender: 'f', city: 'Pisa',     looking_for: 'm', bio: 'Ricercatrice in fisica. Mi piacciono le cose semplici e gli astronauti.' },
    { firstName: 'Stefano',   age: 31, gender: 'm', city: 'Cagliari', looking_for: 'f', bio: 'Producer musicale. Notti lunghe, idee strane. Cerco una musa.' },
    { firstName: 'Camilla',   age: 27, gender: 'f', city: 'Pescara',  looking_for: 'all', bio: 'Giornalista. Caffè nero, podcast indie, e una valigia sempre pronta.' },
    { firstName: 'Matteo',    age: 34, gender: 'm', city: 'Modena',   looking_for: 'f', bio: 'Ingegnere meccanico. Auto d\'epoca, vinili, e cene che durano fino all\'alba.' },
    { firstName: 'Aurora',    age: 23, gender: 'f', city: 'Lecce',    looking_for: 'm', bio: 'Studentessa di lingue. Tre lingue, mille curiosità. Cerco chi mi insegni qualcosa di nuovo.' },
    { firstName: 'Gabriele',  age: 30, gender: 'm', city: 'Perugia',  looking_for: 'f', bio: 'Olivicoltore. Famiglia da 5 generazioni. Cerco una persona con radici e ali.' },
    { firstName: 'Noemi',     age: 26, gender: 'f', city: 'Ancona',   looking_for: 'all', bio: 'Tatuatrice. Disegno storie sulla pelle. Cerco la prossima storia.' },
    { firstName: 'Filippo',   age: 33, gender: 'm', city: 'Treviso',  looking_for: 'f', bio: 'Pediatra. Mi rilasso suonando la chitarra. Cerco serenità intelligente.' },
    { firstName: 'Greta',     age: 28, gender: 'f', city: 'Reggio Emilia', looking_for: 'm', bio: 'Sommelier. Vino, montagne, libri. La pazienza è la mia arte.' },
    { firstName: 'Lorenzo',   age: 29, gender: 'm', city: 'Parma',    looking_for: 'f', bio: 'Pastry chef. Domani provo qualcosa di nuovo. Cerco chi assaggi senza giudicare.' },
    { firstName: 'Irene',     age: 25, gender: 'f', city: 'Salerno',  looking_for: 'all', bio: 'Ballerina. Mi muovo per parlare. Cerco silenzi che fanno musica.' },
    { firstName: 'Nicola',    age: 37, gender: 'm', city: 'Vicenza',  looking_for: 'f', bio: 'Imprenditore tech. Padre separato. Cerco una donna sicura di sé.' },
    { firstName: 'Sofia',     age: 24, gender: 'f', city: 'Brescia',  looking_for: 'all', bio: 'Studentessa di medicina. Insonne curiosa. Voglio voce, non foto.' },
    { firstName: 'Edoardo',   age: 31, gender: 'm', city: 'Bergamo',  looking_for: 'f', bio: 'Climber. Roccia, libri di filosofia, espresso doppio. Cerco una partner d\'avventura.' },
    { firstName: 'Carolina',  age: 29, gender: 'f', city: 'Como',     looking_for: 'm', bio: 'Marketing manager. Workaholic in recupero. Cerco chi mi faccia rallentare.' },
    { firstName: 'Simone',    age: 26, gender: 'm', city: 'Sassari',  looking_for: 'f', bio: 'Web designer. Mare, surf, e domeniche in pigiama. Cerco semplicità.' }
];

(async function main() {
    if (!fs.existsSync(DB_FILE)) {
        console.error('❌ vox-data.json non trovato. Avvia prima il server una volta per generarlo.');
        process.exit(1);
    }
    const bcrypt = require('bcrypt');
    const DB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    DB.users = DB.users || [];

    const existingNames = new Set(DB.users.map(u => u.firstName));
    let added = 0;
    const ts = now();
    const pwHash = await bcrypt.hash('SeedUser2026!', 10);

    for (const s of SEEDS) {
        // dedup by firstName + city
        const dup = DB.users.find(u => u.firstName === s.firstName && u.profile?.city === s.city);
        if (dup) continue;
        const username = (s.firstName + Math.floor(Math.random() * 900 + 100)).toLowerCase();
        const user = {
            id: genId('u_seed'),
            username,
            email: username + '@seed.kouverte.local',
            firstName: s.firstName,
            password_hash: pwHash, // seed users use shared hash, NOT publicly disclosed
            is_admin: false,
            seed: true,
            verified: false,
            created_at: ts - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000),
            credits: 0,
            stats: { likes_received: Math.floor(Math.random() * 15) },
            profile: {
                display_name: s.firstName,
                bio: s.bio,
                gender: s.gender,
                looking_for: s.looking_for,
                birth_year: new Date().getFullYear() - s.age,
                city: s.city,
                clips: [
                    { slot: 0, title: 'Chi sono', audio_id: null, duration: 0 },
                    { slot: 1, title: 'Mi piace', audio_id: null, duration: 0 },
                    { slot: 2, title: 'Cerco',    audio_id: null, duration: 0 }
                ]
            }
        };
        DB.users.push(user);
        added++;
    }

    if (added === 0) {
        console.log('ℹ️  Tutti i seed sono già presenti. Nessun nuovo profilo aggiunto.');
        return;
    }

    // backup + write
    const bak = DB_FILE + '.bak.before-seed.' + Date.now() + '.json';
    fs.copyFileSync(DB_FILE, bak);
    fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2), 'utf8');
    console.log(`✅ Aggiunti ${added} profili seed al feed Esplora.`);
    console.log(`   Backup DB pre-seed in: ${bak}`);
    console.log(`   Riavvia il server (Render redeploy) per applicare.`);
})();
