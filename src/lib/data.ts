import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";
import { metricDefinitions } from "~/config/metrics";

// Runtime transforms applied after loading raw data.
// Keys are metric IDs; each entry describes a linear scale factor and updated unit.
const runtimeTransforms: Record<string, { factor: number; unit: string }> = {
  // Quarterly ABS data — divide by 3 to express as monthly rate
  "dwelling-completions": { factor: 1 / 3, unit: "k dwellings/mo" },
  // Already monthly — just standardise the unit label
  "building-approvals": { factor: 1, unit: "k dwellings/mo" },
};

// Metrics that should display as a trailing 4-quarter sum (removes fiscal seasonality).
const rolling4QMetrics = new Set(["fiscal-balance"]);

function toRolling4Q(series: MetricData["series"]): MetricData["series"] {
  return series.slice(3).map((p, i) => ({
    date: p.date,
    value: Math.round((series[i]!.value + series[i + 1]!.value + series[i + 2]!.value + series[i + 3]!.value) * 10) / 10,
  }));
}

function applyTransform(data: MetricData): MetricData {
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

  if (rolling4QMetrics.has(data.id) && result.series.length >= 4) {
    const series = toRolling4Q(result.series);
    result = {
      ...result,
      series,
      currentValue: series.at(-1)!.value,
      previousValue: series.at(-2)!.value,
    };
  }

  return result;
}

function readMetricFile(id: string): MetricData {
  const filePath = join(process.cwd(), "data", `${id}.json`);
  const raw = readFileSync(filePath, "utf-8");
  return applyTransform(JSON.parse(raw) as MetricData);
}

export function getAllMetrics(): MetricData[] {
  return metricDefinitions.map((def) => readMetricFile(def.id));
}

export function getMetricById(id: string): MetricData | null {
  try {
    return readMetricFile(id);
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
