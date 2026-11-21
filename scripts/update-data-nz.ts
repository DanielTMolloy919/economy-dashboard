/**
 * NZ data update orchestrator — fetches all NZ metrics from live APIs and writes to /data/nz/*.json
 *
 * Usage: FRED_API_KEY=<key> pnpm tsx scripts/update-data-nz.ts
 *
 * Prerequisites:
 *   - FRED API key: Free at https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Sources:
 *   - FRED: gdp, unemployment, wages, trade, retail-trade, nzd-usd, cash-rate
 *   - OECD: cpi, gdp-per-capita
 *   - Derived: real-wages (wages − CPI)
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import {
  fetchNzGdp,
  fetchNzUnemployment,
  fetchNzWages,
  fetchNzTrade,
  fetchNzRetailTrade,
  fetchNzNzdUsd,
  fetchNzCashRate,
} from "./sources/fred-nz";
import { fetchOecdCpi, fetchOecdGdpPerCapita, OecdRateLimitedError } from "./sources/oecd-api";
import { computeRealWages } from "./sources/derived";

const DATA_DIR = join(process.cwd(), "data", "nz");

function write(metric: MetricData) {
  const path = join(DATA_DIR, `${metric.id}.json`);
  writeFileSync(path, JSON.stringify(metric, null, 2) + "\n");
  console.log(
    `  ✓ ${metric.id}: ${metric.currentValue} ${metric.unit} (${metric.health}) — ${metric.series.length} data points`,
  );
}

const failures: string[] = [];

async function run(
  name: string,
  fetcher: () => Promise<MetricData>,
): Promise<void> {
  try {
    const data = await fetcher();
    write(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof OecdRateLimitedError) {
      console.log(`  ~ ${name}: skipped — ${message}. Existing data retained.`);
      return;
    }
    console.error(`  ✗ ${name}: ${message}`);
    failures.push(name);
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
    run("gdp-per-capita", () => fetchOecdGdpPerCapita("nz")),
    run("cpi", () => fetchOecdCpi("nz")),
    run("unemployment", fetchNzUnemployment),
    run("wages", fetchNzWages),
    run("trade", fetchNzTrade),
    run("retail-trade", fetchNzRetailTrade),
    run("nzd-usd", fetchNzNzdUsd),
    run("cash-rate", fetchNzCashRate),
  ]);

  // Derived metrics (depend on fetched data above)
  try {
    const wages: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "wages.json"), "utf-8"));
    const cpi: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "cpi.json"), "utf-8"));
    write(computeRealWages(wages, cpi, "nz"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ real-wages: ${message}`);
    failures.push("real-wages");
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} metric(s) failed: ${failures.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
