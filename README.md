# 🇦🇺 Australian Economy Dashboard

Economic health dashboard for Australia — built with Next.js 15, tRPC, Tailwind v4, and shadcn/ui.

## Data Sources

**ABS** (GDP Growth, Trade Balance, Unemployment, Underemployment, CPI, Wage Growth, Household Spending, Job Vacancies)
Hits the ABS SDMX-JSON API. Unemployment and underemployment come back as ready-to-use percentages. GDP, CPI, and wages come back as raw index numbers, so the script computes year-on-year % change by comparing each period to the same period a year prior. Trade balance comes back in A$M and is divided by 1000 to get A$B. Household spending comes back as a direct YoY % change. Job vacancies are in thousands.

**RBA** (Cash Rate, AUD/USD)
Downloads two CSV files directly from the RBA website. The CSVs have a 4-row header before the data starts, so the script skips those. Cash rate data is already monthly. Exchange rate data is daily, so it collapses it to monthly by keeping the last value for each month.

## Dev

```bash
pnpm dev                         # start dev server
pnpm tsx scripts/update-data.ts  # refresh all data from sources
```

## Todos
- squash the headers down to a 4x1 at the top
- make the graphs bigger and nicer
- Last updated + next expected update
- does the ABS have anything on housing
- More transparency on how the overall economic score is calculated
- Can we use ABS to get a deepdive on the labor force or my industry specifically
    - Scrape indeed hiring data?
- up and down arrows aren't always good or bad
- 4x1 tabs up the top link to full graph cards
- Better trend than just the last value?
