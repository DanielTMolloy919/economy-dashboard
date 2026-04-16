/**
 * NZ data update orchestrator — fetches all NZ metrics from live APIs and writes to /data/nz/*.json
 *
 * Usage: FRED_API_KEY=<key> pnpm tsx scripts/update-data-nz.ts
 *
 * Prerequisites:
 *   - FRED API key: Free at https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Sources:
 *   - FRED: gdp, cpi, unemployment, wages, trade, retail-trade, nzd-usd, cash-rate
 *   - NZ Treasury XLSX: fiscal-balance (OBEGAL)
 *   - Derived: real-wages (wages − CPI)
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import {
  fetchNzGdpPerCapita,
  fetchNzGdp,
  fetchNzCpi,
  fetchNzUnemployment,
  fetchNzWages,
  fetchNzTrade,
  fetchNzRetailTrade,
  fetchNzNzdUsd,
  fetchNzCashRate,
} from "./sources/fred-nz";
import { fetchNzFiscalBalance } from "./sources/nz-treasury";
import { computeRealWages } from "./sources/derived";

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
    // FRED
    run("gdp", fetchNzGdp),
    run("gdp-per-capita", fetchNzGdpPerCapita),
    run("cpi", fetchNzCpi),
    run("unemployment", fetchNzUnemployment),
    run("wages", fetchNzWages),
    run("trade", fetchNzTrade),
    run("retail-trade", fetchNzRetailTrade),
    run("nzd-usd", fetchNzNzdUsd),
    run("cash-rate", fetchNzCashRate),
    // NZ Treasury
    run("fiscal-balance", fetchNzFiscalBalance),
  ]);

  // Derived metrics (depend on fetched data above)
  try {
    const wages: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "wages.json"), "utf-8"));
    const cpi: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "cpi.json"), "utf-8"));
    write(computeRealWages(wages, cpi, "nz"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ real-wages: ${message}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
