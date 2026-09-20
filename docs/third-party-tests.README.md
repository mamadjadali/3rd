# Third-party test → Scalar workflow

Live vendor scenario tests are **not committed**. They live under a gitignored `third-party-tests/` directory so credentials, LAN hosts, and capture fixtures never enter git.

## Pipeline

1. Extract endpoints from vendor docs / curls.
2. Write scenario tests under `third-party-tests/<vendor>/` (gitignored).
3. Put secrets in `.env.pos.local` (or vendor-specific env) — also gitignored via `.env*.local`.
4. Run tests against the live third party.
5. On success, author OpenAPI with descriptions/examples.
6. Promote into Payload **API Specs** so Viewers see it in `/scalar`.

## First vendor: PNA Android POS

Documented endpoints (from vendor PDF / curls):

| Operation | Path |
| --- | --- |
| Check connection | `GET /pnaPos/checkConnection` |
| Get accounts | `GET /pnaPos/getAccounts` |
| Payment | `GET /pnaPos/payment` |

Auth uses query params `username` + `password`. Base URL is the POS LAN host (port `8082`).

### Setup (local only)

```bash
# Create the gitignored suite (agent/team scaffolds this once)
# Then:
cp third-party-tests/pos/.env.example .env.pos.local
# Edit POS_BASE_URL, POS_USERNAME, POS_PASSWORD

pnpm test:pos              # S1 + S2 (skips if POS unreachable)
POS_RUN_PAYMENT=1 pnpm test:pos:payment   # interactive card+PIN
pnpm promote:pos           # upsert OpenAPI into Payload api-specs
```

## Rules

- Never commit vendor PDFs, curls with passwords, or real LAN IPs.
- Mask card numbers in fixtures.
- Payment tests require a physical POS and human interaction.
