/**
 * UK data update orchestrator — fetches all UK metrics from ONS and BoE, writes to /data/uk/*.json
 *
 * Usage: pnpm tsx scripts/update-data-uk.ts
 *
 * No API keys required — all UK data sources are publicly accessible.
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import {
  fetchUkGdp,
  fetchUkGdpPerCapita,
  fetchUkProductivity,
  fetchUkCpi,
  fetchUkWages,
  fetchUkUnemployment,
  fetchUkEconomicInactivity,
  fetchUkJobVacancies,
  fetchUkRetailSales,
  fetchUkTrade,
} from "./sources/ons-api";
import { fetchUkBankRate, fetchUkGbpUsd } from "./sources/boe-csv";
import { computeRealWages } from "./sources/derived";

const DATA_DIR = join(process.cwd(), "data", "uk");

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

  console.log("Updating UK economy dashboard data...\n");

  await Promise.all([
    run("gdp", fetchUkGdp),
    run("gdp-per-capita", fetchUkGdpPerCapita),
    run("productivity", fetchUkProductivity),
    run("cpi", fetchUkCpi),
    run("wages", fetchUkWages),
    run("unemployment", fetchUkUnemployment),
    run("economic-inactivity", fetchUkEconomicInactivity),
    run("job-vacancies", fetchUkJobVacancies),
    run("retail-sales", fetchUkRetailSales),
    run("trade", fetchUkTrade),
    run("bank-rate", fetchUkBankRate),
    run("gbp-usd", fetchUkGbpUsd),
  ]);

  // Derived metrics (depend on fetched data above)
  try {
    const wages: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "wages.json"), "utf-8"));
    const cpi: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "cpi.json"), "utf-8"));
    write(computeRealWages(wages, cpi, "uk"));
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
