// ============================================================
// Bitcoin Blockchain Verification Service
// Mempool.space API (libero, no auth required)
// Verifica transazioni Bitcoin con N conferme
// ============================================================

const axios = require('axios');

const MEMPOOL_API = 'https://mempool.space/api';
const TIMEOUT_MS = 5000;

async function checkBlockchainConfirmations(btcAmount, bitcoinAddress, requiredConfs = 4) {
    try {
        // Chiama Mempool API per ottenere dati indirizzo
        const response = await axios.get(
            `${MEMPOOL_API}/address/${bitcoinAddress}`,
            { timeout: TIMEOUT_MS }
        );

        const addressData = response.data;

        // Raccogli tutte le transazioni (confirmed + mempool)
        const allTxs = [
            ...(addressData.txs || []),
            ...(addressData.mempool_txs || [])
        ];

        if (allTxs.length === 0) {
            return {
                found: false,
                confirmations: 0,
                txHash: null,
                verified: false,
                error: 'No transactions found'
            };
        }

        // Leggi blockHeight per calcolare conferme
        const blockHeightResponse = await axios.get(
            `${MEMPOOL_API}/blocks/tip/height`,
            { timeout: TIMEOUT_MS }
        );
        const currentBlockHeight = parseInt(blockHeightResponse.data);

        const expectedBtcAmount = parseFloat(btcAmount);
        const tolerance = 0.05; // ±5% tolleranza

        // Cerca transazione che matches l'importo
        for (const tx of allTxs) {
            let receivedAmount = 0;

            // Somma tutti gli output diretti all'indirizzo
            for (const output of (tx.vout || [])) {
                if (output.scriptpubkey_address === bitcoinAddress) {
                    receivedAmount += output.value / 100000000; // converti satoshi → BTC
                }
            }

            // Controlla se l'importo è dentro la tolleranza
            if (receivedAmount >= expectedBtcAmount * (1 - tolerance) &&
                receivedAmount <= expectedBtcAmount * (1 + tolerance)) {

                // Calcola numero di conferme
                let confirmations = 0;
                if (tx.status?.confirmed) {
                    confirmations = currentBlockHeight - tx.status.block_height + 1;
                } else {
                    // Se in mempool (unconfirmed)
                    confirmations = 0;
                }

                return {
                    found: true,
                    confirmations,
                    txHash: tx.txid,
                    verified: confirmations >= requiredConfs,
                    receivedAmount,
                    blockHeight: tx.status?.block_height || null
                };
            }
        }

        // Nessuna transazione trovata con importo matching
        return {
            found: false,
            confirmations: 0,
            txHash: null,
            verified: false,
            error: 'No matching transaction found'
        };

    } catch (error) {
        console.error('❌ Blockchain check error:', error.message);
        return {
            found: false,
            confirmations: 0,
            txHash: null,
            verified: false,
            error: error.message || 'Blockchain API error'
        };
    }
}

// Utility: Get address info (balance, tx count)
async function getAddressInfo(bitcoinAddress) {
    try {
        const response = await axios.get(
            `${MEMPOOL_API}/address/${bitcoinAddress}`,
            { timeout: TIMEOUT_MS }
        );
        const data = response.data;
        return {
            address: bitcoinAddress,
            confirmed_balance: data.chain_stats?.funded_txo_sum / 100000000,
            unconfirmed_balance: data.mempool_stats?.funded_txo_sum / 100000000,
            total_txs: (data.txs || []).length + (data.mempool_txs || []).length
        };
    } catch (error) {
        console.error('❌ Address info error:', error.message);
        return null;
    }
}

module.exports = {
    checkBlockchainConfirmations,
    getAddressInfo
};
