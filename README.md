# 🇦🇺 Australian Economy Dashboard

Economic health dashboard for Australia — built with Next.js 15, tRPC, Tailwind v4, and shadcn/ui.

## Data Sources

**ABS** (GDP Growth, Unemployment, CPI, Wage Growth)
Hits the ABS SDMX-JSON API with a specific key for each series. Unemployment comes back as a ready-to-use percentage. GDP, CPI, and wages come back as raw index numbers, so the script computes the year-on-year % change by comparing each quarter to the same quarter a year prior.

**RBA** (Cash Rate, AUD/USD)
Downloads two CSV files directly from the RBA website. The CSVs have a 4-row header before the data starts, so the script skips those. Cash rate data is already monthly. Exchange rate data is daily, so it collapses it to monthly by keeping the last value for each month.

**World Bank** (Trade Balance)
Calls the World Bank REST API for Australia's merchandise trade balance. Comes back in USD, so the script divides by a USD/AUD factor to get AUD billions.

## Dev

```bash
pnpm dev                         # start dev server
pnpm tsx scripts/update-data.ts  # refresh all data from sources
```

## Todos
- What else can we get from ABS? Trade Balance?
- squash the headers down to a 4x1 at the top
- make the graphs bigger and nicer
- Last updated + next expected update
- does the ABS have anything on housing
- More transparency on how the overall economic score is calculated
- Can we use ABS to get a deepdive on the labor force or my industry specifically
    - Scrape indeed hiring data?
- up and down arrows aren't always good or bad
- the more info button needs to be a bit more obvious
- 4x1 tabs up the top link to full graph cards
- Better trend than just the last value?
