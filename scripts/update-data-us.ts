/**
 * US data update orchestrator — fetches all US metrics from FRED and writes to /data/us/*.json
 *
 * Usage: FRED_API_KEY=<key> pnpm tsx scripts/update-data-us.ts
 *
 * Prerequisites:
 *   - FRED API key: Register free at https://fred.stlouisfed.org/docs/api/api_key.html
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import {
  fetchUsGdp,
  fetchUsGdpPerCapita,
  fetchUsCpi,
  fetchUsWages,
  fetchUsUnemployment,
  fetchUsUnderemployment,
  fetchUsJobOpenings,
  fetchUsFedFundsRate,
  fetchUsTrade,
  fetchUsUsdIndex,
  fetchUsBuildingPermits,
  fetchUsHousingStarts,
  fetchUsFiscalBalance,
  fetchUsPersonalConsumption,
} from "./sources/fred-api";
import { computeRealWages } from "./sources/derived";

const DATA_DIR = join(process.cwd(), "data", "us");

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

  console.log("Updating US economy dashboard data...\n");

  await Promise.all([
    run("gdp", fetchUsGdp),
    run("gdp-per-capita", fetchUsGdpPerCapita),
    run("cpi", fetchUsCpi),
    run("wages", fetchUsWages),
    run("unemployment", fetchUsUnemployment),
    run("underemployment", fetchUsUnderemployment),
    run("job-openings", fetchUsJobOpenings),
    run("fed-funds-rate", fetchUsFedFundsRate),
    run("trade", fetchUsTrade),
    run("usd-index", fetchUsUsdIndex),
    run("building-permits", fetchUsBuildingPermits),
    run("housing-starts", fetchUsHousingStarts),
    run("fiscal-balance", fetchUsFiscalBalance),
    run("personal-consumption", fetchUsPersonalConsumption),
  ]);

  // Derived metrics (depend on fetched data above)
  try {
    const wages: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "wages.json"), "utf-8"));
    const cpi: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "cpi.json"), "utf-8"));
    write(computeRealWages(wages, cpi, "us"));
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
