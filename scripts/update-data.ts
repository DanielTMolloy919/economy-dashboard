/**
 * Data update orchestrator — fetches all metrics from live APIs and writes to /data/*.json
 *
 * Usage: pnpm tsx scripts/update-data.ts
 *
 * Sources:
 *   - RBA CSV: cash-rate (F1), aud-usd (F11)
 *   - World Bank API: (none)
 *   - ABS SDMX API: gdp (ANA_AGG), unemployment (LF), underemployment (LF_UNDER), wages (WPI), cpi (CPI), household-spending (HSI_M), job-vacancies (JV), building-approvals (BA_GCCSA), dwelling-completions (BUILDING_ACTIVITY)
 *   - ABS GFS XLSX: fiscal-balance (cat. 5519.0)
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";

import { fetchCashRate, fetchAudUsd } from "./sources/rba-csv";
import { fetchGdp, fetchGdpPerCapita, fetchTrade, fetchUnemployment, fetchUnderemployment, fetchWages, fetchCpi, fetchHouseholdSpending, fetchJobVacancies, fetchBuildingApprovals, fetchDwellingCompletions } from "./sources/abs-api";
import { fetchFiscalBalance } from "./sources/abs-gfs";
import { computeRealWages } from "./sources/derived";

const DATA_DIR = join(process.cwd(), "data", "au");

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
    run("gdp-per-capita", fetchGdpPerCapita),
    run("trade", fetchTrade),
    run("unemployment", fetchUnemployment),
    run("underemployment", fetchUnderemployment),
    run("wages", fetchWages),
    run("cpi", fetchCpi),
    run("household-spending", fetchHouseholdSpending),
    run("job-vacancies", fetchJobVacancies),
    run("building-approvals", fetchBuildingApprovals),
    run("dwelling-completions", fetchDwellingCompletions),
    run("fiscal-balance", fetchFiscalBalance),
  ]);

  // Derived metrics (depend on fetched data above)
  try {
    const wages: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "wages.json"), "utf-8"));
    const cpi: MetricData = JSON.parse(readFileSync(join(DATA_DIR, "cpi.json"), "utf-8"));
    write(computeRealWages(wages, cpi, "au"));
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
