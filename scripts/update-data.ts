/**
 * Data update orchestrator — fetches all metrics from live APIs and writes to /data/*.json
 *
 * Usage: pnpm tsx scripts/update-data.ts
 *
 * Sources:
 *   - RBA CSV: cash-rate (F1), aud-usd (F11)
 *   - World Bank API: gdp, trade
 *   - ABS SDMX API: unemployment (LF), wages (WPI), cpi (CPI)
 *   - Housing: skipped — ABS RPPI dataflow is ceased (placeholder data retained)
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import { fetchCashRate, fetchAudUsd } from "./sources/rba-csv";
import { fetchGdp, fetchTrade } from "./sources/world-bank";
import { fetchUnemployment, fetchWages, fetchCpi } from "./sources/abs-api";

const DATA_DIR = join(process.cwd(), "data");

function write(metric: MetricData) {
  const path = join(DATA_DIR, `${metric.id}.json`);
  writeFileSync(path, JSON.stringify(metric, null, 2) + "\n");
  console.log(
    `  ✓ ${metric.id}: ${metric.currentValue} ${metric.unit} (${metric.health}) — ${metric.series.length} data points`,
  );
}

function keep(id: string, reason: string) {
  console.log(`  ~ ${id}: skipped — ${reason}`);
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
  console.log("Updating economy dashboard data...\n");

  await Promise.all([
    run("cash-rate", fetchCashRate),
    run("aud-usd", fetchAudUsd),
    run("gdp", fetchGdp),
    run("trade", fetchTrade),
    run("unemployment", fetchUnemployment),
    run("wages", fetchWages),
    run("cpi", fetchCpi),
  ]);

  keep(
    "housing",
    "ABS RPPI dataflow is ceased — update manually from abs.gov.au/statistics/economy/price-indexes-and-inflation/residential-property-price-indexes-eight-capital-cities",
  );

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
