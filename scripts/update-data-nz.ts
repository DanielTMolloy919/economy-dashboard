/**
 * NZ data update orchestrator — fetches all NZ metrics from live APIs and writes to /data/nz/*.json
 *
 * Usage: STATS_NZ_API_KEY=<key> pnpm tsx scripts/update-data-nz.ts
 *
 * Prerequisites:
 *   - Stats NZ API key: Register at https://portal.apis.stats.govt.nz/
 *   - RBNZ data: May require manual download of Excel files to data/nz/rbnz-cache/
 *     if Cloudflare blocks automated access.
 *
 * Sources:
 *   - Stats NZ SDMX API: gdp, cpi, unemployment, wages (LCI), trade, underutilisation,
 *     retail-trade, job-vacancies, building-consents
 *   - RBNZ Excel: cash-rate (OCR), nzd-usd (B1)
 *   - NZ Treasury XLSX: fiscal-balance (OBEGAL)
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import {
  fetchNzGdp,
  fetchNzCpi,
  fetchNzUnemployment,
  fetchNzWages,
  fetchNzTrade,
  fetchNzUnderutilisation,
  fetchNzRetailTrade,
  fetchNzJobVacancies,
  fetchNzBuildingConsents,
} from "./sources/stats-nz-api";
import { fetchNzOcr, fetchNzNzdUsd } from "./sources/rbnz-xlsx";
import { fetchNzFiscalBalance } from "./sources/nz-treasury";

const DATA_DIR = join(process.cwd(), "data", "nz");

function write(metric: MetricData) {
  const path = join(DATA_DIR, `${metric.id}.json`);
  writeFileSync(path, JSON.stringify(metric, null, 2) + "\n");
  console.log(
    `  ✓ ${metric.id}: ${metric.currentValue} ${metric.unit} (${metric.health}) — ${metric.series.length} data points`,
  );
}

async function run(
  name: string,
  fetcher: () => Promise<MetricData>,
): Promise<void> {
  try {
    const data = await fetcher();
    write(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${name}: ${message}`);
    console.error(`    Existing data retained.`);
  }
}

async function main() {
  // Ensure data directory exists
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Updating NZ economy dashboard data...\n");

  await Promise.all([
    // Stats NZ (requires STATS_NZ_API_KEY)
    run("gdp", fetchNzGdp),
    run("cpi", fetchNzCpi),
    run("unemployment", fetchNzUnemployment),
    run("wages", fetchNzWages),
    run("trade", fetchNzTrade),
    run("underutilisation", fetchNzUnderutilisation),
    run("retail-trade", fetchNzRetailTrade),
    run("job-vacancies", fetchNzJobVacancies),
    run("building-consents", fetchNzBuildingConsents),
    // RBNZ (may need cached files)
    run("cash-rate", fetchNzOcr),
    run("nzd-usd", fetchNzNzdUsd),
    // NZ Treasury
    run("fiscal-balance", fetchNzFiscalBalance),
  ]);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
