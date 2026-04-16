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
const rolling4QMetrics: Record<CountryCode, Set<string>> = {
  au: new Set(["fiscal-balance"]),
  nz: new Set(["fiscal-balance"]),
  us: new Set(),
  uk: new Set(),
  ca: new Set(),
};

// Metrics stored as index numbers that should display as YoY % change.
// Value = number of periods per year (4 for quarterly data).
const yoyIndexMetrics: Record<string, number> = {
  "gdp-per-capita": 4,
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
  if (periodsPerYear && result.series.length > periodsPerYear) {
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

export function getAllMetrics(country: CountryCode): MetricData[] {
  const definitions = getMetricDefinitions(country);
  return definitions.map((def) => readMetricFile(country, def.id));
}

export function getMetricById(country: CountryCode, id: string): MetricData | null {
  try {
    return readMetricFile(country, id);
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
