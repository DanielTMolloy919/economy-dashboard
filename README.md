# 🇦🇺 Australian Economy Dashboard

Economic health dashboard for Australia — built with Next.js 15, tRPC, Tailwind v4, and shadcn/ui.

## Data Sources

**ABS** (Unemployment, CPI, Wage Growth)
Hits the ABS SDMX-JSON API with a specific key for each series. Unemployment comes back as a ready-to-use percentage. CPI and wages come back as raw index numbers, so the script computes the year-on-year % change by comparing each quarter to the same quarter a year prior.

**RBA** (Cash Rate, AUD/USD)
Downloads two CSV files directly from the RBA website. The CSVs have a 4-row header before the data starts, so the script skips those. Cash rate data is already monthly. Exchange rate data is daily, so it collapses it to monthly by keeping the last value for each month.

**World Bank** (GDP Growth, Trade Balance)
Calls the World Bank REST API for two Australian indicators. GDP growth comes back as a direct annual percentage. Trade balance comes back in USD, so the script divides by a USD/AUD factor to get AUD billions.

## Dev

```bash
pnpm dev                         # start dev server
pnpm tsx scripts/update-data.ts  # refresh all data from sources
```
