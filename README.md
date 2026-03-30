# 🇦🇺 Australian Economy Dashboard

A real-time economic health dashboard tracking key Australian economic indicators, built with the T3 stack.

## Features

- **Overall health score** — weighted gauge across all indicators
- **8 metrics** across four categories: Growth & Output, Prices & Wages, Labour Market, and Financial & External
- **Time range filtering** — 1Y, 5Y, 10Y, All
- **Dark mode** support
- **Live data** from ABS, RBA, and World Bank APIs

## Data Sources

| Metric | Source |
|---|---|
| GDP Growth | World Bank |
| Inflation (CPI) | ABS SDMX API |
| Wage Growth | ABS SDMX API |
| Unemployment | ABS SDMX API |
| Cash Rate | RBA |
| AUD/USD | RBA |
| Trade Balance | World Bank |

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui
- **API** — tRPC
- **Database** — Drizzle ORM + Turso (libSQL)
- **Charts** — Recharts via shadcn charts

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Updating Data

```bash
pnpm tsx scripts/update-data.ts
```

Fetches the latest data from all sources and writes to `src/data/metrics.json`.
