// LIGHTNING NETWORK SERVICE · LNbits-compatible
// Setup (Render env vars):
//   LNBITS_URL=https://legend.lnbits.com (o tua istanza)
//   LNBITS_INVOICE_KEY=<chiave invoice/admin del wallet>
//   LIGHTNING_ENABLED=1
//
// Compatibile con LNbits API standard:
//   POST /api/v1/payments  { out:false, amount, memo }  → bolt11 + payment_hash
//   GET  /api/v1/payments/<payment_hash>                → paid: true/false
//
// Niente custodia: invoice generate sul wallet LNbits dell'admin.
// L'utente paga la bolt11, server verifica via polling.

const LNBITS_URL = process.env.LNBITS_URL || '';
const LNBITS_INVOICE_KEY = process.env.LNBITS_INVOICE_KEY || '';
const ENABLED = process.env.LIGHTNING_ENABLED === '1' && LNBITS_URL && LNBITS_INVOICE_KEY;

async function createInvoice(amountSats, memo) {
    if (!ENABLED) throw new Error('Lightning non configurato (mancano LNBITS_URL/LNBITS_INVOICE_KEY/LIGHTNING_ENABLED=1)');
    const url = LNBITS_URL.replace(/\/$/, '') + '/api/v1/payments';
    const r = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': LNBITS_INVOICE_KEY
        },
        body: JSON.stringify({ out: false, amount: amountSats, memo: memo || 'Kouverte' })
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`LNbits invoice failed: ${r.status} ${t.slice(0, 200)}`);
    }
    const d = await r.json();
    return {
        bolt11: d.payment_request || d.bolt11,
        paymentHash: d.payment_hash || d.checking_id,
        amount: amountSats
    };
}

async function checkInvoice(paymentHash) {
    if (!ENABLED) throw new Error('Lightning non configurato');
    const url = LNBITS_URL.replace(/\/$/, '') + '/api/v1/payments/' + encodeURIComponent(paymentHash);
    const r = await fetch(url, {
        headers: { 'X-Api-Key': LNBITS_INVOICE_KEY }
    });
    if (!r.ok) return { paid: false, error: 'check failed' };
    const d = await r.json();
    return { paid: !!d.paid, details: d };
}

module.exports = { createInvoice, checkInvoice, ENABLED };
