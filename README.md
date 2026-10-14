# FINOVA — AI Financial Intelligence & Blockchain Verification Platform

> **Academic Project Prototype** — AI-Voice Financial Intelligence Network Using Blockchain  
> All data is fictional demonstration data. Blockchain operations use SHA-256 local verification only.

---

## Quick Start

```bash
# From the finova/ root directory:
npm install
npm run dev
```

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:4000/api  

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v7 |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3, WAL mode) |
| Validation | Zod |
| Hashing | Node.js crypto (SHA-256) |
| Testing | Vitest (10 tests) |

---

## Application Pages

| Page | URL | Description |
|------|-----|-------------|
| Overview | / | Dashboard metrics, charts, system status |
| Financial Analysis | /analysis | Transaction form, CSV import, portfolio report |
| Transactions | /transactions | Table with search/filter/sort/pagination, CSV export |
| Risk Assessment | /risk | Per-transaction scoring with rule explanations |
| Verified Decisions | /decisions | SHA-256 records, tamper demo, canonical JSON viewer |
| Voice Assistant | /voice | Text/mic input, TTS, ledger-grounded responses |
| Audit Trail | /audit | Filterable event log with expandable details |
| Settings | /settings | Risk thresholds, Solidity snippet, demo controls |

---

## Risk Scoring Rules

| Rule | Trigger | Points |
|------|---------|--------|
| RULE-VAL-01 | Ultra-High Amount (>=20L) | 45 |
| RULE-VAL-02 | Elevated Amount (>=5L) | 25 |
| RULE-DUP-01 | Duplicate Transaction | 35 |
| RULE-INF-01 | Incomplete Metadata | 25 |
| RULE-VEL-01 | High Counterparty Velocity | 20 |
| RULE-CAT-01 | High-Audit Category | 15 |

Bands: Low (0-29) | Moderate (30-59) | High (60-79) | Critical (80-100)

---

## Blockchain Trust Layer

- SHA-256 canonical JSON hashing (keys sorted deterministically)
- Stored hash verified against recomputed hash on demand
- Tamper demo operates on temporary in-memory copy only
- Database records are NEVER silently modified

> "Hashing proves data integrity, not on-chain consensus."

---

## Running Tests

```bash
npm test   # 22 tests: SHA-256, tamper detection, INR formatting, risk rules, neural voice
```

## Production Build

```bash
npm run build:client
```

---

## 24/7 Cloud Deployment (No Local Machine Required)

Because FINOVA includes an Express API server with SQLite persistence (`better-sqlite3`), risk scoring, and neural voice synthesis, it runs 24/7 in a cloud container without needing your personal computer to stay open or online.

### Option 1: 1-Click Deploy on Render (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service** (or **Blueprint**).
2. Connect your GitHub repository: `https://github.com/AtharvProjects/finova`.
3. Render will automatically detect [`render.yaml`](./render.yaml) or [`Dockerfile`](./Dockerfile):
   - **Build Command**: `npm install && cd client && npm install && cd .. && npm run build:client`
   - **Start Command**: `npx tsx server/src/index.ts`
   - **Port**: `4000`
4. Click **Deploy**. Your application will be live at `https://finova-xxxx.onrender.com` 24/7.

### Option 2: Add Cloudflare in Front of Render (Custom Domain & Edge CDN)

1. In your Cloudflare Dashboard, go to your domain's **DNS Records**.
2. Add a `CNAME` record:
   - **Name**: `finova` (or `@`)
   - **Target**: `finova-xxxx.onrender.com`
   - **Proxy status**: Proxied (Orange cloud enabled)
3. Your app now runs on Cloudflare's global edge network with DDoS protection and SSL, while Render runs the 24/7 backend container!

---

*FINOVA is an academic prototype. Not a certified financial compliance system.*
