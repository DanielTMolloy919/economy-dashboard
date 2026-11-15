import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";
import type { CountryCode } from "~/config/countries";
import { getMetricDefinitions } from "~/config/metrics";
import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";

// Runtime transforms applied after loading raw data.
// Keys are metric IDs; each entry describes a linear scale factor and updated unit.
const runtimeTransforms: Record<string, { factor: number; unit: string }> = {
  // AU: Quarterly ABS data — divide by 3 to express as monthly rate
  "dwelling-completions": { factor: 1 / 3, unit: "k dwellings/mo" },
  // AU: Already monthly — just standardise the unit label
  "building-approvals": { factor: 1, unit: "k dwellings/mo" },
};

// Metrics that should display as a trailing 4-quarter sum (removes fiscal seasonality).
// US fiscal data is pre-computed as a trailing 12-month sum in the fetcher, so excluded here.
// NZ fiscal data (Treasury OBEGAL) is annual, so it must not be summed.
const rolling4QMetrics: Record<CountryCode, Set<string>> = {
  au: new Set(["fiscal-balance"]),
  nz: new Set(),
  us: new Set(),
  uk: new Set(),
  ca: new Set(),
};

// Metrics stored as levels (unit "index") that should display as YoY % change.
// Value = number of periods per year (4 for quarterly data). Countries whose source
// already publishes the YoY rate store "% YoY" and are left untouched.
const yoyIndexMetrics: Record<string, number> = {
  gdp: 4,
  "gdp-per-capita": 4,
  productivity: 4,
};

function toRolling4Q(series: MetricData["series"]): MetricData["series"] {
  return series.slice(3).map((p, i) => ({
    date: p.date,
    value: Math.round((series[i]!.value + series[i + 1]!.value + series[i + 2]!.value + series[i + 3]!.value) * 10) / 10,
  }));
}

function toYoY(series: MetricData["series"], periodsPerYear: number): MetricData["series"] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    const change = ((p.value - prev.value) / prev.value) * 100;
    return { date: p.date, value: Math.round(change * 10) / 10 };
  });
}

function applyTransform(data: MetricData, country: CountryCode): MetricData {
  let result = data;

  const t = runtimeTransforms[data.id];
  if (t) {
    const round1 = (v: number) => Math.round(v * t.factor * 10) / 10;
    result = {
      ...result,
      unit: t.unit,
      currentValue: round1(result.currentValue),
      previousValue: result.previousValue !== undefined ? round1(result.previousValue) : result.previousValue,
      series: result.series.map((p) => ({ ...p, value: round1(p.value) })),
    };
  }

  if (rolling4QMetrics[country]?.has(data.id) && result.series.length >= 4) {
    const series = toRolling4Q(result.series);
    result = {
      ...result,
      series,
      currentValue: series.at(-1)!.value,
      previousValue: series.at(-2)!.value,
    };
  }

  const periodsPerYear = yoyIndexMetrics[data.id];
  if (periodsPerYear && data.unit === "index" && result.series.length > periodsPerYear) {
    const series = toYoY(result.series, periodsPerYear);
    const currentValue = series.at(-1)!.value;
    result = {
      ...result,
      series,
      unit: "% YoY",
      currentValue,
      previousValue: series.at(-2)!.value,
    };
  }

  // Always recalculate health from current thresholds — the JSON-stored value is stale.
  result = {
    ...result,
    health: getHealthStatus(getHealthThresholds(country), result.id, result.currentValue),
  };

  return result;
}

function readMetricFile(country: CountryCode, id: string): MetricData {
  const filePath = join(process.cwd(), "data", country, `${id}.json`);
  const raw = readFileSync(filePath, "utf-8");
  return applyTransform(JSON.parse(raw) as MetricData, country);
}

// Metrics whose source has no data yet (e.g. a discontinued series) are omitted
// rather than shown as a blank chart with a fake 0 value.
export function getAllMetrics(country: CountryCode): MetricData[] {
  const definitions = getMetricDefinitions(country);
  return definitions
    .map((def) => readMetricFile(country, def.id))
    .filter((m) => m.series.length > 0);
}

export function getMetricById(country: CountryCode, id: string): MetricData | null {
  try {
    const data = readMetricFile(country, id);
    return data.series.length > 0 ? data : null;
  } catch {
    return null;
  }
}

export function filterSeriesByRange(
  series: MetricData["series"],
  range: "1Y" | "5Y" | "10Y" | "all",
): MetricData["series"] {
  if (range === "all") return series;

  const now = new Date();
  const yearsBack = range === "1Y" ? 1 : range === "5Y" ? 5 : 10;
  const cutoff = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate());

  return series.filter((point) => new Date(point.date) >= cutoff);
}
