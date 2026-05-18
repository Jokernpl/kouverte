// LIGHTNING NETWORK SERVICE · multi-provider (LNbits + Coinos)
// Provider selezionato via env LIGHTNING_PROVIDER (default: 'lnbits')
//
// === COINOS ===
//   LIGHTNING_ENABLED=1
//   LIGHTNING_PROVIDER=coinos
//   COINOS_URL=https://coinos.io                (opzionale, default è questo)
//   COINOS_TOKEN=<Bearer JWT da Settings/API del tuo account>
//
//   Coinos API:
//     POST /api/invoice   { invoice: { amount, type: 'lightning', memo } }  → hash + text (bolt11)
//     GET  /api/invoice/<hash>                                              → received/amount
//
// === LNBITS ===
//   LIGHTNING_ENABLED=1
//   LIGHTNING_PROVIDER=lnbits
//   LNBITS_URL=https://legend.lnbits.com
//   LNBITS_INVOICE_KEY=<chiave invoice/admin>

const PROVIDER = (process.env.LIGHTNING_PROVIDER || 'lnbits').toLowerCase();
const LNBITS_URL = process.env.LNBITS_URL || '';
const LNBITS_INVOICE_KEY = process.env.LNBITS_INVOICE_KEY || '';
const COINOS_URL = (process.env.COINOS_URL || 'https://coinos.io').replace(/\/$/, '');
const COINOS_TOKEN = process.env.COINOS_TOKEN || '';

const ENABLED = process.env.LIGHTNING_ENABLED === '1' && (
    (PROVIDER === 'lnbits' && LNBITS_URL && LNBITS_INVOICE_KEY) ||
    (PROVIDER === 'coinos' && COINOS_TOKEN)
);

async function createInvoice(amountSats, memo) {
    if (!ENABLED) throw new Error('Lightning non configurato. Imposta LIGHTNING_ENABLED=1 + provider credentials.');

    if (PROVIDER === 'coinos') {
        const r = await fetch(COINOS_URL + '/api/invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + COINOS_TOKEN
            },
            body: JSON.stringify({ invoice: { amount: amountSats, type: 'lightning', memo: memo || 'Kouverte' } })
        });
        if (!r.ok) {
            const t = await r.text().catch(() => '');
            throw new Error(`Coinos invoice failed: ${r.status} ${t.slice(0, 200)}`);
        }
        const d = await r.json();
        return {
            bolt11: d.text || d.bolt11 || d.payment_request,
            paymentHash: d.hash || d.id,
            amount: amountSats
        };
    }

    // default: LNbits
    const r = await fetch(LNBITS_URL.replace(/\/$/, '') + '/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': LNBITS_INVOICE_KEY },
        body: JSON.stringify({ out: false, amount: amountSats, memo: memo || 'Kouverte' })
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`LNbits invoice failed: ${r.status} ${t.slice(0, 200)}`);
    }
    const d = await r.json();
    return { bolt11: d.payment_request || d.bolt11, paymentHash: d.payment_hash || d.checking_id, amount: amountSats };
}

async function checkInvoice(paymentHash) {
    if (!ENABLED) throw new Error('Lightning non configurato');

    if (PROVIDER === 'coinos') {
        const r = await fetch(COINOS_URL + '/api/invoice/' + encodeURIComponent(paymentHash), {
            headers: { 'Authorization': 'Bearer ' + COINOS_TOKEN }
        });
        if (!r.ok) return { paid: false, error: 'check failed' };
        const d = await r.json();
        const paid = (d.received && d.received >= d.amount) || d.status === 'paid' || d.confirmed === true;
        return { paid: !!paid, details: d };
    }

    const r = await fetch(LNBITS_URL.replace(/\/$/, '') + '/api/v1/payments/' + encodeURIComponent(paymentHash), {
        headers: { 'X-Api-Key': LNBITS_INVOICE_KEY }
    });
    if (!r.ok) return { paid: false, error: 'check failed' };
    const d = await r.json();
    return { paid: !!d.paid, details: d };
}

module.exports = { createInvoice, checkInvoice, ENABLED, PROVIDER };
