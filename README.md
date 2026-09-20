# Third-party API portal (Payload + Scalar)

Payload CMS with MongoDB (via `.env`), **Viewers** auth for the frontend, and [Scalar](https://github.com/scalar/scalar) at `/scalar`.

API documents are managed in the admin panel under **API Specs** — upload YAML/JSON, paste inline, or link a remote URL. No code deploy is required to add a vendor API.

## Prerequisites

- Node.js 20.9+ (22 recommended)
- pnpm
- A **separate** MongoDB instance (local `mongod`, Coolify Mongo, Atlas, etc.)

## Setup

```bash
cp .env.example .env
# Edit .env — set DATABASE_URI, PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL

pnpm install
pnpm seed:api-specs   # optional: load sample OpenAPI docs from ./openapi
pnpm dev
```

Open:

- http://localhost:3000 — redirects to `/scalar`
- http://localhost:3000/admin — Users (admins) + **API Specs** + Viewers
- http://localhost:3000/login — viewer sign-in
- http://localhost:3000/scalar — interactive docs (viewers only)

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URI` | MongoDB connection string |
| `PAYLOAD_SECRET` | Payload encryption secret |
| `NEXT_PUBLIC_SERVER_URL` | Public app URL |

See [`.env.example`](.env.example). Never commit `.env`.

## Collections

| Collection | Purpose |
| --- | --- |
| `users` | Payload admin (`/admin`) |
| `viewers` | Portal access to `/scalar` and `/api/openapi/*` |
| `api-specs` | Scalar sources (title, slug, order, enabled, source type) |
| `openapi-files` | Private uploaded OpenAPI files |
| `vendor-docs` | Private vendor PDFs linked from API Specs / Scalar |

### Add an API in admin

1. Sign in at `/admin` as a User.
2. Open **API Specs** → Create.
3. Set title (slug auto-fills), sort order, enabled.
4. Choose source type:
   - **Upload file** — attach YAML/JSON (creates an OpenAPI Files upload)
   - **Paste YAML/JSON** — put the document in Spec Body
   - **Remote URL** — public OpenAPI URL (fetched server-side)
5. Optionally upload an **original vendor PDF** (`originalDoc`) — Scalar shows it as an External documentation link (served at `/api/vendor-docs/{slug}` for authenticated viewers).
6. Optionally mark **Default** for the first document Scalar shows.
7. Save. Refresh `/scalar` — the API appears immediately.

Avoid logging into both admin and viewer in the same browser profile — auth cookies can conflict.

## Coolify

1. Deploy this Next/Payload app as one resource.
2. Use a **separate** Mongo resource (or Atlas).
3. Inject `DATABASE_URI`, `PAYLOAD_SECRET`, and `NEXT_PUBLIC_SERVER_URL` as env vars.
4. Persist `openapi-uploads/` and `vendor-docs-uploads/` if you use file uploads (volume or cloud storage later).

## Third-party testing → Scalar

Live vendor scenario tests are gitignored. See [`docs/third-party-tests.README.md`](docs/third-party-tests.README.md).

```bash
pnpm test:pos        # PNA Android POS S1/S2 (skips if POS offline)
pnpm promote:pos     # upsert OpenAPI into API Specs
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production |
| `pnpm seed:api-specs` | Seed sample specs from `openapi/` |
| `pnpm generate:types` | Regenerate TypeScript types |
| `pnpm payload` | Payload CLI |
