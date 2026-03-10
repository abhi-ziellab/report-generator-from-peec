# Peec AI Report Builder

Open-source report builder for **GEO (Generative Engine Optimization)** analytics. Generate branded, print-ready reports that show how your brand appears across AI models like ChatGPT, Perplexity, Gemini, and others.

Built on the [Peec AI](https://peec.ai) API. Uses [Claude](https://anthropic.com) for AI-generated narrative insights.

> **Beta 1.0** — This tool is in active development. Reports are generated from live data but should be reviewed before sharing with clients.

---

## What it does

Peec AI tracks how brands are represented in AI-generated responses. This report builder turns that data into professional, exportable reports.

**Three report types:**

- **Brand Visibility Analysis** — Visibility scores, share of voice, sentiment, and position across AI models
- **Competitive Gap Analysis** — Head-to-head brand comparison with prompt-level gap identification
- **AI Citation Report** — Which domains and URLs get cited in AI responses, classified by source type (OWN, EDITORIAL, COMPETITOR, etc.)

**Each report includes:**

- KPI scorecards with period-over-period deltas
- Interactive charts (bar, pie, radar) via Recharts
- Data tables with sorting
- AI-generated key takeaways (powered by Claude Opus 4.6)
- Print-optimized layout for PDF export via browser print
- Optional client logo branding

---

## Quick start

### Prerequisites

- **Node.js 18+**
- A **Peec AI API key** — get one from your [Peec AI dashboard](https://app.peec.ai) under Settings
- An **Anthropic API key** — get one from [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
# Clone the repository
git clone https://github.com/abhi-ziellab/report-generator-from-peec.git
cd report-generator-from-peec

# Install dependencies
npm install
```

No environment variables are required to get started — the app auto-generates a cookie encryption key on startup. Just run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The wizard will guide you through:

1. **Enter API keys** — Your Peec AI key and Anthropic key
2. **Select project** — If using an account-wide key (`skc-`), choose which project to report on
3. **Choose report type** — Brand Visibility, Competitive Gap, or Citation Report
4. **Configure** — Date range, report depth (executive/comprehensive), period comparison, brand filters, client logo
5. **Generate** — Data is fetched and narrative insights are generated

### Export to PDF

Click **Export PDF** on the report page. The report is optimized for A4 print with proper page breaks, preserved colors, and clean typography.

---

## API keys

This tool requires two API keys, both entered through the UI at runtime. No keys are stored in environment variables or source code.

| Key | Format | Purpose |
|-----|--------|---------|
| **Peec AI** | `skp-...` (project) or `skc-...` (account) | Fetches brand visibility, citation, and competitive data |
| **Anthropic** | `sk-ant-...` | Powers AI-generated narrative insights via Claude Opus 4.6 |

- **Project keys** (`skp-`) are scoped to a single project — the report builder skips project selection
- **Account keys** (`skc-`) have access to all projects — you'll choose which project to report on
- Both keys are encrypted with AES-256-GCM and stored in httpOnly session cookies
- Keys are never logged, persisted to disk, or sent to any third party

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/validate/route.ts   # API key validation + cookie encryption
│   │   ├── generate/route.ts        # Report generation orchestration
│   │   └── metadata/route.ts        # Fetch brands, models, prompts
│   ├── report/                      # Report display page
│   ├── wizard/                      # Multi-step wizard
│   ├── globals.css                  # Design tokens + print styles
│   └── layout.tsx                   # Root layout
├── components/
│   ├── charts/                      # Recharts wrappers (bar, pie, line, radar)
│   ├── report/                      # Report layout, scorecards, tables, insights
│   └── wizard/                      # Wizard step components
├── hooks/
│   └── use-wizard.ts                # Wizard state management (context + reducer)
└── lib/
    ├── peecai-client.ts             # Peec AI REST client
    ├── cookie.ts                    # AES-256-GCM encryption
    ├── types.ts                     # TypeScript interfaces
    ├── utils.ts                     # Date, filter, formatting utilities
    └── reports/
        ├── brand-visibility.ts      # Brand visibility data fetching
        ├── competitive-gap.ts       # Competitive gap data fetching
        ├── citation-report.ts       # Citation data fetching
        ├── narrative.ts             # Claude-powered insight generation
        ├── insights.ts              # Deterministic insight computation
        └── period-compare.ts        # Period-over-period delta logic
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19 + [Tailwind CSS 4](https://tailwindcss.com) |
| Charts | [Recharts 3](https://recharts.org) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai) + [Anthropic Claude Opus 4.6](https://anthropic.com) |
| API | [Peec AI Customer API v1](https://peec.ai) |

---

## Configuration

No environment variables are required. API keys (Peec AI and Anthropic) are entered through the UI at runtime.

| Variable | Required | Description |
|----------|----------|-------------|
| `COOKIE_SECRET` | No | 64-character hex string (32 bytes) for AES-256-GCM cookie encryption. If not set, a key is auto-generated on startup — sessions will reset on server restart. Set a fixed value in production for persistent sessions. |

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment

This is a standard Next.js application. Deploy anywhere that supports Node.js:

**Vercel** (recommended):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Optionally set `COOKIE_SECRET` in your Vercel project's environment variables for persistent sessions across deploys.

**Docker:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

**Self-hosted:**

```bash
npm run build
npm start
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Type-check
npm run typecheck

# Dev server
npm run dev

# Production build
npm run build
```

---

## License

[MIT](LICENSE)

---

Built by [Peec AI](https://peec.ai)
