# 🔒 SECURITY AUDIT — Dipendenze npm

**Ultima verifica**: 2026-05-18

## Status corrente

| Severity | Count | Status |
|---|---|---|
| Critical | 0 | ✅ |
| High     | 0 | ✅ |
| Moderate | 4 | ⚠️ Risk accepted (vedi sotto) |

## Risoluzione vulnerabilità

Da `10 vulnerabilities (5 moderate, 3 high, 2 critical)` →
`4 moderate severity vulnerabilities` tramite **npm overrides** in `package.json`:

```json
"overrides": {
  "form-data": "^4.0.5",
  "tough-cookie": "^4.1.4",
  "qs": "^6.14.1",
  "tar": "^7.5.15",
  "ws": "^8.20.1"
}
```

### Risolte
- **form-data <2.5.4** (CRITICAL, unsafe random boundary) → forzato 4.0.5
- **request@2.88.2 SSRF in form-data path** (CRITICAL) → mitigato con form-data 4.x
- **qs <6.14.1 DoS** (MODERATE) → forzato 6.14.1+
- **tough-cookie <4.1.3** (MODERATE) → forzato 4.1.4+
- **tar <6.3 multiple path traversal** (HIGH x 6 advisory) → forzato 7.5.15
- **ws <8.20 memory disclosure** (MODERATE) → forzato 8.20.1
- **@mapbox/node-pre-gyp <=1.0.11** (HIGH) → cascade fix via tar

### Risk-accepted (residue 4 moderate)

| Pacchetto | Severity | Vulnerabilità | Mitigazione effettiva |
|---|---|---|---|
| `request@2.88.2` | moderate | [SSRF GHSA-p8p7-x288-28g6](https://github.com/advisories/GHSA-p8p7-x288-28g6) | URL hardcoded a `api.telegram.org`, no user input |
| `request-promise-core` | moderate | depends on request | stessa catena |
| `@cypress/request-promise@5.0.0` | moderate | depends on request | stessa catena |
| `node-telegram-bot-api@0.66.0` | moderate | depends on @cypress/request-promise | stessa catena |

**Perché OK accettare il rischio:**
- L'attacco SSRF richiede che un input utente venga passato come URL alla libreria
- Nel nostro codice `tg-bot.js`, l'unica chiamata HTTP è verso l'API Telegram (URL fisso interno)
- Nessun utente può iniettare URL nel flusso del bot
- Il pacchetto `request` è deprecato ma non riproducibile come exploit nel nostro use-case

**Alternative considerate**:
- Downgrade a `node-telegram-bot-api@0.63.0`: stessa vulnerabilità (usa `request` direttamente), perdita di feature
- Sostituire con `telegraf`: refactor di 700+ righe di `tg-bot.js`, breaking change su tutti i comandi
- Sostituire con `grammyjs`: stesso problema, e curva di apprendimento

## Comandi utili

### Verificare lo stato corrente
```bash
npm audit
```

### Re-installare pulito dopo modifiche
```bash
rm -rf node_modules package-lock.json
npm install
```

### Filtrare audit solo per high/critical (per CI/build)
```bash
npm audit --audit-level=high
```
→ Exit 0 finché non escono nuovi high/critical. Le 4 moderate non bloccano.

### TODO futuro (priorità bassa)

- [ ] **Migrare a `telegraf`** quando hai 2 giornate libere (refactor tg-bot.js)
- [ ] Setup **Dependabot** su GitHub per alert automatici nuove vulnerabilità
- [ ] Considerare **`audit-ci`** in CI pipeline per bloccare nuovi high/critical introdotti

## Storico audit

| Data | Critical | High | Moderate | Note |
|---|---|---|---|---|
| 2026-05-18 (initial) | 2 | 3 | 5 | Stato pre-fix |
| 2026-05-18 (post overrides) | 0 | 0 | 4 | Stato attuale |
