# 🇦🇺 Australian Economy Dashboard

Economic health dashboard for Australia — built with Next.js 15, tRPC, Tailwind v4, and shadcn/ui.

## Data Sources

| Metric | Source | How |
|---|---|---|
| GDP Growth | World Bank | REST API — annual GDP growth % for Australia (`NY.GDP.MKTP.KD.ZG`) |
| Inflation (CPI) | ABS | SDMX-JSON API — quarterly CPI index numbers, converted to YoY % change |
| Wage Growth | ABS | SDMX-JSON API — quarterly Wage Price Index, converted to YoY % change |
| Unemployment | ABS | SDMX-JSON API — monthly unemployment rate from Labour Force survey |
| Cash Rate | RBA | CSV download (Table F1) — official cash rate target, parsed from RBA website |
| AUD/USD | RBA | CSV download (Table F11) — daily exchange rates, collapsed to monthly |
| Trade Balance | World Bank | REST API — annual merchandise trade balance in USD, converted to AUD billions |

## Dev

```bash
pnpm dev          # start dev server
pnpm tsx scripts/update-data.ts  # refresh all data from sources
```
