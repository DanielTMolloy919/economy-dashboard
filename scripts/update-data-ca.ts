/**
 * Canada data update orchestrator — fetches all CA metrics from FRED and writes to /data/ca/*.json
 *
 * Usage: FRED_API_KEY=<key> pnpm tsx scripts/update-data-ca.ts
 *
 * Prerequisites:
 *   - FRED API key: Register free at https://fred.stlouisfed.org/docs/api/api_key.html
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import {
  fetchCaGdpPerCapita,
  fetchCaGdp,
  fetchCaCpi,
  fetchCaUnemployment,
  fetchCaWages,
  fetchCaPolicyRate,
  fetchCaCadUsd,
  fetchCaTrade,
  fetchCaRetailSales,
} from "./sources/fred-ca";
import { computeRealWages } from "./sources/derived";

const DATA_DIR = join(process.cwd(), "data", "ca");

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
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Updating Canada economy dashboard data...\n");

  await Promise.all([
    run("gdp", fetchCaGdp),
    run("gdp-per-capita", fetchCaGdpPerCapita),
    run("cpi", fetchCaCpi),
    run("unemployment", fetchCaUnemployment),
    run("wages", fetchCaWages),
    run("policy-rate", fetchCaPolicyRate),
    run("cad-usd", fetchCaCadUsd),
    run("trade", fetchCaTrade),
    run("retail-sales", fetchCaRetailSales),
  ]);

  // Derived metrics (depend on fetched data above)
  try {
    const wages: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "wages.json"), "utf-8"));
    const cpi: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "cpi.json"), "utf-8"));
    write(computeRealWages(wages, cpi, "ca"));
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
